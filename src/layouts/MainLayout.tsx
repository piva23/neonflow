import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  Home,
  Music,
  ListMusic,
  Users,
  Radio,
  LayoutDashboard,
  Settings,
  Menu,
  X,
  Flame,
  Search,
  Bell,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  Download,
  CreditCard,
  LogOut,
} from 'lucide-react';
import { useApp, useFamily, useMember, useTheme, usePlayer } from '../hooks';
import { usePWA } from '../contexts/PWAContext';
import { SidebarItem, PlayerShell } from '../components';
import { getThemeColors } from '../utils/themeHelpers';

export const MainLayout: React.FC = () => {
  const { isMobileSidebarOpen, setMobileSidebarOpen, searchQuery, setSearchQuery, notifications, clearNotification } = useApp();
  const { activeMember, members, selectMember } = useMember();
  const { family } = useFamily();
  const activeProfile = activeMember;
  const profiles = members;
  const selectProfile = selectMember;
  const { activeTheme } = useTheme();
  const { currentTrack } = usePlayer();
  const { isInstallable, promptInstall, isInstalled } = usePWA();
  const location = useLocation();

  const themeColors = getThemeColors(activeTheme);

  // States for Desktop Sidebar Collapse & UI Dropdowns
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotifDropdownOpen, setIsNotifDropdownOpen] = useState(false);

  const activeProfileColor = activeProfile?.color || '#7b2cbf';

  return (
    <div className="h-screen w-full overflow-hidden bg-brand-bg text-brand-text font-sans flex flex-col selection:bg-brand-purple/30 selection:text-white" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      
      {/* Top Banner alert on gamification info */}
      <div className="bg-gradient-to-r from-brand-purple/20 via-brand-blue/20 to-brand-pink/20 border-b border-brand-border py-2 px-4 text-center text-xs font-semibold tracking-wide flex items-center justify-center gap-2 shrink-0 z-40">
        <Sparkles className="w-3.5 h-3.5 text-brand-purple-light animate-pulse" />
        {activeProfile ? (
          <span className="truncate">Membro ativo: <strong>{activeProfile.name} ({activeProfile.role})</strong> • Ganhe +15 XP ouvindo músicas juntos!</span>
        ) : (
          <span>Bem-vindo ao <strong>NeonFlow</strong> • Crie sua primeira família para começar!</span>
        )}
      </div>

      <div className="flex flex-1 w-full overflow-hidden relative">
        
        {/* ================= SIDEBAR (DESKTOP) ================= */}
        <aside
          className={`hidden lg:flex flex-col ${
            isSidebarCollapsed ? 'w-20' : 'w-64'
          } bg-brand-card/75 border-r border-brand-border p-4 shrink-0 z-50 backdrop-blur-md transition-all duration-300 relative`}
        >
          {/* Logo Brand & Collapse Toggle */}
          <div className="flex items-center justify-between px-2 py-3 mb-6">
            <Link to="/" className="flex items-center gap-3 group min-w-0">
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-pink p-0.5 shadow-lg group-hover:scale-105 transition-transform duration-300 shrink-0">
                <div className="w-full h-full bg-brand-card rounded-[10px] flex items-center justify-center">
                  <span className="text-sm font-black font-display text-transparent bg-clip-text bg-gradient-to-r from-brand-purple-light to-brand-pink">NF</span>
                </div>
              </div>
              {!isSidebarCollapsed && (
                <div className="flex flex-col min-w-0">
                  <span className="text-lg font-black font-display tracking-tight leading-none text-brand-text truncate">
                    Neon<span className="text-brand-purple-light" style={{ color: activeProfileColor }}>Flow</span>
                  </span>
                  <span className="text-[10px] font-bold text-brand-text-muted tracking-widest uppercase truncate">Family Player</span>
                </div>
              )}
            </Link>

            {/* Toggle Button */}
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-brand-border/60 text-brand-text-muted hover:text-white transition-colors cursor-pointer shrink-0"
              title={isSidebarCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-4 h-4 text-brand-cyan" />
              ) : (
                <PanelLeftClose className="w-4 h-4 text-brand-text-muted hover:text-white" />
              )}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 flex flex-col gap-1 overflow-y-auto overflow-x-hidden">
            <SidebarItem to="/" label="Início" icon={Home} collapsed={isSidebarCollapsed} />
            <SidebarItem to="/biblioteca" label="Biblioteca" icon={Music} collapsed={isSidebarCollapsed} />
            <SidebarItem to="/playlists" label="Playlists" icon={ListMusic} collapsed={isSidebarCollapsed} />
            <SidebarItem to="/downloads" label="Downloads" icon={Download} collapsed={isSidebarCollapsed} />
            <SidebarItem to="/sessoes" label="Sessões" icon={Radio} collapsed={isSidebarCollapsed} />
            <SidebarItem to="/familia" label="Família" icon={Users} collapsed={isSidebarCollapsed} />
            <SidebarItem to="/dashboard" label="Dashboard" icon={LayoutDashboard} collapsed={isSidebarCollapsed} />
            <SidebarItem to="/loja" label="Loja" icon={CreditCard} collapsed={isSidebarCollapsed} />
            <SidebarItem to="/configuracoes" label="Configurações" icon={Settings} collapsed={isSidebarCollapsed} />
          </nav>

          {/* Footer Active Profile Card */}
          <div className="relative border-t border-brand-border pt-4 mt-auto">
            {activeProfile ? (
              <div
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className={`flex items-center gap-3 ${
                  isSidebarCollapsed ? 'justify-center p-2' : 'p-2.5'
                } rounded-xl bg-brand-surface/40 hover:bg-brand-surface/80 border border-brand-border/40 cursor-pointer transition-all duration-200`}
                title={isSidebarCollapsed ? activeProfile.name : undefined}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-lg select-none shadow-md shrink-0"
                  style={{ backgroundColor: `${activeProfile.color}22`, border: `1px solid ${activeProfile.color}88` }}
                >
                  {activeProfile.avatar}
                </div>
                {!isSidebarCollapsed && (
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-brand-text truncate leading-none mb-0.5">
                      {activeProfile.name}
                    </h4>
                    <span className="text-2xs font-semibold text-brand-text-muted uppercase tracking-wider">
                      {activeProfile.role} • {activeProfile.xp} XP
                    </span>
                  </div>
                )}
                {!isSidebarCollapsed && (
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse shrink-0" />
                )}
              </div>
            ) : (
              <Link
                to="/familia"
                className={`flex items-center ${
                  isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-center gap-2 p-2.5'
                } rounded-xl bg-brand-purple/20 hover:bg-brand-purple/30 border border-brand-purple/40 text-brand-purple-light font-bold text-xs transition-all duration-200`}
                title={isSidebarCollapsed ? 'Criar Família' : undefined}
              >
                <Users className="w-4 h-4 shrink-0" />
                {!isSidebarCollapsed && <span>Criar Primeira Família</span>}
              </Link>
            )}

            {/* Profile Picker Dropup Dropdown */}
            {isProfileDropdownOpen && (
              <div className={`absolute bottom-16 ${isSidebarCollapsed ? 'left-0 w-64' : 'left-0 right-0'} glass-panel rounded-2xl border border-brand-border p-2 z-30 animate-in fade-in slide-in-from-bottom-2 duration-200 shadow-2xl`}>
                <div className="px-3.5 py-2 border-b border-brand-border/50">
                  <span className="text-2xs font-extrabold uppercase tracking-widest text-brand-text-muted">Quem está ouvindo?</span>
                </div>
                <div className="flex flex-col gap-1 mt-1 max-h-48 overflow-y-auto">
                  {profiles.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        selectProfile(p.id);
                        setIsProfileDropdownOpen(false);
                      }}
                      className={`flex items-center gap-3 w-full p-2 rounded-lg text-left text-xs font-semibold hover:bg-white/5 transition-colors
                        ${activeProfile?.id === p.id ? 'bg-brand-purple/10 text-brand-purple-light' : 'text-brand-text-muted'}
                      `}
                    >
                      <span className="text-base">{p.avatar}</span>
                      <div className="flex-1 truncate">
                        <div>{p.name}</div>
                        <div className="text-3xs font-medium text-brand-text-muted uppercase tracking-wider leading-none">{p.role}</div>
                      </div>
                      {activeProfile?.id === p.id && (
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Logout Button */}
            <button
              onClick={() => import('../lib/firebase').then(m => m.auth?.signOut())}
              className={`flex items-center gap-2 mt-2 ${isSidebarCollapsed ? 'justify-center p-2' : 'px-3 py-2'} rounded-xl text-red-400 hover:bg-red-500/10 text-xs font-semibold transition-colors cursor-pointer`}
              title={isSidebarCollapsed ? 'Sair da Conta' : undefined}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {!isSidebarCollapsed && <span>Sair</span>}
            </button>
          </div>
        </aside>

        {/* ================= SIDEBAR DRAWER (MOBILE) ================= */}
        {isMobileSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex">
            {/* Overlay */}
            <div
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            />
            
            {/* Drawer Body */}
            <div className="relative flex flex-col w-72 h-full bg-brand-card border-r border-brand-border p-5 z-10 animate-in slide-in-from-left duration-300">
              <div className="flex items-center justify-between mb-8">
                <Link to="/" onClick={() => setMobileSidebarOpen(false)} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-purple flex items-center justify-center text-xs font-black">
                    NF
                  </div>
                  <span className="text-base font-bold font-display text-brand-text">
                    NeonFlow
                  </span>
                </Link>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/5 border border-brand-border flex items-center justify-center text-brand-text-muted hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 flex flex-col gap-1.5">
                <SidebarItem to="/" label="Início" icon={Home} onClick={() => setMobileSidebarOpen(false)} />
                <SidebarItem to="/biblioteca" label="Biblioteca" icon={Music} onClick={() => setMobileSidebarOpen(false)} />
                <SidebarItem to="/playlists" label="Playlists" icon={ListMusic} onClick={() => setMobileSidebarOpen(false)} />
                <SidebarItem to="/downloads" label="Downloads" icon={Download} onClick={() => setMobileSidebarOpen(false)} />
                <SidebarItem to="/sessoes" label="Sessões" icon={Radio} onClick={() => setMobileSidebarOpen(false)} />
                <SidebarItem to="/familia" label="Família" icon={Users} onClick={() => setMobileSidebarOpen(false)} />
                <SidebarItem to="/dashboard" label="Dashboard" icon={LayoutDashboard} onClick={() => setMobileSidebarOpen(false)} />
                <SidebarItem to="/loja" label="Loja" icon={CreditCard} onClick={() => setMobileSidebarOpen(false)} />
                <SidebarItem to="/configuracoes" label="Configurações" icon={Settings} onClick={() => setMobileSidebarOpen(false)} />
              </nav>

              {/* Mobile Logout */}
              <div className="border-t border-brand-border pt-3">
                <button
                  onClick={() => { setMobileSidebarOpen(false); import('../lib/firebase').then(m => m.auth?.signOut()); }}
                  className="flex items-center gap-3 w-full p-2.5 rounded-xl text-red-400 hover:bg-red-500/10 text-xs font-semibold transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sair da Conta</span>
                </button>
              </div>

              {/* Mobile Profile Display */}
              <div className="border-t border-brand-border pt-4 mt-auto">
                <div className="flex items-center gap-3 p-2 bg-brand-surface/40 rounded-xl">
                  <div className="text-xl">{activeProfile?.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate text-brand-text">{activeProfile?.name}</div>
                    <div className="text-3xs font-semibold text-brand-text-muted uppercase tracking-wider">{activeProfile?.role} • {activeProfile?.xp} XP</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= MAIN CONTAINER ================= */}
        <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden relative">
          
          {/* ================= STICKY TOPBAR ================= */}
          <header className="sticky top-0 h-16 border-b border-brand-border px-5 md:px-8 bg-brand-card/85 flex items-center justify-between shrink-0 z-40 backdrop-blur-md shadow-sm">
            
            {/* Left: Hamburger menu (mobile only) & Breadcrumbs */}
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="lg:hidden w-10 h-10 min-w-[44px] min-h-[44px] rounded-xl bg-brand-surface border border-brand-border flex items-center justify-center text-brand-text hover:bg-white/5 cursor-pointer active:scale-95"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Quick Profile Switcher (Mobile only) */}
              {activeProfile && (
                <button
                  onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                  className="lg:hidden flex items-center gap-2 px-2.5 py-1.5 min-h-[40px] rounded-xl bg-brand-surface/60 border border-brand-border/60 cursor-pointer active:scale-95 transition-all"
                  title="Trocar perfil"
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-sm select-none shrink-0"
                    style={{ backgroundColor: `${activeProfile.color}22`, border: `1px solid ${activeProfile.color}88` }}
                  >
                    {activeProfile.avatar}
                  </div>
                  <span className="text-xs font-bold text-brand-text truncate max-w-[80px]">{activeProfile.name}</span>
                </button>
              )}

              <div className="hidden sm:flex items-center gap-2">
                <span className="text-xs font-semibold text-brand-text-muted tracking-tight">
                  {family.name || family.familyName}
                </span>
                <span className="text-brand-text-muted">/</span>
                <span className="text-xs font-bold text-brand-text capitalize">
                  {location.pathname === '/' ? 'Início' : location.pathname.substring(1)}
                </span>
              </div>
            </div>

            {/* Center: Search Box */}
            <div className="flex-1 max-w-sm mx-4">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-muted pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar músicas ou playlists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-brand-bg/50 border border-brand-border rounded-xl py-2 pl-10 pr-4 text-xs font-medium focus:outline-none focus:border-brand-purple/50 focus:bg-brand-bg/80 transition-all text-brand-text"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-white text-xs"
                  >
                    Limpar
                  </button>
                )}
              </div>
            </div>

            {/* Right: Streak & Notifications */}
            <div className="flex items-center gap-2 md:gap-4 shrink-0">
              
              {/* PWA Install Button (If installable and not installed) */}
              {isInstallable && !isInstalled && (
                <button
                  onClick={promptInstall}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-purple/30 to-brand-cyan/30 hover:from-brand-purple/50 hover:to-brand-cyan/50 border border-brand-cyan/40 text-brand-cyan text-xs font-extrabold transition-all shadow-lg cursor-pointer"
                  title="Instalar NeonFlow no dispositivo"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Instalar App</span>
                </button>
              )}

              {/* Streak Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 font-extrabold text-2xs md:text-xs select-none">
                <Flame className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                <span>{activeProfile?.streak || 5} Dias</span>
              </div>

              {/* Notifications bell */}
              <div className="relative">
                <button
                  onClick={() => setIsNotifDropdownOpen(!isNotifDropdownOpen)}
                  className="w-9 h-9 rounded-xl bg-brand-surface/60 border border-brand-border flex items-center justify-center text-brand-text-muted hover:text-brand-text hover:bg-brand-surface transition-all cursor-pointer relative"
                >
                  <Bell className="w-4 h-4" />
                  {notifications.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-pink rounded-full ring-2 ring-brand-card animate-pulse" />
                  )}
                </button>

                {isNotifDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-80 glass-panel rounded-2xl border border-brand-border shadow-2xl p-4 z-30 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between pb-2 border-b border-brand-border mb-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-brand-text">Notificações</span>
                      <span className="text-3xs font-medium text-brand-text-muted">{notifications.length} ativas</span>
                    </div>
                    {notifications.length === 0 ? (
                      <div className="text-center py-4 text-xs text-brand-text-muted">Nenhuma notificação nova</div>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                        {notifications.map((n) => (
                          <div key={n.id} className="p-2 rounded-lg bg-white/5 border border-white/2.5 relative group">
                            <button
                              onClick={() => clearNotification(n.id)}
                              className="absolute right-2 top-2 text-brand-text-muted hover:text-white text-3xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Excluir
                            </button>
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={`w-1.5 h-1.5 rounded-full ${n.type === 'gamification' ? 'bg-brand-purple' : 'bg-brand-blue'}`} />
                              <span className="text-xs font-bold leading-none">{n.title}</span>
                            </div>
                            <p className="text-2xs text-brand-text-muted leading-relaxed pr-6">{n.message}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile Profile Quick Switcher Dropdown */}
              {isProfileDropdownOpen && (
                <div className="lg:hidden absolute right-0 mt-3 w-72 glass-panel rounded-2xl border border-brand-border shadow-2xl p-3 z-30 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-3 py-2 border-b border-brand-border/50 mb-2">
                    <span className="text-2xs font-extrabold uppercase tracking-widest text-brand-text-muted">Quem está ouvindo?</span>
                  </div>
                  <div className="flex flex-col gap-1 max-h-60 overflow-y-auto">
                    {profiles.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          selectProfile(p.id);
                          setIsProfileDropdownOpen(false);
                        }}
                        onTouchEnd={(e) => {
                          e.preventDefault();
                          selectProfile(p.id);
                          setIsProfileDropdownOpen(false);
                        }}
                        className={`flex items-center gap-3 w-full p-2.5 min-h-[48px] rounded-xl text-left text-xs font-semibold hover:bg-white/5 transition-colors active:scale-95 ${
                          activeProfile?.id === p.id ? 'bg-brand-purple/10 text-brand-purple-light' : 'text-brand-text-muted'
                        }`}
                      >
                        <span className="text-lg">{p.avatar}</span>
                        <div className="flex-1 truncate">
                          <div className="font-bold">{p.name}</div>
                          <div className="text-3xs font-medium text-brand-text-muted uppercase tracking-wider leading-none">{p.role}</div>
                        </div>
                        {activeProfile?.id === p.id && (
                          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: p.color }} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </header>

          {/* ================= MAIN CONTENT SCROLL AREA ================= */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-40 sm:pb-44 min-w-0" style={{ paddingBottom: 'max(10rem, calc(10rem + env(safe-area-inset-bottom)))' }}>
            <Outlet />
          </main>

        </div>
      </div>

      {/* ================= UNIFIED PLAYER SHELL ================= */}
      <PlayerShell />

    </div>
  );
};
