import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeStore } from '../store/theme.store';
import { useAuthStore } from '../store/auth.store';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useThemeStore();
  const isAuthenticated = useAuthStore((state) => !!state.accessToken);

  return (
    <div className="min-h-screen bg-canvas text-white font-sans transition-colors duration-250">
      
      {/* 1. Header (64px editorial nav) */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-canvas/80 backdrop-blur-md border-b border-hairline flex items-center justify-between px-6 md:px-12 z-50 transition-colors duration-250">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
            <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="3" width="4" height="18" rx="1" />
              <rect x="10" y="8" width="4" height="13" rx="1" />
              <rect x="17" y="13" width="4" height="8" rx="1" />
            </svg>
            <span className="font-bold text-white text-base tracking-tight [data-theme=light]:text-zinc-900">ClickLeads</span>
          </div>
          
          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xxs font-bold uppercase tracking-wider text-zinc-400">
            <a href="#features" className="hover:text-primary transition">Features</a>
            <a href="#demo" className="hover:text-primary transition">Terminal</a>
            <a href="#pricing" className="hover:text-primary transition">Pricing</a>
          </nav>
        </div>

        {/* Right Nav Options */}
        <div className="flex items-center gap-4">
          {/* Dark / Light Theme Toggle Switch */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-surface-soft border border-hairline text-zinc-400 hover:text-primary transition duration-150 active:scale-95 cursor-pointer"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              // Sun icon
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 7a5 5 0 100 10 5 5 0 000-10z" />
              </svg>
            ) : (
              // Moon icon
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>

          {isAuthenticated ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-primary"
            >
              Console
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className="text-xxs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/register')}
                className="btn-primary"
              >
                Get Started
              </button>
            </>
          )}
        </div>
      </header>

      {/* 2. Hero Section (7-5 Split) */}
      <section className="pt-32 pb-20 px-6 md:px-12 max-w-[1280px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-block bg-primary/10 border border-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider">
            Clickhouse-Inspired Performance
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-[1.05] tracking-tighter [data-theme=light]:text-zinc-900">
            High-Performance <br />
            <span className="text-primary">CRM Network</span> <br />
            for modern sales.
          </h1>
          <p className="text-zinc-400 text-sm max-w-lg leading-relaxed [data-theme=light]:text-zinc-500">
            A near-pure black canvas interface with electric brand voltage. Map relationships with force-directed physics, deconstruct lead ratings with animated orbital contributor weights, and sync spreadsheet leads in milliseconds.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 btn-primary text-xs font-bold uppercase tracking-wider"
              >
                Enter CRM Console
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/register')}
                  className="px-6 py-3 btn-primary text-xs font-bold uppercase tracking-wider"
                >
                  Start Tracking Free
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="px-6 py-3 btn-secondary text-xs font-bold uppercase tracking-wider"
                >
                  Request Demo
                </button>
              </>
            )}
          </div>
        </div>

        {/* Hero Artifact Widget (SQL Window Card) */}
        <div className="lg:col-span-5">
          <div className="relative border border-hairline rounded-xl overflow-hidden shadow-2xl bg-surface-card animate-scale-up">
            <div className="flex items-center justify-between px-4 py-3 bg-[#0d0d0d] border-b border-hairline [data-theme=light]:bg-slate-100">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-accent-rose/70"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-warning/70"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-accent-emerald/70"></span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">query_console.sql</span>
            </div>
            
            <div className="p-5 font-mono text-[11px] text-zinc-300 leading-relaxed overflow-x-auto [data-theme=light]:text-zinc-700">
              <p className="text-zinc-600">-- Compute dynamic relationship coordinates in 3.4ms</p>
              <p><span className="text-primary font-bold">SELECT</span> lead_id, name, score <span className="text-zinc-500">FROM</span> leads</p>
              <p><span className="text-primary font-bold">JOIN</span> activity_logs <span className="text-zinc-500">ON</span> leads.id = activity_logs.lead_id</p>
              <p><span className="text-primary font-bold">WHERE</span> leads.status = <span className="text-accent-emerald font-semibold">'qualified'</span></p>
              <p className="text-zinc-600 mt-3">-- Result Matrix:</p>
              <table className="w-full mt-1.5 border-t border-hairline pt-1 text-[10px]">
                <thead>
                  <tr className="text-zinc-500 border-b border-hairline/40 text-left uppercase">
                    <th className="py-1">Lead</th>
                    <th className="py-1 text-right">Orbit Rating</th>
                    <th className="py-1 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-1 text-white [data-theme=light]:text-zinc-800">Rahul Singh</td>
                    <td className="py-1 text-right text-primary font-bold">95 pts</td>
                    <td className="py-1 text-right text-accent-emerald">QUALIFIED</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-white [data-theme=light]:text-zinc-800">Sarah Connor</td>
                    <td className="py-1 text-right text-primary font-bold">75 pts</td>
                    <td className="py-1 text-right text-accent-emerald">CONTACTED</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="px-4 py-2.5 bg-[#0d0d0d] border-t border-hairline flex items-center justify-between text-[9px] font-mono text-zinc-500 [data-theme=light]:bg-slate-100">
              <span>Query processed successfully</span>
              <span className="text-accent-emerald font-extrabold uppercase">● Ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Monochrome Client Logo Strip */}
      <section className="bg-canvas border-t border-b border-hairline py-8 px-6 text-center select-none transition-colors duration-250">
        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-6">Engineered for high performance teams worldwide</p>
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-40 grayscale [data-theme=light]:opacity-80">
          <span className="font-extrabold tracking-tighter text-white text-lg font-mono [data-theme=light]:text-zinc-800">SNOWFLAKE</span>
          <span className="font-black tracking-widest text-white text-lg font-sans [data-theme=light]:text-zinc-800">DATABRICKS</span>
          <span className="font-bold text-white text-lg font-serif [data-theme=light]:text-zinc-800">ClickHouse</span>
          <span className="font-mono text-white text-lg [data-theme=light]:text-zinc-800">MONGODB</span>
        </div>
      </section>

      {/* 4. Features Grid */}
      <section id="features" className="py-24 px-6 md:px-12 max-w-[1280px] mx-auto space-y-16">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-xxs font-extrabold uppercase tracking-widest text-primary">CRM Architecture</h2>
          <h3 className="text-2xl md:text-4xl font-extrabold text-white leading-tight tracking-tight [data-theme=light]:text-zinc-900">
            Features engineered to close deals.
          </h3>
          <p className="text-zinc-400 text-xs [data-theme=light]:text-zinc-500">
            Highly-focused interfaces that get out of your way and let you analyze interactions efficiently.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="card-dark p-8 flex flex-col justify-between h-72 hover:border-primary/30 transition duration-200 group">
            <div>
              <div className="w-8 h-8 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 transition group-hover:scale-105">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="text-sm font-bold text-white mb-2 [data-theme=light]:text-zinc-800">Force Relationship Graph</h4>
              <p className="text-zinc-400 text-xxs leading-relaxed [data-theme=light]:text-zinc-500">
                Visualize shared domain associations and referral networks using live physics attraction equations on dynamic HTML5 canvas widgets.
              </p>
            </div>
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-4">Verlet Engine</span>
          </div>

          <div className="card-dark p-8 flex flex-col justify-between h-72 hover:border-primary/30 transition duration-200 group">
            <div>
              <div className="w-8 h-8 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 transition group-hover:scale-105">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                </svg>
              </div>
              <h4 className="text-sm font-bold text-white mb-2 [data-theme=light]:text-zinc-800">Orbital Score Contributors</h4>
              <p className="text-zinc-400 text-xxs leading-relaxed [data-theme=light]:text-zinc-500">
                Deconstruct lead scores inside animated orbital systems showing exactly which activities boost or reduce rating weights.
              </p>
            </div>
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-4">Orbital Physics</span>
          </div>

          <div className="card-dark p-8 flex flex-col justify-between h-72 hover:border-primary/30 transition duration-200 group">
            <div>
              <div className="w-8 h-8 rounded bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6 transition group-hover:scale-105">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h4 className="text-sm font-bold text-white mb-2 [data-theme=light]:text-zinc-800">Merge Deduplication</h4>
              <p className="text-zinc-400 text-xxs leading-relaxed [data-theme=light]:text-zinc-500">
                Identify matching clusters by emails and domains. Automatically merge note history and emails without losing client context.
              </p>
            </div>
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-4">Timeline Merge</span>
          </div>

        </div>
      </section>

      {/* 5. Electric Yellow CTA Band */}
      <section className="py-12 px-6 md:px-12 max-w-[1280px] mx-auto">
        <div className="bg-primary p-12 md:p-16 rounded-xl flex flex-col md:flex-row justify-between items-center gap-8 shadow-xl">
          <div className="space-y-3 text-center md:text-left">
            <h3 className="text-2xl md:text-3xl font-extrabold text-[#0a0a0a] tracking-tight">
              Ready to experience brand voltage?
            </h3>
            <p className="text-zinc-800 text-xs font-semibold max-w-md">
              Access the high-contrast dashboard metrics and Verlet connection graphs immediately by launching the live CRM console.
            </p>
          </div>
          <button
            onClick={() => navigate('/register')}
            className="px-6 py-3 bg-[#0a0a0a] text-white hover:bg-zinc-900 text-xs font-bold uppercase tracking-wider rounded-lg transition duration-150 active:scale-95 shadow-md shrink-0 cursor-pointer"
          >
            Launch Console Now
          </button>
        </div>
      </section>

      {/* 6. Footer (Editorial black band) */}
      <footer className="border-t border-hairline mt-24 py-16 px-6 md:px-12 bg-canvas transition-colors duration-250">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="3" width="4" height="18" rx="1" />
              <rect x="10" y="8" width="4" height="13" rx="1" />
              <rect x="17" y="13" width="4" height="8" rx="1" />
            </svg>
            <span className="font-bold text-white text-sm tracking-tight [data-theme=light]:text-zinc-900">ClickLeads</span>
          </div>
          <p className="text-[10px] text-zinc-500 font-medium">
            © {new Date().getFullYear()} ClickLeads CRM. All rights reserved. Built for lightning-fast database interactions.
          </p>
        </div>
      </footer>

    </div>
  );
};
