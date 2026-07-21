import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PageWrapper } from './components/layout/PageWrapper';
import { ToastProvider } from './components/ui/Toast';
import { PageLoader } from './components/ui/Spinner';
import DashboardPage from './pages/DashboardPage';
import PermohonanListPage from './pages/PermohonanListPage';
import SurveyListPage from './pages/SurveyListPage';
import MapPage from './pages/MapPage';
import SyncPage from './pages/SyncPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';

import { ThemeProvider } from './context/ThemeContext';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <PageWrapper>{children}</PageWrapper>;
}

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center">
        <PageLoader />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/permohonan" element={<ProtectedRoute><PermohonanListPage /></ProtectedRoute>} />
      <Route path="/survey" element={<ProtectedRoute><SurveyListPage /></ProtectedRoute>} />
      <Route path="/peta" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
      <Route path="/sinkronisasi" element={<ProtectedRoute><SyncPage /></ProtectedRoute>} />
      <Route path="/pengaturan" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL && import.meta.env.BASE_URL !== './' ? import.meta.env.BASE_URL : ''}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
