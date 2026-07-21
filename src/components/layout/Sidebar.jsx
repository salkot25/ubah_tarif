import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, ClipboardList, Map, Zap,
  ChevronLeft, ChevronRight, FileText, LogOut, RefreshCw
} from 'lucide-react';
import { APP_NAME } from '../../config/constants';
import { useAuth } from '../../context/AuthContext';

const navGroups = [
  {
    title: 'MENU UTAMA',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
    ]
  },
  {
    title: 'MANAJEMEN DATA',
    items: [
      { to: '/permohonan', icon: FileText, label: 'Permohonan Tarif' },
      { to: '/survey', icon: ClipboardList, label: 'Survey Lokasi' },
      { to: '/peta', icon: Map, label: 'Peta Lokasi' },
    ]
  },
  {
    title: 'SISTEM & UTILITY',
    items: [
      { to: '/sinkronisasi', icon: RefreshCw, label: 'Sinkronisasi Data' },
    ]
  }
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();

  const getInitials = (name) => {
    if (!name) return 'PLN';
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <aside
      className={`
        hidden md:flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-16' : 'w-64'}
        relative flex-shrink-0 shadow-sm
      `}
    >
      {/* Logo & Header Toggle */}
      <div className={`px-4 py-5 border-b border-slate-100 dark:border-slate-800 flex ${collapsed ? 'flex-col gap-4 items-center justify-center' : 'items-center justify-between'}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Zap size={18} className="text-white" />
          </div>
          {!collapsed && (
            <div className="animate-fade-in overflow-hidden">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">{APP_NAME}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">Survey Lokasi PLN</p>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus:outline-none"
          title={collapsed ? 'Perluas sidebar' : 'Perkecil sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Nav Groups */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-4">
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx} className="space-y-1">
            {!collapsed ? (
              <p className="px-3 pt-2 pb-1 text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-wider">
                {group.title}
              </p>
            ) : groupIdx > 0 ? (
              <hr className="my-2 border-slate-100 dark:border-slate-800" />
            ) : null}

            {group.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `${isActive ? 'nav-item-active' : 'nav-item-inactive'} ${collapsed ? 'justify-center px-2' : ''}`
                }
                title={collapsed ? item.label : undefined}
              >
                <item.icon size={18} className="flex-shrink-0" />
                {!collapsed && (
                  <span className="animate-fade-in text-sm">{item.label}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User Profile Footer */}
      {user && (
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <div 
                className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-xs font-bold shadow-sm select-none"
                title={`${user.nama || user.username} (${user.role})`}
              >
                {getInitials(user.nama || user.username)}
              </div>
              <button
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-red-500/20"
                title="Keluar dari Aplikasi"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-xs font-bold shadow-sm flex-shrink-0 select-none">
                  {getInitials(user.nama || user.username)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate leading-tight">
                    {user.nama || user.username}
                  </p>
                  <p className="text-[10px] font-semibold text-blue-700 dark:text-blue-400 leading-tight mt-0.5 uppercase tracking-wider">
                    {user.role}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-red-500/20 flex-shrink-0"
                title="Keluar dari Aplikasi"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
