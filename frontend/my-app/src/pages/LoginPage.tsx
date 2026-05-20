import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/auth.store';
import { useThemeStore } from '../store/theme.store';
import { useNotificationStore } from '../store/notification.store';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await authService.login({ email, password });
      setAuth(result.user, result.tokens.accessToken, result.tokens.refreshToken);
      navigate('/dashboard');
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || err.message || 'Login failed';
      setError(errorMsg);
      useNotificationStore.getState().addToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-white font-sans flex flex-col justify-between transition-colors duration-250">
      
      {/* 1. Simple Header */}
      <header className="h-16 flex items-center justify-between px-6 md:px-12 border-b border-hairline transition-colors duration-250">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
            <rect x="3" y="3" width="4" height="18" rx="1" />
            <rect x="10" y="8" width="4" height="13" rx="1" />
            <rect x="17" y="13" width="4" height="8" rx="1" />
          </svg>
          <span className="font-bold text-white text-base tracking-tight [data-theme=light]:text-zinc-900">ClickLeads</span>
        </div>

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-surface-soft border border-hairline text-zinc-400 hover:text-primary transition duration-150 active:scale-95 cursor-pointer"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 7a5 5 0 100 10 5 5 0 000-10z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </header>

      {/* 2. Login Workspace Card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="card-dark w-full max-w-md p-8 space-y-6 shadow-2xl animate-scale-up">
          
          <div className="space-y-1.5 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white [data-theme=light]:text-zinc-900">Sign in to console</h1>
            <p className="text-zinc-500 text-xxs font-semibold uppercase tracking-wider">Access ClickLeads CRM</p>
          </div>

          {error && (
            <div className="p-3 bg-accent-rose/10 border border-accent-rose/25 text-accent-rose text-xxs font-mono rounded flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">Corporate Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input-dark w-full"
                placeholder="name@company.com"
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">Password</label>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-dark w-full"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 mt-2 active:scale-95 transition text-xxs font-bold uppercase tracking-wider"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-zinc-500 text-xxs font-bold uppercase tracking-wider pt-2">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline transition">
              Create account
            </Link>
          </p>
        </div>
      </div>

      {/* 3. Footer */}
      <footer className="h-12 border-t border-hairline flex items-center justify-center text-[10px] text-zinc-500 font-medium">
        © {new Date().getFullYear()} ClickLeads CRM. All rights reserved.
      </footer>
    </div>
  );
};
