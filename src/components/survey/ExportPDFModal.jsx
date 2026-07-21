import React, { useState, useEffect } from 'react';
import { X, Printer, FileText } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { formatDateForInput } from '../../config/constants';
import LiveBASheet, { formatIndonesianDate, formatToIndonesianDDMMMMYYYY, suggestMcbAmpere, getSuggestedAppointmentDate } from './LiveBASheet';


export default function ExportPDFModal({ isOpen, onClose, data }) {
  if (!isOpen || !data) return null;

  // Form states initialized with database values where available
  const [noBa, setNoBa] = useState(data.NO_BA || `52351-${data.IDPEL ? data.IDPEL.toString().slice(-7) : '2620045'}`);
  const [tglPemeriksaan, setTglPemeriksaan] = useState(data.TANGGAL_SURVEY || new Date().toISOString().slice(0, 10));
  const [noSuratTugas, setNoSuratTugas] = useState(data.NO_SURAT_TUGAS || localStorage.getItem('SETTING_NO_SURAT_TUGAS') || '0005.STg/SDM.02/07/F03110000/2026');
  const [tglSuratTugas, setTglSuratTugas] = useState(data.TANGGAL_SURAT_TUGAS || localStorage.getItem('SETTING_TANGGAL_SURAT_TUGAS') || '05 Januari 2026');
  
  // Technical / MCB states
  const [letakApp, setLetakApp] = useState(data.LETAK_APP || 'Bangunan bagian luar');
  const [mcbMerk, setMcbMerk] = useState(data.MCB_MERK || 'SND');
  const [mcbTahun, setMcbTahun] = useState(data.MCB_TAHUN || '2023');
  const [mcbAmpere, setMcbAmpere] = useState(data.MCB_AMPERE || suggestMcbAmpere(data.DAYA));
  
  // Meter states
  const [meterKonstanta, setMeterKonstanta] = useState(data.METER_KONSTANTA || '');
  const [meterStandLwbp, setMeterStandLwbp] = useState(data.METER_STAND_LWBP || '');
  const [meterStandWbp, setMeterStandWbp] = useState(data.METER_STAND_WBP || '');
  const [meterTrafo, setMeterTrafo] = useState(data.METER_TRAFO || '');
  const [meterFaktorKali, setMeterFaktorKali] = useState(data.METER_FAKTOR_KALI || '');
  
  // Additional states
  const [kodeKedudukan, setKodeKedudukan] = useState(data.KODE_KEDUDUKAN || 'LAAAMRH00000');
  const [letakSltr, setLetakSltr] = useState(data.LETAK_SLTR || '');
  const [jenisSltr, setJenisSltr] = useState(data.JENIS_SLTR || '');
  const [panjangSltr, setPanjangSltr] = useState(data.PANJANG_SLTR || '');
  const [fasaTersambung, setFasaTersambung] = useState(data.FASA_TERSAMBUNG || '');
  const [teganganNominal, setTeganganNominal] = useState(data.TEGANGAN_NOMINAL || '');
  const [pengukuran, setPengukuran] = useState(data.PENGUKURAN || '');
  const [menggunakanTrafoPln, setMenggunakanTrafoPln] = useState(data.TRAFO_PLN || '');
  const [segelOk, setSegelOk] = useState(data.SEGEL_OK || '');
  const [pengambilanDari, setPengambilanDari] = useState(data.PENGAMBILAN_DARI || '');
  
  // Appointment & Officer states
  const [alamatKantor, setAlamatKantor] = useState(() => localStorage.getItem('SETTING_ALAMAT_KANTOR') || 'Jl. Diponegoro No. 19 Salatiga');
  const [kantorUlp, setKantorUlp] = useState(() => localStorage.getItem('SETTING_KANTOR_ULP') || 'ULP Salatiga Kota');
  const [hariKembali, setHariKembali] = useState('');
  const [tglKembali, setTglKembali] = useState('');
  const [petugasNama, setPetugasNama] = useState(() => localStorage.getItem('SETTING_PETUGAS_SURVEY') || 'Fathur Rohim');

  const parseDayaToNumber = (dayaStr) => {
    if (!dayaStr) return 0;
    const clean = String(dayaStr).replace(/\s*va$/i, '').replace(/\./g, '').trim();
    const num = Number(clean);
    return isNaN(num) ? 0 : num;
  };

  const getTrafoPlnValue = () => {
    if (menggunakanTrafoPln && menggunakanTrafoPln !== 'Tanpa Trafo') return menggunakanTrafoPln;
    const dayaNum = parseDayaToNumber(data.DAYA_BARU || data.DAYA);
    if (dayaNum > 0 && dayaNum < 200000) return 'Ya';
    return menggunakanTrafoPln || 'Tanpa Trafo';
  };
  const [sertakanTtd, setSertakanTtd] = useState(true);

  // Parse appliance inventories safely
  const parseAppliances = (str) => {
    if (!str) return [];
    if (typeof str !== 'string') return str;
    try {
      return JSON.parse(str);
    } catch (e) {
      return [];
    }
  };

  const appliancesRT = parseAppliances(data.INVENTARISASI_RT);
  const appliancesPL = parseAppliances(data.INVENTARISASI_PL);

  // Auto calculate appointment date when inspection date changes
  useEffect(() => {
    const sug = getSuggestedAppointmentDate(tglPemeriksaan);
    setHariKembali(sug.dayName);
    setTglKembali(sug.formatted);
  }, [tglPemeriksaan]);

  // Format dates for preview
  const dateInfo = formatIndonesianDate(tglPemeriksaan);

  const handlePrint = () => {
    window.print();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:p-0 print:bg-white">
      {/* Dynamic Style injection for printing only the BA preview element */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Hide everything */
          body * {
            visibility: hidden !important;
          }
          /* Show print container and its contents */
          #printable-ba, #printable-ba * {
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
          /* Center target element print layout */
          #printable-ba {
            position: absolute !important;
            left: 0 !important;
            right: 0 !important;
            top: 0 !important;
            margin: 0 auto !important;
            width: 210mm !important;
            box-shadow: none !important;
            border: none !important;
            background: white !important;
            z-index: 9999999 !important;
            transform: none !important;
          }
          .print-page {
            width: 210mm !important;
            height: 297mm !important;
            padding: 15mm !important;
            page-break-after: always !important;
            box-sizing: border-box !important;
            position: relative !important;
            font-size: 10pt !important;
          }
          .page-break-before {
            page-break-before: always !important;
          }
          /* Clean up styling for print layout */
          .print-border-black {
            border-color: #000000 !important;
          }
          /* Page setup */
          @page {
            size: A4;
            margin: 0;
          }
        }
      ` }} />

      <div className="relative w-full max-w-7xl h-[90vh] bg-slate-50 rounded-2xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-slide-up print:hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Export Berita Acara (BA) ke PDF</h2>
              <p className="text-xs text-slate-500 mt-0.5">Sesuaikan parameter sebelum dicetak atau disimpan sebagai PDF (Dokumen 2 Halaman)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body (Split Screen) */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: Configuration Form */}
          <div className="w-96 border-r border-slate-200 bg-white flex flex-col overflow-y-auto p-5 space-y-5 flex-shrink-0">
            <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider pb-1 border-b border-slate-100">
              Informasi Cetak
            </h3>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-blue-800 uppercase">Data Terkunci</h4>
              <p className="text-xs text-blue-600 leading-relaxed">
                Nomor BA, Surat Tugas, spesifikasi MCB, detail KWh Meter, dan data SLTR ditarik langsung dari database hasil survey (Google Sheets) dan bersifat read-only pada dialog cetak ini.
              </p>
              <p className="text-xs text-blue-600 leading-relaxed font-semibold">
                Guna melakukan perubahan data, silakan edit melalui form Survey terkait.
              </p>
            </div>

            {/* Section 4: Agenda Penyelesaian */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-semibold text-blue-700 uppercase">Agenda Penyelesaian</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Hari Kembali</label>
                  <Input value={hariKembali} onChange={e => setHariKembali(e.target.value)} size="sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Tgl Kembali</label>
                  <Input value={tglKembali} onChange={e => setTglKembali(e.target.value)} size="sm" />
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="sertakanTtd"
                  checked={sertakanTtd}
                  onChange={e => setSertakanTtd(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                />
                <label htmlFor="sertakanTtd" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Sertakan Tanda Tangan Digital
                </label>
              </div>
            </div>
          </div>

          {/* Right Panel: Page Print Preview */}
          <div className="flex-1 bg-slate-500 overflow-y-auto p-8 flex flex-col items-center gap-8">
            <LiveBASheet
              data={{
                ...data,
                NO_BA: noBa,
                TANGGAL_SURVEY: tglPemeriksaan,
                NO_SURAT_TUGAS: noSuratTugas,
                TANGGAL_SURAT_TUGAS: tglSuratTugas,
                LETAK_APP: letakApp,
                MCB_MERK: mcbMerk,
                MCB_TAHUN: mcbTahun,
                MCB_AMPERE: mcbAmpere,
                METER_KONSTANTA: meterKonstanta,
                METER_STAND_LWBP: meterStandLwbp,
                METER_STAND_WBP: meterStandWbp,
                METER_TRAFO: meterTrafo,
                METER_FAKTOR_KALI: meterFaktorKali,
                KODE_KEDUDUKAN: kodeKedudukan,
                LETAK_SLTR: letakSltr,
                JENIS_SLTR: jenisSltr,
                PANJANG_SLTR: panjangSltr,
                FASA_TERSAMBUNG: fasaTersambung,
                TEGANGAN_NOMINAL: teganganNominal,
                PENGUKURAN: pengukuran,
                TRAFO_PLN: menggunakanTrafoPln,
                SEGEL_OK: segelOk,
                PENGAMBILAN_DARI: pengambilanDari,
                HARI_KEMBALI: hariKembali,
                TANGGAL_KEMBALI: tglKembali
              }}
              sertakanTtd={sertakanTtd}
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-white flex-shrink-0 flex items-center justify-between">
          <p className="text-xs text-slate-500">
            * Tekan <kbd className="px-1 py-0.5 bg-slate-100 rounded border font-mono">Ctrl + P</kbd> atau klik Cetak. Pilih tujuan <strong>Save as PDF</strong> di dialog browser untuk menyimpan.
          </p>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={onClose}>
              Batal
            </Button>
            <Button variant="primary" icon={Printer} onClick={handlePrint}>
              Cetak / Simpan PDF
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
