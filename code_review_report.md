# 📋 Laporan Code Review & Quality: Frontend

> Tanggal: 23 Agustus 2026  
> Scope: `frontend/` (HTML, CSS, JS)

---

## 📊 Ringkasan Eksekutif

| Kategori | Rating | Catatan Singkat |
|---|:---:|---|
| **Struktur & Modularitas** | ⭐⭐⭐⭐☆ | Sangat ringan, menggunakan Vanilla JS ES Modules tanpa dependensi berlebih. |
| **Keamanan (Security)** | ⭐⭐☆☆☆ | Ada celah risiko Stored XSS pada manipulasi `innerHTML`. |
| **UX & Error Handling** | ⭐⭐⭐☆☆ | State loading dasar ada, namun transisi login/logout dan fallback gambar perlu disempurnakan. |
| **Aksesibilitas (a11y)** | ⭐⭐⭐☆☆ | Atribut `aria-live` sudah ada, namun relasi label form dan navigasi breadcrumb masih minim. |
| **Kerapian Format Kode** | ⭐⭐☆☆☆ | Sebagian file HTML & CSS dalam kondisi *minified/single-line*. |

---

## 🔍 Temuan Utama & Analisis Mendalam

### 1. 🚨 Keamanan: Potensi Stored XSS via `innerHTML`
* **Lokasi**: `frontend/index.html` (fungsi `card()`)
* **Masalah**:
  ```javascript
  item.innerHTML = manga.cover_image_url
    ? `<img src="${manga.cover_image_url}" alt="Cover ${manga.title}">`
    : '<div class="cover-placeholder"></div>';
  ```
  Jika data `manga.cover_image_url` atau `manga.title` dari backend disusupi script berbahaya (misal `"><img src=x onerror=alert(1)>`), browser akan mengeksekusinya.
* **Solusi**: Gunakan API DOM murni (`document.createElement`, properti `.src`, `.alt`) untuk menghindari evaluasi string HTML mentah.

---

### 2. ⚡ UI/UX: Toggle Tombol Login & Logout Tidak Sinkron
* **Lokasi**: `frontend/index.html` & `frontend/js/auth.js` (`updateAuthNavigation()`)
* **Masalah**:
  Fungsi hanya mengubah status hidden tombol `[data-logout]`. Tombol link `Login` tetap terlihat meski pengguna sudah login.
* **Solusi**:
  Tambahkan atribut `data-login-btn` pada tombol login, lalu sembunyikan (`hidden = !!user`) saat sesi aktif.

---

### 3. 🌐 API Client & Session Management
* **Lokasi**: `frontend/js/api.js`
* **Temuan**:
  1. **Hardcoded API URL**: `const API_BASE_URL = "http://localhost:8000/api/v1";` menyulitkan konfigurasi saat dideploy ke staging/production.
  2. **JSON.parse Unhandled Error**: `getCurrentUser()` memanggil `JSON.parse(user)` tanpa blok `try/catch`. Jika isi `localStorage` rusak/corrupted, aplikasi akan crash.
  3. **Handling Token Expired (401)**: Belum ada auto-clear session saat request backend mengembalikan status `401 Unauthorized`.

---

### 4. 📖 Reader Experience & Image Fallbacks
* **Lokasi**: `frontend/js/reader.js`
* **Temuan**:
  1. **Navigasi Kembali**: Saat membaca chapter, link header kembali ke `index.html` (katalog utama), bukan ke daftar chapter manga terkait.
  2. **Signed URL Timeout**: Halaman reader menggunakan Signed URL Supabase yang memiliki masa berlaku. Jika expired saat membaca, belum ada penanganan retry / info error gambar.

---

### 5. 🎨 Format Kode (Maintainability)
* **Lokasi**: `frontend/login.html`, `frontend/reader.html`, `frontend/css/styles.css`
* **Masalah**: Ditulis rapat dalam 1 baris panjang sehingga sulit dibaca dan di-diff di Git.

---

## 🛠️ Rekomendasi Kode Solusi

### 1. Perbaikan Sanitasi DOM (`frontend/index.html`)
```javascript
function card(manga) {
  const item = document.createElement("a");
  item.className = "card";
  item.href = `reader.html?slug=${encodeURIComponent(manga.slug)}`;

  if (manga.cover_image_url) {
    const img = document.createElement("img");
    img.src = manga.cover_image_url;
    img.alt = `Cover ${manga.title}`;
    img.loading = "lazy";
    item.append(img);
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = "cover-placeholder";
    item.append(placeholder);
  }

  const heading = document.createElement("h2");
  heading.textContent = manga.title;

  const creator = document.createElement("p");
  creator.textContent = manga.creator || "Creator tidak tersedia";

  item.append(heading, creator);
  return item;
}
```

### 2. Penanganan Auth Navigasi (`frontend/js/auth.js`)
```javascript
export function updateAuthNavigation() {
  const user = getCurrentUser();
  const status = document.querySelector("[data-auth-status]");
  const logoutButton = document.querySelector("[data-logout]");
  const loginButton = document.querySelector("[data-login-btn]");

  if (status) {
    status.textContent = user 
      ? `Masuk sebagai ${user.profile?.username || user.username || user.email}` 
      : "Belum masuk";
  }
  if (logoutButton) logoutButton.hidden = !user;
  if (loginButton) loginButton.hidden = !!user;
}
```

### 3. Safe User Parse (`frontend/js/api.js`)
```javascript
export function getCurrentUser() {
  const user = localStorage.getItem("manga_user");
  if (!user) return null;
  try {
    return JSON.parse(user);
  } catch {
    clearSession();
    return null;
  }
}
```
