import React, { useState, useEffect } from 'react';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../store/auth.store';
import type { IUser } from '../types/auth';

export const TeamPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'sales_user'>('sales_user');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [users, setUsers] = useState<IUser[]>([]);
  const { user } = useAuthStore();

  const fetchUsers = async () => {
    try {
      const data = await authService.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await authService.inviteUser(email, role);
      setMessage({ type: 'success', text: `Invitation sent to ${email} successfully!` });
      setEmail('');
      setRole('sales_user');
      fetchUsers();
    } catch (err: any) {
      const errorMsg = err.response?.data?.errors?.[0]?.message || err.response?.data?.message || err.message || 'Failed to send invite';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'admin') {
    return <div className="p-8 text-zinc-400">You do not have permission to view this page.</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-white tracking-tight">Team Management</h1>
        <p className="text-sm text-zinc-400">Invite new members to your workspace and manage your team.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Invite Form */}
        <div className="card-dark p-6 space-y-5 h-fit">
          <h2 className="text-lg font-bold text-white">Invite Team Member</h2>
        
        {message.text && (
          <div className={`p-3 text-xs font-mono rounded ${message.type === 'success' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-accent-rose/10 text-accent-rose border border-accent-rose/25'}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleInvite} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-dark w-full"
              placeholder="colleague@company.com"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">Assign Role</label>
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
            {loading ? 'Sending Invite...' : 'Send Invitation'}
          </button>
        </form>
        </div>

        {/* Right Column: User List */}
        <div className="card-dark p-6 space-y-5 h-fit">
          <h2 className="text-lg font-bold text-white">Current Team</h2>
          <div className="space-y-3">
            {users.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-surface-soft border border-hairline">
                <div>
                  <div className="font-bold text-sm text-white">{member.fullName}</div>
                  <div className="text-xs text-zinc-400">{member.email}</div>
                </div>
                <div className="flex items-center gap-2">
                  {member.role === 'admin' ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary uppercase border border-primary/20">
                      Admin
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-800 text-zinc-300 uppercase border border-zinc-700">
                      Sales
                    </span>
                  )}
                </div>
              </div>
            ))}
            {users.length === 0 && (
              <div className="text-xs text-zinc-500 text-center py-4">No team members found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
