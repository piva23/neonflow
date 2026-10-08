import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthGate } from './components/AuthGate';

// Context Providers
import { ThemeProvider } from './contexts/ThemeContext';
import { AppProvider } from './contexts/AppContext';
import { SessionProvider } from './contexts/SessionContext';
import { FamilyProvider } from './contexts/FamilyContext';
import { MemberProvider } from './contexts/MemberContext';
import { ProfileProvider } from './contexts/ProfileContext';
import { PlaylistProvider } from './contexts/PlaylistContext';
import { PlayerProvider as GlobalPlayerProvider } from './contexts/PlayerContext';
import { PWAProvider } from './contexts/PWAContext';
import { PWAInstallBanner } from './components/PWAInstallBanner';

// Layout and Pages
import { MainLayout } from './layouts/MainLayout';
import { Home } from './pages/Home';
import { Biblioteca } from './pages/Biblioteca';
import { Playlists } from './pages/Playlists';
import { Sessoes } from './pages/Sessoes';
import { Familia } from './pages/Familia';
import { Dashboard } from './pages/Dashboard';
import { Configuracoes } from './pages/Configuracoes';
import { Downloads } from './pages/Downloads';
import StorePage from './pages/StorePage';

export default function App() {
  return (
    <AuthGate>
      {(_user) => (
    <ThemeProvider>
      <AppProvider>
        <FamilyProvider>
          <SessionProvider>
            <MemberProvider>
              <ProfileProvider>
                <PlaylistProvider>
                  <GlobalPlayerProvider>
                    <PWAProvider>
                      <BrowserRouter>
                        
                        {/* React Hot Toast notification engine */}
                        <Toaster
                          position="top-right"
                          toastOptions={{
                            style: {
                              background: '#121420',
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              color: '#f8f9fa',
                              backdropFilter: 'blur(12px)',
                              fontSize: '13px',
                              borderRadius: '16px',
                              padding: '12px 18px',
                            },
                            success: {
                              iconTheme: {
                                primary: '#06d6a0',
                                secondary: '#121420',
                              },
                            },
                            error: {
                              iconTheme: {
                                primary: '#ef4444',
                                secondary: '#121420',
                              },
                            },
                          }}
                        />

                        {/* PWA Installation and Status Banner */}
                        <PWAInstallBanner />

                        {/* Routing Layout Framework */}
                        <Routes>
                          <Route path="/" element={<MainLayout />}>
                            <Route index element={<Home />} />
                            <Route path="biblioteca" element={<Biblioteca />} />
                            <Route path="playlists" element={<Playlists />} />
                            <Route path="sessoes" element={<Sessoes />} />
                            <Route path="familia" element={<Familia />} />
                            <Route path="dashboard" element={<Dashboard />} />
                            <Route path="downloads" element={<Downloads />} />
                            <Route path="configuracoes" element={<Configuracoes />} />
                            <Route path="loja" element={<StorePage />} />
                            
                            {/* Fallback routing */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                          </Route>
                        </Routes>

                      </BrowserRouter>
                    </PWAProvider>
                  </GlobalPlayerProvider>
                </PlaylistProvider>
              </ProfileProvider>
            </MemberProvider>
          </SessionProvider>
        </FamilyProvider>
      </AppProvider>
    </ThemeProvider>
      )}
    </AuthGate>
  );
}
