import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';
import { offlineSyncService } from '../services/offlineSyncService';
import { syncOfflineQueue, getPermohonans, getSurveys, getStats } from '../services/api';
import { 
  Wifi, WifiOff, Database, Clock, RefreshCw, Download, Upload, 
  Trash2, CheckCircle2, AlertCircle, HardDrive, ShieldCheck, FileText, ClipboardList
} from 'lucide-react';

export default function SyncPage() {
  const toast = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queue, setQueue] = useState(() => offlineSyncService.getQueue());
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(() => localStorage.getItem('SALKOT_LAST_SYNC') || 'Belum pernah');
  const [activeMessage, setActiveMessage] = useState('Sistem siap. Tidak ada proses sinkronisasi aktif di latar belakang.');

  // Cache stats
  const [cacheCounts, setCacheCounts] = useState({ permohonan: 0, survey: 0, stats: 0 });

  const calculateCache = () => {
    const pCache = offlineSyncService.getCache('permohonans_default');
    const sCache = offlineSyncService.getCache('surveys_default');
    const stCache = offlineSyncService.getCache('stats');

    setCacheCounts({
      permohonan: pCache?.data?.length || (Array.isArray(pCache) ? pCache.length : 0),
      survey: sCache?.data?.length || (Array.isArray(sCache) ? sCache.length : 0),
      stats: stCache ? 1 : 0
    });
  };

  useEffect(() => {
    calculateCache();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleQueueChanged = () => {
      setQueue(offlineSyncService.getQueue());
      calculateCache();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('offline-queue-changed', handleQueueChanged);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offline-queue-changed', handleQueueChanged);
    };
  }, []);

  const updateLastSync = () => {
    const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    setLastSyncTime(nowStr);
    localStorage.setItem('SALKOT_LAST_SYNC', nowStr);
  };

  // ─── HANDLERS ──────────────────────────────────────────────────────────────

  const handleFullSync = async () => {
    if (!isOnline) {
      toast.error('Tidak ada koneksi internet untuk melakukan sinkronisasi');
      return;
    }
    setSyncing(true);
    setActiveMessage('Memulai sinkronisasi dua arah (Unggah perubahan & Unduh data terbaru)...');
    
    try {
      // 1. Push local changes
      const syncRes = await syncOfflineQueue();
      
      // 2. Pull fresh server data
      setActiveMessage('Mengunduh pembaruan terbaru dari database server...');
      await Promise.all([
        getPermohonans({ page: 1, limit: 50 }),
        getSurveys({ page: 1, limit: 50 }),
        getStats()
      ]);

      updateLastSync();
      calculateCache();
      setQueue(offlineSyncService.getQueue());
      
      setActiveMessage('Sinkronisasi penuh berhasil dilakukan!');
      toast.success(`Sinkronisasi penuh selesai! (${syncRes.synced} terunggah)`);
    } catch (err) {
      toast.error('Gagal melakukan sinkronisasi penuh');
      setActiveMessage('Terjadi kesalahan saat sinkronisasi.');
    } finally {
      setSyncing(false);
    }
  };

  const handlePullOnly = async () => {
    if (!isOnline) {
      toast.error('Koneksi internet diperlukan untuk mengunduh data');
      return;
    }
    setSyncing(true);
    setActiveMessage('Mengunduh data terbaru dari server...');
    try {
      await Promise.all([
        getPermohonans({ page: 1, limit: 50 }),
        getSurveys({ page: 1, limit: 50 }),
        getStats()
      ]);
      updateLastSync();
      calculateCache();
      setActiveMessage('Pembaruan data dari server berhasil diunduh.');
      toast.success('Berhasil mengunduh pembaruan data!');
    } catch (err) {
      toast.error('Gagal mengunduh data server');
    } finally {
      setSyncing(false);
    }
  };

  const handlePushOnly = async () => {
    if (!isOnline) {
      toast.error('Koneksi internet diperlukan untuk mengunggah data');
      return;
    }
    if (queue.length === 0) {
      toast.info('Tidak ada antrean perubahan tertunda');
      return;
    }
    setSyncing(true);
    setActiveMessage('Mengunggah antrean perubahan lokal ke server...');
    try {
      const res = await syncOfflineQueue();
      setQueue(offlineSyncService.getQueue());
      calculateCache();
      setActiveMessage(`Pengunggahan selesai! (${res.synced} data berhasil).`);
      toast.success(`Berhasil mengunggah ${res.synced} baris data!`);
    } catch (err) {
      toast.error('Gagal mengunggah antrean data');
    } finally {
      setSyncing(false);
    }
  };

  const handleClearCache = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus seluruh cache lokal & antrean offline? Data yang belum tersinkronisasi akan hilang.')) {
      offlineSyncService.clearQueue();
      localStorage.removeItem('SALKOT_CACHE_permohonans_default');
      localStorage.removeItem('SALKOT_CACHE_surveys_default');
      localStorage.removeItem('SALKOT_CACHE_stats');
      setQueue([]);
      calculateCache();
      toast.success('Cache lokal & antrean berhasil dibersihkan');
    }
  };

  const handleRemoveQueueItem = (id) => {
    offlineSyncService.dequeue(id);
    setQueue(offlineSyncService.getQueue());
    toast.info('Item antrean dihapus');
  };

  return (
    <div className="space-y-6">
      {/* Top 3 Summary Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Network Status */}
        <Card className="p-5 flex items-center gap-4 shadow-xs">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${isOnline ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30' : 'bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30'}`}>
            {isOnline ? <Wifi size={24} /> : <WifiOff size={24} />}
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Koneksi Jaringan</span>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">
              {isOnline ? 'Terhubung (Online)' : 'Terputus (Offline)'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {isOnline ? 'Aplikasi siap sinkronisasi.' : 'Koneksi internet tidak tersedia.'}
            </p>
          </div>
        </Card>

        {/* Card 2: Pending Changes */}
        <Card className="p-5 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 flex items-center justify-center flex-shrink-0">
            <Database size={24} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Perubahan Tertunda</span>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">
              {queue.length} Baris Data
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {queue.length === 0 ? 'Semua data lokal sinkron.' : `${queue.length} transaksi menunggu upload.`}
            </p>
          </div>
        </Card>

        {/* Card 3: Last Sync Time */}
        <Card className="p-5 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center flex-shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Pembaruan Terakhir</span>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">
              {lastSyncTime}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Waktu terakhir data diunduh.
            </p>
          </div>
        </Card>
      </div>

      {/* Main Content Split (Control vs Queue Activity) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Kontrol Sinkronisasi */}
        <Card className="p-5 space-y-5 lg:col-span-1">
          <div>
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Kontrol Sinkronisasi</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Jalankan sinkronisasi dua arah untuk mengunggah perubahan lokal Anda dan mengunduh pembaruan terbaru dari database server.
            </p>
          </div>

          <div className="space-y-2.5">
            {/* Primary Full Sync Button */}
            <Button
              onClick={handleFullSync}
              disabled={!isOnline}
              loading={syncing}
              variant="success"
              className="w-full py-3 text-xs font-bold shadow-md rounded-xl"
              icon={RefreshCw}
            >
              <span>{syncing ? 'Sedang Menyinkronkan...' : 'Sinkronisasi Penuh'}</span>
            </Button>

            {/* Secondary Buttons Row */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handlePullOnly}
                disabled={syncing || !isOnline}
                variant="secondary"
                size="sm"
                className="w-full py-2.5 text-xs font-semibold"
                icon={Download}
              >
                Unduh (Pull)
              </Button>
              <Button
                onClick={handlePushOnly}
                disabled={syncing || !isOnline || queue.length === 0}
                variant="secondary"
                size="sm"
                className="w-full py-2.5 text-xs font-semibold"
                icon={Upload}
              >
                Unggah (Push)
              </Button>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-700" />

          {/* Cache Info Breakdown */}
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-2 font-medium">
                <FileText size={14} className="text-slate-400 dark:text-slate-500" /> Cache Permohonan
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{cacheCounts.permohonan} baris</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-2 font-medium">
                <ClipboardList size={14} className="text-slate-400 dark:text-slate-500" /> Cache Survey
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{cacheCounts.survey} baris</span>
            </div>
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span className="flex items-center gap-2 font-medium">
                <HardDrive size={14} className="text-slate-400 dark:text-slate-500" /> Cache Statistik
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{cacheCounts.stats} baris</span>
            </div>
          </div>

          {/* Clear Cache Danger Button */}
          <button
            onClick={handleClearCache}
            className="w-full py-2.5 px-3 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 mt-2"
          >
            <Trash2 size={14} /> Hapus Cache Lokal
          </button>
        </Card>

        {/* Right Column: Aktivitas & Status Sinkronisasi */}
        <Card className="p-5 space-y-5 lg:col-span-2">
          <div>
            <h2 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">Aktivitas & Status Sinkronisasi</h2>
          </div>

          {/* Status Alert Message Box */}
          <div className={`p-3.5 rounded-xl border flex items-center gap-3 text-xs font-medium ${syncing ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/40 text-blue-800 dark:text-blue-300' : 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-350'}`}>
            {syncing ? (
              <RefreshCw size={18} className="animate-spin text-blue-600 dark:text-blue-450 flex-shrink-0" />
            ) : (
              <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-450 flex-shrink-0" />
            )}
            <span>{activeMessage}</span>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Antrean Perubahan Tertunda</h3>

            {queue.length === 0 ? (
              <div className="text-center py-12 px-4 bg-slate-50/50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                <div className="w-12 h-12 rounded-full bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={24} />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Antrean Bersih</h4>
                <p className="text-xs text-slate-500 dark:text-slate-450 mt-1">Semua data lokal telah disinkronkan ke server utama.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[400px] overflow-y-auto pr-1">
                {queue.map((item) => {
                  const idpel = item.payload?.data?.IDPEL || item.payload?.IDPEL || item.payload?.idpel || 'N/A';
                  const actionLabel = 
                    item.actionType === 'savePermohonan' ? 'Simpan Permohonan' :
                    item.actionType === 'saveSurvey' ? 'Simpan Survey' : 'Hapus Data';

                  return (
                    <div key={item.id} className="p-3 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs shadow-2xs hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold flex-shrink-0">
                          <Database size={15} />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 dark:text-slate-200">{actionLabel}</span>
                            <span className="font-mono text-[10px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded border border-blue-100 dark:border-blue-800">{idpel}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                            {new Date(item.timestamp).toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handleRemoveQueueItem(item.id)}
                        className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-450 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                        title="Batalkan antrean ini"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

      </div>
    </div>
  );
}
