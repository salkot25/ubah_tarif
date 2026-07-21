import React, { useState, useEffect, useRef } from 'react';
import { useSurveyData } from '../hooks/useSurveyData';
import { Badge, KesimpulanBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Card } from '../components/ui/Card';
import { SurveyForm } from '../components/survey/SurveyForm';
import { PageLoader, EmptyState } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import {
  Search, Filter, Download, RefreshCw, Edit2, Trash2, Eye,
  ChevronLeft, ChevronRight, ClipboardList, MapPin, FileText, FileEdit,
  List, LayoutGrid
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { TARIF_OPTIONS, KESIMPULAN_SPI_OPTIONS, ITEMS_PER_PAGE } from '../config/constants';
import ExportPDFModal from '../components/survey/ExportPDFModal';

export default function ListPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const { surveys, loading, error, meta, filters, updateFilters, setPage, handleDelete, handleUpdate, refetch } = useSurveyData();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('SETTING_VIEW_MODE') || 'list');
  const [editModal, setEditModal] = useState({ open: false, data: null });
  const [detailModal, setDetailModal] = useState({ open: false, data: null });
  const [pdfModal, setPdfModal] = useState({ open: false, data: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, idpel: null, name: '' });
  const [deleting, setDeleting] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const searchTimeout = useRef(null);

  // Debounced search
  const handleSearch = (val) => {
    setSearch(val);
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      updateFilters({ search: val });
    }, 500);
  };

  const handleFilterChange = (key, val) => {
    updateFilters({ [key]: val });
  };

  const handleExportCSV = () => {
    if (!surveys.length) { toast.warning('Tidak ada data untuk diexport'); return; }
    const headers = ['IDPEL', 'Nama', 'ALAMAT', 'Tarif', 'Daya', 'NO TIANG', 'LAT', 'LONG', 'MERK METER', 'TYPE METER', 'TAHUN', 'NO METER', 'PEMAKAIAN', 'JAM NYALA', 'TEGANGAN', 'ARUS', 'TARIF KOREKSI', 'KESIMPULAN SPI', 'TINDAKLANJUT'];
    const rows = surveys.map(row => headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `survey_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast.success(`${surveys.length} data berhasil diexport`);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    const res = await handleDelete(deleteConfirm.idpel);
    setDeleting(false);
    setDeleteConfirm({ open: false, idpel: null, name: '' });
    if (res.status === 'success') toast.success('Data berhasil dihapus');
    else toast.error(res.message || 'Gagal menghapus data');
  };

  const handleEditSubmit = async (data) => {
    setEditSubmitting(true);
    const res = await handleUpdate(data);
    setEditSubmitting(false);
    if (res.status === 'success') {
      setEditModal({ open: false, data: null });
      toast.success('Data berhasil diperbarui');
    }
    return res;
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="page-title">Data Survey</h2>
          <p className="text-sm text-slate-500 mt-1">
            Total <span className="font-semibold text-slate-700">{meta.total}</span> data survey
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={RefreshCw} onClick={() => refetch()} size="sm">
            Refresh
          </Button>
          <Button variant="secondary" icon={Download} onClick={handleExportCSV} size="sm">
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="flex-1 w-full sm:w-auto">
            <Input
              leftIcon={Search}
              placeholder="Cari IDPEL, nama, atau alamat..."
              value={search}
              onChange={e => handleSearch(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              options={[{ value: '', label: 'Semua Tarif' }, ...TARIF_OPTIONS.slice(1)]}
              value={filters.tarif || ''}
              onChange={e => handleFilterChange('tarif', e.target.value)}
            />
          </div>
          <div className="w-full sm:w-44">
            <Select
              options={[{ value: '', label: 'Semua Status' }, ...KESIMPULAN_SPI_OPTIONS.slice(1)]}
              value={filters.kesimpulan || ''}
              onChange={e => handleFilterChange('kesimpulan', e.target.value)}
            />
          </div>
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-end sm:self-center">
            <button
              onClick={() => { setViewMode('list'); localStorage.setItem('SETTING_VIEW_MODE', 'list'); }}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${viewMode === 'list' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              title="Tampilan Tabel (List View)"
            >
              <List size={16} />
              <span className="hidden sm:inline">Tabel</span>
            </button>
            <button
              onClick={() => { setViewMode('grid'); localStorage.setItem('SETTING_VIEW_MODE', 'grid'); }}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${viewMode === 'grid' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              title="Tampilan Kartu (Grid View)"
            >
              <LayoutGrid size={16} />
              <span className="hidden sm:inline">Kartu</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Content Container */}
      <Card className={viewMode === 'grid' ? 'bg-transparent border-0 shadow-none p-0' : ''}>
        {loading ? (
          <div className="p-8 bg-white rounded-2xl border border-slate-200"><PageLoader /></div>
        ) : error ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
            <p className="text-red-600 text-sm">{error}</p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => refetch()}>Coba Lagi</Button>
          </div>
        ) : surveys.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200">
            <EmptyState
              icon={ClipboardList}
              title="Tidak ada data ditemukan"
              description="Coba ubah filter pencarian atau tambah data survey baru"
            />
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {surveys.map((row, i) => (
              <Card key={row.IDPEL || i} className="p-4 hover:shadow-card-lg transition-all border border-slate-200 flex flex-col justify-between space-y-3 bg-white">
                <div>
                  <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                    <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">{row.IDPEL}</span>
                    <KesimpulanBadge value={row['KESIMPULAN SPI']} />
                  </div>

                  <div className="mt-3 space-y-1">
                    <h4 className="font-bold text-sm text-slate-800 line-clamp-1">{row.Nama}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed" title={row.ALAMAT}>{row.ALAMAT}</p>
                  </div>

                  <div className="mt-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Tarif & Daya</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant="primary">{row.Tarif || '—'}</Badge>
                        <span className="text-[11px] font-semibold text-slate-600">{row.Daya ? `${Number(row.Daya).toLocaleString('id')} VA` : '—'}</span>
                      </div>
                    </div>
                    <div className="border-l border-slate-200 pl-2.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Merk Meter</span>
                      <span className="font-semibold text-slate-700 block mt-1">{row['MERK METER'] || '—'}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div>
                    {row.LAT && row.LONG ? (
                      <a
                        href={`https://maps.google.com/?q=${row.LAT},${row.LONG}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-semibold"
                      >
                        <MapPin size={13} /> Lokasi GPS
                      </a>
                    ) : <span className="text-slate-400 text-xs">—</span>}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setDetailModal({ open: true, data: row })}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Detail"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => setPdfModal({ open: true, data: row })}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                      title="Cetak Berita Acara (PDF)"
                    >
                      <FileText size={16} />
                    </button>
                    <button
                      onClick={() => navigate('/permohonan')}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Form Perubahan Tarif (Live PDF)"
                    >
                      <FileEdit size={16} />
                    </button>
                    <button
                      onClick={() => setEditModal({ open: true, data: row })}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ open: true, idpel: row.IDPEL, name: row.Nama })}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>IDPEL</th>
                    <th>Nama</th>
                    <th>Alamat</th>
                    <th>Tarif</th>
                    <th>Daya</th>
                    <th>Merk Meter</th>
                    <th>Kesimpulan</th>
                    <th>Lokasi</th>
                    <th className="text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {surveys.map((row, i) => (
                    <tr key={row.IDPEL || i}>
                      <td className="font-mono text-xs font-bold text-blue-700">{row.IDPEL}</td>
                      <td className="font-medium max-w-[140px] truncate">{row.Nama}</td>
                      <td className="text-slate-500 max-w-[180px] truncate" title={row.ALAMAT}>{row.ALAMAT}</td>
                      <td><Badge variant="primary">{row.Tarif || '—'}</Badge></td>
                      <td className="text-slate-500 whitespace-nowrap">{row.Daya ? `${Number(row.Daya).toLocaleString('id')} VA` : '—'}</td>
                      <td className="text-slate-600">{row['MERK METER'] || '—'}</td>
                      <td><KesimpulanBadge value={row['KESIMPULAN SPI']} /></td>
                      <td>
                        {row.LAT && row.LONG ? (
                          <a
                            href={`https://maps.google.com/?q=${row.LAT},${row.LONG}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                          >
                            <MapPin size={11} />GPS
                          </a>
                        ) : <span className="text-slate-400 text-xs">—</span>}
                      </td>
                      <td>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setDetailModal({ open: true, data: row })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Detail"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => setPdfModal({ open: true, data: row })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Cetak Berita Acara (PDF)"
                          >
                            <FileText size={15} />
                          </button>
                          <button
                            onClick={() => navigate('/permohonan')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Form Perubahan Tarif (Live PDF di Permohonan)"
                          >
                            <FileEdit size={15} />
                          </button>
                          <button
                            onClick={() => setEditModal({ open: true, data: row })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ open: true, idpel: row.IDPEL, name: row.Nama })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
                <p className="text-xs text-slate-500">
                  Halaman {meta.page} dari {meta.totalPages} ({meta.total} data)
                </p>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" icon={ChevronLeft} onClick={() => setPage(meta.page - 1)} disabled={meta.page <= 1}>
                    Prev
                  </Button>
                  <Button size="sm" variant="secondary" iconRight={ChevronRight} onClick={() => setPage(meta.page + 1)} disabled={meta.page >= meta.totalPages}>
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Detail Modal */}
      <Modal
        isOpen={detailModal.open}
        onClose={() => setDetailModal({ open: false, data: null })}
        title={`Detail — ${detailModal.data?.IDPEL}`}
        size="md"
        footer={
          <div className="flex gap-2 w-full justify-between items-center">
            <div className="flex gap-2">
              <Button
                variant="success"
                icon={FileText}
                size="sm"
                onClick={() => {
                  setPdfModal({ open: true, data: detailModal.data });
                  setDetailModal({ open: false, data: null });
                }}
              >
                Cetak BA P2TL
              </Button>
              <Button
                variant="primary"
                icon={FileEdit}
                size="sm"
                onClick={() => {
                  setDetailModal({ open: false, data: null });
                  navigate('/permohonan');
                }}
              >
                Form Ubah Tarif (Permohonan)
              </Button>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setDetailModal({ open: false, data: null })}>
              Tutup
            </Button>
          </div>
        }
      >
        {detailModal.data && <DetailView data={detailModal.data} />}
      </Modal>

      {/* PDF Export Modal */}
      <ExportPDFModal
        isOpen={pdfModal.open}
        onClose={() => setPdfModal({ open: false, data: null })}
        data={pdfModal.data}
      />

      {/* Edit Modal */}
      <Modal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, data: null })}
        title="Edit Data Survey"
        size="lg"
      >
        {editModal.data && (
          <SurveyForm
            initialData={editModal.data}
            onSubmit={handleEditSubmit}
            isEdit
            submitting={editSubmitting}
          />
        )}
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, idpel: null, name: '' })}
        title="Konfirmasi Hapus"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteConfirm({ open: false, idpel: null, name: '' })}>Batal</Button>
            <Button variant="danger" loading={deleting} onClick={confirmDelete}>Ya, Hapus</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Apakah Anda yakin ingin menghapus data survey untuk{' '}
          <span className="font-semibold text-slate-800">{deleteConfirm.name}</span>{' '}
          (IDPEL: <span className="font-mono text-blue-700">{deleteConfirm.idpel}</span>)?
        </p>
        <p className="text-xs text-red-600 mt-2">Tindakan ini tidak dapat dibatalkan.</p>
      </Modal>
    </div>
  );
}

function DetailView({ data }) {
  const fields = [
    ['IDPEL', data.IDPEL], ['Nama', data.Nama], ['Alamat', data.ALAMAT],
    ['Tarif', data.Tarif], ['Daya', data.Daya ? `${Number(data.Daya).toLocaleString('id')} VA` : '—'],
    ['No. Tiang', data['NO TIANG']], ['Latitude', data.LAT], ['Longitude', data.LONG],
    ['Merk Meter', data['MERK METER']], ['Type Meter', data['TYPE METER']],
    ['Tahun', data.TAHUN], ['No. Meter', data['NO METER']],
    ['Pemakaian', data.PEMAKAIAN ? `${data.PEMAKAIAN} kWh` : '—'],
    ['Jam Nyala', data['JAM NYALA'] ? `${data['JAM NYALA']} jam` : '—'],
    ['Tegangan', data.TEGANGAN ? `${data.TEGANGAN} V` : '—'],
    ['Arus', data.ARUS ? `${data.ARUS} A` : '—'],
    ['Tarif Koreksi', data['TARIF KOREKSI']],
    ['Kesimpulan SPI', data['KESIMPULAN SPI']],
    ['Peruntukan', data['PERUNTUKAN ON SITE']],
    ['Kesesuaian', data.KESESUAIAN],
    ['Tindak Lanjut', data.TINDAKLANJUT],
  ];

  return (
    <div className="space-y-2">
      {fields.map(([label, value]) => (
        <div key={label} className="flex gap-3 py-2 border-b border-slate-100 last:border-0">
          <span className="text-xs font-medium text-slate-500 w-32 flex-shrink-0">{label}</span>
          <span className="text-sm text-slate-800 flex-1">
            {label === 'Kesimpulan SPI'
              ? <KesimpulanBadge value={value} />
              : (value || <span className="text-slate-400">—</span>)
            }
          </span>
        </div>
      ))}
      {(data['FOTO RUIMAH'] || data.DOKUMENTASI) && (
        <div className="pt-3 grid grid-cols-2 gap-3">
          {data['FOTO RUIMAH'] && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Foto Rumah</p>
              <a href={data['FOTO RUIMAH']} target="_blank" rel="noreferrer">
                <img src={data['FOTO RUIMAH']} alt="Foto Rumah" className="w-full h-32 object-cover rounded-xl border border-slate-200 hover:opacity-90 transition-opacity" />
              </a>
            </div>
          )}
          {data.DOKUMENTASI && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Dokumentasi</p>
              <a href={data.DOKUMENTASI} target="_blank" rel="noreferrer">
                <img src={data.DOKUMENTASI} alt="Dokumentasi" className="w-full h-32 object-cover rounded-xl border border-slate-200 hover:opacity-90 transition-opacity" />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
