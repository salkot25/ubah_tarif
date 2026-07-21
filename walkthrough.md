# Walkthrough — Form Survey Lokasi PLN (SALKOT)

# Walkthrough — Form Survey & Permohonan Ubah Tarif PLN (SALKOT) Separated Flow

Aplikasi telah berhasil dirombak untuk memisahkan alur **Permohonan (Ubah Tarif)** dan **Survey (BA Lapangan)** secara mandiri, didukung oleh pembagian database (Google Sheets) yang clean dan relasional.

---

## 🌟 Update: Fitur Autentikasi & Otorisasi Robust (User Tersimpan di Spreadsheet) (2026-06-20)

Kami telah menambahkan sistem **Autentikasi (Login)** dan **Otorisasi (Role-Based Access Control / RBAC)** yang robust. Akun user disimpan secara terpusat di tab `Users` di Google Spreadsheet.

### Detail Keamanan & Implementasi:
* **Password Hashing (SHA-256)**: Password disimpan dalam bentuk hash aman menggunakan algoritma SHA-256 di level backend Google Apps Script. Tidak ada password teks polos yang tersimpan di spreadsheet.
* **Signed Stateless Token (JWT-Like)**: Mengimplementasikan token sesi tanpa-state (stateless) yang ditandatangani secara kriptografis menggunakan tanda tangan HMAC-SHA256 dengan Script-Secret yang dinamis. Token diverifikasi secara real-time pada setiap query/mutasi data.
* **Route Guarding & Protected Routes**: Mengamankan navigasi frontend React menggunakan context provider `<AuthProvider>` dan `<ProtectedRoute>`. Pengguna tidak terautentikasi akan otomatis diarahkan kembali ke halaman login.
* **CORS Interceptor (Self-Healing Session)**: Mengintegrasikan interceptor token di `src/services/api.js` untuk secara otomatis menyematkan token ke seluruh payload POST dan parameter GET. Bila sesi kedaluwarsa (24 jam) atau token rusak, sistem memicu event `gas-unauthorized` untuk mengeluarkan user secara otomatis dengan pemberitahuan.
* **Manajemen User (Admin Only)**: Menambahkan tab khusus "Manajemen User" di halaman Pengaturan (hanya terlihat oleh role `admin`). Admin dapat mendaftarkan user baru, mengedit nama, menonaktifkan akun, mengubah role, mengganti password, atau menghapus user secara aman.
* **Pencegahan Self-Destruct**: Sistem mencegah user admin menghapus dirinya sendiri atau menghapus akun `admin` utama.
* **Role Check di Client & Server**: Hak menghapus data permohonan dibatasi hanya untuk role `admin` (dinonaktifkan secara visual pada client-side dan ditolak di level API backend).

### Perubahan File:
* **[backend/Code.gs](file:///d:/Antigravity/ubah_tarif/backend/Code.gs)**: Menambahkan skema Users, hashing password, HMAC generator/verifier, doGet/doPost interceptor, serta endpoint login, getUsers, saveUser, dan deleteUser.
* **[src/services/api.js](file:///d:/Antigravity/ubah_tarif/src/services/api.js)**: Menyematkan token ke query params dan request body, melempar event unauthorized, dan mengekspor binding API auth baru.
* **[src/context/AuthContext.jsx](file:///d:/Antigravity/ubah_tarif/src/context/AuthContext.jsx) [NEW]**: Provider state login, simpan token di localStorage, dan listener event unauthorized.
* **[src/pages/LoginPage.jsx](file:///d:/Antigravity/ubah_tarif/src/pages/LoginPage.jsx) [NEW]**: Halaman login premium berdesain modern (slate orbs, glassmorphism card, validation handling, password show/hide).
* **[src/App.jsx](file:///d:/Antigravity/ubah_tarif/src/App.jsx)**: Menerapkan login route, ProtectedRoute guard, dan membersihkan PageWrapper global.
* **[src/pages/SettingsPage.jsx](file:///d:/Antigravity/ubah_tarif/src/pages/SettingsPage.jsx)**: Pembagian tab (Pejabat & Manajemen User), tabel manajemen akun, modal mutasi akun, password resets, dan confirmation modals.
* **[src/pages/PermohonanListPage.jsx](file:///d:/Antigravity/ubah_tarif/src/pages/PermohonanListPage.jsx)**: Menambahkan context user dan menyembunyikan tombol delete permohonan jika role bukan `admin`.
* **[src/components/layout/Navbar.jsx](file:///d:/Antigravity/ubah_tarif/src/components/layout/Navbar.jsx)**: Menampilkan nama lengkap, role badge, inisial avatar pengguna, dan tombol aksi Logout.

## ✅ Apa yang Sudah Dibuat

Aplikasi survey lokasi pelanggan PLN yang lengkap dengan:

- **Backend**: Google Apps Script terhubung ke Spreadsheet `LHA SALKOT 26`
- **Frontend**: React 18 + Vite + Tailwind CSS

---

## 🖼️ Screenshots

````carousel
![Dashboard Page](file:///C:/Users/user/.gemini/antigravity-ide/brain/903baf58-ef45-4cc9-9433-f250cbc0e85c/dashboard_page_1781891731308.png)
<!-- slide -->
![Form Survey Step 1 — Identitas](file:///C:/Users/user/.gemini/antigravity-ide/brain/903baf58-ef45-4cc9-9433-f250cbc0e85c/form_step_1_1781891741151.png)
<!-- slide -->
![Form Survey Step 2 — Teknis + GPS](file:///C:/Users/user/.gemini/antigravity-ide/brain/903baf58-ef45-4cc9-9433-f250cbc0e85c/form_step_2_1781891773634.png)
<!-- slide -->
![Data Survey — Tabel + Filter](file:///C:/Users/user/.gemini/antigravity-ide/brain/903baf58-ef45-4cc9-9433-f250cbc0e85c/data_survey_page_1781891781903.png)
<!-- slide -->
![Peta Lokasi — Leaflet Map](file:///C:/Users/user/.gemini/antigravity-ide/brain/903baf58-ef45-4cc9-9433-f250cbc0e85c/peta_lokasi_page_1781891791111.png)
````

---

## 🚀 Setup Lengkap — Langkah demi Langkah

### Step 1: Deploy Google Apps Script

1. Buka **[Google Apps Script](https://script.google.com)** — buat project baru
2. Copy-paste seluruh isi [Code.gs](file:///d:/Antigravity/ubah_tarif/backend/Code.gs) ke editor
3. Pastikan nilai variabel:
   ```js
   const SPREADSHEET_ID = '1dd4qZjZ-tqVnM48f74zAkiouKZblrKgWoDkVAOzEAys'; // sudah benar
   const SHEET_NAME     = 'Sheet1'; // sesuaikan nama tab
   const DRIVE_FOLDER_ID = '1ebRlXV1hV6oeAo-VAGNneLYDeTn-P_jF'; // sudah benar
   ```
4. Klik **Deploy** → **New deployment**
5. Atur: Type = **Web App**, Execute as = **Me**, Access = **Anyone**
6. Salin **URL web app** yang diberikan

### Step 2: Konfigurasi Frontend

Buat file `.env` di root project:
```bash
# d:\Antigravity\ubah_tarif\.env
VITE_GAS_URL=https://script.google.com/macros/s/SCRIPT_ID_ANDA/exec
```

### Step 3: Jalankan

```bash
npm run dev
```

Buka **http://localhost:5173/**

---

## 📁 Struktur File

```
d:\Antigravity\ubah_tarif\
├── backend/
│   └── Code.gs              ← Copy ke Google Apps Script
├── src/
│   ├── config/constants.js  ← Dropdown options, field definitions
│   ├── services/api.js      ← Connector ke GAS
│   ├── hooks/
│   │   ├── useSurveyData.js ← CRUD state management
│   │   └── useGeolocation.js← GPS auto-fill
│   ├── components/
│   │   ├── ui/              ← Button, Input, Select, Badge, Modal, Toast, Spinner
│   │   ├── layout/          ← Sidebar, Navbar, PageWrapper
│   │   └── survey/          ← SurveyForm + Step 1-5
│   └── pages/
│       ├── DashboardPage.jsx← Statistik + charts
│       ├── FormPage.jsx     ← Form survey baru
│       ├── ListPage.jsx     ← Tabel data + CRUD
│       └── MapPage.jsx      ← Peta Leaflet
└── .env.example             ← Template environment variables
```

---

## ✨ Fitur Aplikasi

| Fitur | Detail |
|---|---|
| **Form Multi-Step** | 5 tahap wizard (Identitas → Teknis → Meter → Pengukuran → Kesimpulan) |
| **GPS Auto-Fill** | 1-klik ambil koordinat GPS dari browser |
| **Upload Foto** | Upload ke Google Drive, tersusun per tahun/bulan |
| **Dashboard** | Statistik, bar chart tarif, pie chart merk meter |
| **Data Table** | Search, filter tarif & SPI, pagination, edit, hapus |
| **Export CSV** | Download semua data sebagai CSV |
| **Peta Lokasi** | Leaflet map — hijau = Efektif, merah = Tidak Efektif |
| **Toast Notif** | Feedback realtime untuk setiap aksi |
| **Responsive** | Mobile-first, collapsible sidebar |

---

## 🔧 Deployment ke GitHub Pages

```bash
npm run build
```

Upload isi folder `dist/` ke repository GitHub Pages, atau gunakan GitHub Actions.

> [!NOTE]
> Karena menggunakan `BrowserRouter` + `basename='./'`, routing perlu sedikit adjustment untuk GitHub Pages. Tambahkan redirect di `404.html` jika diperlukan.
