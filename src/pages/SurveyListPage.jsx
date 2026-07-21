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
  Search, Filter, RefreshCw, FileText, ClipboardList, MapPin,
  Eye, Edit2, CheckCircle2, AlertTriangle, AlertCircle,
  ChevronLeft, ChevronRight, User, Activity, Zap, Camera,
  ArrowUpDown, ArrowUp, ArrowDown, List, LayoutGrid
} from 'lucide-react';
import { STATUS_OPTIONS } from '../config/constants';
import ExportPDFModal from '../components/survey/ExportPDFModal';

// Status badge for survey
function SurveyStatusBadge({ value }) {
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

export default function SurveyListPage() {
  const toast = useToast();
  const {
    surveys, loading, error, meta, filters,
    updateFilters, setPage, setLimit, setSort, handleSave, handleDelete, refetch
  } = useSurveyData();

  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState(() => {
    const saved = localStorage.getItem('SETTING_VIEW_MODE');
    if (saved) return saved;
    return typeof window !== 'undefined' && window.innerWidth < 768 ? 'grid' : 'list';
  });
  const [surveyModal, setSurveyModal] = useState({ open: false, data: null });
  const [printModal, setPrintModal] = useState({ open: false, data: null });
  const [detailModal, setDetailModal] = useState({ open: false, data: null });
  
  const [saving, setSaving] = useState(false);
  const searchTimeout = useRef(null);

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

  // Handle survey submit from the 5-step wizard
  const handleSurveySubmit = async (surveyData) => {
    setSaving(true);
    
    // Auto-calculate STATUS_SURVEY based on essential fields
    const requiredTechnical = [
      'NO_SURAT_TUGAS', 'NO_BA', 'NO_TIANG', 'LAT', 'LONG', 
      'METER_MERK', 'METER_TYPE', 'METER_NO', 'METER_TAHUN', 
      'METER_TEGANGAN', 'METER_ARUS', 'KESIMPULAN_SPI'
    ];
    
    const isAnyEmpty = requiredTechnical.some(f => !surveyData[f] || String(surveyData[f]).trim() === '');
    const isPhotoMissing = !surveyData.FOTO_RUMAH;
    
    const status = (isAnyEmpty || isPhotoMissing) ? 'Draft' : 'Selesai';
    const submissionData = { ...surveyData, STATUS_SURVEY: status };

    const res = await handleSave(submissionData);
    setSaving(false);
    
    if (res.status === 'success') {
      setSurveyModal({ open: false, data: null });
      toast.success(res.message || 'Data survey berhasil disimpan');
    } else {
      toast.error(res.message || 'Gagal menyimpan data survey');
    }
    return res;
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
                value={filters.statusSurvey || ''}
                onChange={e => handleFilterChange('statusSurvey', e.target.value)}
              />
            </div>
          </div>

          {/* Right: Toggle View */}
          <div className="flex items-center justify-between md:justify-end gap-3 flex-shrink-0">
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
        ) : surveys.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
            <EmptyState
              icon={ClipboardList}
              title="Tidak ada antrean survey"
              description="Pelanggan harus didaftarkan di menu Permohonan Tarif terlebih dahulu"
            />
          </div>
        ) : viewMode === 'grid' ? (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {surveys.map((row, i) => (
                <Card key={row.IDPEL || i} className="p-4 hover:shadow-card-lg transition-all border border-slate-200 dark:border-slate-700 flex flex-col justify-between space-y-3 bg-white dark:bg-slate-800">
                  <div>
                    <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-700">
                      <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md border border-blue-100 dark:border-blue-800">{row.IDPEL}</span>
                      <SurveyStatusBadge value={row.STATUS_SURVEY} />
                    </div>

                    <div className="mt-3 space-y-1">
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-100 line-clamp-1">{row.NAMA}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed" title={row.ALAMAT}>{row.ALAMAT}</p>
                    </div>

                    <div className="mt-3 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Tarif & Daya</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300 block mt-0.5">{row.TARIF || '—'} ({row.DAYA ? `${row.DAYA.toString().replace(' VA', '')} VA` : '—'})</span>
                      </div>
                      <div className="border-l border-slate-200 dark:border-slate-700 pl-2.5">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Hasil SPI</span>
                        <div className="mt-0.5">
                          {row.KESIMPULAN_SPI ? (
                            <KesimpulanBadge value={row.KESIMPULAN_SPI} />
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 text-[10px] italic">Belum diisi</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <div>
                      {row.LAT && row.LONG ? (
                        <a
                          href={`https://maps.google.com/?q=${row.LAT},${row.LONG}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-semibold"
                        >
                          <MapPin size={13} /> GPS Lokasi
                        </a>
                      ) : <span className="text-slate-400 text-xs">—</span>}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setDetailModal({ open: true, data: row })}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Detail Survey"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => setSurveyModal({ open: true, data: row })}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        title="Input / Edit Hasil Survey"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setPrintModal({ open: true, data: row })}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                        title="Cetak BA + Lampiran (PDF)"
                        disabled={row.STATUS_SURVEY === 'Belum'}
                        style={{ opacity: row.STATUS_SURVEY === 'Belum' ? 0.3 : 1 }}
                      >
                        <FileText size={16} />
                      </button>
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
                        <span>Tarif / Daya</span>
                        {renderSortIcon('TARIF')}
                      </div>
                    </th>
                    <th className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors select-none group" onClick={() => setSort('KESIMPULAN_SPI')}>
                      <div className="flex items-center gap-1.5">
                        <span>Kesimpulan SPI</span>
                        {renderSortIcon('KESIMPULAN_SPI')}
                      </div>
                    </th>
                    <th className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors select-none group" onClick={() => setSort('STATUS_SURVEY')}>
                      <div className="flex items-center gap-1.5">
                        <span>Status Survey</span>
                        {renderSortIcon('STATUS_SURVEY')}
                      </div>
                    </th>
                    <th className="select-none">Peta</th>
                    <th className="text-center select-none">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {surveys.map((row, i) => (
                    <tr key={row.IDPEL || i}>
                      <td className="font-mono text-xs font-bold text-blue-700">{row.IDPEL}</td>
                      <td className="font-medium max-w-[140px] truncate">{row.NAMA}</td>
                      <td className="text-slate-500 max-w-[180px] truncate" title={row.ALAMAT}>{row.ALAMAT}</td>
                      <td>
                        <span className="font-semibold text-slate-700">{row.TARIF}</span>
                        <span className="text-xs text-slate-400 ml-1">({row.DAYA ? row.DAYA.toString().replace(' VA', '') : ''} VA)</span>
                      </td>
                      <td>
                        {row.KESIMPULAN_SPI ? (
                          <KesimpulanBadge value={row.KESIMPULAN_SPI} />
                        ) : (
                          <span className="text-slate-400 text-xs">— Belum diisi —</span>
                        )}
                      </td>
                      <td><SurveyStatusBadge value={row.STATUS_SURVEY} /></td>
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
                            title="Detail Survey"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            onClick={() => setSurveyModal({ open: true, data: row })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Input / Edit Hasil Survey"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            onClick={() => setPrintModal({ open: true, data: row })}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Cetak BA + Lampiran (PDF)"
                            disabled={row.STATUS_SURVEY === 'Belum'}
                            style={{ opacity: row.STATUS_SURVEY === 'Belum' ? 0.3 : 1 }}
                          >
                            <FileText size={15} />
                          </button>
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
      {/* Survey Wizard Modal */}
      <Modal
        isOpen={surveyModal.open}
        onClose={() => setSurveyModal({ open: false, data: null })}
        title={`Input Hasil Survey Lapangan — ${surveyModal.data?.IDPEL}`}
        size="full"
      >
        {surveyModal.data && (
          <SurveyForm
            initialData={surveyModal.data}
            onSubmit={handleSurveySubmit}
            isEdit={surveyModal.data.STATUS_SURVEY !== 'Belum'}
            submitting={saving}
          />
        )}
      </Modal>

      {/* Print PDF BA + Lampiran Modal */}
      {printModal.open && (
        <ExportPDFModal
          isOpen={printModal.open}
          onClose={() => setPrintModal({ open: false, data: null })}
          data={printModal.data}
        />
      )}

      {/* Detail Modal */}
      <Modal
        isOpen={detailModal.open}
        onClose={() => setDetailModal({ open: false, data: null })}
        title={`Detail Survey — ${detailModal.data?.IDPEL}`}
        size="lg"
        footer={
          <div className="flex gap-2 w-full justify-between items-center">
            <Button
              variant="success"
              icon={FileText}
              size="sm"
              onClick={() => {
                setPrintModal({ open: true, data: detailModal.data });
                setDetailModal({ open: false, data: null });
              }}
              disabled={detailModal.data?.STATUS_SURVEY === 'Belum'}
            >
              Cetak BA P2TL
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setDetailModal({ open: false, data: null })}>
              Tutup
            </Button>
          </div>
        }
      >
        {detailModal.data && <DetailSurveyView data={detailModal.data} />}
      </Modal>
    </div>
  );
}

function DetailSurveyView({ data }) {
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

  const totalRT = appliancesRT.reduce((sum, item) => sum + ((Number(item.qty) || 0) * (Number(item.watt) || 0)), 0);
  const totalPL = appliancesPL.reduce((sum, item) => sum + ((Number(item.qty) || 0) * (Number(item.watt) || 0)), 0);

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

  return (
    <div className="space-y-6 max-h-[70vh] pr-2 overflow-y-auto">
      {/* 2-Column Grid for main data groups */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Section 1: Data Pelanggan */}
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 text-slate-800 font-bold text-xs uppercase tracking-wider">
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
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Alamat</span>
              <span className="text-xs text-slate-600">{data.ALAMAT}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tarif / Daya Lama</span>
              <span className="text-xs font-semibold text-slate-700">{data.TARIF} / {data.DAYA ? `${Number(data.DAYA).toLocaleString('id')} VA` : '—'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tarif / Daya Baru</span>
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 inline-block">
                {data.TARIF_BARU || '—'} / {data.DAYA_BARU ? `${Number(data.DAYA_BARU).toLocaleString('id')} VA` : '—'}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Kesesuaian Tarif</span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                data.KESESUAIAN === 'Sesuai' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                  : data.KESESUAIAN === 'Tidak Sesuai'
                  ? 'bg-rose-50 text-rose-700 border border-rose-100'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}>
                {data.KESESUAIAN || 'Belum Ditentukan'}
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Penugasan & Lokasi */}
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 text-slate-800 font-bold text-xs uppercase tracking-wider">
            <ClipboardList size={14} className="text-indigo-600" />
            <span>Penugasan & Lokasi</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">No. Surat Tugas</span>
              <span className="text-xs font-medium text-slate-700">{data.NO_SURAT_TUGAS || '—'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">No. Berita Acara</span>
              <span className="text-xs font-mono font-medium text-slate-700">{data.NO_BA || '—'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tanggal Survey</span>
              <span className="text-xs font-medium text-slate-700">{formatReadableDate(data.TANGGAL_SURVEY)}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">No. Tiang</span>
              <span className="text-xs font-medium text-slate-700">{data.NO_TIANG || '—'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Koordinat</span>
              {data.LAT && data.LONG ? (
                <a
                  href={`https://maps.google.com/?q=${data.LAT},${data.LONG}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium mt-0.5"
                >
                  <MapPin size={12} className="text-rose-500" />
                  {Number(data.LAT).toFixed(6)}, {Number(data.LONG).toFixed(6)}
                </a>
              ) : (
                <span className="text-xs text-slate-400">—</span>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Section 3: Informasi Meter & Pengukuran */}
      <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 text-slate-800 font-bold text-xs uppercase tracking-wider">
          <Activity size={14} className="text-teal-600" />
          <span>Informasi Meter & Pengukuran Teknik</span>
        </div>
        
        {/* Technical grids */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          {/* Col 1: KWH Meter info */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-500 border-b border-slate-200/40 pb-1 text-[10px] uppercase">A. Data KWH Meter</h4>
            <div className="space-y-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Merk / Tipe Meter</span>
                <span className="text-xs font-medium text-slate-700">
                  {data.METER_MERK || '—'} {data.METER_TYPE ? `/ ${data.METER_TYPE}` : ''}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">No. Seri / Tahun</span>
                <span className="text-xs font-mono font-medium text-slate-700">
                  {data.METER_NO || '—'} {data.METER_TAHUN ? `/ ${data.METER_TAHUN}` : ''}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tegangan / Arus</span>
                <span className="text-xs font-medium text-slate-700">
                  {data.METER_TEGANGAN ? `${data.METER_TEGANGAN} V` : '—'} / {data.METER_ARUS ? `${data.METER_ARUS} A` : '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Konstanta / Faktor Kali</span>
                <span className="text-xs font-medium text-slate-700">
                  {data.METER_KONSTANTA || '—'} / {data.METER_FAKTOR_KALI || '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Col 2: Stand & Pembatas */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-500 border-b border-slate-200/40 pb-1 text-[10px] uppercase">B. Stand & Pembatas</h4>
            <div className="space-y-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Stand LWBP / WBP</span>
                <span className="text-xs font-mono font-medium text-slate-700">
                  {data.METER_STAND_LWBP || '—'} / {data.METER_STAND_WBP || '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Letak APP / Trafo CT</span>
                <span className="text-xs font-medium text-slate-700">
                  {data.LETAK_APP || '—'} {data.METER_TRAFO ? `/ CT: ${data.METER_TRAFO}` : ''}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">MCB (Merk / Tahun)</span>
                <span className="text-xs font-medium text-slate-700">
                  {data.MCB_MERK || '—'} {data.MCB_TAHUN ? `/ ${data.MCB_TAHUN}` : ''}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">MCB Ampere</span>
                <span className="text-xs font-mono font-bold text-slate-700">
                  {data.MCB_AMPERE ? `${data.MCB_AMPERE} A` : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Col 3: Saluran & Pengukuran */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-500 border-b border-slate-200/40 pb-1 text-[10px] uppercase">C. Saluran & Pengukuran</h4>
            <div className="space-y-2">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SLTR (Letak / Jenis / Pjg)</span>
                <span className="text-xs font-medium text-slate-700">
                  {data.LETAK_SLTR || '—'} / {data.JENIS_SLTR || '—'} {data.PANJANG_SLTR ? `/ ${data.PANJANG_SLTR}m` : ''}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fasa / Tegangan Nominal</span>
                <span className="text-xs font-medium text-slate-700">
                  {data.FASA_TERSAMBUNG || '—'} / {data.TEGANGAN_NOMINAL ? `${data.TEGANGAN_NOMINAL} V` : '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Segel OK / Pengambilan</span>
                <span className="text-xs font-medium text-slate-700">
                  {data.SEGEL_OK || '—'} / {data.PENGAMBILAN_DARI || '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pengukuran / Trafo PLN</span>
                <span className="text-xs font-medium text-slate-700">
                  {data.PENGUKURAN || '—'} {data.TRAFO_PLN ? `/ Trafo: ${data.TRAFO_PLN}` : ''}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Grid for Kesimpulan & Dokumentasi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Section 4: Kesimpulan & Tindak Lanjut */}
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 text-slate-800 font-bold text-xs uppercase tracking-wider">
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span>Hasil Evaluasi & Kesimpulan</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Kesimpulan SPI</span>
              <KesimpulanBadge value={data.KESIMPULAN_SPI} />
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Status Survey</span>
              <SurveyStatusBadge value={data.STATUS_SURVEY} />
            </div>
            <div className="col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Peruntukan On-Site</span>
              <span className="text-xs font-medium text-slate-700">{data.PERUNTUKAN_ON_SITE || '—'}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pemakaian (kWh)</span>
              <span className="text-xs font-mono font-semibold text-slate-800">{data.PEMAKAIAN || '—'} kWh</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Jam Nyala</span>
              <span className="text-xs font-mono font-semibold text-slate-800">{data.JAM_NYALA || '—'}</span>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tindak Lanjut</span>
              <p className="text-xs text-slate-600 font-medium bg-white p-2 rounded border border-slate-200 mt-1">
                {data.TINDAKLANJUT || '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Section 5: Lampiran Dokumentasi */}
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200/60 text-slate-800 font-bold text-xs uppercase tracking-wider">
            <Camera size={14} className="text-rose-600" />
            <span>Lampiran Foto Lapangan</span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Foto Rumah / Lokasi</p>
              {data.FOTO_RUMAH ? (
                (() => {
                  const urls = data.FOTO_RUMAH.split(',').filter(Boolean);
                  return (
                    <div className={`grid ${urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
                      {urls.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer" className="block relative group rounded-lg overflow-hidden border border-slate-200">
                          <img src={url} alt={`Foto Rumah ${i + 1}`} className="w-full h-24 object-cover group-hover:opacity-90 transition-opacity" />
                          <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-[9px] font-semibold bg-slate-950/60 px-2 py-0.5 rounded-full">Perbesar</span>
                          </div>
                          {urls.length > 1 && (
                            <span className="absolute bottom-1 left-1 bg-slate-900/60 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                              #{i + 1}
                            </span>
                          )}
                        </a>
                      ))}
                    </div>
                  );
                })()
              ) : (
                <div className="w-full h-24 bg-slate-100 rounded-lg flex flex-col items-center justify-center border border-dashed border-slate-200 text-slate-400">
                  <Camera size={18} className="mb-1" />
                  <span className="text-[10px] font-medium">Tidak ada foto</span>
                </div>
              )}
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Foto Dokumentasi Lapangan</p>
              {data.DOKUMENTASI ? (
                (() => {
                  const urls = data.DOKUMENTASI.split(',').filter(Boolean);
                  return (
                    <div className={`grid ${urls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
                      {urls.map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer" className="block relative group rounded-lg overflow-hidden border border-slate-200">
                          <img src={url} alt={`Dokumentasi ${i + 1}`} className="w-full h-24 object-cover group-hover:opacity-90 transition-opacity" />
                          <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-[9px] font-semibold bg-slate-950/60 px-2 py-0.5 rounded-full">Perbesar</span>
                          </div>
                          {urls.length > 1 && (
                            <span className="absolute bottom-1 left-1 bg-slate-900/60 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                              #{i + 1}
                            </span>
                          )}
                        </a>
                      ))}
                    </div>
                  );
                })()
              ) : (
                <div className="w-full h-24 bg-slate-100 rounded-lg flex flex-col items-center justify-center border border-dashed border-slate-200 text-slate-400">
                  <Camera size={18} className="mb-1" />
                  <span className="text-[10px] font-medium">Tidak ada foto</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Section 6: Inventarisasi Peralatan Listrik */}
      <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase tracking-wider">
            <Zap size={14} className="text-amber-500 animate-pulse" />
            <span>Hasil Inventarisasi Peralatan Listrik</span>
          </div>
          <div className="flex gap-2">
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 font-mono">
              RT: {totalRT.toLocaleString('id')} W
            </span>
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 font-mono">
              PL: {totalPL.toLocaleString('id')} W
            </span>
          </div>
        </div>

        {/* RT vs PL lists side-by-side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* RT Card */}
          <div className="bg-white p-3 rounded-lg border border-slate-200/80">
            <h4 className="font-bold text-slate-700 text-xs mb-2 uppercase tracking-wide flex items-center justify-between">
              <span>Rumah Tangga (RT)</span>
              <span className="text-[10px] text-slate-400 lowercase font-normal">({appliancesRT.length} item)</span>
            </h4>
            {appliancesRT.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">Tidak ada data inventarisasi RT</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                      <th className="pb-1.5 font-bold uppercase">Nama Alat</th>
                      <th className="pb-1.5 text-center font-bold uppercase w-12">Jml</th>
                      <th className="pb-1.5 text-right font-bold uppercase w-16">Watt</th>
                      <th className="pb-1.5 text-right font-bold uppercase w-20">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appliancesRT.map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                        <td className="py-1.5 font-medium text-slate-600">{item.name || '—'}</td>
                        <td className="py-1.5 text-center font-mono text-slate-500">{item.qty || 0}</td>
                        <td className="py-1.5 text-right font-mono text-slate-500">{Number(item.watt || 0).toLocaleString('id')} W</td>
                        <td className="py-1.5 text-right font-mono font-semibold text-slate-700">
                          {((Number(item.qty) || 0) * (Number(item.watt) || 0)).toLocaleString('id')} W
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* PL Card */}
          <div className="bg-white p-3 rounded-lg border border-slate-200/80">
            <h4 className="font-bold text-slate-700 text-xs mb-2 uppercase tracking-wide flex items-center justify-between">
              <span>Peruntukan Lain (PL)</span>
              <span className="text-[10px] text-slate-400 lowercase font-normal">({appliancesPL.length} item)</span>
            </h4>
            {appliancesPL.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-4 text-center">Tidak ada data inventarisasi PL</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                      <th className="pb-1.5 font-bold uppercase">Nama Alat</th>
                      <th className="pb-1.5 text-center font-bold uppercase w-12">Jml</th>
                      <th className="pb-1.5 text-right font-bold uppercase w-16">Watt</th>
                      <th className="pb-1.5 text-right font-bold uppercase w-20">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appliancesPL.map((item, idx) => (
                      <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                        <td className="py-1.5 font-medium text-slate-600">{item.name || '—'}</td>
                        <td className="py-1.5 text-center font-mono text-slate-500">{item.qty || 0}</td>
                        <td className="py-1.5 text-right font-mono text-slate-500">{Number(item.watt || 0).toLocaleString('id')} W</td>
                        <td className="py-1.5 text-right font-mono font-semibold text-slate-700">
                          {((Number(item.qty) || 0) * (Number(item.watt) || 0)).toLocaleString('id')} W
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
      
    </div>
  );
}
