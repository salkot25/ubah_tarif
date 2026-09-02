import React, { useState, useEffect } from 'react';
import { X, Printer, FileEdit, FileText, Plus, Trash, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { getById } from '../../services/api';
import { formatDateForInput } from '../../config/constants';

// Helper to format date
const formatIndonesianDate = (dateStr) => {
  if (!dateStr) return { fullText: '', shortDate: '', dayName: '' };
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return { fullText: dateStr, shortDate: dateStr, dayName: '' };

  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const dayName = days[date.getDay()];
  const dayNum = date.getDate();
  const monthName = months[date.getMonth()];
  const yearNum = date.getFullYear();

  const dd = String(dayNum).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(yearNum).slice(-2);

  return {
    fullText: `${dayName} Tanggal ${dayNum} Bulan ${monthName} Tahun ${yearNum}`,
    shortDate: `${dd}-${mm}-${yy}`,
    dayName
  };
};

export default function ChangeTarifModal({ isOpen, onClose, data }) {
  if (!isOpen || !data) return null;

  const [loading, setLoading] = useState(true);
  const [completeData, setCompleteData] = useState(null);

  // 1. Data Administrasi
  const [namaPelanggan, setNamaPelanggan] = useState('');
  const [idpel, setIdpel] = useState('');
  const [alamat, setAlamat] = useState('');
  const [tarifLama, setTarifLama] = useState('');
  const [dayaLama, setDayaLama] = useState('');

  // 2. Data Permohonan
  const [mediaPermohonan, setMediaPermohonan] = useState('CC123');
  const [tglPermohonan, setTglPermohonan] = useState(new Date().toISOString().slice(0, 10));
  const [namaPemohon, setNamaPemohon] = useState('');
  const [alamatPemohon, setAlamatPemohon] = useState('');
  const [nikPemohon, setNikPemohon] = useState('');
  const [tarifBaru, setTarifBaru] = useState('');
  const [dayaBaru, setDayaBaru] = useState('');

  // 3. Data Lapangan
  const [nikPelanggan, setNikPelanggan] = useState('');
  const [noTelp, setNoTelp] = useState('');
  const [peruntukanLap, setPeruntukanLap] = useState('Rumah Tinggal');
  const [statusPersil, setStatusPersil] = useState('Milik Sendiri');

  // 4. Dokumen Pendukung
  const [ktpAda, setKtpAda] = useState(true);
  const [ijinAda, setIjinAda] = useState(false);
  const [fotoAda, setFotoAda] = useState(true);

  // 5. Peralatan Listrik
  const [appliancesRT, setAppliancesRT] = useState([]);
  const [appliancesPL, setAppliancesPL] = useState([]);

  // 6. Pejabat Penandatangan
  const [pejabatMup3, setPejabatMup3] = useState(() => localStorage.getItem('SETTING_MUP3') || 'VICKY REANDRY FARADIAN');
  const [pejabatAsman, setPejabatAsman] = useState(() => localStorage.getItem('SETTING_ASMAN') || 'MUHAMAD ALWI SOFIAN');
  const [pejabatMulp, setPejabatMulp] = useState(() => localStorage.getItem('SETTING_MULP') || 'ARIF SETYAWAN');
  const [pejabatTl, setPejabatTl] = useState(() => localStorage.getItem('SETTING_TL') || 'FATHUR ROHIM');
  const [petugasSurvey, setPetugasSurvey] = useState(() => localStorage.getItem('SETTING_PETUGAS_SURVEY') || 'Fathur Rohim');

  // Digital Signatures from Settings
  const [ttdMup3, setTtdMup3] = useState(() => localStorage.getItem('SETTING_TTD_MUP3') || '');
  const [ttdAsman, setTtdAsman] = useState(() => localStorage.getItem('SETTING_TTD_ASMAN') || '');
  const [ttdMulp, setTtdMulp] = useState(() => localStorage.getItem('SETTING_TTD_MULP') || '');
  const [ttdTl, setTtdTl] = useState(() => localStorage.getItem('SETTING_TTD_TL') || '');
  const [ttdPetugas, setTtdPetugas] = useState(() => localStorage.getItem('SETTING_TTD_PETUGAS_SURVEY') || '');

  const [sertakanTtd, setSertakanTtd] = useState(true);

  const [tglPemeriksaan, setTglPemeriksaan] = useState(new Date().toISOString().slice(0, 10));

  // Fetch full data including survey to populate appliances list
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await getById(data.IDPEL);
        if (res.status === 'success') {
          setCompleteData(res.data);
        }
      } catch (err) {
        console.error('Gagal memuat data lengkap:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [data.IDPEL]);

  // Set states when complete data arrives
  useEffect(() => {
    if (completeData) {
      const p = completeData.permohonan || {};
      const s = completeData.survey || {};

      setNamaPelanggan(p.NAMA || '');
      setIdpel(p.IDPEL || '');
      setAlamat(p.ALAMAT || '');
      setTarifLama(p.TARIF || '');
      setDayaLama(p.DAYA ? `${Number(p.DAYA).toLocaleString('id')} VA` : '');

      setMediaPermohonan(p.MEDIA_PERMOHONAN || 'CC123');
      setTglPermohonan(p.TANGGAL_PERMOHONAN || new Date().toISOString().slice(0, 10));
      setNamaPemohon(p.NAMA_PEMOHON || p.NAMA || '');
      setAlamatPemohon(p.ALAMAT_PEMOHON || p.ALAMAT || '');
      setNikPemohon(p.NIK_PEMOHON || '');
      setTarifBaru(p.TARIF_BARU || '');
      setDayaBaru(p.DAYA_BARU ? `${Number(p.DAYA_BARU).toLocaleString('id')} VA` : '');

      setNikPelanggan(p.NIK_PELANGGAN || '');
      setNoTelp(p.NO_TELEPON || '');
      setPeruntukanLap(s.PERUNTUKAN_ON_SITE || 'Rumah Tinggal');
      setStatusPersil(p.STATUS_PERSIL || 'Milik Sendiri');

      const normalizeAda = (val) => {
        if (val === true || val === 1) return true;
        if (typeof val === 'string') {
          const s = val.trim().toLowerCase();
          return s === 'ada' || s === 'true' || s === '1' || s === 'ya';
        }
        return false;
      };

      setKtpAda(normalizeAda(p.KTP_ADA));
      setIjinAda(normalizeAda(p.IJIN_ADA));
      setFotoAda(normalizeAda(p.FOTO_ADA));

      const parseAppliances = (str) => {
        if (!str) return [];
        if (typeof str !== 'string') return str;
        try {
          return JSON.parse(str);
        } catch (e) {
          return [];
        }
      };

      const rtList = parseAppliances(s.INVENTARISASI_RT);
      const plList = parseAppliances(s.INVENTARISASI_PL);

      setAppliancesRT(rtList);
      setAppliancesPL(plList);
    }
  }, [completeData]);

  // Date formatting helpers
  const dateInfo = formatIndonesianDate(tglPemeriksaan);
  const tglMohonFormatted = formatIndonesianDate(tglPermohonan).shortDate;

  // Calculators
  const calcTotalRT = () => appliancesRT.reduce((sum, item) => sum + ((item.qty || 0) * (item.watt || 0)), 0);
  const calcTotalPL = () => appliancesPL.reduce((sum, item) => sum + ((item.qty || 0) * (item.watt || 0)), 0);

  const totalRT = calcTotalRT();
  const totalPL = calcTotalPL();
  const grandTotal = totalRT + totalPL;

  const pctRT = grandTotal > 0 ? ((totalRT / grandTotal) * 100).toFixed(1) : '0';
  const pctPL = grandTotal > 0 ? ((totalPL / grandTotal) * 100).toFixed(1) : '0';

  // Get max length for side-by-side table rows rendering
  const maxRowsCount = Math.max(appliancesRT.length, appliancesPL.length);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:p-0 print:bg-white">
      {/* Print CSS Specific Injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide all other elements by default */
          body * {
            visibility: hidden !important;
          }
          /* Show print target container and all its children */
          #printable-change-tarif, #printable-change-tarif * {
            visibility: visible !important;
          }
          /* Reset parent structures to static block layout so they don't break page margins/alignment */
          html, body, #root, [role="dialog"], .fixed, [role="dialog"] > div:last-child, .fixed > div:last-child, [role="dialog"] > div:last-child > div, .fixed > div:last-child > div, [role="dialog"] > div:last-child > div > div, .fixed > div:last-child > div > div, form, form > div, form > div > div {
            position: static !important;
            display: block !important;
            transform: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: auto !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
          }
          /* Position printable container absolutely centered relative to A4 page view */
          #printable-change-tarif {
            position: absolute !important;
            left: 0 !important;
            right: 0 !important;
            top: 0 !important;
            margin: 0 auto !important;
            width: 210mm !important;
            height: 297mm !important;
            padding: 12mm 15mm !important;
            box-sizing: border-box !important;
            background: white !important;
            border: none !important;
            box-shadow: none !important;
            z-index: 9999999 !important;
            font-size: 8.5pt !important;
            transform: none !important;
          }
          .print-border-black {
            border-color: #000000 !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      ` }} />

      <div className="relative w-full max-w-7xl h-[90vh] bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-slide-up print:hidden transition-colors">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 rounded-lg">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Cetak Live PDF — Formulir Pemeriksaan Peruntukan Tenaga Listrik</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Pratinjau dokumen A4 realtime sebelum dicetak atau disimpan sebagai PDF</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex-1 bg-white dark:bg-slate-900 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 size={32} className="text-blue-600 animate-spin" />
              <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Memuat data permohonan & survey...</span>
            </div>
          </div>
        ) : (
          /* Modal Body (Split Screen) */
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel: Configuration Form */}
            <div className="w-96 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col overflow-y-auto p-5 space-y-5 flex-shrink-0">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider pb-1 border-b border-slate-100 dark:border-slate-800">
                Informasi Cetak
              </h3>

              <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 rounded-xl p-4 space-y-2">
                <h4 className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase">Data Terkunci</h4>
                <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                  Semua parameter permohonan, kelengkapan berkas, dan hasil survey ditarik langsung dari database utama (Google Sheets) dan bersifat read-only pada dialog cetak ini.
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed font-semibold">
                  Guna melakukan perubahan data, silakan edit data melalui form Permohonan atau Survey terkait.
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase">Pengaturan Cetak</h4>
                
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="sertakanTtd"
                    checked={sertakanTtd}
                    onChange={e => setSertakanTtd(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 h-4 w-4 bg-white dark:bg-slate-800"
                  />
                  <label htmlFor="sertakanTtd" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                    Sertakan Tanda Tangan Digital
                  </label>
                </div>
              </div>
            </div>

            {/* Right Panel: Page Print Preview */}
            <div className="flex-1 bg-slate-500 dark:bg-slate-950 overflow-y-auto p-8 flex justify-center">
              {/* The A4 change-tarif request form page representation */}
              <div
                id="printable-change-tarif"
                className="w-[210mm] min-h-[297mm] bg-white shadow-2xl p-[15mm] text-black text-[9pt] leading-snug font-sans relative flex flex-col print-border-black"
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
              >
                {/* Header */}
                <div className="text-center border-b-2 border-black pb-2 mb-3">
                  <h1 className="text-[12pt] font-black uppercase tracking-wide">
                    FORMULIR PEMERIKSAAN PERUNTUKAN TENAGA LISTRIK
                  </h1>
                  <h2 className="text-[10pt] font-extrabold uppercase mt-0.5 tracking-normal">
                    DARI TARIF NON SUBSIDI KE TARIF SUBSIDI DENGAN PERUBAHAN TARIF
                  </h2>
                </div>

                {/* Date line */}
                <p className="text-justify text-[9pt] mb-3">
                  Pada hari ini, <span className="font-bold">{dateInfo.dayName || '..........'}</span> Tanggal, <span className="font-bold">{tglPemeriksaan ? new Date(tglPemeriksaan).getDate() : '..........'}</span> Bulan, <span className="font-bold">{dateInfo.fullText.split('Bulan ')[1]?.split(' Tahun')[0] || '..........'}</span> Tahun <span className="font-bold">{tglPemeriksaan ? new Date(tglPemeriksaan).getFullYear() : '2026'}</span>, telah dilaksanakan pengecekan peruntukan tenaga listrik Pelanggan UP3 Salatiga ULP Salatiga Kota :
                </p>

                {/* Section 1: Data Administrasi */}
                <div className="mb-3">
                  <h3 className="font-bold text-[9pt] underline mb-1 uppercase tracking-wide">
                    Data Administrasi (DIL AP2T) :
                  </h3>
                  <table className="w-full border-collapse text-[9pt] border border-black">
                    <tbody>
                      <tr className="border-b border-black">
                        <td className="w-[32%] px-3 py-1 font-bold bg-slate-50 border-r border-black">Nama Pelanggan</td>
                        <td className="px-3 py-1 font-semibold">{namaPelanggan} / {idpel}</td>
                      </tr>
                      <tr className="border-b border-black">
                        <td className="px-3 py-1 font-bold bg-slate-50 border-r border-black">Alamat</td>
                        <td className="px-3 py-1 text-[8.5pt] leading-tight">{alamat}</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1 font-bold bg-slate-50 border-r border-black">Tarif/Daya Lama</td>
                        <td className="px-3 py-1 font-bold">{tarifLama} / {dayaLama}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Section 2: Data Permohonan */}
                <div className="mb-3">
                  <h3 className="font-bold text-[9pt] underline mb-1 uppercase tracking-wide">
                    Data Permohonan Perubahan Tarif :
                  </h3>
                  <table className="w-full border-collapse text-[9pt] border border-black">
                    <tbody>
                      <tr className="border-b border-black">
                        <td className="w-[32%] px-3 py-1 font-bold bg-slate-50 border-r border-black">Media Permohonan</td>
                        <td className="px-3 py-1 font-semibold">{mediaPermohonan || 'CC123'}</td>
                      </tr>
                      <tr className="border-b border-black">
                        <td className="px-3 py-1 font-bold bg-slate-50 border-r border-black">Tanggal Permohonan</td>
                        <td className="px-3 py-1">{tglMohonFormatted}</td>
                      </tr>
                      <tr className="border-b border-black">
                        <td className="px-3 py-1 font-bold bg-slate-50 border-r border-black">Nama Pemohon</td>
                        <td className="px-3 py-1 font-semibold">{namaPemohon}</td>
                      </tr>
                      <tr className="border-b border-black">
                        <td className="px-3 py-1 font-bold bg-slate-50 border-r border-black">Alamat Pemohon</td>
                        <td className="px-3 py-1 text-[8.5pt] leading-tight">{alamatPemohon}</td>
                      </tr>
                      <tr className="border-b border-black">
                        <td className="px-3 py-1 font-bold bg-slate-50 border-r border-black">NIK Pemohon</td>
                        <td className="px-3 py-1 font-mono">{nikPemohon || '—'}</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1 font-bold bg-slate-50 border-r border-black">Tarif/Daya Baru</td>
                        <td className="px-3 py-1 font-bold">{tarifBaru ? `${tarifBaru} / ${dayaBaru}` : '—'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Section 3: Data Cek Lapangan */}
                <div className="mb-3">
                  <h3 className="font-bold text-[9pt] underline mb-1 uppercase tracking-wide">
                    Data Cek Lapangan :
                  </h3>
                  <table className="w-full border-collapse text-[9pt] border border-black">
                    <tbody>
                      <tr className="border-b border-black">
                        <td className="w-[32%] px-3 py-1 font-bold bg-slate-50 border-r border-black">Nama Pelanggan</td>
                        <td className="px-3 py-1 font-semibold">{namaPelanggan} / {idpel}</td>
                      </tr>
                      <tr className="border-b border-black">
                        <td className="px-3 py-1 font-bold bg-slate-50 border-r border-black">Alamat Pelanggan</td>
                        <td className="px-3 py-1 text-[8.5pt] leading-tight">{alamat}</td>
                      </tr>
                      <tr className="border-b border-black">
                        <td className="px-3 py-1 font-bold bg-slate-50 border-r border-black">NIK Pelanggan</td>
                        <td className="px-3 py-1 font-mono">{nikPelanggan || '—'}</td>
                      </tr>
                      <tr className="border-b border-black">
                        <td className="px-3 py-1 font-bold bg-slate-50 border-r border-black">No Telepon/HP/Email Pelanggan</td>
                        <td className="px-3 py-1 font-mono">{noTelp || '—'}</td>
                      </tr>
                      <tr className="border-b border-black">
                        <td className="px-3 py-1 font-bold bg-slate-50 border-r border-black">Peruntukan listrik</td>
                        <td className="px-3 py-1 font-bold italic">{peruntukanLap || 'Rumah Tinggal'}</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-1 font-bold bg-slate-50 border-r border-black">Status Persil/bangunan</td>
                        <td className="px-3 py-1 font-medium">{statusPersil || 'Milik Sendiri'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Section 4: Dokumen Pendukung */}
                <div className="mb-3">
                  <table className="w-[65%] border border-black border-collapse text-[8.5pt]">
                    <thead>
                      <tr className="bg-slate-100 text-center font-bold">
                        <th className="border border-black py-1 px-2 text-left">Dokumen Pendukung</th>
                        <th className="border border-black py-1 w-[22%]">Ada</th>
                        <th className="border border-black py-1 w-[22%]">Tidak Ada</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="border border-black px-2 py-0.5 font-medium">KTP Pelanggan</td>
                        <td className="border border-black text-center py-0.5 font-bold text-emerald-600">{ktpAda ? '✓' : ''}</td>
                        <td className="border border-black text-center py-0.5 font-bold text-red-500">{!ktpAda ? '✓' : ''}</td>
                      </tr>
                      <tr>
                        <td className="border border-black px-2 py-0.5 font-medium">Ijin Pendirian / Ijin Usaha</td>
                        <td className="border border-black text-center py-0.5 font-bold text-emerald-600">{ijinAda ? '✓' : ''}</td>
                        <td className="border border-black text-center py-0.5 font-bold text-red-500">{!ijinAda ? '✓' : ''}</td>
                      </tr>
                      <tr>
                        <td className="border border-black px-2 py-0.5 font-medium">Foto Persil/Bangunan</td>
                        <td className="border border-black text-center py-0.5 font-bold text-emerald-600">{fotoAda ? '✓' : ''}</td>
                        <td className="border border-black text-center py-0.5 font-bold text-red-500">{!fotoAda ? '✓' : ''}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Section 5: Appliances Table */}
                <div className="mb-3">
                  <table className="w-full border border-black border-collapse text-[8pt]">
                    <thead>
                      <tr className="bg-slate-100 text-center font-bold">
                        <th colSpan={8} className="border border-black py-0.5 text-[8.5pt]">PERUNTUKAN</th>
                      </tr>
                      <tr className="bg-slate-100 text-center font-bold">
                        <th colSpan={4} className="border border-black py-0.5 text-[8.5pt]">RUMAH TANGGA</th>
                        <th colSpan={4} className="border border-black py-0.5 text-[8.5pt] border-l-2">PERUNTUKAN LAIN</th>
                      </tr>
                      <tr className="bg-slate-50 text-[7.5pt] font-semibold text-slate-700">
                        <th className="border border-black py-1 w-[24%] px-1 text-left">PERALATAN LISTRIK</th>
                        <th className="border border-black py-1 w-[8%] text-center">JUMLAH</th>
                        <th className="border border-black py-1 w-[9%] text-center">DAYA SATUAN (WATT)</th>
                        <th className="border border-black py-1 w-[9%] text-center">DAYA TOTAL (WATT)</th>
                        <th className="border border-black py-1 w-[24%] px-1 text-left border-l-2">PERALATAN LISTRIK</th>
                        <th className="border border-black py-1 w-[8%] text-center">JUMLAH</th>
                        <th className="border border-black py-1 w-[9%] text-center">DAYA SATUAN (WATT)</th>
                        <th className="border border-black py-1 w-[9%] text-center">DAYA TOTAL (WATT)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: Math.max(maxRowsCount, 4) }).map((_, rowIndex) => {
                        const itemRT = appliancesRT[rowIndex] || { name: '', qty: '', watt: '' };
                        const itemPL = appliancesPL[rowIndex] || { name: '', qty: '', watt: '' };

                        const renderVal = (val) => (val !== '' && val !== undefined && val !== null ? val : '\u00A0');

                        return (
                          <tr key={rowIndex} className="h-5">
                            {/* RT Side */}
                            <td className="border border-black px-1.5 py-0 truncate max-w-[80px]">{itemRT.name || (rowIndex === 0 ? 'Lampu' : '\u00A0')}</td>
                            <td className="border border-black text-center py-0 font-mono">{renderVal(itemRT.qty)}</td>
                            <td className="border border-black text-center py-0 font-mono">{renderVal(itemRT.watt)}</td>
                            <td className="border border-black text-center py-0 font-mono font-medium">{renderVal(itemRT.qty && itemRT.watt ? itemRT.qty * itemRT.watt : '')}</td>

                            {/* PL Side */}
                            <td className="border border-black px-1.5 py-0 truncate max-w-[80px] border-l-2">{itemPL.name || (rowIndex === 0 ? 'Lampu' : '\u00A0')}</td>
                            <td className="border border-black text-center py-0 font-mono">{renderVal(itemPL.qty)}</td>
                            <td className="border border-black text-center py-0 font-mono">{renderVal(itemPL.watt)}</td>
                            <td className="border border-black text-center py-0 font-mono font-medium">{renderVal(itemPL.qty && itemPL.watt ? itemPL.qty * itemPL.watt : '')}</td>
                          </tr>
                        );
                      })}
                      {/* Totals row */}
                      <tr className="bg-slate-50 font-bold text-[8.5pt]">
                        <td colSpan={3} className="border border-black px-1.5 py-0.5 font-bold">TOTAL</td>
                        <td className="border border-black text-center py-0.5 font-mono font-bold text-blue-700">{totalRT > 0 ? totalRT : ''}</td>
                        <td colSpan={3} className="border border-black px-1.5 py-0.5 font-bold border-l-2">TOTAL</td>
                        <td className="border border-black text-center py-0.5 font-mono font-bold text-blue-700">{totalPL > 0 ? totalPL : ''}</td>
                      </tr>
                      {/* Percentages row */}
                      <tr className="bg-slate-100 font-extrabold text-[8.5pt]">
                        <td colSpan={3} className="border border-black px-1.5 py-0.5 text-right font-bold">%</td>
                        <td className="border border-black text-center py-0.5 font-mono font-extrabold">{grandTotal > 0 ? `${pctRT}%` : '%'}</td>
                        <td colSpan={3} className="border border-black px-1.5 py-0.5 text-right font-bold border-l-2">%</td>
                        <td className="border border-black text-center py-0.5 font-mono font-extrabold">{grandTotal > 0 ? `${pctPL}%` : '%'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Legal Declaration */}
                <p className="text-justify text-[8.5pt] italic mb-3 leading-normal">
                  Berdasarkan hasil pemeriksaan di atas, apabila ditemukan ketidaksesuaian, maka Pelanggan bersedia mengikuti peraturan dan ketentuan yang berlaku di PLN.
                </p>

                {/* Signatures section (Table 6 - 3 columns x 2 rows borderless layout) */}
                <div className="mt-auto w-full text-[8.5pt]">
                  {/* Row 1 Signatures */}
                  <div className="grid grid-cols-3 text-center min-h-[95px]">
                    {/* Pelanggan */}
                    <div className="p-1 flex flex-col justify-between">
                      <span className="font-bold leading-tight">Pelanggan/Pemilik Persil</span>
                      <div className="h-10 flex items-center justify-center relative my-0.5">
                        {/* Area TTD Fisik Pelanggan */}
                      </div>
                      <span className="font-bold underline uppercase truncate">{namaPelanggan || '___________________________'}</span>
                    </div>

                    {/* Petugas */}
                    <div className="p-1 flex flex-col justify-between">
                      <span className="font-bold leading-tight">Petugas Pemeriksa</span>
                      <div className="h-10 flex items-center justify-center relative my-0.5">
                        {sertakanTtd && ttdPetugas ? (
                          <img
                            src={ttdPetugas}
                            alt="Ttd Petugas"
                            className="h-10 max-w-[110px] object-contain mix-blend-multiply"
                          />
                        ) : null}
                      </div>
                      <span className="font-bold underline uppercase truncate">{petugasSurvey || pejabatTl || '___________________________'}</span>
                    </div>

                    {/* TL TE LAY GAN */}
                    <div className="p-1 flex flex-col justify-between">
                      <span className="font-bold leading-tight">TL TE LAY GAN</span>
                      <div className="h-10 flex items-center justify-center relative my-0.5">
                        {sertakanTtd && ttdTl ? (
                          <img
                            src={ttdTl}
                            alt="Ttd TL"
                            className="h-10 max-w-[110px] object-contain mix-blend-multiply"
                          />
                        ) : null}
                      </div>
                      <span className="font-bold underline uppercase truncate">{pejabatTl || '—'}</span>
                    </div>
                  </div>

                  {/* Row 2 Signatures */}
                  <div className="grid grid-cols-3 text-center min-h-[95px] mt-1.5">
                    {/* MUP3 */}
                    <div className="p-1 flex flex-col justify-between">
                      <span className="font-bold leading-tight">Mengesahkan,<br />MUP3 Salatiga</span>
                      <div className="h-10 flex items-center justify-center relative my-0.5">
                        {sertakanTtd && ttdMup3 ? (
                          <img
                            src={ttdMup3}
                            alt="Ttd MUP3"
                            className="h-10 max-w-[110px] object-contain mix-blend-multiply"
                          />
                        ) : null}
                      </div>
                      <span className="font-bold underline uppercase truncate">{pejabatMup3 || '—'}</span>
                    </div>

                    {/* ASMAN NPS */}
                    <div className="p-1 flex flex-col justify-between">
                      <span className="font-bold leading-tight">Mengetahui,<br />ASMAN NPS</span>
                      <div className="h-10 flex items-center justify-center relative my-0.5">
                        {sertakanTtd && ttdAsman ? (
                          <img
                            src={ttdAsman}
                            alt="Ttd ASMAN"
                            className="h-10 max-w-[110px] object-contain mix-blend-multiply"
                          />
                        ) : null}
                      </div>
                      <span className="font-bold underline uppercase truncate">{pejabatAsman || '—'}</span>
                    </div>

                    {/* MULP */}
                    <div className="p-1 flex flex-col justify-between">
                      <span className="font-bold leading-tight">Menyetujui,<br />MULP Salatiga Kota</span>
                      <div className="h-10 flex items-center justify-center relative my-0.5">
                        {sertakanTtd && ttdMulp ? (
                          <img
                            src={ttdMulp}
                            alt="Ttd MULP"
                            className="h-10 max-w-[110px] object-contain mix-blend-multiply"
                          />
                        ) : null}
                      </div>
                      <span className="font-bold underline uppercase truncate">{pejabatMulp || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0 flex items-center justify-between transition-colors">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            * Tekan <kbd className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono">Ctrl + P</kbd> atau klik Cetak. Pilih tujuan <strong>Save as PDF</strong> di dialog browser untuk menyimpan.
          </p>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={onClose}>
              Batal
            </Button>
            <Button variant="success" icon={Printer} onClick={handlePrint} disabled={loading}>
              Cetak Live PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
