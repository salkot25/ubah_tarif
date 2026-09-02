import React, { useEffect, useState } from 'react';
import { usePermohonanData } from '../hooks/usePermohonanData';
import { getSurveys } from '../services/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { PageLoader } from '../components/ui/Spinner';
import { CalendarPermohonanSurvey } from '../components/dashboard/CalendarPermohonanSurvey';
import { MediaPermohonanWidget } from '../components/dashboard/MediaPermohonanWidget';
import { 
  ClipboardList, CheckCircle2, AlertTriangle, Clock, 
  FileText, Activity, Layers, ArrowUpRight, ShieldCheck, Zap,
  TrendingUp, Sparkles, ChevronRight, FileCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { permohonans, stats, loading, fetchStats, fetchPermohonans } = usePermohonanData();
  const [surveysList, setSurveysList] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchPermohonans({ limit: 100, sortBy: 'IDPEL', sortOrder: 'DESC' });
    
    getSurveys({ limit: 100 }).then(res => {
      if (res?.status === 'success') {
        setSurveysList(res.data || []);
      }
    }).catch(console.error);
  }, [fetchStats, fetchPermohonans]);

  const pStats = stats?.permohonan || { total: 0, selesai: 0, draft: 0, belum: 0 };
  const sStats = stats?.survey || { total: 0, selesai: 0, draft: 0, belum: 0 };
  const dist = stats?.distributions || {};

  const pctPermohonanSelesai = pStats.total ? Math.round((pStats.selesai / pStats.total) * 100) : 0;
  const pctSurveySelesai = sStats.total ? Math.round((sStats.selesai / sStats.total) * 100) : 0;

  // Prepare chart datasets
  const peruntukanData = dist.peruntukan
    ? Object.entries(dist.peruntukan).map(([name, value]) => ({ name, value }))
    : [];

  const mediaData = dist.media
    ? Object.entries(dist.media).map(([name, value]) => ({ name, value }))
    : [];

  const spiData = dist.kesimpulanSpi
    ? Object.entries(dist.kesimpulanSpi).map(([name, value]) => ({ name, value }))
    : [];

  const tarifBaruData = dist.tarifBaru
    ? Object.entries(dist.tarifBaru).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
    : [];

  return (
    <div className="space-y-6">
      
      {/* Executive Hero Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 rounded-3xl p-6 md:p-8 text-white shadow-xl border border-blue-900/40">
        {/* Background Ambient Glow Circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-semibold backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Sistem Executive Monitoring Realtime
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
              Monitoring Ubah Tarif & Survey Lokasi
            </h1>
            <p className="text-slate-300 text-xs md:text-sm leading-relaxed">
              Pusat kendali dan analisis data pengajuan permohonan perubahan tarif serta hasil verifikasi lapangan secara presisi.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <Link to="/permohonan" className="flex-1 md:flex-initial">
              <button className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 active:scale-95">
                <FileText size={16} /> Data Permohonan
              </button>
            </Link>
            <Link to="/survey" className="flex-1 md:flex-initial">
              <button className="w-full px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold rounded-xl transition-all backdrop-blur-md flex items-center justify-center gap-2 active:scale-95">
                <Activity size={16} /> Survey Lapangan
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Metrics Dashboard Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Administrasi Permohonan Group */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 flex items-center justify-center font-bold">
                <FileText size={16} />
              </div>
              <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Berkas Permohonan Ubah Tarif</h2>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-lg border border-blue-100 dark:border-blue-800">
              <span>{pctPermohonanSelesai}% Selesai</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-4 bg-gradient-to-br from-white dark:from-slate-800 to-blue-50/40 dark:to-blue-900/10 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider">Total</span>
                <Layers size={14} className="text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{pStats.total}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium">Pengajuan Berkas</p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-white dark:from-slate-800 to-emerald-50/40 dark:to-emerald-900/10 border border-emerald-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Selesai</span>
                <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{pStats.selesai}</p>
              <div className="w-full bg-emerald-100 dark:bg-emerald-900/40 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${pctPermohonanSelesai}%` }} />
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-white dark:from-slate-800 to-amber-50/40 dark:to-amber-900/10 border border-amber-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Draft</span>
                <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400" />
              </div>
              <p className="text-2xl font-black text-amber-700 dark:text-amber-400">{pStats.draft}</p>
              <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-1 font-medium">Perlu Melengkapi</p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-white dark:from-slate-800 to-slate-50 dark:to-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider">Belum</span>
                <Clock size={14} className="text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-2xl font-black text-slate-600 dark:text-slate-300">{pStats.belum}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium">Belum Diisi</p>
            </Card>
          </div>
        </div>

        {/* Verifikasi Survey Lapangan Group */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Activity size={16} />
              </div>
              <h2 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Verifikasi Survey Lapangan</h2>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-lg border border-emerald-100 dark:border-emerald-800">
              <span>{pctSurveySelesai}% Tuntas</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-4 bg-gradient-to-br from-white dark:from-slate-800 to-indigo-50/40 dark:to-indigo-900/10 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider">Target</span>
                <ClipboardList size={14} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{sStats.total}</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 font-medium">Antrean Survey</p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-white dark:from-slate-800 to-teal-50/40 dark:to-teal-900/10 border border-teal-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">Surveyed</span>
                <CheckCircle2 size={14} className="text-teal-600 dark:text-teal-400" />
              </div>
              <p className="text-2xl font-black text-teal-700 dark:text-teal-400">{sStats.selesai}</p>
              <div className="w-full bg-teal-100 dark:bg-teal-900/40 h-1.5 rounded-full mt-2 overflow-hidden">
                <div className="bg-teal-500 h-full rounded-full" style={{ width: `${pctSurveySelesai}%` }} />
              </div>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-white dark:from-slate-800 to-orange-50/40 dark:to-orange-900/10 border border-orange-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 dark:text-orange-400">Draft</span>
                <AlertTriangle size={14} className="text-orange-600 dark:text-orange-400" />
              </div>
              <p className="text-2xl font-black text-orange-700 dark:text-orange-400">{sStats.draft}</p>
              <p className="text-[10px] text-orange-600/80 dark:text-orange-400/80 mt-1 font-medium">Belum Lengkap</p>
            </Card>

            <Card className="p-4 bg-gradient-to-br from-white dark:from-slate-800 to-rose-50/40 dark:to-rose-900/10 border border-rose-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">Belum</span>
                <Clock size={14} className="text-rose-500 dark:text-rose-400" />
              </div>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{sStats.belum}</p>
              <p className="text-[10px] text-rose-500/80 dark:text-rose-400/80 mt-1 font-medium">Belum Didatangi</p>
            </Card>
          </div>
        </div>

      </div>

      {/* Executive Visualizations Section: Kalender Permohonan & Survey AND Saluran Media Permohonan Pelanggan */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left/Main Column: Kalender Permohonan & Survey */}
        <div className="xl:col-span-2">
          <CalendarPermohonanSurvey permohonans={permohonans} surveys={surveysList} />
        </div>

        {/* Right Column: Saluran Media Permohonan Pelanggan */}
        <div className="xl:col-span-1">
          <MediaPermohonanWidget mediaData={mediaData} />
        </div>

      </div>

      <Card className="p-5 sm:p-6 border border-slate-200/90 dark:border-slate-700/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Sparkles size={18} className="text-blue-600" />
              Daftar Permohonan Terbaru
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">6 pengajuan permohonan perubahan tarif terbaru dalam sistem</p>
          </div>
          <Link to="/permohonan" className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 px-3 py-1.5 rounded-xl border border-blue-200/60 dark:border-blue-800/60 transition-all self-start sm:self-auto">
            <span>Lihat Semua Permohonan</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="py-10"><PageLoader /></div>
        ) : permohonans.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <ClipboardList size={40} className="mx-auto mb-2 opacity-30" />
            <p className="text-xs font-medium">Belum ada data permohonan registered</p>
          </div>
        ) : (
          <div>
              {/* Section 3: Permohonan Terbaru Executive Table & Cards */}
              <div className="hidden md:block table-wrapper overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
              <table className="data-table text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800">
                    <th>IDPEL</th>
                    <th>Nama Pelanggan</th>
                    <th>Alamat</th>
                    <th>Tarif/Daya Lama</th>
                    <th>Tarif/Daya Baru</th>
                    <th>Media</th>
                    <th>Status Berkas</th>
                  </tr>
                </thead>
                <tbody>
                  {permohonans.map((row, i) => (
                    <tr key={row.IDPEL || i} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors">
                      <td className="font-mono font-bold text-blue-700 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20 px-2 py-1 rounded">{row.IDPEL}</td>
                      <td className="font-semibold text-slate-800 dark:text-slate-200">{row.NAMA}</td>
                      <td className="text-slate-500 dark:text-slate-400 max-w-[200px] truncate" title={row.ALAMAT}>{row.ALAMAT}</td>
                      <td className="font-medium text-slate-700 dark:text-slate-300">{row.TARIF} / {row.DAYA ? `${row.DAYA.toString().replace(' VA', '')} VA` : '—'}</td>
                      <td className="font-bold text-blue-700 dark:text-blue-400">{row.TARIF_BARU || '—'} / {row.DAYA_BARU ? `${row.DAYA_BARU.toString().replace(' VA', '')} VA` : '—'}</td>
                      <td className="text-slate-500 dark:text-slate-400 font-medium">{row.MEDIA_PERMOHONAN}</td>
                      <td>
                        {row.STATUS_PERMOHONAN === 'Selesai' ? (
                          <Badge variant="success" icon={CheckCircle2}>Selesai</Badge>
                        ) : (
                          <Badge variant="warning" icon={AlertTriangle}>Draft</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card Grid View */}
            <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {permohonans.map((row, i) => (
                <div key={row.IDPEL || i} className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40 space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-700/60">
                    <span className="font-mono text-xs font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded border border-blue-100 dark:border-blue-800">{row.IDPEL}</span>
                    {row.STATUS_PERMOHONAN === 'Selesai' ? (
                      <Badge variant="success" icon={CheckCircle2}>Selesai</Badge>
                    ) : (
                      <Badge variant="warning" icon={AlertTriangle}>Draft</Badge>
                    )}
                  </div>

                  <div>
                    <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200 truncate">{row.NAMA}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate" title={row.ALAMAT}>{row.ALAMAT}</p>
                  </div>

                  <div className="bg-white dark:bg-slate-900/60 p-2 rounded-xl border border-slate-200/80 dark:border-slate-700/60 grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase block">Tarif Lama</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{row.TARIF || '—'} ({row.DAYA ? `${row.DAYA.toString().replace(' VA', '')} VA` : '—'})</span>
                    </div>
                    <div className="border-l border-slate-200 dark:border-slate-700 pl-2">
                      <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase block">Tarif Baru</span>
                      <span className="font-bold text-blue-700 dark:text-blue-400">{row.TARIF_BARU || '—'} ({row.DAYA_BARU ? `${row.DAYA_BARU.toString().replace(' VA', '')} VA` : '—'})</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

    </div>
  );
}
