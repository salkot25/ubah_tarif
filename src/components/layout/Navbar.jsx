import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Zap, LogOut, User as UserIcon, RefreshCw, Settings, Sun, Moon } from 'lucide-react';
import { APP_NAME } from '../../config/constants';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const pageTitles = {
  '/':            { title: 'Dashboard', subtitle: 'Ringkasan data survey lokasi' },
  '/permohonan':  { title: 'Permohonan Tarif', subtitle: 'Kelola pengajuan perubahan tarif' },
  '/survey':      { title: 'Survey Lokasi', subtitle: 'Kelola data survey lapangan (BA P2TL)' },
  '/peta':        { title: 'Peta Lokasi', subtitle: 'Sebaran titik survey' },
  '/sinkronisasi':{ title: 'Sinkronisasi Data', subtitle: 'Kelola penyimpanan offline & sinkronisasi server' },
  '/pengaturan':  { title: 'Pengaturan', subtitle: 'Konfigurasi pejabat penandatangan & ULP' },
};

export function Navbar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const pageInfo = pageTitles[location.pathname] || { title: 'SALKOT', subtitle: '' };

  const today = new Date().toLocaleDateString('id-ID', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  });

  const getInitials = (name) => {
    if (!name) return 'PLN';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  const handleRefreshClick = () => {
    window.dispatchEvent(new Event('app-refresh'));
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 md:px-6 flex items-center justify-between flex-shrink-0 shadow-sm relative z-30 transition-colors">
      {/* Mobile Branding & Desktop Title */}
      <div className="flex items-center gap-3">
        {/* Mobile Logo Branding */}
        <div className="md:hidden flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white shadow-sm flex-shrink-0">
            <Zap size={16} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-none">{APP_NAME}</h1>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold leading-tight mt-0.5">{pageInfo.title}</p>
          </div>
        </div>

        {/* Desktop Header Titles */}
        <div className="hidden md:block">
          <h1 className="text-base font-semibold text-slate-800 dark:text-slate-100 leading-tight">{pageInfo.title}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight">{pageInfo.subtitle}</p>
        </div>
      </div>

      {/* Right Action Controls */}
      <div className="flex items-center gap-2.5">
        <span className="hidden sm:inline-block text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 px-3 py-1.5 rounded-lg font-medium">
          {today}
        </span>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-600 dark:text-amber-400 flex items-center justify-center transition-all shadow-sm border border-slate-200/80 dark:border-slate-700"
          title={theme === 'dark' ? 'Beralih ke Mode Terang' : 'Beralih ke Mode Gelap'}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Mobile Refresh Button */}
        <button
          onClick={handleRefreshClick}
          className="md:hidden w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all shadow-sm border border-slate-200/80 dark:border-slate-700"
          title="Refresh Data"
        >
          <RefreshCw size={15} />
        </button>

        {/* User Profile Button & Dropdown */}
        {user && (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white text-xs font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-transform active:scale-95"
              title="Menu User"
            >
              {getInitials(user.nama || user.username)}
            </button>

            {showUserMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-800 rounded-xl shadow-card-lg border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-slide-up transition-colors">
                  <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{user.nama || user.username}</p>
                    <p className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{user.role}</p>
                  </div>

                  <button
                    onClick={() => {
                      toggleTheme();
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      {theme === 'dark' ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-slate-500" />}
                      <span>Mode Tampilan</span>
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {theme === 'dark' ? 'Gelap' : 'Terang'}
                    </span>
                  </button>

                  <Link
                    to="/pengaturan"
                    onClick={() => setShowUserMenu(false)}
                    className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2 transition-colors"
                  >
                    <Settings size={15} className="text-slate-500 dark:text-slate-400" /> Pengaturan Aplikasi
                  </Link>

                  <hr className="my-1 border-slate-100 dark:border-slate-700" />

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2 transition-colors"
                  >
                    <LogOut size={15} /> Keluar Aplikasi
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
