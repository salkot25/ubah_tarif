import React from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';
import { OfflineBanner } from '../ui/OfflineBanner';
import { PWAInstallBanner } from '../ui/PWAInstallBanner';

export function PageWrapper({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <PWAInstallBanner />
        <Navbar />
        <OfflineBanner />
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 pb-24 md:pb-6 bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
          <div className="max-w-7xl mx-auto animate-in">
            {children}
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
