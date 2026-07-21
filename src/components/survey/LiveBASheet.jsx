import React from 'react';

// Helper to format date into official Indonesian style
export const formatIndonesianDate = (dateStr) => {
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

export const formatToIndonesianDDMMMMYYYY = (dateStr) => {
  if (!dateStr) return '';
  const indonesianMonths = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const hasMonthName = indonesianMonths.some(m => String(dateStr).includes(m));
  if (hasMonthName) return dateStr;

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const day = String(date.getDate()).padStart(2, '0');
  const month = indonesianMonths[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

// Suggest MCB Ampere based on Daya (VA)
export const suggestMcbAmpere = (daya) => {
  const d = Number(daya);
  if (!d) return '';
  if (d === 450) return '2';
  if (d === 900) return '4';
  if (d === 1300) return '6';
  if (d === 2200) return '10';
  if (d === 3500) return '16';
  if (d === 4400) return '20';
  if (d === 5500) return '25';
  if (d === 6600) return '30';
  if (d === 7700) return '35';
  if (d === 10600) return '50';
  if (d === 13200) return '20 (3-Fasa)';
  if (d === 16500) return '25 (3-Fasa)';
  if (d === 23000) return '35 (3-Fasa)';
  if (d === 33000) return '50 (3-Fasa)';
  if (d === 41500) return '63 (3-Fasa)';
  if (d === 53000) return '80 (3-Fasa)';
  if (d === 66000) return '100 (3-Fasa)';
  if (d === 82500) return '125 (3-Fasa)';
  if (d === 105000) return '160 (3-Fasa)';
  if (d === 147000) return '225 (3-Fasa)';
  return '';
};

// Auto get appointment day (2 days from inspection date, skipping Sunday)
export const getSuggestedAppointmentDate = (dateStr) => {
  if (!dateStr) return { dateVal: '', dayName: '', formatted: '' };
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return { dateVal: '', dayName: '', formatted: '' };

  // Add 2 days
  date.setDate(date.getDate() + 2);
  // If Sunday, add 1 more day
  if (date.getDay() === 0) {
    date.setDate(date.getDate() + 1);
  }

  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);

  return {
    dateVal: date.toISOString().slice(0, 10),
    dayName: days[date.getDay()],
    formatted: `${dd}-${mm}-${yy}`
  };
};

export default function LiveBASheet({ data, sertakanTtd = true }) {
  if (!data) return null;

  const noBa = data.NO_BA || `52351-${data.IDPEL ? data.IDPEL.toString().slice(-7) : '2620045'}`;
  const tglPemeriksaan = data.TANGGAL_SURVEY || new Date().toISOString().slice(0, 10);
  const noSuratTugas = data.NO_SURAT_TUGAS || '0005.STg/SDM.02/07/F03110000/2026';
  const tglSuratTugas = data.TANGGAL_SURAT_TUGAS || '05 Januari 2026';
  const letakApp = data.LETAK_APP || 'Bangunan bagian luar';
  const mcbMerk = data.MCB_MERK || 'SND';
  const mcbTahun = data.MCB_TAHUN || '2023';
  const mcbAmpere = data.MCB_AMPERE || suggestMcbAmpere(data.DAYA);
  
  const meterKonstanta = data.METER_KONSTANTA || '';
  const meterStandLwbp = data.METER_STAND_LWBP || '';
  const meterStandWbp = data.METER_STAND_WBP || '';
  const meterTrafo = data.METER_TRAFO || '';
  const meterFaktorKali = data.METER_FAKTOR_KALI || '';
  
  const kodeKedudukan = data.KODE_KEDUDUKAN || 'LAAAMRH00000';
  const letakSltr = data.LETAK_SLTR || '';
  const jenisSltr = data.JENIS_SLTR || '';
  const panjangSltr = data.PANJANG_SLTR || '';
  const fasaTersambung = data.FASA_TERSAMBUNG || '';
  const teganganNominal = data.TEGANGAN_NOMINAL || '';
  const pengukuran = data.PENGUKURAN || '';
  const menggunakanTrafoPln = data.TRAFO_PLN || 'Tanpa Trafo';
  const segelOk = data.SEGEL_OK || '';
  const pengambilanDari = data.PENGAMBILAN_DARI || '';
  
  const kantorUlp = data.KANTOR_ULP || localStorage.getItem('SETTING_KANTOR_ULP') || 'ULP Salatiga Kota';
  const alamatKantor = data.ALAMAT_KANTOR || localStorage.getItem('SETTING_ALAMAT_KANTOR') || 'Jl. Diponegoro No. 19 Salatiga';
  const petugasNama = data.PETUGAS_NAMA || localStorage.getItem('SETTING_PETUGAS_SURVEY') || 'Fathur Rohim';

  // Get Suggested/Form Appointment dates
  let hariKembali = data.HARI_KEMBALI;
  let tglKembali = data.TANGGAL_KEMBALI;
  if (!hariKembali || !tglKembali) {
    const sug = getSuggestedAppointmentDate(tglPemeriksaan);
    hariKembali = hariKembali || sug.dayName;
    tglKembali = tglKembali || sug.formatted;
  }

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
  const dateInfo = formatIndonesianDate(tglPemeriksaan);

  return (
    <div id="printable-ba" className="print:w-[210mm] print:bg-white text-black font-sans leading-snug">
      {/* PAGE 1: Berita Acara P2TL */}
      <div className="print-page w-[210mm] min-h-[297mm] bg-white p-[10mm] flex flex-col relative print-border-black">
        {/* Logo & PLN Header */}
        <div className="flex items-start justify-between border-b border-black pb-1.5 mb-2">
          <div className="flex items-center gap-3">
            <img
              src="./pln-logo.png"
              alt="PLN Logo"
              className="w-10 h-14 object-contain"
            />
            <div className="text-[8pt] font-extrabold uppercase leading-tight tracking-wide text-left">
              <div>PT PLN (PERSERO)</div>
              <div>UID JATENG & DIY</div>
              <div>UP3 SALATIGA</div>
            </div>
          </div>
          <div className="text-right text-[7.5pt] text-slate-500 italic uppercase font-medium">
            {kantorUlp}
          </div>
        </div>

        {/* Title Section */}
        <div className="text-center my-2">
          <h2 className="text-[11.5pt] font-black tracking-wide uppercase underline decoration-1">
            BERITA ACARA PELAKSANAAN P2TL
          </h2>
          <div className="text-[9pt] font-bold mt-0.5">
            No. {noBa}
          </div>
        </div>

        {/* Introduction Text */}
        <p className="text-justify text-[8.5pt] mb-2 leading-normal">
          Pada hari ini, <span className="font-bold">{dateInfo.dayName || '...'}</span> Tanggal <span className="font-bold">{tglPemeriksaan ? new Date(tglPemeriksaan).getDate() : '...'}</span> Bulan <span className="font-bold">{dateInfo.fullText.split('Bulan ')[1]?.split(' Tahun')[0] || '...'}</span> Tahun <span className="font-bold">{tglPemeriksaan ? new Date(tglPemeriksaan).getFullYear() : '...'}</span> ({dateInfo.shortDate}) telah dilaksanakan pemeriksaan kWh meter atas dasar Surat Tugas nomor : <span className="font-mono text-[8.5pt] border-b border-black px-1 font-bold">{noSuratTugas || '................................'}</span> Tanggal <span className="font-bold">{formatToIndonesianDDMMMMYYYY(tglSuratTugas) || '....................'}</span> pada pelanggan sbb :
        </p>

        {/* Table 1: Customer Info */}
        <table className="w-full border-collapse text-[8.5pt] mb-2.5">
          <tbody>
            <tr className="border-t border-b border-slate-300">
              <td className="w-[18%] py-1 font-bold uppercase text-slate-700">ID PELANGGAN</td>
              <td className="w-[2%] text-center py-1">:</td>
              <td className="w-[30%] py-1 font-mono font-bold text-[9pt]">{data.IDPEL || '—'}</td>
              <td className="w-[18%] py-1 font-bold uppercase text-slate-700 pl-4">TARIP/DAYA</td>
              <td className="w-[2%] text-center py-1">:</td>
              <td className="w-[30%] py-1 font-bold">{data.TARIF || '—'} / {data.DAYA ? `${Number(data.DAYA).toLocaleString('id')} VA` : '—'}</td>
            </tr>
            <tr className="border-b border-slate-300">
              <td className="w-[18%] py-1 font-bold uppercase text-slate-700">NAMA</td>
              <td className="w-[2%] text-center py-1">:</td>
              <td className="w-[30%] py-1 font-medium pr-2 leading-tight" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{data.NAMA || '—'}</td>
              <td className="w-[18%] py-1 font-bold uppercase text-slate-700 pl-4">NO. TIANG</td>
              <td className="w-[2%] text-center py-1">:</td>
              <td className="w-[30%] py-1 font-mono">{data.NO_TIANG || '—'}</td>
            </tr>
            <tr className="border-b border-slate-300">
              <td className="w-[18%] py-1 font-bold uppercase text-slate-700 align-top">ALAMAT</td>
              <td className="w-[2%] text-center py-1 align-top">:</td>
              <td className="w-[30%] py-1 pr-2 align-top text-[8.5pt] leading-tight" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                {data.ALAMAT || '—'}
              </td>
              <td className="w-[18%] py-1 font-bold uppercase text-slate-700 pl-4 align-top">KDDK</td>
              <td className="w-[2%] text-center py-1 align-top">:</td>
              <td className="w-[30%] py-1 align-top font-mono">{kodeKedudukan || '—'}</td>
            </tr>
          </tbody>
        </table>

        {/* Title Section 2 */}
        <div className="text-[8.5pt] font-bold mb-1">
          Dengan hasil sebagai berikut :
        </div>

        {/* Table 2: Technical verification */}
        <table className="w-full border border-black border-collapse text-[7.8pt]">
          <thead>
            <tr className="bg-slate-100 text-center font-bold">
              <th className="border border-black py-1 w-[5%]">NO</th>
              <th className="border border-black py-1 w-[55%]">URAIAN</th>
              <th className="border border-black py-1 w-[40%]">TERPASANG</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-black text-center py-0.5 font-bold">1.</td>
              <td className="border border-black px-2 py-0.5">Tanggal pemeriksaan</td>
              <td className="border border-black text-center py-0.5">{dateInfo.shortDate}</td>
            </tr>
            <tr>
              <td className="border border-black text-center py-0.5 font-bold">2.</td>
              <td className="border border-black px-2 py-0.5">Letak APP</td>
              <td className="border border-black text-center py-0.5">{letakApp || '—'}</td>
            </tr>
            <tr>
              <td className="border border-black text-center py-0.5 font-bold align-top">3.</td>
              <td className="border border-black px-2 py-0.5 font-semibold">Alat pembatas</td>
              <td className="border border-black text-center py-0.5">—</td>
            </tr>
            <tr>
              <td className="border border-black text-center py-0.5"></td>
              <td className="border border-black pl-5 pr-2 py-0.25">Tanggal</td>
              <td className="border border-black text-center py-0.25">{dateInfo.shortDate}</td>
            </tr>
            <tr>
              <td className="border border-black text-center py-0.5"></td>
              <td className="border border-black pl-5 pr-2 py-0.25">Merk / Type / Nomor</td>
              <td className="border border-black text-center py-0.25 font-mono">{mcbMerk || '—'}</td>
            </tr>
            <tr>
              <td className="border border-black text-center py-0.5"></td>
              <td className="border border-black pl-5 pr-2 py-0.25">Tahun (Tera/Buat/Segel)</td>
              <td className="border border-black text-center py-0.25">{mcbTahun || '—'}</td>
            </tr>
            <tr>
              <td className="border border-black text-center py-0.5"></td>
              <td className="border border-black pl-5 pr-2 py-0.25">Ukuran / Setting</td>
              <td className="border border-black text-center py-0.25 font-bold">{mcbAmpere ? `${mcbAmpere} A` : '—'}</td>
            </tr>
            <tr>
              <td className="border border-black text-center py-0.5 font-bold align-top">4.</td>
              <td className="border border-black px-2 py-0.5 font-semibold">KWh Meter</td>
              <td className="border border-black text-center py-0.5">—</td>
            </tr>
            <tr>
              <td className="border border-black text-center py-0.5"></td>
              <td className="border border-black pl-5 pr-2 py-0.25">Tanggal</td>
              <td className="border border-black text-center py-0.25">{dateInfo.shortDate}</td>
            </tr>
            <tr>
              <td className="border border-black text-center py-0.5"></td>
              <td className="border border-black pl-5 pr-2 py-0.25">Merek / Type / Nomor</td>
              <td className="border border-black text-center py-0.25 font-mono">
                {data.METER_MERK || '—'} / {data.METER_TYPE || '—'} / {data.METER_NO || '—'}
              </td>
            </tr>
            <tr>
              <td className="border border-black text-center py-0.5"></td>
              <td className="border border-black pl-5 pr-2 py-0.25">Tahun (Tera/Buat/Segel)</td>
              <td className="border border-black text-center py-0.25">{data.METER_TAHUN || '—'}</td>
            </tr>
            <tr>
              <td className="border border-black text-center py-0.5"></td>
              <td className="border border-black pl-5 pr-2 py-0.25">Konstanta</td>
              <td className="border border-black text-center py-0.25">{meterKonstanta || '—'}</td>
            </tr>
            <tr>
              <td className="border border-black text-center py-0.5"></td>
              <td className="border border-black pl-5 pr-2 py-0.25">Tegangan / Arus</td>
              <td className="border border-black text-center py-0.25 font-mono">
                {data.METER_TEGANGAN ? `${data.METER_TEGANGAN} V` : '—'} / {data.METER_ARUS ? `${Number(data.METER_ARUS).toFixed(2)} A` : '—'}
              </td>
            </tr>
            <tr>
              <td className="border border-black text-center py-0.5"></td>
              <td className="border border-black pl-5 pr-2 py-0.25">Stand Meter LWBP / WBP</td>
              <td className="border border-black text-center py-0.25">
                {meterStandLwbp || '—'} / {meterStandWbp || '—'}
              </td>
            </tr>
            <tr>
              <td className="border border-black text-center py-0.5"></td>
              <td className="border border-black pl-5 pr-2 py-0.25">Trafo Arus / Trafo Tegangan</td>
              <td className="border border-black text-center py-0.25">{meterTrafo || '—'}</td>
            </tr>
            <tr>
              <td className="border border-black text-center py-0.5"></td>
              <td className="border border-black pl-5 pr-2 py-0.25">Faktor Kali</td>
              <td className="border border-black text-center py-0.25">{meterFaktorKali || '—'}</td>
            </tr>
            <tr>
              <td className="border border-black text-center py-0.5 font-bold">5.</td>
              <td className="border border-black px-2 py-0.5">Letak SLTR / SLTM / SLTT</td>
              <td className="border border-black text-center py-0.5">{letakSltr || '—'}</td>
            </tr>
            <tr>
              <td className="border border-black text-center py-0.5 font-bold">6.</td>
              <td className="border border-black px-2 py-0.5">Jenis SLTR / SLTM / SLTT</td>
              <td className="border border-black text-center py-0.5">{jenisSltr || '—'}</td>
            </tr>
            <tr>
              <td className="border border-black text-center py-0.5 font-bold">7.</td>
              <td className="border border-black px-2 py-0.5">Panjang SLTR / SLTM / SLTT</td>
              <td className="border border-black text-center py-0.5">{panjangSltr || '—'}</td>
            </tr>
            <tr>
              <td className="border border-black text-center py-0.5 font-bold">8.</td>
              <td className="border border-black px-2 py-0.5">Fasa Tersambung</td>
              <td className="border border-black text-center py-0.5">{fasaTersambung || '—'}</td>
            </tr>
            <tr>
              <td className="border border-black text-center py-0.5 font-bold">9.</td>
              <td className="border border-black px-2 py-0.5">Tegangan nominal</td>
              <td className="border border-black text-center py-0.5">{teganganNominal || '—'}</td>
            </tr>
            <tr>
              <td className="border border-black text-center py-0.5 font-bold">10.</td>
              <td className="border border-black px-2 py-0.5">Pengukuran</td>
              <td className="border border-black text-center py-0.5">{pengukuran || '—'}</td>
            </tr>
            <tr>
              <td className="border border-black text-center py-0.5 font-bold">11.</td>
              <td className="border border-black px-2 py-0.5">Menggunakan Trafo PLN</td>
              <td className="border border-black text-center py-0.5">{getTrafoPlnValue()}</td>
            </tr>
            <tr>
              <td className="border border-black text-center py-0.5 font-bold">12.</td>
              <td className="border border-black px-2 py-0.5">Segel OK (Inisial dan Tahun)</td>
              <td className="border border-black text-center py-0.5">{segelOk || '—'}</td>
            </tr>
            <tr>
              <td className="border border-black text-center py-0.5 font-bold">13.</td>
              <td className="border border-black px-2 py-0.5">Pengambilan dari</td>
              <td className="border border-black text-center py-0.5">{pengambilanDari || '—'}</td>
            </tr>
          </tbody>
        </table>

        {/* Closing paragraph */}
        <p className="text-justify text-[8.5pt] mt-2.5 leading-normal">
          Demikian pada saat ini hasil pemeriksaan dinyatakan : <span className="font-bold">{data.KESIMPULAN_SPI || 'BAIK'}</span>, pemakaian pelanggan <span className="font-bold">{data.PEMAKAIAN || '—'} kWh</span> dengan Jam nyala <span className="font-bold">{data.JAM_NYALA || '—'}</span> digunakan untuk kebutuhan <span className="font-bold">{data.PERUNTUKAN_ON_SITE || '—'}</span>. Untuk penyelesaian permasalahan, pelanggan tersebut di atas atau wakilnya diminta datang ke Kantor PT PLN (Persero) UP3 Salatiga <span className="font-bold">{kantorUlp}</span> Bagian Pelayanan Pelanggan yang beralamat di : <span className="font-bold">{alamatKantor}</span> pada hari <span className="font-bold">{hariKembali || '...'}</span> tanggal <span className="font-bold">{tglKembali || '...'}</span>.
        </p>

        {/* Signatures section */}
        <div className="mt-auto pt-2 grid grid-cols-2 gap-8 text-[8.5pt]">
          {/* Left Side: Pelanggan */}
          <div className="flex flex-col items-center text-center">
            <div className="font-bold leading-tight min-h-[30px] uppercase text-[9px]">
              TANDA TANGAN PELANGGAN/PEMAKAI/<br />
              WAKIL PELANGGAN/PENANGGUNG JAWAB
            </div>
            <div className="mt-0.5 font-semibold text-slate-600 font-mono text-[7.5pt] uppercase">
              {data.NAMA || '—'}
            </div>
            {/* Space for manual signature */}
            <div className="h-10 w-full flex items-center justify-center border-b border-dashed border-slate-300 my-1">
              <span className="text-[7.5pt] text-slate-400 italic">(Tanda Tangan Pelanggan)</span>
            </div>
            <div className="font-bold underline uppercase mt-0.5">
              {data.NAMA || '—'}
            </div>
          </div>

          {/* Right Side: Petugas */}
          <div className="flex flex-col items-center text-center">
            <div className="font-bold leading-tight min-h-[30px] uppercase text-[9px]">
              Petugas Pemeriksa
            </div>
            <div className="mt-0.5 font-semibold text-slate-600 font-mono text-[7.5pt] uppercase">
              PT PLN (Persero)
            </div>
            {/* Signature Image */}
            <div className="h-10 w-full relative flex items-center justify-center my-1">
              {sertakanTtd ? (
                <img
                  src="./signature-petugas.png"
                  alt="Tanda Tangan Petugas"
                  className="h-10 object-contain mix-blend-multiply"
                />
              ) : (
                <span className="text-[7.5pt] text-slate-400 italic">(Tanda Tangan Petugas)</span>
              )}
            </div>
            <div className="font-bold underline uppercase mt-0.5">
              {petugasNama || 'FATHUR ROHIM'}
            </div>
          </div>
        </div>
      </div>

      {/* PAGE 2: Lampiran Dokumentasi & Inventarisasi */}
      <div className="print-page w-[210mm] min-h-[297mm] bg-white p-[10mm] flex flex-col relative print-border-black page-break-before">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-black pb-1.5 mb-2">
          <div className="flex items-center gap-3">
            <img
              src="./pln-logo.png"
              alt="PLN Logo"
              className="w-10 h-14 object-contain"
            />
            <div className="text-[8pt] font-extrabold uppercase leading-tight tracking-wide text-left">
              <div>PT PLN (PERSERO)</div>
              <div>UID JATENG & DIY</div>
              <div>UP3 SALATIGA</div>
            </div>
          </div>
          <div className="text-right text-[7.5pt] text-slate-500 italic uppercase font-medium">
            {kantorUlp}
          </div>
        </div>

        {/* Title Section */}
        <div className="text-center my-2">
          <h2 className="text-[11pt] font-black tracking-wide uppercase underline decoration-1">
            LAMPIRAN BERITA ACARA P2TL
          </h2>
          <div className="text-[8.5pt] font-bold mt-0.5">
            FOTO DOKUMENTASI SURVEY & INVENTARISASI ALAT LISTRIK
          </div>
        </div>

        {/* Customer summary */}
        <div className="mb-2 text-[8.5pt] bg-slate-50 p-2 rounded-lg border border-slate-200">
          IDPEL: <span className="font-mono font-bold text-blue-700">{data.IDPEL}</span> | Nama: <span className="font-bold">{data.NAMA}</span> | Tarif/Daya: <span className="font-bold">{data.TARIF} / {data.DAYA ? `${Number(data.DAYA).toLocaleString('id')} VA` : '—'}</span>
        </div>

        {/* Inventarisasi Title */}
        <div className="text-[8.5pt] font-bold mb-1 uppercase text-slate-800">
          Hasil Inventarisasi Peralatan Listrik :
        </div>

        {/* Table RT vs PL */}
        <table className="w-full border border-black border-collapse text-[7.2pt] mb-2.5">
          <thead>
            <tr className="bg-slate-100 text-center font-bold">
              <th colSpan={4} className="border border-black py-0.75 text-[7.8pt]">RUMAH TANGGA</th>
              <th colSpan={4} className="border border-black py-0.75 text-[7.8pt] border-l-2">PERUNTUKAN LAIN</th>
            </tr>
            <tr className="bg-slate-50 text-[6.8pt] font-semibold text-slate-600">
              <th className="border border-black py-0.5 w-[24%] px-1 text-left">PERALATAN LISTRIK</th>
              <th className="border border-black py-0.5 w-[8%] text-center">JML</th>
              <th className="border border-black py-0.5 w-[9%] text-center">DAYA (W)</th>
              <th className="border border-black py-0.5 w-[9%] text-center">TOTAL (W)</th>
              <th className="border border-black py-0.5 w-[24%] px-1 text-left border-l-2">PERALATAN LISTRIK</th>
              <th className="border border-black py-0.5 w-[8%] text-center">JML</th>
              <th className="border border-black py-0.5 w-[9%] text-center">DAYA (W)</th>
              <th className="border border-black py-0.5 w-[9%] text-center">TOTAL (W)</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: Math.max(appliancesRT.length, appliancesPL.length, 5) }).map((_, rowIndex) => {
              const itemRT = appliancesRT[rowIndex] || { name: '', qty: '', watt: '' };
              const itemPL = appliancesPL[rowIndex] || { name: '', qty: '', watt: '' };
              return (
                <tr key={rowIndex}>
                  <td className="border border-black px-1.5 py-0.25 truncate max-w-[80px]">{itemRT.name || '—'}</td>
                  <td className="border border-black text-center py-0.25 font-mono">{itemRT.qty !== '' && itemRT.qty !== undefined ? itemRT.qty : '—'}</td>
                  <td className="border border-black text-center py-0.25 font-mono">{itemRT.watt !== '' && itemRT.watt !== undefined ? itemRT.watt : '—'}</td>
                  <td className="border border-black text-center py-0.25 font-mono font-medium">
                    {itemRT.qty !== '' && itemRT.qty !== undefined && itemRT.watt !== '' && itemRT.watt !== undefined ? itemRT.qty * itemRT.watt : '—'}
                  </td>

                  <td className="border border-black px-1.5 py-0.25 truncate max-w-[80px] border-l-2">{itemPL.name || '—'}</td>
                  <td className="border border-black text-center py-0.25 font-mono">{itemPL.qty !== '' && itemPL.qty !== undefined ? itemPL.qty : '—'}</td>
                  <td className="border border-black text-center py-0.25 font-mono">{itemPL.watt !== '' && itemPL.watt !== undefined ? itemPL.watt : '—'}</td>
                  <td className="border border-black text-center py-0.25 font-mono font-medium">
                    {itemPL.qty !== '' && itemPL.qty !== undefined && itemPL.watt !== '' && itemPL.watt !== undefined ? itemPL.qty * itemPL.watt : '—'}
                  </td>
                </tr>
              );
            })}
            {/* Totals row */}
            <tr className="bg-slate-50 font-bold text-[7.5pt]">
              <td className="border border-black px-1.5 py-0.75">TOTAL</td>
              <td className="border border-black text-center py-0.75"></td>
              <td className="border border-black text-center py-0.75"></td>
              <td className="border border-black text-center py-0.75 font-mono text-blue-700">
                {appliancesRT.reduce((s, i) => s + ((i.qty || 0) * (i.watt || 0)), 0)} W
              </td>
              <td className="border border-black px-1.5 py-0.75 border-l-2">TOTAL</td>
              <td className="border border-black text-center py-0.75"></td>
              <td className="border border-black text-center py-0.75"></td>
              <td className="border border-black text-center py-0.75 font-mono text-blue-700">
                {appliancesPL.reduce((s, i) => s + ((i.qty || 0) * (i.watt || 0)), 0)} W
              </td>
            </tr>
          </tbody>
        </table>

        {/* Photos section */}
        <div className="grid grid-cols-2 gap-4 mb-2.5">
          <div className="border border-black p-1.5 flex flex-col items-center rounded bg-slate-50/50">
            <span className="text-[8pt] font-bold mb-1 uppercase text-slate-700">Foto Rumah / Lokasi</span>
            {data.FOTO_RUMAH ? (
              (() => {
                const urls = data.FOTO_RUMAH.split(',').filter(Boolean);
                if (urls.length === 1) {
                  return <img src={urls[0]} alt="Foto Rumah" className="w-full h-36 object-cover border border-slate-300 rounded" />;
                }
                return (
                  <div className="grid grid-cols-2 gap-1 w-full">
                    {urls.map((url, i) => (
                      <img key={i} src={url} alt={`Foto Rumah ${i + 1}`} className={`w-full ${urls.length === 2 ? 'h-36' : 'h-16'} object-cover border border-slate-300 rounded`} />
                    ))}
                  </div>
                );
              })()
            ) : (
              <div className="w-full h-36 bg-slate-100 flex items-center justify-center border border-dashed border-slate-300 rounded text-slate-400 text-xs">
                [ Tidak Ada Foto Rumah ]
              </div>
            )}
          </div>
          <div className="border border-black p-1.5 flex flex-col items-center rounded bg-slate-50/50">
            <span className="text-[8pt] font-bold mb-1 uppercase text-slate-700">Foto Dokumentasi Lapangan</span>
            {data.DOKUMENTASI ? (
              (() => {
                const urls = data.DOKUMENTASI.split(',').filter(Boolean);
                if (urls.length === 1) {
                  return <img src={urls[0]} alt="Foto Dokumentasi" className="w-full h-36 object-cover border border-slate-300 rounded" />;
                }
                return (
                  <div className="grid grid-cols-2 gap-1 w-full">
                    {urls.map((url, i) => (
                      <img key={i} src={url} alt={`Foto Dokumentasi ${i + 1}`} className={`w-full ${urls.length === 2 ? 'h-36' : 'h-16'} object-cover border border-slate-300 rounded`} />
                    ))}
                  </div>
                );
              })()
            ) : (
              <div className="w-full h-36 bg-slate-100 flex items-center justify-center border border-dashed border-slate-300 rounded text-slate-400 text-xs">
                [ Tidak Ada Foto Dokumentasi ]
              </div>
            )}
          </div>
        </div>


      </div>
    </div>
  );
}
