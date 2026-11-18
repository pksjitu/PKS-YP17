const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const PHOTO_DIR = path.join(ROOT, 'media', 'photos');
const VIDEO_DIR = path.join(ROOT, 'media', 'videos');
const PHOTO_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);
const VIDEO_EXTENSIONS = new Set(['.mp4', '.webm', '.mov', '.ogv']);
const EXCLUDED_LOGOS = new Set(['pks.jpg', 'jitu.jpg']);

async function walk(directory, baseDirectory, type, extensions, output) {
  let entries;
  try {
    entries = await fs.promises.readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw error;
  }

  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, baseDirectory, type, extensions, output);
      continue;
    }
    if (!entry.isFile()) continue;

    const extension = path.extname(entry.name).toLowerCase();
    if (!extensions.has(extension)) continue;
    if (type === 'photo' && EXCLUDED_LOGOS.has(entry.name.toLowerCase())) continue;

    const relativePath = path.relative(ROOT, fullPath).split(path.sep).join('/');
    const stat = await fs.promises.stat(fullPath);
    output.push({
      id: relativePath,
      path: relativePath,
      title: path.basename(entry.name, extension),
      type,
      extension: extension.slice(1),
      url: `/${relativePath.split('/').map(encodeURIComponent).join('/')}`,
      sha: `${stat.size}-${stat.mtimeMs}`
    });
  }
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  try {
    const media = [];
    await walk(PHOTO_DIR, PHOTO_DIR, 'photo', PHOTO_EXTENSIONS, media);
    await walk(VIDEO_DIR, VIDEO_DIR, 'video', VIDEO_EXTENSIONS, media);
    media.sort((a, b) => a.path.localeCompare(b.path, undefined, { numeric: true, sensitivity: 'base' }));

    const version = media.map(item => `${item.path}:${item.sha}`).join('|');
    res.status(200).json({ media, version });
  } catch (error) {
    console.error('Media index error:', error);
    res.status(500).json({ error: 'Gagal membaca folder media.' });
  }
};
