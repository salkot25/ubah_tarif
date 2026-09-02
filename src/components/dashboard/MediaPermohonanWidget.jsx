import React from 'react';
import { Card } from '../ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Clock, Radio, Share2, Layers, Award } from 'lucide-react';

export function MediaPermohonanWidget({ mediaData = [] }) {
  const total = mediaData.reduce((sum, item) => sum + (item.value || 0), 0);
  
  // Find top media channel
  const topChannel = mediaData.length > 0 
    ? [...mediaData].sort((a, b) => b.value - a.value)[0]
    : null;

  const topPercentage = topChannel && total > 0 
    ? Math.round((topChannel.value / total) * 100)
    : 0;

  return (
    <Card className="p-5 sm:p-6 border border-slate-200/90 dark:border-slate-700/80 shadow-sm space-y-5 transition-colors flex flex-col justify-between">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Share2 size={18} />
            </div>
            Saluran Media Permohonan Pelanggan
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Kanal pendaftaran pengajuan permohonan ubah tarif
          </p>
        </div>

        {topChannel && (
          <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-800 self-start sm:self-auto shrink-0">
            <Award size={14} className="text-amber-500" />
            <span>Terbanyak: {topChannel.name} ({topPercentage}%)</span>
          </div>
        )}
      </div>

      {/* Chart & Progress Bars Container */}
      <div className="space-y-4 flex-1">
        {mediaData.length > 0 ? (
          <>
            {/* Recharts Visual Bar Chart */}
            <div className="w-full h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mediaData} layout="vertical" barSize={20}>
                  <defs>
                    <linearGradient id="barGradientIndigoWidget" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={1} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.9} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} width={110} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '14px', border: '1px solid #334155', fontSize: '12px', background: '#1e293b', color: '#f1f5f9' }} />
                  <Bar dataKey="value" fill="url(#barGradientIndigoWidget)" radius={[0, 8, 8, 0]} name="Jumlah Permohonan" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Detailed Progress Bars */}
            <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              {mediaData.map((item, idx) => {
                const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                return (
                  <div key={item.name || idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span className="text-slate-700 dark:text-slate-200">{item.name}</span>
                      <span className="font-mono text-slate-500 dark:text-slate-400">
                        {item.value} Pengajuan <span className="text-blue-600 dark:text-blue-400 font-bold">({pct}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs font-medium italic">
            Belum ada data saluran media permohonan
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>Total Terakumulasi:</span>
        <span className="font-bold text-slate-800 dark:text-slate-200">{total} Permohonan</span>
      </div>

    </Card>
  );
}
