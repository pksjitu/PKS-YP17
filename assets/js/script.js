/* =====================================================
   PKS JITU — VERCEL & GITHUB PAGES MEDIA GALLERY
   Edit pengaturan di bagian CONFIGURATION.
   ===================================================== */

// ===================== CONFIGURATION =====================
const CONFIG = {
    // Dipakai sebagai fallback jika website dijalankan di GitHub Pages.
    GITHUB_BRANCH: "main",

    // Isi link logo jika ingin memakai link eksternal.
    // Jika kosong atau link gagal dimuat, otomatis memakai file lokal.
    LOGO_PKS_URL: "https://files.catbox.moe/dagf7f.png",
    LOGO_JITU_URL: "https://files.catbox.moe/4kpdq9.png",

    // Folder media di repository.
    PHOTOS_FOLDER: "media/photos",
    VIDEOS_FOLDER: "media/videos",

    // Pemeriksaan ulang. 60000 = 1 menit.
    REFRESH_INTERVAL: 60000
};
// =========================================================

const gallery = document.getElementById('gallery');
const viewer = document.getElementById('viewer');
const viewerContent = document.getElementById('viewer-content');
const statusLabel = document.getElementById('update-status');

const PHOTO_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif']);
const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'mov', 'ogv']);
const EXCLUDED_LOGOS = new Set(['pks.jpg', 'jitu.jpg']);

let media = [];
let activeFilter = 'all';
let hasLoaded = false;
let isLoading = false;
let lastTreeSha = '';
let mediaSource = 'github';

function detectRepository() {
    const hostname = window.location.hostname.toLowerCase();
    const segments = window.location.pathname.split('/').filter(Boolean);

    // Format standar GitHub Pages: username.github.io atau username.github.io/repo/
    if (hostname.endsWith('.github.io')) {
        const owner = hostname.slice(0, -'.github.io'.length);
        const repo = segments.length ? segments[0] : `${owner}.github.io`;
        if (owner && repo) return { owner, repo };
    }

    // Custom domain tidak mengandung informasi owner/repository.
    // Hindari menebak repository yang salah.
    throw new Error('Alamat website ini bukan format username.github.io. Untuk custom domain, GitHub tidak menyediakan informasi repository dari alamat website; diperlukan konfigurasi repository atau manifest media statis.');
}

let repository;
try {
    repository = detectRepository();
} catch (error) {
    repository = null;
}

function encodePath(path) {
    return path.split('/').map(encodeURIComponent).join('/');
}

function extensionOf(path) {
    const name = path.split('/').pop() || '';
    const dot = name.lastIndexOf('.');
    return dot >= 0 ? name.slice(dot + 1).toLowerCase() : '';
}

function isLogoFile(path) {
    return EXCLUDED_LOGOS.has((path.split('/').pop() || '').toLowerCase());
}

function naturalCompare(a, b) {
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}

function rawFileUrl(path, sha) {
    const base = `https://raw.githubusercontent.com/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.repo)}/${encodeURIComponent(CONFIG.GITHUB_BRANCH)}/${encodePath(path)}`;
    return sha ? `${base}?v=${encodeURIComponent(sha)}` : base;
}

async function loadRepositoryTree() {
    if (!repository) {
        throw new Error('Repository tidak bisa dideteksi otomatis. Gunakan alamat GitHub Pages username.github.io/repository/ atau siapkan manifest untuk custom domain.');
    }

    const endpoint = `https://api.github.com/repos/${encodeURIComponent(repository.owner)}/${encodeURIComponent(repository.repo)}/git/trees/${encodeURIComponent(CONFIG.GITHUB_BRANCH)}?recursive=1`;
    const response = await fetch(endpoint, {
        cache: 'no-store',
        headers: { 'Accept': 'application/vnd.github+json' }
    });

    if (!response.ok) {
        if (response.status === 404) throw new Error('Repository atau branch tidak ditemukan. Pastikan repository bersifat public.');
        if (response.status === 403) throw new Error('Batas permintaan GitHub API tercapai. Coba lagi beberapa saat.');
        throw new Error(`GitHub API error (${response.status}).`);
    }

    const data = await response.json();
    if (!Array.isArray(data.tree)) throw new Error('Daftar file dari GitHub tidak valid.');
    if (data.truncated) console.warn('GitHub mengembalikan daftar file yang terpotong karena ukuran repository.');
    return { tree: data.tree, sha: data.sha || '' };
}

function collectMedia(tree) {
    const photoPrefix = CONFIG.PHOTOS_FOLDER.replace(/^\/+|\/+$/g, '') + '/';
    const videoPrefix = CONFIG.VIDEOS_FOLDER.replace(/^\/+|\/+$/g, '') + '/';
    const found = [];

    for (const file of tree) {
        if (file.type !== 'blob') continue;
        const path = file.path || '';
        const isPhoto = path.startsWith(photoPrefix);
        const isVideo = path.startsWith(videoPrefix);
        if (!isPhoto && !isVideo) continue;

        const extension = extensionOf(path);
        if (isPhoto && (!PHOTO_EXTENSIONS.has(extension) || isLogoFile(path))) continue;
        if (isVideo && !VIDEO_EXTENSIONS.has(extension)) continue;

        const filename = path.split('/').pop();
        found.push({
            id: path,
            path,
            title: filename.replace(/\.[^.]+$/, ''),
            type: isPhoto ? 'photo' : 'video',
            extension,
            url: rawFileUrl(path, file.sha),
            sha: file.sha || ''
        });
    }

    found.sort((a, b) => naturalCompare(a.path, b.path));
    return found;
}

function setLogo(elementId, externalUrl, localFilename) {
    const image = document.getElementById(elementId);
    const localPath = `${CONFIG.PHOTOS_FOLDER}/${localFilename}`;
    const localUrl = mediaSource === 'vercel' ? `/${encodePath(localPath)}` : rawFileUrl(localPath);
    const candidates = [];
    if (typeof externalUrl === 'string' && externalUrl.trim()) candidates.push(externalUrl.trim());
    candidates.push(localUrl);

    let candidateIndex = 0;
    image.hidden = true;
    image.onerror = () => {
        candidateIndex += 1;
        if (candidateIndex < candidates.length) {
            image.src = candidates[candidateIndex];
        } else {
            image.hidden = true;
            image.removeAttribute('src');
        }
    };
    image.onload = () => { image.hidden = false; };
    image.src = candidates[candidateIndex];
}

function setupLogos() {
    setLogo('logo-pks', CONFIG.LOGO_PKS_URL, 'pks.jpg');
    setLogo('logo-jitu', CONFIG.LOGO_JITU_URL, 'jitu.jpg');
}

async function loadVercelMedia() {
    const response = await fetch('/api/media', { cache: 'no-store' });
    if (!response.ok) throw new Error(`Vercel media API tidak tersedia (${response.status}).`);
    const data = await response.json();
    if (!Array.isArray(data.media)) throw new Error('Data media dari Vercel tidak valid.');
    return data;
}

async function loadMedia() {
    if (isLoading) return;
    isLoading = true;

    try {
        let nextMedia;
        let version;

        // Vercel: API membaca isi folder media langsung dari deployment.
        // Jika API tidak ada, lanjutkan dengan GitHub Pages API.
        try {
            const data = await loadVercelMedia();
            mediaSource = 'vercel';
            nextMedia = data.media;
            version = data.version || JSON.stringify(nextMedia.map(item => item.path));
        } catch (vercelError) {
            mediaSource = 'github';
            const { tree, sha } = await loadRepositoryTree();
            nextMedia = collectMedia(tree);
            version = sha;
        }

        if (version !== lastTreeSha || !hasLoaded) {
            media = nextMedia;
            lastTreeSha = version;
            setupLogos();
            updateStats();
            render();
        }
        hasLoaded = true;
        statusLabel.textContent = 'AUTOMATICALLY UPDATED';
    } catch (error) {
        console.error(error);
        statusLabel.textContent = 'UPDATE UNAVAILABLE';
        if (!hasLoaded) {
            gallery.replaceChildren();
            const message = document.createElement('div');
            message.className = 'empty-state';
            message.textContent = error.message;
            gallery.appendChild(message);
        }
    } finally {
        isLoading = false;
    }
}

function updateStats() {
    const photos = media.filter(item => item.type === 'photo').length;
    const videos = media.filter(item => item.type === 'video').length;
    document.getElementById('total-count').textContent = media.length;
    document.getElementById('photo-count').textContent = photos;
    document.getElementById('video-count').textContent = videos;
}

function render() {
    const filtered = activeFilter === 'all'
        ? media
        : media.filter(item => item.type === activeFilter);

    gallery.replaceChildren();
    if (!filtered.length) {
        const empty = document.createElement('div');
        empty.className = 'empty-state';
        empty.textContent = 'Belum ada media di kategori ini.';
        gallery.appendChild(empty);
        return;
    }

    const fragment = document.createDocumentFragment();
    for (const item of filtered) {
        const card = document.createElement('div');
        card.className = 'media-card';
        card.tabIndex = 0;
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', `Buka ${item.title}`);

        const preview = document.createElement(item.type === 'video' ? 'video' : 'img');
        preview.src = item.url;
        if (item.type === 'video') {
            preview.muted = true;
            preview.preload = 'metadata';
            preview.playsInline = true;
        } else {
            preview.alt = item.title;
            preview.loading = 'lazy';
        }
        card.appendChild(preview);

        if (item.type === 'video') {
            const indicator = document.createElement('div');
            indicator.className = 'video-indicator';
            indicator.textContent = '▶';
            card.appendChild(indicator);
        }

        const overlay = document.createElement('div');
        overlay.className = 'media-overlay';
        const title = document.createElement('div');
        title.className = 'media-title';
        title.textContent = item.title;
        overlay.appendChild(title);
        card.appendChild(overlay);

        const open = () => openViewer(item);
        card.addEventListener('click', open);
        card.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                open();
            }
        });
        fragment.appendChild(card);
    }
    gallery.appendChild(fragment);
}

function openViewer(item) {
    viewerContent.replaceChildren();
    const element = document.createElement(item.type === 'video' ? 'video' : 'img');
    element.src = item.url;
    if (item.type === 'video') {
        element.controls = true;
        element.autoplay = true;
        element.playsInline = true;
    } else {
        element.alt = item.title;
    }
    viewerContent.appendChild(element);
    viewer.classList.add('open');
}

function closeViewer() {
    viewer.classList.remove('open');
    const video = viewerContent.querySelector('video');
    if (video) video.pause();
    viewerContent.replaceChildren();
}

document.querySelectorAll('.filter-btn').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(item => item.classList.remove('active'));
        button.classList.add('active');
        activeFilter = button.dataset.filter;
        render();
    });
});

document.getElementById('close-viewer').addEventListener('click', closeViewer);
viewer.addEventListener('click', event => {
    if (event.target === viewer) closeViewer();
});
document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && viewer.classList.contains('open')) closeViewer();
});

loadMedia();
setInterval(loadMedia, CONFIG.REFRESH_INTERVAL);
