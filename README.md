# Survey Lokasi PLN — SALKOT

Aplikasi **Form Survey Lokasi** untuk petugas lapangan PLN. Menggunakan Google Apps Script sebagai backend dan React + Vite + Tailwind CSS sebagai frontend.

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Konfigurasi Environment

Salin `.env.example` menjadi `.env` dan isi URL Google Apps Script:

```bash
cp .env.example .env
```

Edit `.env`:
```
VITE_GAS_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

### 3. Jalankan Development Server

```bash
npm run dev
```

---

## 📋 Setup Google Apps Script (Backend)

1. Buka [Google Apps Script](https://script.google.com)
2. Buat project baru
3. Copy isi file `backend/Code.gs` ke editor
4. Pastikan variabel `SPREADSHEET_ID` dan `DRIVE_FOLDER_ID` sudah benar
5. **Deploy sebagai Web App:**
   - Klik **Deploy** → **New deployment**
   - Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Copy URL web app dan paste ke `.env` sebagai `VITE_GAS_URL`

---

## 🏗️ Struktur Folder

```
src/
├── components/
│   ├── ui/          # Button, Input, Select, Badge, Card, Modal, Toast, Spinner
│   ├── layout/      # Sidebar, Navbar, PageWrapper
│   └── survey/      # SurveyForm, Step1-5, SurveyTable
├── hooks/           # useSurveyData, useGeolocation
├── pages/           # Dashboard, Form, List, Map
├── services/        # api.js (GAS connector)
└── config/          # constants.js (dropdown options, etc)
backend/
└── Code.gs          # Google Apps Script
```

---

## 📦 Build untuk Production (GitHub Pages)

```bash
npm run build
```

Output di folder `dist/`. Upload isi folder `dist/` ke repository GitHub Pages.

---

## 🛠️ Tech Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS 3 |
| Routing | React Router DOM |
| Charts | Recharts |
| Maps | Leaflet + React-Leaflet |
| HTTP | Fetch API |
| Backend | Google Apps Script |
| Database | Google Sheets |
| Storage | Google Drive |
