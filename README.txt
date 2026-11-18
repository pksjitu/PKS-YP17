PKS JITU — PHOTO & VIDEO GALLERY
================================

MENDUKUNG VERCEL DAN GITHUB PAGES
---------------------------------

VERCEL (disarankan jika memakai domain sendiri)
1. Upload seluruh isi folder project ini ke GitHub atau import langsung ke Vercel.
2. Deploy project sebagai website Node.js/static biasa. Tidak perlu database atau environment variable.
3. Pastikan folder api/ dan vercel.json ikut ter-upload.
4. Setiap kali file media baru ikut dalam deployment, API /api/media akan mendeteksinya otomatis.
5. Website memeriksa ulang daftar media setiap 1 menit.

GitHub Pages
1. Upload seluruh isi folder ini ke repository GitHub yang bersifat PUBLIC.
2. Aktifkan GitHub Pages melalui Settings > Pages.
3. Pilih Deploy from a branch, branch main, folder /(root).
4. Untuk GitHub Pages, owner dan repository dideteksi otomatis dari alamat standar:
   - username.github.io/ untuk repository username.github.io
   - username.github.io/nama-repo/ untuk repository project.
5. GitHub Pages tidak menjalankan API Node.js. Website otomatis memakai GitHub API sebagai fallback.

PENGATURAN LOGO
---------------
Di file assets/js/script.js:

LOGO_PKS_URL: "https://link-logo-pks"
LOGO_JITU_URL: "https://link-logo-jitu"

Jika link kosong atau gagal dimuat, website akan mencari:
- media/photos/pks.jpg
- media/photos/jitu.jpg

Kedua file logo lokal tersebut tidak akan ditampilkan di galeri dan tidak dihitung.

FOLDER MEDIA
------------
Foto:
- media/photos/foto1.jpg
- media/photos/foto2.jpg
- media/photos/foto3.png
- dan seterusnya

Video:
- media/videos/video1.mp4
- media/videos/video2.mp4
- media/videos/video3.mp4
- dan seterusnya

Format foto: JPG, JPEG, PNG, WEBP, GIF, AVIF
Format video: MP4, WEBM, MOV, OGV

PENTING
-------
- Untuk Vercel, file media harus ikut ter-upload/ter-deploy ke project. Menambahkan file ke folder di komputer saja tidak akan membuatnya muncul di website yang sudah online.
- Setelah file baru ikut deployment Vercel, API akan memindai folder media saat website memeriksa ulang (maksimal sekitar 1 menit).
- Pada GitHub Pages, repository harus PUBLIC agar GitHub API dapat membaca daftar file tanpa token.
- Jangan upload file rahasia atau data pribadi ke repository public.
- GitHub Pages adalah hosting statis dan tidak menjalankan PHP maupun Node.js.
