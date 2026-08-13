import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { AdminAuthProvider } from './auth/AdminAuthProvider.jsx';
import AdminRouteGate from './auth/AdminRouteGate.jsx';
import AdminShell from './components/AdminShell.jsx';
import { AdminPageActionsProvider } from './context/AdminPageActionsContext.jsx';
import { AdminThemeProvider } from './context/AdminThemeProvider.jsx';
import { AdminToastProvider } from './context/AdminToastProvider.jsx';
import { AdminWorkspaceProvider } from './context/AdminWorkspaceProvider.jsx';
import AdminCollectionPage from './pages/AdminCollectionPage.jsx';
import AdminEditorPage from './pages/AdminEditorPage.jsx';
import AdminLandingPage from './pages/AdminLandingPage.jsx';
import AdminMediaLibraryPage from './pages/AdminMediaLibraryPage.jsx';
import AdminMusicCollectionEditorPage from './pages/AdminMusicCollectionEditorPage.jsx';
import AdminMusicPage from './pages/AdminMusicPage.jsx';
import AdminOverviewPage from './pages/AdminOverviewPage.jsx';
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

function AdminProviders({ children }) {
  return (
    <AdminAuthProvider>
      <AdminThemeProvider>
        <AdminToastProvider>
          <AdminWorkspaceProvider>
            <AdminPageActionsProvider>{children}</AdminPageActionsProvider>
          </AdminWorkspaceProvider>
        </AdminToastProvider>
      </AdminThemeProvider>
    </AdminAuthProvider>
  );
}

export default function AdminApp() {
  return (
    <AdminProviders>
      <Routes>
        <Route path="sign-in" element={<AdminSignInPage />} />
        <Route path="unauthorized" element={<AdminUnauthorizedPage />} />

        <Route element={<ProtectedAdminShell />}>
          <Route index element={<AdminOverviewPage />} />
          <Route path="blogs" element={<AdminCollectionPage moduleKey="blogs" />} />
          <Route path="blogs/new" element={<AdminEditorPage moduleKey="blogs" mode="create" />} />
          <Route path="blogs/:id" element={<AdminEditorPage moduleKey="blogs" />} />

          <Route path="projects" element={<AdminCollectionPage moduleKey="projects" />} />
          <Route path="projects/new" element={<AdminEditorPage moduleKey="projects" mode="create" />} />
          <Route path="projects/:id" element={<AdminEditorPage moduleKey="projects" />} />

          <Route path="photos" element={<AdminCollectionPage moduleKey="photos" />} />
          <Route path="photos/new" element={<AdminEditorPage moduleKey="photos" mode="create" />} />
          <Route path="photos/:id" element={<AdminEditorPage moduleKey="photos" />} />

          <Route path="testimonials" element={<AdminCollectionPage moduleKey="testimonials" />} />
          <Route path="testimonials/new" element={<AdminEditorPage moduleKey="testimonials" mode="create" />} />
          <Route path="testimonials/:id" element={<AdminEditorPage moduleKey="testimonials" />} />

          <Route path="journey" element={<AdminCollectionPage moduleKey="journey" />} />
          <Route path="journey/new" element={<AdminEditorPage moduleKey="journey" mode="create" />} />
          <Route path="journey/:id" element={<AdminEditorPage moduleKey="journey" />} />

          <Route path="movies" element={<AdminCollectionPage moduleKey="movies" />} />
          <Route path="movies/new" element={<AdminEditorPage moduleKey="movies" mode="create" />} />
          <Route path="movies/:id" element={<AdminEditorPage moduleKey="movies" />} />

          <Route path="tv" element={<AdminCollectionPage moduleKey="tv" />} />
          <Route path="tv/new" element={<AdminEditorPage moduleKey="tv" mode="create" />} />
          <Route path="tv/:id" element={<AdminEditorPage moduleKey="tv" />} />

          <Route path="music" element={<AdminMusicPage />} />
          <Route path="music/new" element={<AdminEditorPage moduleKey="music" mode="create" />} />
          <Route path="music/collections/new" element={<AdminMusicCollectionEditorPage mode="create" />} />
          <Route path="music/collections/:id" element={<AdminMusicCollectionEditorPage />} />
          <Route path="music/:id" element={<AdminEditorPage moduleKey="music" />} />

          <Route path="media" element={<AdminMediaLibraryPage />} />
          <Route path="media/:id" element={<AdminEditorPage moduleKey="media" />} />

          <Route path="landing" element={<AdminLandingPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>
      </Routes>
    </AdminProviders>
  );
}
