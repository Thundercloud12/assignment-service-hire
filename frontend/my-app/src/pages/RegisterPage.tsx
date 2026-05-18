import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/auth.store';
import { useThemeStore } from '../store/theme.store';

export const RegisterPage: React.FC = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'sales_user'>('sales_user');
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
      const result = await authService.register({ fullName, email, password, role });
      setAuth(result.user, result.tokens.accessToken, result.tokens.refreshToken);
      navigate('/dashboard');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMsg);
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

      {/* 2. Register Workspace Card */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="card-dark w-full max-w-md p-8 space-y-5 shadow-2xl animate-scale-up">
          
          <div className="space-y-1.5 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white [data-theme=light]:text-zinc-900">Create your console account</h1>
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
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="input-dark w-full"
                placeholder="Rahul Singh"
              />
            </div>

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
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-dark w-full"
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">Console Security Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'sales_user')}
                className="input-dark w-full appearance-none cursor-pointer"
                style={{ backgroundPosition: 'right 12px center', backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundSize: '1.25rem' }}
              >
                <option value="sales_user" className="bg-zinc-900 text-white">Sales Representative</option>
                <option value="admin" className="bg-zinc-900 text-white">Administrator</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 mt-2 active:scale-95 transition text-xxs font-bold uppercase tracking-wider"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-zinc-500 text-xxs font-bold uppercase tracking-wider pt-2">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline transition">
              Sign In
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
