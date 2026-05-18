import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import { useThemeStore } from '../store/theme.store';
import { LeadsPage } from './LeadsPage';
import { TemplatesPage } from './TemplatesPage';
import { AnalyticsPage } from './AnalyticsPage';

type ViewType = 'leads' | 'templates' | 'analytics';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const [currentView, setCurrentView] = useState<ViewType>('leads');

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-canvas text-white font-sans overflow-hidden">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-canvas border-r border-hairline flex flex-col justify-between p-6 shrink-0 z-10">
        <div className="space-y-8">
          
          {/* Logo / Header */}
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2.5">
              <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="3" width="4" height="18" rx="1" />
                <rect x="10" y="8" width="4" height="13" rx="1" />
                <rect x="17" y="13" width="4" height="8" rx="1" />
              </svg>
              ClickLeads
            </h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">High Performance CRM</p>
          </div>

          {/* Nav Menu */}
          <nav className="space-y-1.5">
            
            <button
              onClick={() => setCurrentView('leads')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold tracking-wide transition duration-155 active:scale-[0.96] cursor-pointer ${
                currentView === 'leads'
                  ? 'bg-primary text-canvas shadow-[0_0_15px_rgba(250,255,105,0.2)]'
                  : 'text-zinc-400 hover:text-white hover:bg-surface-card'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
              Leads Manager
            </button>

            {user?.role === 'admin' && (
              <>
                <button
                  onClick={() => setCurrentView('templates')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold tracking-wide transition duration-155 active:scale-[0.96] cursor-pointer ${
                    currentView === 'templates'
                      ? 'bg-primary text-canvas shadow-[0_0_15px_rgba(250,255,105,0.2)]'
                      : 'text-zinc-400 hover:text-white hover:bg-surface-card'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  Email Templates
                </button>

                <button
                  onClick={() => setCurrentView('analytics')}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold tracking-wide transition duration-155 active:scale-[0.96] cursor-pointer ${
                    currentView === 'analytics'
                      ? 'bg-primary text-canvas shadow-[0_0_15px_rgba(250,255,105,0.2)]'
                      : 'text-zinc-400 hover:text-white hover:bg-surface-card'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z"></path></svg>
                  Analytics Dashboard
                </button>
              </>
            )}

          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="space-y-4 pt-6 border-t border-hairline">
          
          <div className="flex items-center justify-between p-3 bg-surface-card rounded-xl border border-hairline">
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Appearance</span>
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded bg-surface-soft border border-hairline text-zinc-400 hover:text-primary transition duration-150 active:scale-95 cursor-pointer flex items-center justify-center"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 7a5 5 0 100 10 5 5 0 000-10z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>

          <div className="p-4 bg-surface-card rounded-xl border border-hairline space-y-3">
            <div>
              <div className="font-bold text-xs text-white truncate">{user?.fullName}</div>
              <div className="text-[10px] text-zinc-400 truncate mt-0.5">{user?.email}</div>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary uppercase border border-primary/20">
              {user?.role === 'admin' ? 'Admin' : 'Sales Rep'}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-surface-card hover:bg-zinc-800 border border-hairline text-zinc-300 hover:text-white text-xs font-semibold rounded-lg transition active:scale-[0.96] cursor-pointer"
          >
            Logout Session
          </button>
        </div>

      </aside>

      {/* Main View Area */}
      <main className="flex-1 overflow-y-auto max-h-screen bg-canvas">
        {currentView === 'leads' && <LeadsPage />}
        {currentView === 'templates' && <TemplatesPage />}
        {currentView === 'analytics' && <AnalyticsPage />}
      </main>

    </div>
  );
};
