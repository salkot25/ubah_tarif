import React, { useState, useEffect, useRef } from 'react';
import { usePermohonanData } from '../hooks/usePermohonanData';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Card } from '../components/ui/Card';
import { PageLoader, EmptyState } from '../components/ui/Spinner';
import { useToast } from '../components/ui/Toast';
import {
  Search, Filter, Plus, RefreshCw, Edit2, Trash2, FileEdit, Eye, Printer,
  ChevronLeft, ChevronRight, FileText, CheckCircle2, AlertTriangle, AlertCircle,
  User, ClipboardCheck, Briefcase, FileCheck, ArrowUpDown, ArrowUp, ArrowDown,
  List, LayoutGrid
} from 'lucide-react';
import {
  TARIF_OPTIONS,
  DAYA_OPTIONS,
  TARIF_KOREKSI_OPTIONS,
  STATUS_OPTIONS,
  MEDIA_PERMOHONAN_OPTIONS,
  STATUS_PERSIL_OPTIONS,
  PERUNTUKAN_OPTIONS,
  formatDateForInput
} from '../config/constants';
import { getById } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ChangeTarifModal from '../components/survey/ChangeTarifModal';

// Status badge helper
function PermohonanStatusBadge({ value }) {
  if (value === 'Selesai') return <Badge variant="success" icon={CheckCircle2}>Selesai</Badge>;
  if (value === 'Draft') return <Badge variant="warning" icon={AlertTriangle}>Draft</Badge>;
  return <Badge variant="neutral" icon={AlertCircle}>Belum</Badge>;
}

// Pagination Bar helper
function PaginationBar({ meta, limit, setLimit, setPage }) {
  if (!meta || meta.total === 0) return null;

  const pages = [];
  const startPage = Math.max(1, meta.page - 2);
  const endPage = Math.min(meta.totalPages, meta.page + 2);
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 flex-wrap gap-3 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-b-2xl">
      <div className="flex items-center gap-4 flex-wrap">
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Halaman <span className="font-bold text-slate-700 dark:text-slate-200">{meta.page}</span> dari <span className="font-bold text-slate-700 dark:text-slate-200">{meta.totalPages}</span> ({meta.total} data)
        </p>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span>Tampilkan:</span>
          <select
            value={limit || 20}
            onChange={e => setLimit(Number(e.target.value))}
            className="form-select text-xs py-1 px-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold cursor-pointer"
          >
            <option value={10}>10 baris</option>
            <option value={20}>20 baris</option>
            <option value={50}>50 baris</option>
            <option value={100}>100 baris</option>
          </select>
        </div>
      </div>
      {meta.totalPages > 1 && (
        <div className="flex items-center gap-1 flex-wrap">
          <Button size="sm" variant="secondary" icon={ChevronLeft} onClick={() => setPage(meta.page - 1)} disabled={meta.page <= 1}>
            Prev
          </Button>
          
          {startPage > 1 && (
            <>
              <button
                onClick={() => setPage(1)}
                className="w-8 h-8 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                1
              </button>
              {startPage > 2 && <span className="text-xs text-slate-400 dark:text-slate-500 px-1">...</span>}
            </>
          )}

          {pages.map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${p === meta.page ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
            >
              {p}
            </button>
          ))}

          {endPage < meta.totalPages && (
            <>
              {endPage < meta.totalPages - 1 && <span className="text-xs text-slate-400 dark:text-slate-500 px-1">...</span>}
              <button
                onClick={() => setPage(meta.totalPages)}
                className="w-8 h-8 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                {meta.totalPages}
              </button>
            </>
          )}

          <Button size="sm" variant="secondary" iconRight={ChevronRight} onClick={() => setPage(meta.page + 1)} disabled={meta.page >= meta.totalPages}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

export default function PermohonanListPage() {
  const toast = useToast();
  const { user } = useAuth();
  const {
    permohonans, loading, error, meta, filters,
    updateFilters, setPage, setLimit, setSort, handleSave, handleDelete, refetch
  } = usePermohonanData();

  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState(() => {
    const saved = localStorage.getItem('SETTING_VIEW_MODE');
    if (saved) return saved;
    return typeof window !== 'undefined' && window.innerWidth < 768 ? 'grid' : 'list';
  });
  const [formModal, setFormModal] = useState({ open: false, data: null });
  const [detailModal, setDetailModal] = useState({ open: false, data: null });
  const [printModal, setPrintModal] = useState({ open: false, data: null });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, idpel: null, name: '' });
  
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [surveyDetails, setSurveyDetails] = useState({ rt: [], pl: [], peruntukan: 'Rumah Tinggal' });
  const [sameAsDil, setSameAsDil] = useState(true);
  const searchTimeout = useRef(null);

  // Official Settings & Signatures from localStorage
  const pejabatMup3 = localStorage.getItem('SETTING_MUP3') || 'VICKY REANDRY FARADIAN';
  const pejabatAsman = localStorage.getItem('SETTING_ASMAN') || 'MUHAMAD ALWI SOFIAN';
  const pejabatMulp = localStorage.getItem('SETTING_MULP') || 'ARIF SETYAWAN';
  const pejabatTl = localStorage.getItem('SETTING_TL') || 'FATHUR ROHIM';
  const petugasSurvey = localStorage.getItem('SETTING_PETUGAS_SURVEY') || pejabatTl;
  const ttdMup3 = localStorage.getItem('SETTING_TTD_MUP3') || '';
  const ttdAsman = localStorage.getItem('SETTING_TTD_ASMAN') || '';
  const ttdMulp = localStorage.getItem('SETTING_TTD_MULP') || '';
  const ttdTl = localStorage.getItem('SETTING_TTD_TL') || '';
  const ttdPetugas = localStorage.getItem('SETTING_TTD_PETUGAS_SURVEY') || '';

  useEffect(() => {
    const handleAppRefresh = () => refetch();
    window.addEventListener('app-refresh', handleAppRefresh);
    return () => window.removeEventListener('app-refresh', handleAppRefresh);
  }, [refetch]);

  const renderSortIcon = (field) => {
    if (filters.sortBy !== field) {
      return <ArrowUpDown size={12} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return filters.sortOrder === 'ASC' 
      ? <ArrowUp size={12} className="text-blue-600 font-bold" />
      : <ArrowDown size={12} className="text-blue-600 font-bold" />;
  };

  // Form fields state
  const [formData, setFormData] = useState({
    IDPEL: '', NAMA: '', ALAMAT: '', TARIF: '', DAYA: '',
    MEDIA_PERMOHONAN: 'CC123', TANGGAL_PERMOHONAN: new Date().toISOString().slice(0, 10),
    NAMA_PEMOHON: '', ALAMAT_PEMOHON: '', NIK_PEMOHON: '',
    TARIF_BARU: '', DAYA_BARU: '', STATUS_PERSIL: 'Milik Sendiri',
    NIK_PELANGGAN: '', NO_TELEPON: '',
    PERUNTUKAN_LISTRIK: 'Rumah Tinggal', NAMA_LAPANGAN: '', ALAMAT_LAPANGAN: '',
    KTP_ADA: 'Ada', IJIN_ADA: 'Tidak Ada', FOTO_ADA: 'Ada'
  });

  // Auto sync Cek Lapangan with DIL AP2T if sameAsDil is active
  useEffect(() => {
    if (sameAsDil) {
      setFormData(prev => ({
        ...prev,
        NAMA_LAPANGAN: prev.NAMA,
        ALAMAT_LAPANGAN: prev.ALAMAT
      }));
    }
  }, [formData.NAMA, formData.ALAMAT, sameAsDil]);

  // Fetch survey appliances if IDPEL exists when modal is open
  useEffect(() => {
    if (formModal.open && formData.IDPEL) {
      async function fetchSurvey() {
        try {
          const res = await getById(formData.IDPEL);
          if (res.status === 'success' && res.data.survey) {
            const s = res.data.survey;
            const parseApp = (str) => {
              if (!str) return [];
              try { return typeof str === 'string' ? JSON.parse(str) : str; } catch(e) { return []; }
            };
            setSurveyDetails({
              rt: parseApp(s.INVENTARISASI_RT),
              pl: parseApp(s.INVENTARISASI_PL),
              peruntukan: s.PERUNTUKAN_ON_SITE || 'Rumah Tinggal'
            });
            if (s.PERUNTUKAN_ON_SITE && !formData.PERUNTUKAN_LISTRIK) {
              setFormData(prev => ({ ...prev, PERUNTUKAN_LISTRIK: s.PERUNTUKAN_ON_SITE }));
            }
          }
        } catch (e) {
          // keep fallback
        }
      }
      fetchSurvey();
    } else if (formModal.open && !formData.IDPEL) {
      setSurveyDetails({ rt: [], pl: [], peruntukan: 'Rumah Tinggal' });
    }
  }, [formModal.open, formData.IDPEL]);

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

  // Open Form for Create
  const handleOpenCreate = () => {
    setFormData({
      IDPEL: '', NAMA: '', ALAMAT: '', TARIF: '', DAYA: '',
      MEDIA_PERMOHONAN: 'CC123', TANGGAL_PERMOHONAN: new Date().toISOString().slice(0, 10),
      NAMA_PEMOHON: '', ALAMAT_PEMOHON: '', NIK_PEMOHON: '',
      TARIF_BARU: '', DAYA_BARU: '', STATUS_PERSIL: 'Milik Sendiri',
      NIK_PELANGGAN: '', NO_TELEPON: '',
      PERUNTUKAN_LISTRIK: 'Rumah Tinggal', NAMA_LAPANGAN: '', ALAMAT_LAPANGAN: '',
      KTP_ADA: 'Ada', IJIN_ADA: 'Tidak Ada', FOTO_ADA: 'Ada'
    });
    setSameAsDil(true);
    setSurveyDetails({ rt: [], pl: [], peruntukan: 'Rumah Tinggal' });
    setFormModal({ open: true, isEdit: false });
  };

  // Open Form for Edit
  const handleOpenEdit = (row) => {
    const isSame = !row.NAMA_LAPANGAN || (row.NAMA_LAPANGAN === row.NAMA && row.ALAMAT_LAPANGAN === row.ALAMAT);
    setSameAsDil(isSame);
    const normalizeAdaStr = (val) => {
      if (val === true || val === 1) return 'Ada';
      if (typeof val === 'string') {
        const s = val.trim().toLowerCase();
        if (s === 'ada' || s === 'true' || s === '1' || s === 'ya') return 'Ada';
      }
      return 'Tidak Ada';
    };

    setFormData({
      PERUNTUKAN_LISTRIK: 'Rumah Tinggal',
      NAMA_LAPANGAN: row.NAMA || '',
      ALAMAT_LAPANGAN: row.ALAMAT || '',
      ...row,
      KTP_ADA: normalizeAdaStr(row.KTP_ADA),
      IJIN_ADA: normalizeAdaStr(row.IJIN_ADA),
      FOTO_ADA: normalizeAdaStr(row.FOTO_ADA)
    });
    setFormModal({ open: true, isEdit: true });
  };

  // Auto pre-fill applicant details if name is typed and it's create
  useEffect(() => {
    if (!formModal.isEdit && formData.NAMA && !formData.NAMA_PEMOHON) {
      setFormData(prev => ({
        ...prev,
        NAMA_PEMOHON: prev.NAMA,
        ALAMAT_PEMOHON: prev.ALAMAT
      }));
    }
  }, [formData.NAMA, formModal.isEdit]);

  // Handle Form Submission
  const handleSubmitPermohonan = async (e) => {
    e.preventDefault();
    if (!formData.IDPEL || !formData.NAMA || !formData.ALAMAT) {
      toast.error('IDPEL, Nama, dan Alamat wajib diisi');
      return;
    }

    setSaving(true);

    // Auto-calculate STATUS_PERMOHONAN
    const requiredFields = ['IDPEL', 'NAMA', 'ALAMAT', 'TARIF', 'DAYA', 'TARIF_BARU', 'DAYA_BARU', 'NIK_PEMOHON', 'NO_TELEPON', 'NIK_PELANGGAN'];
    const isAnyRequiredEmpty = requiredFields.some(f => !formData[f] || String(formData[f]).trim() === '');
    const isDocsIncomplete = formData.KTP_ADA === 'Tidak Ada' || formData.FOTO_ADA === 'Tidak Ada';

    const calculatedStatus = (isAnyRequiredEmpty || isDocsIncomplete) ? 'Draft' : 'Selesai';
    const submissionData = { ...formData, STATUS_PERMOHONAN: calculatedStatus };

    const res = await handleSave(submissionData);
    setSaving(false);

    if (res.status === 'success') {
      setFormModal({ open: false, isEdit: false });
      toast.success(res.message || 'Permohonan berhasil disimpan');
    } else {
      toast.error(res.message || 'Gagal menyimpan permohonan');
    }
  };

  const confirmDelete = async () => {
    setDeleting(true);
    const res = await handleDelete(deleteConfirm.idpel);
    setDeleting(false);
    setDeleteConfirm({ open: false, idpel: null, name: '' });
    if (res.status === 'success') toast.success('Data permohonan berhasil dihapus');
    else toast.error(res.message || 'Gagal menghapus data');
  };

  return (
    <div className="space-y-5">
      {/* Filters */}
      <Card className="p-3.5 sm:p-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Left: Search & Filter Dropdown */}
          <div className="flex flex-col sm:flex-row gap-3 flex-grow md:flex-grow-0 md:w-[65%] lg:w-[70%]">
            <div className="flex-grow">
              <Input
                leftIcon={Search}
                placeholder="Cari IDPEL, nama pelanggan, atau alamat..."
                value={search}
                onChange={e => handleSearch(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48 flex-shrink-0">
              <Select
                options={STATUS_OPTIONS}
                value={filters.statusPermohonan || ''}
                onChange={e => handleFilterChange('statusPermohonan', e.target.value)}
              />
            </div>
          </div>

          {/* Right: Toggle View & Actions */}
          <div className="flex items-center justify-between md:justify-end gap-3 flex-shrink-0">
            {/* View Switcher */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => { setViewMode('list'); localStorage.setItem('SETTING_VIEW_MODE', 'list'); }}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                title="Tampilan Tabel (List View)"
              >
                <List size={16} />
                <span className="hidden md:inline">Tabel</span>
              </button>
              <button
                onClick={() => { setViewMode('grid'); localStorage.setItem('SETTING_VIEW_MODE', 'grid'); }}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}`}
                title="Tampilan Kartu (Grid View)"
              >
                <LayoutGrid size={16} />
                <span className="hidden md:inline">Kartu</span>
              </button>
            </div>

            {/* Action Button */}
            <Button
              variant="primary"
              icon={Plus}
              onClick={handleOpenCreate}
              className="py-2 px-3.5 text-xs font-semibold whitespace-nowrap h-9 rounded-xl flex items-center justify-center gap-1.5"
            >
              Tambah
            </Button>
          </div>
        </div>
      </Card>

      {/* Content Container */}
      <Card className={viewMode === 'grid' ? 'bg-transparent border-0 shadow-none p-0' : ''}>
        {loading ? (
          <div className="p-8 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700"><PageLoader /></div>
        ) : error ? (
          <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <p className="text-red-600 text-sm">{error}</p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={() => refetch()}>Coba Lagi</Button>
          </div>
        ) : permohonans.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <EmptyState
              icon={FileText}
              title="Tidak ada permohonan ditemukan"
              description="Daftarkan permohonan perubahan tarif baru menggunakan tombol di atas"
            />
          </div>
        ) : viewMode === 'grid' ? (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {permohonans.map((row, i) => (
                <Card key={row.IDPEL || i} className="p-4 hover:shadow-card-lg transition-all border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-700">
                      <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-800">{row.IDPEL}</span>
                      <PermohonanStatusBadge value={row.STATUS_PERMOHONAN} />
                    </div>

                    <div className="mt-3 space-y-1">
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 line-clamp-1">{row.NAMA}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed" title={row.ALAMAT}>{row.ALAMAT}</p>
                    </div>

                    <div className="mt-3 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Tarif Lama</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 block mt-0.5">{row.TARIF || '—'}</span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block">{row.DAYA ? `${row.DAYA.toString().replace(' VA', '')} VA` : '—'}</span>
                      </div>
                      <div className="border-l border-slate-200 dark:border-slate-700 pl-2.5">
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase block">Tarif Baru</span>
                        <span className="font-bold text-blue-700 dark:text-blue-400 block mt-0.5">{row.TARIF_BARU || '—'}</span>
                        <span className="text-[10px] text-blue-500 dark:text-blue-400/70 block">{row.DAYA_BARU ? `${row.DAYA_BARU.toString().replace(' VA', '')} VA` : '—'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-medium text-[11px] bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">{row.MEDIA_PERMOHONAN}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setDetailModal({ open: true, data: row })}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
                        title="Detail Permohonan"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => setPrintModal({ open: true, data: row })}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors"
                        title="Preview & Cetak Form Pemeriksaan"
                      >
                        <Printer size={16} />
                      </button>
                      <button
                        onClick={() => handleOpenEdit(row)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-700 transition-colors"
                        title="Edit Data Administrasi"
                      >
                        <Edit2 size={16} />
                      </button>
                      {user?.role === 'admin' && (
                        <button
                          onClick={() => setDeleteConfirm({ open: true, idpel: row.IDPEL, name: row.NAMA })}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 transition-colors"
                          title="Hapus Permohonan"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <Card className="p-0 mt-4 overflow-hidden border border-slate-200 dark:border-slate-700">
              <PaginationBar meta={meta} limit={filters.limit} setLimit={setLimit} setPage={setPage} />
            </Card>
          </div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors select-none group" onClick={() => setSort('IDPEL')}>
                      <div className="flex items-center gap-1.5">
                        <span>IDPEL</span>
                        {renderSortIcon('IDPEL')}
                      </div>
                    </th>
                    <th className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors select-none group" onClick={() => setSort('NAMA')}>
                      <div className="flex items-center gap-1.5">
                        <span>Nama Pelanggan</span>
                        {renderSortIcon('NAMA')}
                      </div>
                    </th>
                    <th className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors select-none group" onClick={() => setSort('ALAMAT')}>
                      <div className="flex items-center gap-1.5">
                        <span>Alamat</span>
                        {renderSortIcon('ALAMAT')}
                      </div>
                    </th>
                    <th className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors select-none group" onClick={() => setSort('TARIF')}>
                      <div className="flex items-center gap-1.5">
                        <span>Tarif / Daya Lama</span>
                        {renderSortIcon('TARIF')}
                      </div>
                    </th>
                    <th className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors select-none group" onClick={() => setSort('TARIF_BARU')}>
                      <div className="flex items-center gap-1.5">
                        <span>Tarif / Daya Baru</span>
                        {renderSortIcon('TARIF_BARU')}
                      </div>
                    </th>
                    <th className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors select-none group" onClick={() => setSort('MEDIA_PERMOHONAN')}>
                      <div className="flex items-center gap-1.5">
                        <span>Media</span>
                        {renderSortIcon('MEDIA_PERMOHONAN')}
                      </div>
                    </th>
                    <th className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors select-none group" onClick={() => setSort('STATUS_PERMOHONAN')}>
                      <div className="flex items-center gap-1.5">
                        <span>Status Berkas</span>
                        {renderSortIcon('STATUS_PERMOHONAN')}
                      </div>
                    </th>
                    <th className="text-center select-none">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {permohonans.map((row, i) => (
                    <tr key={row.IDPEL || i}>
                      <td className="font-mono text-xs font-bold text-blue-700">{row.IDPEL}</td>
                      <td className="font-medium max-w-[140px] truncate">{row.NAMA}</td>
                      <td className="text-slate-500 max-w-[180px] truncate" title={row.ALAMAT}>{row.ALAMAT}</td>
                      <td>
                        <span className="font-semibold text-slate-700">{row.TARIF}</span>
                        <span className="text-xs text-slate-400 ml-1">({row.DAYA ? row.DAYA.toString().replace(' VA', '') : ''} VA)</span>
                      </td>
                      <td className="text-blue-700">
                        <span className="font-bold">{row.TARIF_BARU || '—'}</span>
                        {row.TARIF_BARU && row.DAYA_BARU && (
                          <span className="text-xs ml-1">({row.DAYA_BARU.toString().replace(' VA', '')} VA)</span>
                        )}
                      </td>
                      <td className="text-slate-500 font-medium text-xs">{row.MEDIA_PERMOHONAN}</td>
                      <td><PermohonanStatusBadge value={row.STATUS_PERMOHONAN} /></td>
                      <td>
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setDetailModal({ open: true, data: row })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors"
                            title="Detail Permohonan"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => setPrintModal({ open: true, data: row })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-700 transition-colors"
                            title="Preview & Cetak Form Pemeriksaan"
                          >
                            <Printer size={15} />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(row)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-700 transition-colors"
                            title="Edit Data Administrasi"
                          >
                            <Edit2 size={15} />
                          </button>
                          {user?.role === 'admin' && (
                            <button
                              onClick={() => setDeleteConfirm({ open: true, idpel: row.IDPEL, name: row.NAMA })}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 transition-colors"
                              title="Hapus Permohonan"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PaginationBar meta={meta} limit={filters.limit} setLimit={setLimit} setPage={setPage} />
          </>
        )}
      </Card>

      <Modal
        isOpen={formModal.open}
        onClose={() => setFormModal({ open: false, data: null })}
        title={formModal.isEdit ? "Edit Administrasi Permohonan" : "Daftarkan Permohonan Baru"}
        size="full"
      >
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
            html, body, #root, [role="dialog"], .fixed, [role="dialog"] > div, .fixed > div, [role="dialog"] > div > div, .fixed > div > div, [role="dialog"] > div > div > div, .fixed > div > div > div, form, form > div, form > div > div {
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

        <form onSubmit={handleSubmitPermohonan} className="flex flex-col h-full">
          {/* Main Split Body */}
          <div className="flex flex-col xl:flex-row gap-6 items-start overflow-y-auto xl:overflow-hidden flex-1 p-1 max-h-[78vh] xl:max-h-none">
            
            {/* Left Panel: Form Inputs */}
            <div className="w-full xl:w-[46%] flex flex-col space-y-4 max-h-none xl:max-h-[72vh] xl:overflow-y-auto pr-1 xl:pr-3 flex-shrink-0">
              {/* Section 1: Data Administrasi */}
              <div className="bg-slate-50/80 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-3 shadow-sm">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-700 text-blue-800 dark:text-blue-300 font-bold text-xs uppercase tracking-wider">
                  <User size={15} className="text-blue-600" />
                  <span>1. Data Administrasi (DIL AP2T)</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">ID Pelanggan (IDPEL) <span className="form-required">*</span></label>
                    <Input
                      value={formData.IDPEL}
                      onChange={e => setFormData({ ...formData, IDPEL: e.target.value })}
                      disabled={formModal.isEdit}
                      required
                      placeholder="12 digit IDPEL"
                      size="sm"
                    />
                  </div>
                  <div>
                    <label className="form-label">Nama Pelanggan <span className="form-required">*</span></label>
                    <Input
                      value={formData.NAMA}
                      onChange={e => setFormData({ ...formData, NAMA: e.target.value })}
                      required
                      placeholder="Nama pelanggan sesuai DIL AP2T"
                      size="sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Alamat Pelanggan <span className="form-required">*</span></label>
                  <Input
                    value={formData.ALAMAT}
                    onChange={e => setFormData({ ...formData, ALAMAT: e.target.value })}
                    required
                    placeholder="Alamat lengkap lokasi pelanggan"
                    size="sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Tarif Lama <span className="form-required">*</span></label>
                    <Input
                      value={formData.TARIF}
                      onChange={e => setFormData({ ...formData, TARIF: e.target.value })}
                      required
                      placeholder="Contoh: R1, B1, R1M"
                      size="sm"
                    />
                  </div>
                  <div>
                    <label className="form-label">Daya Lama <span className="form-required">*</span></label>
                    <Input
                      value={formData.DAYA}
                      onChange={e => setFormData({ ...formData, DAYA: e.target.value })}
                      required
                      placeholder="Contoh: 900, 1300, 2200"
                      size="sm"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Data Permohonan Perubahan Tarif */}
              <div className="bg-indigo-50/40 dark:bg-indigo-950/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/40 space-y-3 shadow-sm">
                <div className="flex items-center gap-2 pb-2 border-b border-indigo-100 dark:border-indigo-900/40 text-indigo-900 dark:text-indigo-300 font-bold text-xs uppercase tracking-wider">
                  <ClipboardCheck size={15} className="text-indigo-600" />
                  <span>2. Data Permohonan Perubahan Tarif</span>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Media Permohonan</label>
                    <Select
                      options={MEDIA_PERMOHONAN_OPTIONS}
                      value={formData.MEDIA_PERMOHONAN}
                      onChange={e => setFormData({ ...formData, MEDIA_PERMOHONAN: e.target.value })}
                      size="sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Tgl Permohonan</label>
                    <Input
                      type="date"
                      value={formatDateForInput(formData.TANGGAL_PERMOHONAN)}
                      onChange={e => setFormData({ ...formData, TANGGAL_PERMOHONAN: e.target.value })}
                      size="sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">NIK Pemohon</label>
                    <Input
                      value={formData.NIK_PEMOHON}
                      onChange={e => setFormData({ ...formData, NIK_PEMOHON: e.target.value })}
                      placeholder="NIK Pemohon / Kuasa"
                      size="sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Nama Pemohon</label>
                    <Input
                      value={formData.NAMA_PEMOHON}
                      onChange={e => setFormData({ ...formData, NAMA_PEMOHON: e.target.value })}
                      placeholder="Nama pemohon / kuasa"
                      size="sm"
                    />
                  </div>
                  <div>
                    <label className="form-label">Alamat Pemohon</label>
                    <Input
                      value={formData.ALAMAT_PEMOHON}
                      onChange={e => setFormData({ ...formData, ALAMAT_PEMOHON: e.target.value })}
                      placeholder="Alamat pemohon jika beda"
                      size="sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Tarif Baru <span className="form-required">*</span></label>
                    <Input
                      value={formData.TARIF_BARU}
                      onChange={e => setFormData({ ...formData, TARIF_BARU: e.target.value })}
                      required
                      placeholder="Contoh: R1, R1M, S1"
                      size="sm"
                    />
                  </div>
                  <div>
                    <label className="form-label">Daya Baru <span className="form-required">*</span></label>
                    <Input
                      value={formData.DAYA_BARU}
                      onChange={e => setFormData({ ...formData, DAYA_BARU: e.target.value })}
                      required
                      placeholder="Contoh: 450, 900, 1300"
                      size="sm"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Data Cek Lapangan & Kontak */}
              <div className="bg-emerald-50/30 dark:bg-emerald-950/15 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/40 space-y-3 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-100 dark:border-emerald-900/40 flex-wrap gap-2">
                  <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 font-bold text-xs uppercase tracking-wider">
                    <Briefcase size={15} className="text-emerald-600" />
                    <span>3. Data Cek Lapangan & Kontak</span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-emerald-800 bg-emerald-100/60 px-2.5 py-1 rounded-lg border border-emerald-200/80 hover:bg-emerald-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={sameAsDil}
                      onChange={e => setSameAsDil(e.target.checked)}
                      className="rounded border-emerald-400 text-emerald-600 focus:ring-emerald-500 h-3.5 w-3.5"
                    />
                    <span>Samakan Data Lapangan dengan DIL AP2T</span>
                  </label>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Nama Pelanggan (Cek Lapangan)</label>
                    <Input
                      value={formData.NAMA_LAPANGAN}
                      onChange={e => setFormData({ ...formData, NAMA_LAPANGAN: e.target.value })}
                      disabled={sameAsDil}
                      placeholder="Nama pelanggan hasil cek lapangan"
                      size="sm"
                    />
                  </div>
                  <div>
                    <label className="form-label">Alamat Pelanggan (Cek Lapangan)</label>
                    <Input
                      value={formData.ALAMAT_LAPANGAN}
                      onChange={e => setFormData({ ...formData, ALAMAT_LAPANGAN: e.target.value })}
                      disabled={sameAsDil}
                      placeholder="Alamat persil hasil cek lapangan"
                      size="sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">NIK Pelanggan Utama</label>
                    <Input
                      value={formData.NIK_PELANGGAN}
                      onChange={e => setFormData({ ...formData, NIK_PELANGGAN: e.target.value })}
                      placeholder="NIK Pelanggan Utama"
                      size="sm"
                    />
                  </div>
                  <div>
                    <label className="form-label">No. Telepon / HP / WA</label>
                    <Input
                      value={formData.NO_TELEPON}
                      onChange={e => setFormData({ ...formData, NO_TELEPON: e.target.value })}
                      placeholder="No HP / WA Pelanggan"
                      size="sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Peruntukan Listrik</label>
                    <Select
                      options={PERUNTUKAN_OPTIONS}
                      value={formData.PERUNTUKAN_LISTRIK}
                      onChange={e => setFormData({ ...formData, PERUNTUKAN_LISTRIK: e.target.value })}
                      size="sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Status Persil / Bangunan</label>
                    <Select
                      options={STATUS_PERSIL_OPTIONS}
                      value={formData.STATUS_PERSIL}
                      onChange={e => setFormData({ ...formData, STATUS_PERSIL: e.target.value })}
                      size="sm"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Kelengkapan Dokumen Pendukung */}
              <div className="bg-rose-50/30 dark:bg-rose-950/15 p-4 rounded-xl border border-rose-100 dark:border-rose-900/40 space-y-3 shadow-sm">
                <div className="flex items-center gap-2 pb-2 border-b border-rose-100 dark:border-rose-900/40 text-rose-900 dark:text-rose-300 font-bold text-xs uppercase tracking-wider">
                  <FileCheck size={15} className="text-rose-600" />
                  <span>4. Kelengkapan Dokumen Pendukung</span>
                </div>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Berkas KTP</label>
                    <Select
                      options={[{ value: 'Ada', label: 'Ada' }, { value: 'Tidak Ada', label: 'Tidak Ada' }]}
                      value={formData.KTP_ADA}
                      onChange={e => setFormData({ ...formData, KTP_ADA: e.target.value })}
                      size="sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Berkas Ijin Usaha</label>
                    <Select
                      options={[{ value: 'Ada', label: 'Ada' }, { value: 'Tidak Ada', label: 'Tidak Ada' }]}
                      value={formData.IJIN_ADA}
                      onChange={e => setFormData({ ...formData, IJIN_ADA: e.target.value })}
                      size="sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">Berkas Foto Persil</label>
                    <Select
                      options={[{ value: 'Ada', label: 'Ada' }, { value: 'Tidak Ada', label: 'Tidak Ada' }]}
                      value={formData.FOTO_ADA}
                      onChange={e => setFormData({ ...formData, FOTO_ADA: e.target.value })}
                      size="sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel: Live PDF Preview Sheet */}
            <div className="w-full xl:w-[54%] bg-slate-600/90 rounded-2xl p-2 sm:p-4 overflow-x-auto xl:overflow-y-auto flex justify-center items-start max-h-none xl:max-h-[72vh] border border-slate-700/50 shadow-inner flex-1 min-w-0">
              <LiveChangeTarifSheet
                formData={formData}
                appliancesRT={surveyDetails.rt}
                appliancesPL={surveyDetails.pl}
                peruntukanLap={surveyDetails.peruntukan}
              />
            </div>

          </div>

          {/* Modal Sticky Footer */}
          <div className="px-4 sm:px-6 py-3.5 -mx-6 -mb-6 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-b-2xl sticky bottom-0 z-20 mt-4">
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium text-center sm:text-left">
              ⚡ Dokumen A4 diperbarui secara realtime sesuai isian form.
            </div>
            <div className="flex items-center justify-end gap-2 sm:gap-3 w-full sm:w-auto flex-wrap">
              <Button type="button" variant="secondary" size="sm" onClick={() => setFormModal({ open: false, data: null })}>
                Batal
              </Button>
              <Button type="button" variant="success" size="sm" icon={Printer} onClick={() => window.print()}>
                Cetak Live PDF
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={saving}>
                Simpan Permohonan
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={detailModal.open}
        onClose={() => setDetailModal({ open: false, data: null })}
        title={`Detail Permohonan — ${detailModal.data?.IDPEL}`}
        size="lg"
        footer={
          <div className="flex gap-2 w-full justify-between items-center flex-wrap">
            <div className="flex items-center gap-2">
              <Button
                variant="success"
                icon={Printer}
                size="sm"
                onClick={() => {
                  const data = detailModal.data;
                  setDetailModal({ open: false, data: null });
                  if (data) setPrintModal({ open: true, data });
                }}
              >
                Preview & Cetak Formulir
              </Button>
              <Button
                variant="secondary"
                icon={Edit2}
                size="sm"
                onClick={() => {
                  const data = detailModal.data;
                  setDetailModal({ open: false, data: null });
                  if (data) handleOpenEdit(data);
                }}
              >
                Edit Data Permohonan
              </Button>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setDetailModal({ open: false, data: null })}>
              Tutup
            </Button>
          </div>
        }
      >
        {detailModal.data && <DetailPermohonanView data={detailModal.data} />}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirm.open}
        onClose={() => setDeleteConfirm({ open: false, idpel: null, name: '' })}
        title="Hapus Permohonan"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteConfirm({ open: false, idpel: null, name: '' })}>Batal</Button>
            <Button variant="danger" loading={deleting} onClick={confirmDelete}>Ya, Hapus</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Apakah Anda yakin ingin menghapus permohonan perubahan tarif untuk{' '}
          <span className="font-semibold text-slate-800">{deleteConfirm.name}</span>{' '}
          (IDPEL: <span className="font-mono text-blue-700">{deleteConfirm.idpel}</span>)?
        </p>
        <p className="text-xs text-red-600 mt-2">Seluruh data permohonan dan survey terkait akan dihapus secara permanen.</p>
      </Modal>

      {/* Dedicated Preview & Cetak Formulir Pemeriksaan Modal */}
      {printModal.open && printModal.data && (
        <ChangeTarifModal
          isOpen={printModal.open}
          onClose={() => setPrintModal({ open: false, data: null })}
          data={printModal.data}
        />
      )}
    </div>
  );
}

function DetailPermohonanView({ data }) {
  // Helper to format date into readable local string
  const formatReadableDate = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getChecklistIcon = (status) => {
    if (status === 'Ada') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
          <CheckCircle2 size={12} className="text-emerald-600" /> Ada
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
        <AlertCircle size={12} className="text-rose-500" /> Tidak Ada
      </span>
    );
  };

  return (
    <div className="space-y-6 max-h-[70vh] pr-2 overflow-y-auto">
      {/* 2-Column Grid for main groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Section 1: Data Pelanggan */}
        <div className="bg-slate-50/50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-700/60 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wider">
            <User size={14} className="text-blue-600" />
            <span>Data Pelanggan</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">IDPEL</span>
              <span className="text-sm font-mono font-bold text-blue-700">{data.IDPEL}</span>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nama Pelanggan</span>
              <span className="text-sm font-semibold text-slate-800">{data.NAMA}</span>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Alamat Pelanggan</span>
              <span className="text-xs text-slate-600">{data.ALAMAT}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">NIK Pelanggan</span>
              <span className="text-xs font-mono font-semibold text-slate-700">{data.NIK_PELANGGAN || '—'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">No. Telp Pelanggan</span>
              <span className="text-xs font-mono font-semibold text-slate-700">{data.NO_TELEPON || '—'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tarif / Daya Lama</span>
              <span className="text-xs font-semibold text-slate-700">{data.TARIF} / {data.DAYA ? `${Number(data.DAYA).toLocaleString('id')} VA` : '—'}</span>
            </div>
          </div>
        </div>

        {/* Section 2: Data Pemohon */}
        <div className="bg-slate-50/50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-700/60 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wider">
            <Briefcase size={14} className="text-indigo-600" />
            <span>Data Pemohon / Kuasa</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Nama Pemohon</span>
              <span className="text-sm font-semibold text-slate-800">{data.NAMA_PEMOHON || '—'}</span>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">NIK Pemohon</span>
              <span className="text-xs font-mono font-semibold text-slate-700">{data.NIK_PEMOHON || '—'}</span>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Alamat Pemohon</span>
              <span className="text-xs text-slate-600">{data.ALAMAT_PEMOHON || '—'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status Persil</span>
              <span className="text-xs font-semibold text-slate-700">{data.STATUS_PERSIL || '—'}</span>
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Section 3: Pengajuan Perubahan Tarif */}
        <div className="bg-slate-50/50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-700/60 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wider">
            <ClipboardCheck size={14} className="text-teal-600" />
            <span>Pengajuan Perubahan Tarif</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tarif / Daya Baru</span>
              <span className="text-xs font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800 inline-block mt-0.5">
                {data.TARIF_BARU || '—'} / {data.DAYA_BARU ? `${Number(data.DAYA_BARU).toLocaleString('id')} VA` : '—'}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Media Permohonan</span>
              <span className="text-xs font-semibold text-slate-700 mt-0.5 inline-block">{data.MEDIA_PERMOHONAN || '—'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tanggal Permohonan</span>
              <span className="text-xs font-medium text-slate-700 mt-0.5 inline-block">{formatReadableDate(data.TANGGAL_PERMOHONAN)}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status Berkas</span>
              <div className="mt-0.5">
                <PermohonanStatusBadge value={data.STATUS_PERMOHONAN} />
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Kelengkapan Dokumen */}
        <div className="bg-slate-50/50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-100 dark:border-slate-700/60 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wider">
            <FileCheck size={14} className="text-rose-600" />
            <span>Kelengkapan Berkas Dokumen</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Foto Copy KTP</span>
              {getChecklistIcon(data.KTP_ADA)}
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Surat Ijin Usaha</span>
              {getChecklistIcon(data.IJIN_ADA)}
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Foto Lokasi</span>
              {getChecklistIcon(data.FOTO_ADA)}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Subcomponent for Live Real-Time PDF A4 Sheet Preview
function LiveChangeTarifSheet({ formData, appliancesRT = [], appliancesPL = [], peruntukanLap = 'Rumah Tinggal' }) {
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

  const tglPemeriksaan = new Date().toISOString().slice(0, 10);
  const dateInfo = formatIndonesianDate(tglPemeriksaan);
  const tglMohonFormatted = formatIndonesianDate(formData.TANGGAL_PERMOHONAN).shortDate;

  const pejabatMup3 = localStorage.getItem('SETTING_MUP3') || 'VICKY REANDRY FARADIAN';
  const pejabatAsman = localStorage.getItem('SETTING_ASMAN') || 'MUHAMAD ALWI SOFIAN';
  const pejabatMulp = localStorage.getItem('SETTING_MULP') || 'ARIF SETYAWAN';
  const pejabatTl = localStorage.getItem('SETTING_TL') || 'FATHUR ROHIM';
  const petugasSurvey = localStorage.getItem('SETTING_PETUGAS_SURVEY') || pejabatTl;
  const ttdMup3 = localStorage.getItem('SETTING_TTD_MUP3') || '';
  const ttdAsman = localStorage.getItem('SETTING_TTD_ASMAN') || '';
  const ttdMulp = localStorage.getItem('SETTING_TTD_MULP') || '';
  const ttdTl = localStorage.getItem('SETTING_TTD_TL') || '';
  const ttdPetugas = localStorage.getItem('SETTING_TTD_PETUGAS_SURVEY') || '';

  const formatDayaText = (val) => {
    if (!val && val !== 0) return '';
    const str = String(val).trim();
    if (!str) return '';
    if (str.toUpperCase().includes('VA')) return str;
    if (!isNaN(str) && str !== '') return `${Number(str).toLocaleString('id')} VA`;
    return str;
  };

  const dayaLamaFormatted = formatDayaText(formData.DAYA);
  const dayaBaruFormatted = formatDayaText(formData.DAYA_BARU);

  const calcTotalRT = () => appliancesRT.reduce((sum, item) => sum + ((item.qty || 0) * (item.watt || 0)), 0);
  const calcTotalPL = () => appliancesPL.reduce((sum, item) => sum + ((item.qty || 0) * (item.watt || 0)), 0);

  const totalRT = calcTotalRT();
  const totalPL = calcTotalPL();
  const grandTotal = totalRT + totalPL;

  const pctRT = grandTotal > 0 ? ((totalRT / grandTotal) * 100).toFixed(1) : '0';
  const pctPL = grandTotal > 0 ? ((totalPL / grandTotal) * 100).toFixed(1) : '0';
  const maxRowsCount = Math.max(appliancesRT.length, appliancesPL.length);

  const checkIsAda = (val) => {
    if (val === true || val === 1) return true;
    if (typeof val === 'string') {
      const s = val.trim().toLowerCase();
      return s === 'ada' || s === 'true' || s === '1' || s === 'ya';
    }
    return false;
  };

  const ktpAda = checkIsAda(formData.KTP_ADA);
  const ijinAda = checkIsAda(formData.IJIN_ADA);
  const fotoAda = checkIsAda(formData.FOTO_ADA);

  return (
    <div
      id="printable-change-tarif"
      className="w-[210mm] min-h-[297mm] bg-white shadow-2xl p-[14mm] text-black text-[8.5pt] leading-snug font-sans relative flex flex-col print-border-black select-none transform scale-[0.75] xl:scale-[0.82] origin-top my-2"
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {/* Header */}
      <div className="text-center border-b-2 border-black pb-2 mb-3">
        <h1 className="text-[11.5pt] font-black uppercase tracking-wide">
          FORMULIR PEMERIKSAAN PERUNTUKAN TENAGA LISTRIK
        </h1>
        <h2 className="text-[9.5pt] font-extrabold uppercase mt-0.5 tracking-normal">
          DARI TARIF NON SUBSIDI KE TARIF SUBSIDI DENGAN PERUBAHAN TARIF
        </h2>
      </div>

      {/* Date line */}
      <p className="text-justify text-[8.5pt] mb-3">
        Pada hari ini, <span className="font-bold">{dateInfo.dayName || '..........'}</span> Tanggal, <span className="font-bold">{new Date().getDate()}</span> Bulan, <span className="font-bold">{dateInfo.fullText.split('Bulan ')[1]?.split(' Tahun')[0] || '..........'}</span> Tahun <span className="font-bold">{new Date().getFullYear()}</span>, telah dilaksanakan pengecekan peruntukan tenaga listrik Pelanggan UP3 Salatiga ULP Salatiga Kota :
      </p>

      {/* Section 1: Data Administrasi */}
      <div className="mb-3">
        <h3 className="font-bold text-[8.5pt] underline mb-1 uppercase tracking-wide">
          Data Administrasi (DIL AP2T) :
        </h3>
        <table className="w-full border-collapse text-[8.5pt] border border-black">
          <tbody>
            <tr className="border-b border-black">
              <td className="w-[32%] px-2.5 py-0.5 font-bold bg-slate-50 border-r border-black">Nama Pelanggan</td>
              <td className="px-2.5 py-0.5 font-semibold">{formData.NAMA || '—'} / {formData.IDPEL || '—'}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="px-2.5 py-0.5 font-bold bg-slate-50 border-r border-black">Alamat</td>
              <td className="px-2.5 py-0.5 text-[8pt] leading-tight">{formData.ALAMAT || '—'}</td>
            </tr>
            <tr>
              <td className="px-2.5 py-0.5 font-bold bg-slate-50 border-r border-black">Tarif/Daya Lama</td>
              <td className="px-2.5 py-0.5 font-bold">{formData.TARIF || '—'} / {dayaLamaFormatted || '—'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Section 2: Data Permohonan */}
      <div className="mb-3">
        <h3 className="font-bold text-[8.5pt] underline mb-1 uppercase tracking-wide">
          Data Permohonan Perubahan Tarif :
        </h3>
        <table className="w-full border-collapse text-[8.5pt] border border-black">
          <tbody>
            <tr className="border-b border-black">
              <td className="w-[32%] px-2.5 py-0.5 font-bold bg-slate-50 border-r border-black">Media Permohonan</td>
              <td className="px-2.5 py-0.5 font-semibold">{formData.MEDIA_PERMOHONAN || 'CC123'}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="px-2.5 py-0.5 font-bold bg-slate-50 border-r border-black">Tanggal Permohonan</td>
              <td className="px-2.5 py-0.5">{tglMohonFormatted || '—'}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="px-2.5 py-0.5 font-bold bg-slate-50 border-r border-black">Nama Pemohon</td>
              <td className="px-2.5 py-0.5 font-semibold">{formData.NAMA_PEMOHON || formData.NAMA || '—'}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="px-2.5 py-0.5 font-bold bg-slate-50 border-r border-black">Alamat Pemohon</td>
              <td className="px-2.5 py-0.5 text-[8pt] leading-tight">{formData.ALAMAT_PEMOHON || formData.ALAMAT || '—'}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="px-2.5 py-0.5 font-bold bg-slate-50 border-r border-black">NIK Pemohon</td>
              <td className="px-2.5 py-0.5 font-mono">{formData.NIK_PEMOHON || '—'}</td>
            </tr>
            <tr>
              <td className="px-2.5 py-0.5 font-bold bg-slate-50 border-r border-black">Tarif/Daya Baru</td>
              <td className="px-2.5 py-0.5 font-bold">{formData.TARIF_BARU ? `${formData.TARIF_BARU} / ${dayaBaruFormatted}` : '—'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Section 3: Data Cek Lapangan */}
      <div className="mb-3">
        <h3 className="font-bold text-[8.5pt] underline mb-1 uppercase tracking-wide">
          Data Cek Lapangan :
        </h3>
        <table className="w-full border-collapse text-[8.5pt] border border-black">
          <tbody>
            <tr className="border-b border-black">
              <td className="w-[32%] px-2.5 py-0.5 font-bold bg-slate-50 border-r border-black">Nama Pelanggan</td>
              <td className="px-2.5 py-0.5 font-semibold">{formData.NAMA_LAPANGAN || formData.NAMA || '—'} / {formData.IDPEL || '—'}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="px-2.5 py-0.5 font-bold bg-slate-50 border-r border-black">Alamat Pelanggan</td>
              <td className="px-2.5 py-0.5 text-[8pt] leading-tight">{formData.ALAMAT_LAPANGAN || formData.ALAMAT || '—'}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="px-2.5 py-0.5 font-bold bg-slate-50 border-r border-black">NIK Pelanggan</td>
              <td className="px-2.5 py-0.5 font-mono">{formData.NIK_PELANGGAN || '—'}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="px-2.5 py-0.5 font-bold bg-slate-50 border-r border-black">No Telepon/HP/Email</td>
              <td className="px-2.5 py-0.5 font-mono">{formData.NO_TELEPON || '—'}</td>
            </tr>
            <tr className="border-b border-black">
              <td className="px-2.5 py-0.5 font-bold bg-slate-50 border-r border-black">Peruntukan listrik</td>
              <td className="px-2.5 py-0.5 font-bold italic">{formData.PERUNTUKAN_LISTRIK || peruntukanLap || 'Rumah Tinggal'}</td>
            </tr>
            <tr>
              <td className="px-2.5 py-0.5 font-bold bg-slate-50 border-r border-black">Status Persil/bangunan</td>
              <td className="px-2.5 py-0.5 font-medium">{formData.STATUS_PERSIL || 'Milik Sendiri'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Section 4: Dokumen Pendukung */}
      <div className="mb-3">
        <table className="w-[65%] border border-black border-collapse text-[8pt]">
          <thead>
            <tr className="bg-slate-100 text-center font-bold">
              <th className="border border-black py-0.5 px-2 text-left">Dokumen Pendukung</th>
              <th className="border border-black py-0.5 w-[22%]">Ada</th>
              <th className="border border-black py-0.5 w-[22%]">Tidak Ada</th>
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
        <table className="w-full border border-black border-collapse text-[7.5pt]">
          <thead>
            <tr className="bg-slate-100 text-center font-bold">
              <th colSpan={8} className="border border-black py-0.5 text-[8pt]">PERUNTUKAN</th>
            </tr>
            <tr className="bg-slate-100 text-center font-bold">
              <th colSpan={4} className="border border-black py-0.5 text-[8pt]">RUMAH TANGGA</th>
              <th colSpan={4} className="border border-black py-0.5 text-[8pt] border-l-2">PERUNTUKAN LAIN</th>
            </tr>
            <tr className="bg-slate-50 text-[7pt] font-semibold text-slate-700">
              <th className="border border-black py-0.5 w-[24%] px-1 text-left">PERALATAN LISTRIK</th>
              <th className="border border-black py-0.5 w-[8%] text-center">JUMLAH</th>
              <th className="border border-black py-0.5 w-[9%] text-center">DAYA SATUAN (WATT)</th>
              <th className="border border-black py-0.5 w-[9%] text-center">DAYA TOTAL (WATT)</th>
              <th className="border border-black py-0.5 w-[24%] px-1 text-left border-l-2">PERALATAN LISTRIK</th>
              <th className="border border-black py-0.5 w-[8%] text-center">JUMLAH</th>
              <th className="border border-black py-0.5 w-[9%] text-center">DAYA SATUAN (WATT)</th>
              <th className="border border-black py-0.5 w-[9%] text-center">DAYA TOTAL (WATT)</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: Math.max(maxRowsCount, 4) }).map((_, rowIndex) => {
              const itemRT = appliancesRT[rowIndex] || { name: '', qty: '', watt: '' };
              const itemPL = appliancesPL[rowIndex] || { name: '', qty: '', watt: '' };

              const renderVal = (val) => (val !== '' && val !== undefined && val !== null ? val : '\u00A0');

              return (
                <tr key={rowIndex} className="h-5">
                  <td className="border border-black px-1.5 py-0 truncate max-w-[80px]">{itemRT.name || (rowIndex === 0 ? 'Lampu' : '\u00A0')}</td>
                  <td className="border border-black text-center py-0 font-mono">{renderVal(itemRT.qty)}</td>
                  <td className="border border-black text-center py-0 font-mono">{renderVal(itemRT.watt)}</td>
                  <td className="border border-black text-center py-0 font-mono font-medium">{renderVal(itemRT.qty && itemRT.watt ? itemRT.qty * itemRT.watt : '')}</td>

                  <td className="border border-black px-1.5 py-0 truncate max-w-[80px] border-l-2">{itemPL.name || (rowIndex === 0 ? 'Lampu' : '\u00A0')}</td>
                  <td className="border border-black text-center py-0 font-mono">{renderVal(itemPL.qty)}</td>
                  <td className="border border-black text-center py-0 font-mono">{renderVal(itemPL.watt)}</td>
                  <td className="border border-black text-center py-0 font-mono font-medium">{renderVal(itemPL.qty && itemPL.watt ? itemPL.qty * itemPL.watt : '')}</td>
                </tr>
              );
            })}
            <tr className="bg-slate-50 font-bold text-[8pt]">
              <td colSpan={3} className="border border-black px-1.5 py-0.5 font-bold">TOTAL</td>
              <td className="border border-black text-center py-0.5 font-mono font-bold text-blue-700">{totalRT > 0 ? totalRT : ''}</td>
              <td colSpan={3} className="border border-black px-1.5 py-0.5 font-bold border-l-2">TOTAL</td>
              <td className="border border-black text-center py-0.5 font-mono font-bold text-blue-700">{totalPL > 0 ? totalPL : ''}</td>
            </tr>
            <tr className="bg-slate-100 font-extrabold text-[8pt]">
              <td colSpan={3} className="border border-black px-1.5 py-0.5 text-right font-bold">%</td>
              <td className="border border-black text-center py-0.5 font-mono font-extrabold">{grandTotal > 0 ? `${pctRT}%` : '%'}</td>
              <td colSpan={3} className="border border-black px-1.5 py-0.5 text-right font-bold border-l-2">%</td>
              <td className="border border-black text-center py-0.5 font-mono font-extrabold">{grandTotal > 0 ? `${pctPL}%` : '%'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Legal Declaration */}
      <p className="text-justify text-[8pt] italic mb-2 leading-normal">
        Berdasarkan hasil pemeriksaan di atas, apabila ditemukan ketidaksesuaian, maka Pelanggan bersedia mengikuti peraturan dan ketentuan yang berlaku di PLN.
      </p>

      {/* Signatures section */}
      <div className="mt-auto w-full text-[8.5pt]">
        <div className="grid grid-cols-3 text-center min-h-[95px]">
          <div className="p-1 flex flex-col justify-between">
            <span className="font-bold leading-tight">Pelanggan/Pemilik Persil</span>
            <div className="h-10 flex items-center justify-center relative my-0.5"></div>
            <span className="font-bold underline uppercase truncate">{formData.NAMA || '___________________________'}</span>
          </div>
          <div className="p-1 flex flex-col justify-between">
            <span className="font-bold leading-tight">Petugas Pemeriksa</span>
            <div className="h-10 flex items-center justify-center relative my-0.5">
              {ttdPetugas ? (
                <img src={ttdPetugas} alt="Ttd Petugas" className="h-10 max-w-[110px] object-contain mix-blend-multiply" />
              ) : null}
            </div>
            <span className="font-bold underline uppercase truncate">{petugasSurvey || pejabatTl || '___________________________'}</span>
          </div>
          <div className="p-1 flex flex-col justify-between">
            <span className="font-bold leading-tight">TL TE LAY GAN</span>
            <div className="h-10 flex items-center justify-center relative my-0.5">
              {ttdTl ? (
                <img src={ttdTl} alt="Ttd TL" className="h-10 max-w-[110px] object-contain mix-blend-multiply" />
              ) : null}
            </div>
            <span className="font-bold underline uppercase truncate">{pejabatTl || '—'}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 text-center min-h-[95px] mt-2">
          <div className="p-1 flex flex-col justify-between">
            <span className="font-bold leading-tight">Mengesahkan,<br />MUP3 Salatiga</span>
            <div className="h-10 flex items-center justify-center relative my-0.5">
              {ttdMup3 ? (
                <img src={ttdMup3} alt="Ttd MUP3" className="h-10 max-w-[110px] object-contain mix-blend-multiply" />
              ) : null}
            </div>
            <span className="font-bold underline uppercase truncate">{pejabatMup3 || '—'}</span>
          </div>
          <div className="p-1 flex flex-col justify-between">
            <span className="font-bold leading-tight">Mengetahui,<br />ASMAN NPS</span>
            <div className="h-10 flex items-center justify-center relative my-0.5">
              {ttdAsman ? (
                <img src={ttdAsman} alt="Ttd ASMAN" className="h-10 max-w-[110px] object-contain mix-blend-multiply" />
              ) : null}
            </div>
            <span className="font-bold underline uppercase truncate">{pejabatAsman || '—'}</span>
          </div>
          <div className="p-1 flex flex-col justify-between">
            <span className="font-bold leading-tight">Menyetujui,<br />MULP Salatiga Kota</span>
            <div className="h-10 flex items-center justify-center relative my-0.5">
              {ttdMulp ? (
                <img src={ttdMulp} alt="Ttd MULP" className="h-10 max-w-[110px] object-contain mix-blend-multiply" />
              ) : null}
            </div>
            <span className="font-bold underline uppercase truncate">{pejabatMulp || '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
