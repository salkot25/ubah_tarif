import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, CheckCircle2, CloudSync, Zap } from 'lucide-react';
import { offlineSyncService } from '../../services/offlineSyncService';
import { syncOfflineQueue } from '../../services/api';

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [queueCount, setQueueCount] = useState(() => offlineSyncService.getQueue().length);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      const count = offlineSyncService.getQueue().length;
      if (count > 0) {
        setSyncing(true);
        const res = await syncOfflineQueue();
        setSyncing(false);
        setSyncResult(res);
        setTimeout(() => setSyncResult(null), 5000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    const handleQueueChanged = (e) => {
      setQueueCount(e.detail?.count ?? offlineSyncService.getQueue().length);
    };

    const handleSyncStarted = () => setSyncing(true);
    const handleSyncCompleted = (e) => {
      setSyncing(false);
      setQueueCount(offlineSyncService.getQueue().length);
      setSyncResult(e.detail);
      setTimeout(() => setSyncResult(null), 5000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('offline-queue-changed', handleQueueChanged);
    window.addEventListener('sync-started', handleSyncStarted);
    window.addEventListener('sync-completed', handleSyncCompleted);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('offline-queue-changed', handleQueueChanged);
      window.removeEventListener('sync-started', handleSyncStarted);
      window.removeEventListener('sync-completed', handleSyncCompleted);
    };
  }, []);

  const handleManualSync = async () => {
    if (!isOnline || syncing) return;
    setSyncing(true);
    const res = await syncOfflineQueue();
    setSyncing(false);
    setSyncResult(res);
    setTimeout(() => setSyncResult(null), 5000);
  };

  if (isOnline && queueCount === 0 && !syncResult && !syncing) {
    return null;
  }

  return (
    <div className="sticky top-0 z-50 w-full animate-in slide-in-from-top duration-300">
      {!isOnline ? (
        <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2 max-w-xl truncate">
            <WifiOff size={16} className="animate-pulse flex-shrink-0" />
            <span>Mode Offline — Perubahan disimpan secara lokal ({queueCount} data antrean)</span>
          </div>
          <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded font-mono">Auto-Sync Saat Online</span>
        </div>
      ) : syncing ? (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <RefreshCw size={16} className="animate-spin flex-shrink-0" />
            <span>Menyingkronkan {queueCount} data antrean ke server...</span>
          </div>
        </div>
      ) : syncResult ? (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="flex-shrink-0" />
            <span>Sinkronisasi selesai! ({syncResult.synced} berhasil disinkronkan)</span>
          </div>
        </div>
      ) : queueCount > 0 ? (
        <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-amber-400 flex-shrink-0" />
            <span>Terdapat {queueCount} data lokal yang belum disinkronkan</span>
          </div>
          <button
            onClick={handleManualSync}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold transition-all shadow-sm flex items-center gap-1 active:scale-95"
          >
            <RefreshCw size={12} /> Sinkronkan Sekarang
          </button>
        </div>
      ) : null}
    </div>
  );
}
