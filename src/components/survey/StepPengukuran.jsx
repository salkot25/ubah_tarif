import React from 'react';
import { Input } from '../ui/Input';
import { Activity, Clock, Zap, BarChart2 } from 'lucide-react';

/**
 * Step 4: Pengukuran Meter
 * Fields: PEMAKAIAN, JAM NYALA, TEGANGAN, ARUS
 */
export function StepPengukuran({ data, onChange, errors }) {
  const parseDayaToNumber = (dayaStr) => {
    if (!dayaStr) return 0;
    const clean = String(dayaStr).replace(/\s*va$/i, '').replace(/\./g, '').trim();
    const num = Number(clean);
    return isNaN(num) ? 0 : num;
  };

  React.useEffect(() => {
    if (data.TEGANGAN_NOMINAL === undefined || data.TEGANGAN_NOMINAL === '') {
      onChange('TEGANGAN_NOMINAL', '220 V');
    }
    if (data.PENGUKURAN === undefined || data.PENGUKURAN === '') {
      onChange('PENGUKURAN', 'Langsung');
    }
    if (data.PENGAMBILAN_DARI === undefined || data.PENGAMBILAN_DARI === '') {
      onChange('PENGAMBILAN_DARI', 'SR / Tiang');
    }
  }, []);

  React.useEffect(() => {
    const dayaNum = parseDayaToNumber(data.DAYA_BARU || data.DAYA);
    if (dayaNum > 0 && dayaNum < 200000) {
      if (data.TRAFO_PLN === undefined || data.TRAFO_PLN === '' || data.TRAFO_PLN === 'Tanpa Trafo') {
        onChange('TRAFO_PLN', 'Ya');
      }
    } else if (data.TRAFO_PLN === undefined || data.TRAFO_PLN === '') {
      onChange('TRAFO_PLN', 'Tanpa Trafo');
    }
  }, [data.DAYA, data.DAYA_BARU, data.TRAFO_PLN]);

  return (
    <div className="space-y-5">
      <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 flex items-start gap-3">
        <Activity size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-800">Hasil Pengukuran & SLTR</p>
          <p className="text-xs text-blue-600 mt-0.5">Isi hasil pembacaan meter, pengukuran teknis, dan detail Saluran Luar Tegangan Rendah (SLTR)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Input
          label="Pemakaian (kWh)"
          id="pemakaian"
          leftIcon={BarChart2}
          type="number"
          step="0.01"
          min="0"
          placeholder="Contoh: 125.50"
          value={data.PEMAKAIAN || ''}
          onChange={e => onChange('PEMAKAIAN', e.target.value)}
          error={errors?.PEMAKAIAN}
          hint="Total pemakaian dalam kWh"
        />

        <Input
          label="Jam Nyala (jam)"
          id="jam-nyala"
          leftIcon={Clock}
          type="number"
          step="0.1"
          min="0"
          max="720"
          placeholder="Contoh: 120"
          value={data.JAM_NYALA || ''}
          onChange={e => onChange('JAM_NYALA', e.target.value)}
          error={errors?.JAM_NYALA}
          hint="Rata-rata jam nyala per bulan"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Input
          label="Tegangan (Volt)"
          id="tegangan"
          leftIcon={Zap}
          type="number"
          step="0.1"
          min="0"
          placeholder="Contoh: 220"
          value={data.METER_TEGANGAN || ''}
          onChange={e => onChange('METER_TEGANGAN', e.target.value)}
          error={errors?.METER_TEGANGAN}
          hint="Tegangan terukur dalam Volt"
        />

        <Input
          label="Arus (Ampere)"
          id="arus"
          leftIcon={Activity}
          type="number"
          step="0.01"
          min="0"
          placeholder="Contoh: 4.55"
          value={data.METER_ARUS || ''}
          onChange={e => onChange('METER_ARUS', e.target.value)}
          error={errors?.METER_ARUS}
          hint="Arus terukur dalam Ampere"
        />
      </div>

      {/* Quick calculation display */}
      {data.METER_TEGANGAN && data.METER_ARUS && (
        <div className="bg-slate-100 rounded-xl p-4 border border-slate-200">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Kalkulasi Daya Terukur</p>
          <p className="text-xl font-bold text-slate-800">
            {(parseFloat(data.METER_TEGANGAN) * parseFloat(data.METER_ARUS)).toFixed(2)}
            <span className="text-sm font-normal text-slate-500 ml-1">VA</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">V × I = {data.METER_TEGANGAN} × {data.METER_ARUS}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-3 border-t border-slate-100">
        <Input
          label="Letak SLTR"
          id="letak-sltr"
          type="text"
          placeholder="Contoh: Atas Atap / Dinding"
          value={data.LETAK_SLTR || ''}
          onChange={e => onChange('LETAK_SLTR', e.target.value)}
          error={errors?.LETAK_SLTR}
        />
        <Input
          label="Jenis Kabel SLTR"
          id="jenis-sltr"
          type="text"
          placeholder="Contoh: Twisted 2x16 mm"
          value={data.JENIS_SLTR || ''}
          onChange={e => onChange('JENIS_SLTR', e.target.value)}
          error={errors?.JENIS_SLTR}
        />
        <Input
          label="Panjang Kabel SLTR (m)"
          id="panjang-sltr"
          type="text"
          placeholder="Contoh: 15"
          value={data.PANJANG_SLTR || ''}
          onChange={e => onChange('PANJANG_SLTR', e.target.value)}
          error={errors?.PANJANG_SLTR}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Input
          label="Fasa Tersambung"
          id="fasa-tersambung"
          type="text"
          placeholder="Contoh: 1-Fasa / R"
          value={data.FASA_TERSAMBUNG || ''}
          onChange={e => onChange('FASA_TERSAMBUNG', e.target.value)}
          error={errors?.FASA_TERSAMBUNG}
        />
        <Input
          label="Tegangan Nominal"
          id="tegangan-nominal"
          type="text"
          placeholder="Contoh: 220 V"
          value={data.TEGANGAN_NOMINAL || ''}
          onChange={e => onChange('TEGANGAN_NOMINAL', e.target.value)}
          error={errors?.TEGANGAN_NOMINAL}
        />
        <Input
          label="Metode Pengukuran"
          id="pengukuran"
          type="text"
          placeholder="Contoh: Langsung"
          value={data.PENGUKURAN || ''}
          onChange={e => onChange('PENGUKURAN', e.target.value)}
          error={errors?.PENGUKURAN}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Input
          label="Menggunakan Trafo PLN"
          id="trafo-pln"
          type="text"
          placeholder="Contoh: Tanpa Trafo"
          value={data.TRAFO_PLN || ''}
          onChange={e => onChange('TRAFO_PLN', e.target.value)}
          error={errors?.TRAFO_PLN}
        />
        <Input
          label="Titik Pengambilan Dari"
          id="pengambilan-dari"
          type="text"
          placeholder="Contoh: SR / Tiang"
          value={data.PENGAMBILAN_DARI || ''}
          onChange={e => onChange('PENGAMBILAN_DARI', e.target.value)}
          error={errors?.PENGAMBILAN_DARI}
        />
      </div>
    </div>
  );
}
