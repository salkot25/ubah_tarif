import React from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { TARIF_OPTIONS, DAYA_OPTIONS } from '../../config/constants';
import { useGeolocation } from '../../hooks/useGeolocation';
import { MapPin, Navigation, Zap, Hash } from 'lucide-react';

const suggestMcbAmpere = (daya) => {
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

/**
 * Step 2: Data Teknis
 * Fields: Tarif, Daya, NO TIANG, LAT, LONG, LETAK_APP, MCB_MERK, MCB_TAHUN, MCB_AMPERE
 */
export function StepTeknis({ data, onChange, errors }) {
  const { coords, loading: gpsLoading, error: gpsError, getCurrentPosition } = useGeolocation();

  // Autofill GPS coordinates
  React.useEffect(() => {
    if (coords.lat && coords.lng) {
      onChange('LAT',  coords.lat);
      onChange('LONG', coords.lng);
    }
  }, [coords]);

  // Auto suggest MCB Ampere and prefill defaults
  React.useEffect(() => {
    if (data.DAYA && !data.MCB_AMPERE) {
      const suggested = suggestMcbAmpere(data.DAYA);
      if (suggested) {
        onChange('MCB_AMPERE', suggested);
      }
    }
  }, [data.DAYA]);

  React.useEffect(() => {
    if (data.LETAK_APP === undefined || data.LETAK_APP === '') {
      onChange('LETAK_APP', 'Bangunan bagian luar');
    }
    if (data.MCB_MERK === undefined || data.MCB_MERK === '') {
      onChange('MCB_MERK', 'SND');
    }
    if (data.MCB_TAHUN === undefined || data.MCB_TAHUN === '') {
      onChange('MCB_TAHUN', '2023');
    }
  }, []);

  return (
    <div className="space-y-5">
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50 rounded-xl px-4 py-3 flex items-start gap-3">
        <Zap size={18} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Data Teknis & Pembatas (MCB)</p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Golongan tarif, daya terpasang, nomor tiang, koordinat lokasi, letak APP, dan spesifikasi MCB</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Select
          label="Golongan Tarif"
          id="tarif"
          required
          options={TARIF_OPTIONS}
          value={data.TARIF || ''}
          onChange={e => onChange('TARIF', e.target.value)}
          error={errors?.TARIF}
        />

        <Select
          label="Daya Terpasang"
          id="daya"
          required
          options={DAYA_OPTIONS}
          value={data.DAYA || ''}
          onChange={e => onChange('DAYA', e.target.value)}
          error={errors?.DAYA}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Input
          label="Nomor Tiang"
          id="no-tiang"
          leftIcon={Hash}
          type="text"
          placeholder="Contoh: SA2-163/3"
          value={data.NO_TIANG || ''}
          onChange={e => onChange('NO_TIANG', e.target.value)}
          error={errors?.NO_TIANG}
        />

        <Input
          label="Letak APP"
          id="letak-app"
          type="text"
          placeholder="Contoh: Bangunan bagian luar"
          value={data.LETAK_APP || ''}
          onChange={e => onChange('LETAK_APP', e.target.value)}
          error={errors?.LETAK_APP}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Input
          label="Merk MCB"
          id="mcb-merk"
          type="text"
          placeholder="Contoh: SND"
          value={data.MCB_MERK || ''}
          onChange={e => onChange('MCB_MERK', e.target.value)}
          error={errors?.MCB_MERK}
        />

        <Input
          label="Tahun MCB"
          id="mcb-tahun"
          type="number"
          placeholder="Contoh: 2023"
          value={data.MCB_TAHUN || ''}
          onChange={e => onChange('MCB_TAHUN', e.target.value)}
          error={errors?.MCB_TAHUN}
        />

        <Input
          label="Setting MCB (Ampere)"
          id="mcb-ampere"
          type="text"
          placeholder="Contoh: 4"
          value={data.MCB_AMPERE || ''}
          onChange={e => onChange('MCB_AMPERE', e.target.value)}
          error={errors?.MCB_AMPERE}
          hint="Auto-suggested dari Daya"
        />
      </div>

      {/* GPS Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="form-label mb-0">
            Koordinat GPS
            <span className="text-xs text-slate-400 ml-2 font-normal">(Latitude / Longitude)</span>
          </label>
          <Button
            size="sm"
            variant={gpsLoading ? 'secondary' : 'primary'}
            icon={Navigation}
            loading={gpsLoading}
            onClick={getCurrentPosition}
            type="button"
          >
            {gpsLoading ? 'Mencari...' : 'Auto GPS'}
          </Button>
        </div>

        {gpsError && (
          <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 flex items-center gap-2">
            <MapPin size={12} />
            {gpsError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder="-7.3034712"
            type="number"
            step="any"
            value={data.LAT || ''}
            onChange={e => onChange('LAT', e.target.value)}
            hint="Latitude"
            error={errors?.LAT}
          />
          <Input
            placeholder="110.4841111"
            type="number"
            step="any"
            value={data.LONG || ''}
            onChange={e => onChange('LONG', e.target.value)}
            hint="Longitude"
            error={errors?.LONG}
          />
        </div>

        {data.LAT && data.LONG && (
          <a
            href={`https://maps.google.com/?q=${data.LAT},${data.LONG}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 underline underline-offset-2"
          >
            <MapPin size={12} />
            Lihat di Google Maps
          </a>
        )}
      </div>
    </div>
  );
}
