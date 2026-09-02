import React, { useRef, useState } from 'react';
import { Select } from '../ui/Select';
import { Input, Textarea } from '../ui/Input';
import { Button } from '../ui/Button';
import { uploadPhoto } from '../../services/api';
import { useToast } from '../ui/Toast';
import {
  TARIF_KOREKSI_OPTIONS,
  KESIMPULAN_SPI_OPTIONS,
  KESESUAIAN_OPTIONS,
} from '../../config/constants';
import { ClipboardCheck, Upload, X, Image as ImageIcon, Loader2, Plus, Trash } from 'lucide-react';

export function StepKesimpulan({ data, onChange, errors }) {
  const toast = useToast();
  const fotoRumahRef = useRef(null);
  const dokumentasiRef = useRef(null);
  const [uploadingFoto, setUploadingFoto]  = useState(false);
  const [uploadingDok,  setUploadingDok]   = useState(false);

  const appliancesRT = data.INVENTARISASI_RT || [];
  const appliancesPL = data.INVENTARISASI_PL || [];

  const handleRTChange = (index, field, value) => {
    const list = [...appliancesRT];
    list[index] = {
      ...list[index],
      [field]: field === 'name' ? value : Number(value) || 0
    };
    onChange('INVENTARISASI_RT', list);
  };

  const addRTRow = () => {
    onChange('INVENTARISASI_RT', [...appliancesRT, { name: '', qty: 1, watt: 100 }]);
  };

  const deleteRTRow = (index) => {
    onChange('INVENTARISASI_RT', appliancesRT.filter((_, i) => i !== index));
  };

  const handlePLChange = (index, field, value) => {
    const list = [...appliancesPL];
    list[index] = {
      ...list[index],
      [field]: field === 'name' ? value : Number(value) || 0
    };
    onChange('INVENTARISASI_PL', list);
  };

  const addPLRow = () => {
    onChange('INVENTARISASI_PL', [...appliancesPL, { name: '', qty: 1, watt: 100 }]);
  };

  const deletePLRow = (index) => {
    onChange('INVENTARISASI_PL', appliancesPL.filter((_, i) => i !== index));
  };

  async function handleFileUpload(file, fieldName, folderType, setLoading) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }
    setLoading(true);
    try {
      const res = await uploadPhoto(file, folderType, data.IDPEL || '');
      if (res.status === 'success') {
        const currentVal = data[fieldName] || '';
        const currentUrls = currentVal ? currentVal.split(',').filter(Boolean) : [];
        const newUrls = [...currentUrls, res.data.fileUrl].join(',');
        onChange(fieldName, newUrls);
        toast.success('Foto berhasil diupload ke Google Drive!');
      } else {
        toast.error('Upload gagal: ' + res.message);
      }
    } catch (err) {
      toast.error('Gagal upload. Pastikan Google Apps Script sudah di-deploy.');
    } finally {
      setLoading(false);
    }
  }

  // Calculate totals for summary/display
  const totalRT = appliancesRT.reduce((sum, item) => sum + ((item.qty || 0) * (item.watt || 0)), 0);
  const totalPL = appliancesPL.reduce((sum, item) => sum + ((item.qty || 0) * (item.watt || 0)), 0);

  return (
    <div className="space-y-5">
      <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 rounded-xl px-4 py-3 flex items-start gap-3">
        <ClipboardCheck size={18} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Kesimpulan & Dokumentasi</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">Evaluasi hasil survey, inventarisasi daya, dan upload foto</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Select
          label="Tarif Koreksi / Rekomendasi"
          id="tarif-koreksi"
          required
          options={TARIF_KOREKSI_OPTIONS}
          value={data.TARIF_KOREKSI || ''}
          onChange={e => onChange('TARIF_KOREKSI', e.target.value)}
          error={errors?.TARIF_KOREKSI}
        />

        <Select
          label="Kesimpulan SPI"
          id="kesimpulan-spi"
          required
          options={KESIMPULAN_SPI_OPTIONS}
          value={data.KESIMPULAN_SPI || ''}
          onChange={e => onChange('KESIMPULAN_SPI', e.target.value)}
          error={errors?.KESIMPULAN_SPI}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Input
          label="Peruntukan On Site"
          id="peruntukan"
          type="text"
          placeholder="Contoh: Rumah Tinggal, Kantor, dll"
          value={data.PERUNTUKAN_ON_SITE || ''}
          onChange={e => onChange('PERUNTUKAN_ON_SITE', e.target.value)}
          error={errors?.PERUNTUKAN_ON_SITE}
        />

        <Select
          label="Kesesuaian"
          id="kesesuaian"
          options={KESESUAIAN_OPTIONS}
          value={data.KESESUAIAN || ''}
          onChange={e => onChange('KESESUAIAN', e.target.value)}
          error={errors?.KESESUAIAN}
        />
      </div>

      {/* Appliance Inventories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-3 border-t border-slate-100 dark:border-slate-800">
        {/* Household Appliances (RT) */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Inventarisasi Rumah Tangga</h4>
            <Button size="xs" variant="secondary" icon={Plus} onClick={addRTRow} type="button">Tambah</Button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {appliancesRT.map((item, i) => (
              <div key={i} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                <Input
                  value={item.name}
                  onChange={e => handleRTChange(i, 'name', e.target.value)}
                  size="sm"
                  placeholder="Nama alat"
                  className="flex-1 h-8"
                />
                <Input
                  type="number"
                  value={item.qty}
                  onChange={e => handleRTChange(i, 'qty', e.target.value)}
                  size="sm"
                  className="w-12 h-8 text-center px-1"
                  placeholder="Qty"
                />
                <Input
                  type="number"
                  value={item.watt}
                  onChange={e => handleRTChange(i, 'watt', e.target.value)}
                  size="sm"
                  className="w-16 h-8 text-center px-1"
                  placeholder="Watt"
                />
                <button type="button" onClick={() => deleteRTRow(i)} className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors">
                  <Trash size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 font-semibold px-2">
            <span>Total Daya Rumah Tangga:</span>
            <span className="font-mono text-slate-700 dark:text-slate-200 font-bold">{totalRT} W</span>
          </div>
        </div>

        {/* Commercial/Other Appliances (PL) */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Inventarisasi Peruntukan Lain</h4>
            <Button size="xs" variant="secondary" icon={Plus} onClick={addPLRow} type="button">Tambah</Button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {appliancesPL.map((item, i) => (
              <div key={i} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
                <Input
                  value={item.name}
                  onChange={e => handlePLChange(i, 'name', e.target.value)}
                  size="sm"
                  placeholder="Nama alat"
                  className="flex-1 h-8"
                />
                <Input
                  type="number"
                  value={item.qty}
                  onChange={e => handlePLChange(i, 'qty', e.target.value)}
                  size="sm"
                  className="w-12 h-8 text-center px-1"
                  placeholder="Qty"
                />
                <Input
                  type="number"
                  value={item.watt}
                  onChange={e => handlePLChange(i, 'watt', e.target.value)}
                  size="sm"
                  className="w-16 h-8 text-center px-1"
                  placeholder="Watt"
                />
                <button type="button" onClick={() => deletePLRow(i)} className="text-red-500 hover:text-red-700 p-1 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors">
                  <Trash size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 font-semibold px-2">
            <span>Total Daya Peruntukan Lain:</span>
            <span className="font-mono text-slate-700 dark:text-slate-200 font-bold">{totalPL} W</span>
          </div>
        </div>
      </div>

      <Textarea
        label="Tindak Lanjut"
        id="tindaklanjut"
        rows={3}
        placeholder="Tuliskan catatan tindak lanjut yang diperlukan..."
        value={data.TINDAKLANJUT || ''}
        onChange={e => onChange('TINDAKLANJUT', e.target.value)}
        error={errors?.TINDAKLANJUT}
      />

      {/* Photo Upload Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-slate-100 dark:border-slate-800">
        <PhotoUploadField
          label="Foto Rumah"
          hint="Foto tampak depan rumah/lokasi pelanggan"
          value={data.FOTO_RUMAH || ''}
          onChange={url => onChange('FOTO_RUMAH', url)}
          onUpload={(file) => handleFileUpload(file, 'FOTO_RUMAH', 'foto_rumah', setUploadingFoto)}
          uploading={uploadingFoto}
          inputRef={fotoRumahRef}
        />

        <PhotoUploadField
          label="Dokumentasi"
          hint="Foto meter atau dokumentasi tambahan"
          value={data.DOKUMENTASI || ''}
          onChange={url => onChange('DOKUMENTASI', url)}
          onUpload={(file) => handleFileUpload(file, 'DOKUMENTASI', 'dokumentasi', setUploadingDok)}
          uploading={uploadingDok}
          inputRef={dokumentasiRef}
        />
      </div>
    </div>
  );
}

function PhotoUploadField({ label, hint, value, onChange, onUpload, uploading, inputRef }) {
  const urls = value ? value.split(',').filter(Boolean) : [];

  const handleRemove = (urlToRemove) => {
    const updated = urls.filter(u => u !== urlToRemove).join(',');
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <label className="form-label">{label}</label>
      <div className="space-y-3">
        {/* Upload area */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className={`
            w-full border-2 border-dashed rounded-xl p-4 flex flex-col items-center gap-2
            transition-colors duration-150 cursor-pointer
            ${uploading
              ? 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-not-allowed'
              : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30'
            }
          `}
        >
          {uploading ? (
            <>
              <Loader2 size={20} className="text-blue-500 animate-spin" />
              <span className="text-xs text-slate-500 dark:text-slate-400">Mengupload ke Drive...</span>
            </>
          ) : (
            <>
              <Upload size={20} className="text-slate-400 dark:text-slate-500" />
              <span className="text-xs text-slate-600 dark:text-slate-300 font-semibold">Upload Foto Baru</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">JPG, PNG maks 5MB</span>
            </>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => { if (e.target.files[0]) onUpload(e.target.files[0]); }}
        />

        {/* List of uploaded photos */}
        {urls.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {urls.map((url, index) => (
              <div key={index} className="relative group border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800">
                <img 
                  src={url} 
                  alt={`${label} ${index + 1}`} 
                  className="w-full h-24 object-cover"
                />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="bg-white/95 hover:bg-white text-slate-800 p-1.5 rounded-lg text-[10px] font-bold shadow transition-colors"
                  >
                    Lihat
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRemove(url)}
                    className="bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-lg shadow transition-colors"
                    title="Hapus foto"
                  >
                    <X size={12} />
                  </button>
                </div>
                <span className="absolute bottom-1 left-1 bg-slate-900/60 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                  #{index + 1}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      {hint && <p className="form-hint">{hint}</p>}
    </div>
  );
}
