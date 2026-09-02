import React from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { MERK_METER_OPTIONS } from '../../config/constants';
import { Gauge, Hash, Calendar } from 'lucide-react';

/**
 * Step 3: Data KWH Meter
 * Fields: MERK METER, TYPE METER, TAHUN, NO METER
 */
export function StepMeter({ data, onChange, errors }) {
  const currentYear = new Date().getFullYear();

  React.useEffect(() => {
    if (data.METER_FAKTOR_KALI === undefined || data.METER_FAKTOR_KALI === '') {
      onChange('METER_FAKTOR_KALI', '1');
    }
    if (data.SEGEL_OK === undefined || data.SEGEL_OK === '') {
      onChange('SEGEL_OK', 'Lengkap / OK');
    }
  }, []);

  return (
    <div className="space-y-5">
      <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 rounded-xl px-4 py-3 flex items-start gap-3">
        <Gauge size={18} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Data KWH Meter</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">Identitas meter listrik yang terpasang di lokasi</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Select
          label="Merk Meter"
          id="merk-meter"
          required
          options={MERK_METER_OPTIONS}
          value={data.METER_MERK || ''}
          onChange={e => onChange('METER_MERK', e.target.value)}
          error={errors?.METER_MERK}
        />

        <Input
          label="Type Meter"
          id="type-meter"
          leftIcon={Gauge}
          type="text"
          placeholder="Contoh: SMI 200 S"
          value={data.METER_TYPE || ''}
          onChange={e => onChange('METER_TYPE', e.target.value)}
          error={errors?.METER_TYPE}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Input
          label="Tahun Pemasangan"
          id="tahun"
          leftIcon={Calendar}
          type="number"
          placeholder="2024"
          min="1980"
          max={currentYear}
          value={data.METER_TAHUN || ''}
          onChange={e => onChange('METER_TAHUN', e.target.value)}
          error={errors?.METER_TAHUN}
        />

        <Input
          label="Nomor Meter (No. Seri)"
          id="no-meter"
          leftIcon={Hash}
          type="text"
          placeholder="Contoh: 86278907943"
          value={data.METER_NO || ''}
          onChange={e => onChange('METER_NO', e.target.value)}
          error={errors?.METER_NO}
          hint="Nomor seri yang tertera di body meter"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Input
          label="Konstanta Meter"
          id="meter-konstanta"
          type="text"
          placeholder="Contoh: 1000 imp/kWh"
          value={data.METER_KONSTANTA || ''}
          onChange={e => onChange('METER_KONSTANTA', e.target.value)}
          error={errors?.METER_KONSTANTA}
        />
        <Input
          label="Stand LWBP"
          id="stand-lwbp"
          type="number"
          placeholder="Contoh: 12500"
          value={data.METER_STAND_LWBP || ''}
          onChange={e => onChange('METER_STAND_LWBP', e.target.value)}
          error={errors?.METER_STAND_LWBP}
        />
        <Input
          label="Stand WBP"
          id="stand-wbp"
          type="number"
          placeholder="Contoh: 0"
          value={data.METER_STAND_WBP || ''}
          onChange={e => onChange('METER_STAND_WBP', e.target.value)}
          error={errors?.METER_STAND_WBP}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Input
          label="Trafo CT / Arus / Teg."
          id="meter-trafo"
          type="text"
          placeholder="Contoh: 50/5 A"
          value={data.METER_TRAFO || ''}
          onChange={e => onChange('METER_TRAFO', e.target.value)}
          error={errors?.METER_TRAFO}
        />
        <Input
          label="Faktor Kali"
          id="meter-faktor-kali"
          type="number"
          placeholder="Contoh: 1"
          value={data.METER_FAKTOR_KALI || ''}
          onChange={e => onChange('METER_FAKTOR_KALI', e.target.value)}
          error={errors?.METER_FAKTOR_KALI}
        />
        <Input
          label="Kondisi Segel"
          id="segel-ok"
          type="text"
          placeholder="Contoh: Lengkap / OK"
          value={data.SEGEL_OK || ''}
          onChange={e => onChange('SEGEL_OK', e.target.value)}
          error={errors?.SEGEL_OK}
        />
      </div>
    </div>
  );
}
