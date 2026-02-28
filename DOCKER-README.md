# PharmaSys Docker Setup

Panduan cara menjalankan aplikasi PharmaSys menggunakan Docker. Pastikan semua langkah dilakukan berurutan.

## Prerequisites

Pastikan komputer sudah terinstall:

* [Docker Desktop](https://www.docker.com/products/docker-desktop)
* Node.js & NPM (untuk compile assets di Mac/Host)

## Cara Menjalankan

### 1. Setup Environment

Copy file `.env.docker` menjadi `.env`.

```bash
cp .env.docker .env

```

*Pastikan konfigurasi database di `.env` menggunakan host `database` (nama service docker).*

### 2. Build dan Jalankan Container

Jalankan perintah ini untuk membangun image dan menyalakan semua service (Nginx, PHP, PostgreSQL).

```bash
docker compose up -d --build

```

### 3. Install Dependencies (Wajib)

Karena menggunakan volume mapping, folder `vendor` harus diisi melalui container agar Laravel bisa berjalan.

```bash
# Install PHP library
docker compose exec php composer install

# Install JS library & build assets (Jalankan di terminal Mac/Host)
npm install
npm run build

```

### 4. Setup Laravel & Database

Setelah dependencies terinstall, lakukan inisialisasi aplikasi:

```bash
# Generate App Key
docker compose exec php php artisan key:generate

# Jalankan Migration & Seed Data
docker compose exec php php artisan migrate --seed

# Setup folder permission
docker compose exec php chown -R www-data:www-data /var/www/storage /var/www/bootstrap/cache
docker compose exec php chmod -R 775 /var/www/storage /var/www/bootstrap/cache

```

### 5. Akses Aplikasi

Buka browser dan akses:

* **Local**: [http://localhost](https://www.google.com/search?q=http://localhost)
* **Network (HP/Perangkat lain)**: `http://[IP-MAC-ANDA]`

---

## Struktur Container

| Service | Port | Deskripsi |
| --- | --- | --- |
| **nginx** | 80 | Web Server (Entry Point) |
| **php** | 9000 | PHP-FPM Engine |
| **database** | 5432 | PostgreSQL 15 |

---

## Command Berguna

```bash
# Menghentikan container
docker compose down

# Menjalankan kembali (tanpa build ulang)
docker compose up -d

# Melihat log jika terjadi error
docker compose logs -f

# Masuk ke terminal container PHP
docker compose exec php bash

```

## Masalah Umum & Solusi

**1. Error: `vendor/autoload.php` not found**
Solusi: Jalankan `docker compose exec php composer install`.

**2. Tampilan Berantakan (CSS Tidak Muncul)**
Solusi: Jalankan `npm install && npm run build` di terminal host (Mac).

**3. Error Permission di Storage**
Solusi: Jalankan perintah `chown` dan `chmod` yang ada di Langkah 4.

**4. Database Connection Refused**
Solusi: Pastikan `DB_HOST=database` di file `.env`, bukan `127.0.0.1`.

**5. Build Frontend Gagal (Tailwind CSS Error)**
Solusi: Pastikan file `resources/css/app.css` tidak menggunakan `@apply` yang merujuk ke class Tailwind. Ganti dengan CSS biasa atau gunakan class Tailwind langsung di komponen React/JSX.

---

**Catatan**: Untuk memindahkan ke laptop lain, cukup copy seluruh folder project dan ulangi dari Langkah 1.
