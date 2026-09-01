import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { DisplayPage } from './pages/display/DisplayPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { ProtectedRoute } from './components/admin/ProtectedRoute';
import { DashboardOverviewPage } from './pages/admin/DashboardOverviewPage';
import { MosqueProfilePage } from './pages/admin/MosqueProfilePage';
import { PrayerSchedulePage } from './pages/admin/PrayerSchedulePage';
import { IqamahSettingsPage } from './pages/admin/IqamahSettingsPage';
import { AudioSettingsPage } from './pages/admin/AudioSettingsPage';
import { ContentMediaPage } from './pages/admin/ContentMediaPage';
import { DonationPage } from './pages/admin/DonationPage';
import { RunningTextPage } from './pages/admin/RunningTextPage';
import { AgendaEventsPage } from './pages/admin/AgendaEventsPage';
import { DesignThemePage } from './pages/admin/DesignThemePage';
import { SyuruqSettingsPage } from './pages/admin/SyuruqSettingsPage';
import { AccountSettingsPage } from './pages/admin/AccountSettingsPage';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* Main TV Display Route */}
          <Route path="/" element={<DisplayPage />} />
          <Route path="/display" element={<DisplayPage />} />

          {/* Admin Login */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Protected Admin Dashboard Routes */}
          <Route path="/admin" element={<ProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardOverviewPage />} />
              <Route path="profil-masjid" element={<MosqueProfilePage />} />
              <Route path="jadwal-sholat" element={<PrayerSchedulePage />} />
              <Route path="iqamah" element={<IqamahSettingsPage />} />
              <Route path="syuruq" element={<SyuruqSettingsPage />} />
              <Route path="audio" element={<AudioSettingsPage />} />
              <Route path="konten" element={<ContentMediaPage />} />
              <Route path="donasi" element={<DonationPage />} />
              <Route path="running-text" element={<RunningTextPage />} />
              <Route path="agenda" element={<AgendaEventsPage />} />
              <Route path="desain" element={<DesignThemePage />} />
              <Route path="akun" element={<AccountSettingsPage />} />
            </Route>
          </Route>

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/display" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  </React.StrictMode>
);
