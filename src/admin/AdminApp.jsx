import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { AdminAuthProvider } from './auth/AdminAuthProvider.jsx';
import AdminRouteGate from './auth/AdminRouteGate.jsx';
import AdminShell from './components/AdminShell.jsx';
import AdminOverviewPage from './pages/AdminOverviewPage.jsx';
import AdminModulePage from './pages/AdminModulePage.jsx';
import AdminSignInPage from './pages/AdminSignInPage.jsx';
import AdminSettingsPage from './pages/AdminSettingsPage.jsx';
import AdminUnauthorizedPage from './pages/AdminUnauthorizedPage.jsx';
import './admin.css';

function ProtectedAdminShell() {
  return (
    <AdminRouteGate>
      <AdminShell />
    </AdminRouteGate>
  );
}

export default function AdminApp() {
  return (
    <AdminAuthProvider>
      <Routes>
        <Route path="sign-in" element={<AdminSignInPage />} />
        <Route path="unauthorized" element={<AdminUnauthorizedPage />} />

        <Route element={<ProtectedAdminShell />}>
          <Route index element={<AdminOverviewPage />} />
          <Route path="blogs" element={<AdminModulePage moduleKey="blogs" />} />
          <Route path="blogs/new" element={<AdminModulePage moduleKey="blogNew" />} />
          <Route path="blogs/:id" element={<AdminModulePage moduleKey="blogEdit" />} />
          <Route path="projects" element={<AdminModulePage moduleKey="projects" />} />
          <Route path="projects/new" element={<AdminModulePage moduleKey="projectNew" />} />
          <Route path="projects/:id" element={<AdminModulePage moduleKey="projectEdit" />} />
          <Route path="photos" element={<AdminModulePage moduleKey="photos" />} />
          <Route path="testimonials" element={<AdminModulePage moduleKey="testimonials" />} />
          <Route path="journey" element={<AdminModulePage moduleKey="journey" />} />
          <Route path="landing" element={<AdminModulePage moduleKey="landing" />} />
          <Route path="movies" element={<AdminModulePage moduleKey="movies" />} />
          <Route path="tv" element={<AdminModulePage moduleKey="tv" />} />
          <Route path="music" element={<AdminModulePage moduleKey="music" />} />
          <Route path="media" element={<AdminModulePage moduleKey="media" />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>
      </Routes>
    </AdminAuthProvider>
  );
}
