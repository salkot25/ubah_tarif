import React from 'react';
import { Input, Textarea } from '../ui/Input';
import { User, Hash } from 'lucide-react';
import { formatDateForInput } from '../../config/constants';

/**
 * Step 1: Identitas Pelanggan
 * Fields: IDPEL, Nama, ALAMAT, NO_SURAT_TUGAS, TANGGAL_SURAT_TUGAS, NO_BA, TANGGAL_SURVEY
 */
export function StepIdentitas({ data, onChange, errors }) {
  return (
    <div className="space-y-5">
      <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 rounded-xl px-4 py-3 flex items-start gap-3">
        <User size={18} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Data Identitas Pelanggan & Penugasan</p>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">Isi IDPEL, nama, alamat, nomor surat tugas, dan nomor berita acara</p>
        </div>
      </div>

      <div className="grid gap-5">
        <Input
          label="ID Pelanggan (IDPEL)"
          id="idpel"
          leftIcon={Hash}
          type="text"
          required
          placeholder="Contoh: 523510578531"
          value={data.IDPEL || ''}
          onChange={e => onChange('IDPEL', e.target.value)}
          error={errors?.IDPEL}
          hint="12 digit angka ID pelanggan PLN"
          maxLength={20}
        />

        <Input
          label="Nama Pelanggan"
          id="nama"
          leftIcon={User}
          type="text"
          required
          placeholder="Contoh: BUDI SANTOSO"
          value={data.NAMA || ''}
          onChange={e => onChange('NAMA', e.target.value.toUpperCase())}
          error={errors?.NAMA}
        />

        <Textarea
          label="Alamat Lengkap"
          id="alamat"
          required
          rows={2}
          placeholder="Contoh: JL. DIPONEGORO NO. 5 RT.02 RW.03 SALATIGA"
          value={data.ALAMAT || ''}
          onChange={e => onChange('ALAMAT', e.target.value)}
          error={errors?.ALAMAT}
          hint="Isi alamat lengkap termasuk RT/RW dan kelurahan"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="No. Surat Tugas"
            id="no-surat-tugas"
            type="text"
            placeholder="Contoh: 0005.STg/SDM.02/07/F03110000/2026"
            value={data.NO_SURAT_TUGAS || ''}
            onChange={e => onChange('NO_SURAT_TUGAS', e.target.value)}
            error={errors?.NO_SURAT_TUGAS}
          />
          <Input
            label="Tanggal Surat Tugas"
            id="tgl-surat-tugas"
            type="date"
            value={formatDateForInput(data.TANGGAL_SURAT_TUGAS)}
            onChange={e => onChange('TANGGAL_SURAT_TUGAS', e.target.value)}
            error={errors?.TANGGAL_SURAT_TUGAS}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Input
            label="No. Berita Acara (BA)"
            id="no-ba"
            type="text"
            placeholder="Contoh: 52351-2620045"
            value={data.NO_BA || ''}
            onChange={e => onChange('NO_BA', e.target.value)}
            error={errors?.NO_BA}
          />
          <Input
            label="Tanggal Survey / Pemeriksaan"
            id="tgl-survey"
            type="date"
            value={formatDateForInput(data.TANGGAL_SURVEY)}
            onChange={e => onChange('TANGGAL_SURVEY', e.target.value)}
            error={errors?.TANGGAL_SURVEY}
          />
        </div>
      </div>
    </div>
  );
}
