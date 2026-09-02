export const GAS_URL = import.meta.env.VITE_GAS_URL || 'https://script.google.com/macros/s/AKfycbycxFteDE8hDFs5cFzxM6aKyoQwfxD3r2C93fs3dtNejR21UBz5QJf-wAvkZGATnmIwmQ/exec';

// ─── DROPDOWN OPTIONS ─────────────────────────────────────────────────────────

export const TARIF_OPTIONS = [
  { value: '',     label: '— Pilih Tarif —' },
  { value: 'R1',   label: 'R1 — Rumah Tangga' },
  { value: 'R1M',  label: 'R1M — Rumah Tangga (M)' },
  { value: 'R1MT', label: 'R1MT — Rumah Tangga (MT)' },
  { value: 'R1T',  label: 'R1T — Rumah Tangga (T)' },
  { value: 'R2T',  label: 'R2T — Rumah Tangga Menengah' },
  { value: 'S1',   label: 'S1 — Sosial Kecil' },
  { value: 'S1T',  label: 'S1T — Sosial Kecil (T)' },
  { value: 'B1',   label: 'B1 — Bisnis Kecil' },
  { value: 'B1T',  label: 'B1T — Bisnis Kecil (T)' },
  { value: 'B2',   label: 'B2 — Bisnis Menengah' },
  { value: 'P1T',  label: 'P1T — Penerangan Jalan Umum' },
];

export const DAYA_OPTIONS = [
  { value: '',      label: '— Pilih Daya —' },
  { value: 450,     label: '450 VA' },
  { value: 900,     label: '900 VA' },
  { value: 1300,    label: '1.300 VA' },
  { value: 2200,    label: '2.200 VA' },
  { value: 3500,    label: '3.500 VA' },
  { value: 4400,    label: '4.400 VA' },
  { value: 5500,    label: '5.500 VA' },
  { value: 6600,    label: '6.600 VA' },
  { value: 7700,    label: '7.700 VA' },
  { value: 10600,   label: '10.600 VA' },
  { value: 13200,   label: '13.200 VA' },
  { value: 16500,   label: '16.500 VA' },
  { value: 23000,   label: '23.000 VA' },
];

export const MERK_METER_OPTIONS = [
  { value: '',           label: '— Pilih Merk —' },
  { value: 'SMARTMETER', label: 'SMARTMETER' },
  { value: 'HEXING',     label: 'HEXING' },
  { value: 'ITRON',      label: 'ITRON' },
  { value: 'MELCOINDA',  label: 'MELCOINDA' },
  { value: 'SANXING',    label: 'SANXING' },
  { value: 'FUJI',       label: 'FUJI' },
  { value: 'METBELOSA',  label: 'METBELOSA' },
  { value: 'CANNET',     label: 'CANNET' },
  { value: 'LAINNYA',    label: 'LAINNYA' },
];

export const TARIF_KOREKSI_OPTIONS = [
  { value: '',    label: '— Pilih Tarif Koreksi —' },
  { value: 'P3',  label: 'P3' },
  { value: 'S1',  label: 'S1' },
  { value: 'S2',  label: 'S2' },
  { value: 'B1',  label: 'B1' },
  { value: 'B2',  label: 'B2' },
  { value: 'R1',  label: 'R1' },
  { value: 'R1M', label: 'R1M' },
  { value: 'R2',  label: 'R2' },
];

export const KESIMPULAN_SPI_OPTIONS = [
  { value: '',               label: '— Pilih Kesimpulan —' },
  { value: 'Efektif',        label: 'Efektif' },
  { value: 'Tidak Efektif',  label: 'Tidak Efektif' },
];

export const KESESUAIAN_OPTIONS = [
  { value: '',       label: '— Pilih Kesesuaian —' },
  { value: 'Sesuai', label: 'Sesuai' },
  { value: 'Tidak Sesuai', label: 'Tidak Sesuai' },
];

export const STATUS_OPTIONS = [
  { value: '',        label: 'Semua Status' },
  { value: 'Belum',   label: 'Belum' },
  { value: 'Draft',   label: 'Draft' },
  { value: 'Selesai', label: 'Selesai' }
];

export const MEDIA_PERMOHONAN_OPTIONS = [
  { value: 'CC123',           label: 'CC123' },
  { value: 'Web PLN',         label: 'Web PLN' },
  { value: 'Loket Pelayanan', label: 'Loket Pelayanan' }
];

export const STATUS_PERSIL_OPTIONS = [
  { value: 'Milik Sendiri', label: 'Milik Sendiri' },
  { value: 'Sewa',          label: 'Sewa' },
  { value: 'Kontrak',       label: 'Kontrak' }
];

export const PERUNTUKAN_OPTIONS = [
  { value: 'Rumah Tinggal', label: 'Rumah Tinggal' },
  { value: 'Usaha',         label: 'Usaha' },
  { value: 'Sosial',        label: 'Sosial' },
  { value: 'Publik',        label: 'Publik' }
];

// ─── FORM STEPS DEFINITION ───────────────────────────────────────────────────
export const FORM_STEPS = [
  { id: 1, title: 'Identitas',    subtitle: 'Data pelanggan',         icon: 'User' },
  { id: 2, title: 'Teknis',       subtitle: 'Tarif, daya & lokasi',   icon: 'Zap' },
  { id: 3, title: 'KWH Meter',    subtitle: 'Data meter listrik',     icon: 'Gauge' },
  { id: 4, title: 'Pengukuran',   subtitle: 'Hasil pembacaan meter',  icon: 'Activity' },
  { id: 5, title: 'Kesimpulan',   subtitle: 'Inventarisasi & Hasil',  icon: 'ClipboardCheck' },
];

// ─── FIELD VALIDATION RULES ──────────────────────────────────────────────────
export const REQUIRED_FIELDS_PERMOHONAN = ['IDPEL', 'NAMA', 'ALAMAT', 'TARIF', 'DAYA'];
export const REQUIRED_FIELDS_SURVEY = ['IDPEL', 'NO_SURAT_TUGAS', 'NO_BA', 'NO_TIANG', 'METER_MERK', 'KESIMPULAN_SPI'];

// ─── MISC ─────────────────────────────────────────────────────────────────────
export const APP_NAME    = 'SALKOT Survey';
export const APP_VERSION = '1.0.0';
export const ITEMS_PER_PAGE = 20;

export function formatDateForInput(dateStr) {
  if (!dateStr) return '';
  const str = String(dateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  if (str.includes('T')) {
    return str.split('T')[0];
  }
  
  try {
    const date = new Date(str);
    if (!isNaN(date.getTime())) {
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
  } catch (e) {
    // ignore
  }
  
  return str;
}
