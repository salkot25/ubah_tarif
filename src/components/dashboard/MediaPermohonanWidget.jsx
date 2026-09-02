import React from 'react';
import { Card } from '../ui/Card';
import { 
  Share2, Award, Building2, PhoneCall, Globe, Smartphone, 
  HelpCircle, TrendingUp, CheckCircle, PieChart as PieIcon 
} from 'lucide-react';

const MEDIA_ICONS = {
  'Loket Pelayanan': Building2,
  'Loket': Building2,
  'CC123': PhoneCall,
  'Call Center 123': PhoneCall,
  'Web PLN': Globe,
  'PLN Mobile': Smartphone,
};

const MEDIA_COLORS = [
  'from-blue-600 to-indigo-600',
  'from-indigo-600 to-violet-600',
  'from-teal-500 to-emerald-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600'
];

export function MediaPermohonanWidget({ mediaData = [] }) {
  const total = mediaData.reduce((sum, item) => sum + (item.value || 0), 0);
  
  // Find top media channel
  const sortedMedia = [...mediaData].sort((a, b) => b.value - a.value);
  const topChannel = sortedMedia.length > 0 ? sortedMedia[0] : null;
  const topPercentage = topChannel && total > 0 
    ? Math.round((topChannel.value / total) * 100)
    : 0;

  // Digital vs Offline channels counter
  const digitalCount = mediaData
    .filter(m => ['CC123', 'Web PLN', 'PLN Mobile', 'Call Center 123'].includes(m.name))
    .reduce((sum, item) => sum + item.value, 0);
  const digitalPct = total > 0 ? Math.round((digitalCount / total) * 100) : 0;

  return (
    <Card className="p-5 sm:p-6 border border-slate-200/90 dark:border-slate-700/80 shadow-sm transition-colors flex flex-col justify-between h-full space-y-5">
      
      {/* Header */}
      <div className="pb-4 border-b border-slate-100 dark:border-slate-700/80 space-y-2.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0">
              <Share2 size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">
                Saluran Media Permohonan
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Kanal pendaftaran pengajuan permohonan pelanggan
              </p>
            </div>
          </div>
        </div>

        {topChannel && (
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-800/80 shadow-2xs">
            <Award size={14} className="text-amber-500 shrink-0" />
            <span>Kanal Terbanyak: <strong className="text-indigo-900 dark:text-indigo-200">{topChannel.name}</strong> ({topPercentage}%)</span>
          </div>
        )}
      </div>

      {/* Media Channel List with Progress Bars */}
      <div className="space-y-4 flex-1">
        {mediaData.length > 0 ? (
          <div className="space-y-3.5">
            {mediaData.map((item, idx) => {
              const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
              const IconComp = MEDIA_ICONS[item.name] || Share2;
              const colorGradient = MEDIA_COLORS[idx % MEDIA_COLORS.length];

              return (
                <div key={item.name || idx} className="p-3 rounded-2xl bg-slate-50/70 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-700/60 space-y-2 hover:border-slate-200 dark:hover:border-slate-600 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 shadow-2xs">
                        <IconComp size={14} />
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                        {item.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                        {item.value} <span className="text-[10px] font-normal text-slate-400">Pengajuan</span>
                      </span>
                      <span className="bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-indigo-200/60 dark:border-indigo-800/60">
                        {pct}%
                      </span>
                    </div>
                  </div>

                  {/* Gradient Progress Bar */}
                  <div className="w-full bg-slate-200/80 dark:bg-slate-700/70 h-2 rounded-full overflow-hidden p-0.5">
                    <div
                      className={`bg-gradient-to-r ${colorGradient} h-full rounded-full transition-all duration-700 shadow-2xs`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs font-medium italic">
            Belum ada data saluran media permohonan
          </div>
        )}
      </div>

      {/* Summary KPI Cards Footer */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700/60 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Registrasi</span>
          <span className="text-base font-extrabold text-slate-800 dark:text-slate-100 mt-1">{total} <span className="text-[10px] font-normal text-slate-400">Berkas</span></span>
        </div>

        <div className="bg-indigo-50/60 dark:bg-indigo-950/40 p-2.5 rounded-xl border border-indigo-100/60 dark:border-indigo-900/40 flex flex-col justify-between">
          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Kanal Digital</span>
          <span className="text-base font-extrabold text-indigo-700 dark:text-indigo-300 mt-1">{digitalPct}% <span className="text-[10px] font-normal text-indigo-500 dark:text-indigo-400">({digitalCount} Pendaftaran)</span></span>
        </div>
      </div>

    </Card>
  );
}
