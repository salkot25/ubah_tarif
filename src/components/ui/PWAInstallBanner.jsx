import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Sparkles, X, Smartphone, CheckCircle } from 'lucide-react';

export function PWAInstallBanner() {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || !isInstallable || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white px-4 py-2.5 shadow-lg border-b border-blue-700/50 flex items-center justify-between gap-3 text-xs z-40 transition-all animate-fadeIn">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-300 flex items-center justify-center shrink-0">
          <Smartphone size={18} />
        </div>
        <div className="min-w-0">
          <p className="font-bold truncate flex items-center gap-1.5">
            <span>Install Aplikasi Survey PLN (PWA)</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.25 rounded font-extrabold hidden sm:inline">
              Enterprise PWA
            </span>
          </p>
          <p className="text-[11px] text-blue-200/80 truncate">
            Akses langsung dari Layar Utama HP / Desktop tanpa browser & bekerja 100% Offline.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={promptInstall}
          className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 active:scale-95 border border-blue-400/30"
        >
          <Download size={14} />
          <span>Install PWA</span>
        </button>

        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Tutup Banner"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
