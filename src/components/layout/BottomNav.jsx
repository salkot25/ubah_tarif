import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, MapPin, FileText, Settings, RefreshCw } from 'lucide-react';

const navItems = [
  { to: '/',            icon: LayoutDashboard, label: 'Dashboard',    end: true },
  { to: '/permohonan',  icon: FileText,        label: 'Permohonan' },
  { to: '/survey',      icon: ClipboardList,   label: 'Survey' },
  { to: '/peta',        icon: MapPin,          label: 'Peta' },
  { to: '/sinkronisasi',icon: RefreshCw,       label: 'Sync' },
];

export function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-3 left-3 right-3 z-50 flex justify-center pointer-events-none">
      <div className="pointer-events-auto w-full max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-700/90 shadow-2xl rounded-2xl px-2 py-1.5 flex items-center justify-around ring-1 ring-slate-900/5 dark:ring-slate-100/5 transition-colors duration-200">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `
              relative flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-300 select-none group flex-1
              ${isActive 
                ? 'text-blue-700 dark:text-blue-400 font-bold scale-105' 
                : 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-900 dark:hover:text-slate-200'
              }
            `}
          >
            {({ isActive }) => (
              <>
                {/* Active Background Glow Pill */}
                {isActive && (
                  <span className="absolute inset-0 bg-gradient-to-br from-blue-50/90 dark:from-blue-950/60 to-indigo-50/80 dark:to-indigo-950/40 rounded-xl border border-blue-200/70 dark:border-blue-700/50 shadow-xs" />
                )}
                
                <div className="relative z-10 flex flex-col items-center">
                  <item.icon 
                    size={20} 
                    className={`transition-all duration-300 ${
                      isActive 
                        ? 'text-blue-700 dark:text-blue-400 stroke-[2.5px] -translate-y-0.5' 
                        : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300 stroke-[1.8px]'
                    }`} 
                  />
                  <span className={`text-[10px] tracking-tight mt-0.5 transition-all duration-200 ${
                    isActive ? 'text-blue-800 dark:text-blue-300 font-bold' : 'text-slate-500 dark:text-slate-400'
                  }`}>
                    {item.label}
                  </span>
                </div>

                {/* Active Indicator Dot */}
                {isActive && (
                  <span className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full bg-blue-600 shadow-sm shadow-blue-500/50" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
