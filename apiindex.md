# 📖 API Index — Mangaweb Backend

> Base URL: `http://localhost:8000`  
> API Version: `v1`  
> Semua endpoint berada di bawah prefix `/api/v1/...`

---

## Daftar Isi
- [🔐 Auth](#-auth)
- [📚 Mangas](#-mangas)
- [📄 Chapters (via Mangas)](#-chapters-via-mangas)
- [🖼️ Chapter Pages](#️-chapter-pages)

---

## 🔐 Auth

Base prefix: `/api/v1/auth`

---

### `POST /api/v1/auth/register`
**Fungsi:** Daftarkan user baru dengan email, password, dan username unik.

**Request Body (JSON):**
```json
{
  "email": "user@example.com",
  "password": "min6char",
  "username": "user_name"
}
```
> Validasi: email harus format valid, password min 6 karakter, username 3–50 karakter (hanya huruf, angka, `_`, `-`, `.`)

**Response `201`:**
```json
{
  "message": "User registered successfully",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "profile": { ... }
  }
}
```

---

### `POST /api/v1/auth/login`
**Fungsi:** Login user dan kembalikan session token (JWT).

**Request Body (JSON):**
```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Response `200`:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "refresh_token": "eyJ...",
  "expires_in": 3600,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "profile": { ... }
  }
}
```

---

### `GET /api/v1/auth/me/{user_id}`
**Fungsi:** Ambil detail profil + metadata user berdasarkan ID.

**Path Param:**
| Param | Tipe | Keterangan |
|-------|------|------------|
| `user_id` | `string (UUID)` | ID user yang ingin diambil datanya |

**Response `200`:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "user_name",
  "role": "member",
  "avatar_url": null,
  "created_at": "2024-01-01T00:00:00"
}
```
> Role bisa: `admin`, `vip`, `member`

---

## 📚 Mangas

Base prefix: `/api/v1/mangas`

---

### `GET /api/v1/mangas`
**Fungsi:** Ambil daftar semua manga dengan dukungan paginasi dan pencarian.

**Query Params:**
| Param | Default | Keterangan |
|-------|---------|------------|
| `skip` | `0` | Offset/mulai dari index ke- |
| `limit` | `20` | Jumlah item (max 100) |
| `search` | `null` | Kata kunci pencarian judul (min 1 karakter) |

**Response `200`:**
```json
{
  "total": 50,
  "items": [
    {
      "id": "uuid",
      "slug": "one-piece",
      "title": "One Piece",
      "creator": "Eiichiro Oda",
      "genre": ["Action", "Adventure"],
      "description": "...",
      "cover_image_url": "https://...",
      "is_published": true,
      "created_at": "2024-01-01T00:00:00",
      "updated_at": "2024-01-01T00:00:00"
    }
  ]
}
```

---

### `POST /api/v1/mangas`
**Fungsi:** Buat entri manga baru.

**Request Body (JSON):**
```json
{
  "slug": "one-piece",
  "title": "One Piece",
  "creator": "Eiichiro Oda",
  "genre": ["Action", "Adventure"],
  "description": "Kisah Monkey D. Luffy...",
  "cover_image_url": "https://...",
  "is_published": true
}
```
> `slug` dan `title` wajib diisi. Field lain opsional.

**Response `201`:** Objek `MangaResponse` (sama dengan item di list).

---

### `GET /api/v1/mangas/{slug}`
**Fungsi:** Ambil detail 1 manga berdasarkan slug URL-nya.

**Path Param:**
| Param | Tipe | Keterangan |
|-------|------|------------|
| `slug` | `string` | Slug unik manga, contoh: `one-piece` |

**Response `200`:** Objek `MangaResponse`.  
**Response `404`:** `{ "detail": "Manga not found" }`

---

### `PATCH /api/v1/mangas/{manga_id}`
**Fungsi:** Update sebagian data manga (partial update).

**Path Param:**
| Param | Tipe | Keterangan |
|-------|------|------------|
| `manga_id` | `string (UUID)` | ID manga |

**Request Body (JSON) — semua field opsional:**
```json
{
  "title": "Judul Baru",
  "is_published": false
}
```

**Response `200`:** Objek `MangaResponse` yang sudah diupdate.

---

### `DELETE /api/v1/mangas/{manga_id}`
**Fungsi:** Hapus manga berdasarkan ID-nya.

**Path Param:**
| Param | Tipe | Keterangan |
|-------|------|------------|
| `manga_id` | `string (UUID)` | ID manga |

**Response `204`:** No content (berhasil dihapus).  
**Response `404`:** `{ "detail": "Manga not found" }`

---

## 📄 Chapters (via Mangas)

Endpoint chapter yang terikat ke manga menggunakan prefix `/api/v1/mangas/...`

---

### `GET /api/v1/mangas/{slug}/chapters`
**Fungsi:** Ambil daftar chapter dari sebuah manga berdasarkan slug-nya.

**Path Param:**
| Param | Tipe | Keterangan |
|-------|------|------------|
| `slug` | `string` | Slug manga |

**Query Params:**
| Param | Default | Keterangan |
|-------|---------|------------|
| `skip` | `0` | Offset paginasi |
| `limit` | `50` | Jumlah item (max 100) |

**Response `200`:**
```json
{
  "total": 10,
  "items": [
    {
      "id": "uuid",
      "manga_id": "uuid",
      "chapter_number": "1.5",
      "title": "Chapter 1.5",
      "created_at": "2024-01-01T00:00:00"
    }
  ]
}
```

---

### `POST /api/v1/mangas/{manga_id}/chapters`
**Fungsi:** Tambah chapter baru ke sebuah manga.

**Path Param:**
| Param | Tipe | Keterangan |
|-------|------|------------|
| `manga_id` | `string (UUID)` | ID manga |

**Request Body (JSON):**
```json
{
  "manga_id": "uuid-sama-dengan-path",
  "chapter_number": 1,
  "title": "Chapter 1: Awal Petualangan"
}
```
> ⚠️ `manga_id` di body harus sama dengan `manga_id` di path, jika tidak akan 400.

**Response `201`:** Objek `ChapterResponse`.

---

### `PATCH /api/v1/mangas/chapters/{chapter_id}`
**Fungsi:** Update data chapter (nomor atau judul).

**Path Param:**
| Param | Tipe | Keterangan |
|-------|------|------------|
| `chapter_id` | `string (UUID)` | ID chapter |

**Request Body (JSON) — semua field opsional:**
```json
{
  "chapter_number": 2,
  "title": "Judul Baru"
}
```

**Response `200`:** Objek `ChapterResponse` yang diupdate.

---

### `DELETE /api/v1/mangas/chapters/{chapter_id}`
**Fungsi:** Hapus chapter berdasarkan ID.

**Path Param:**
| Param | Tipe | Keterangan |
|-------|------|------------|
| `chapter_id` | `string (UUID)` | ID chapter |

**Response `204`:** No content.  
**Response `404`:** `{ "detail": "Chapter not found" }`

---

## 🖼️ Chapter Pages

Base prefix: `/api/v1/chapters`

---

### `GET /api/v1/chapters/{chapter_id}/pages`
**Fungsi:** Ambil semua halaman (pages) dari sebuah chapter, lengkap dengan signed URL untuk akses gambar dari Supabase Storage.

**Path Param:**
| Param | Tipe | Keterangan |
|-------|------|------------|
| `chapter_id` | `string (UUID)` | ID chapter |

**Response `200`:**
```json
{
  "chapter_id": "uuid",
  "manga_id": "uuid",
  "pages": [
    {
      "page_number": 1,
      "signed_url": "https://supabase.../storage/...?token=...",
      "expires_at": "2024-01-01T01:00:00Z"
    }
  ]
}
```
> Signed URL dibuat otomatis oleh server. Jika image_path sudah berupa URL http/https, digunakan langsung tanpa proses signing.

---

### `POST /api/v1/chapters/{chapter_id}/pages`
**Fungsi:** Tambah halaman baru ke dalam chapter, menyimpan path gambar di Supabase Storage.

**Path Param:**
| Param | Tipe | Keterangan |
|-------|------|------------|
| `chapter_id` | `string (UUID)` | ID chapter |

**Request Body (JSON):**
```json
{
  "chapter_id": "uuid-sama-dengan-path",
  "page_number": 1,
  "image_path": "manga/one-piece/ch1/page_001.jpg"
}
```
> ⚠️ `chapter_id` di body harus sama dengan `chapter_id` di path.  
> `image_path` adalah path di dalam Supabase Storage bucket.

**Response `201`:**
```json
{
  "id": "uuid",
  "chapter_id": "uuid",
  "page_number": 1,
  "image_path": "manga/one-piece/ch1/page_001.jpg",
  "created_at": "2024-01-01T00:00:00"
}
```

---

## 🔧 Utilitas

### `GET /`
**Fungsi:** Health check — cek apakah server aktif.

**Response `200`:**
```json
{ "Server": "Active" }
```

---

## 📋 Ringkasan Semua Endpoint

| Method | Endpoint | Fungsi |
|--------|----------|--------|
| `POST` | `/api/v1/auth/register` | Daftar user baru |
| `POST` | `/api/v1/auth/login` | Login & dapat token |
| `GET` | `/api/v1/auth/me/{user_id}` | Ambil profil user |
| `GET` | `/api/v1/mangas` | List semua manga (+ search, paginasi) |
| `POST` | `/api/v1/mangas` | Buat manga baru |
| `GET` | `/api/v1/mangas/{slug}` | Detail manga by slug |
| `PATCH` | `/api/v1/mangas/{manga_id}` | Update manga |
| `DELETE` | `/api/v1/mangas/{manga_id}` | Hapus manga |
| `GET` | `/api/v1/mangas/{slug}/chapters` | List chapter dari manga |
| `POST` | `/api/v1/mangas/{manga_id}/chapters` | Tambah chapter ke manga |
| `PATCH` | `/api/v1/mangas/chapters/{chapter_id}` | Update chapter |
| `DELETE` | `/api/v1/mangas/chapters/{chapter_id}` | Hapus chapter |
| `GET` | `/api/v1/chapters/{chapter_id}/pages` | Ambil semua halaman chapter (+ signed URL) |
| `POST` | `/api/v1/chapters/{chapter_id}/pages` | Tambah halaman ke chapter |
| `GET` | `/` | Health check server |
