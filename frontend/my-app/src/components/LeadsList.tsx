import { useEffect, useState } from 'react';
import { useFilterStore } from '../store/filter.store';
import { leadService } from '../services/lead.service';
import type { ILead } from '../types/lead';

interface LeadsListProps {
  onLeadClick?: (lead: ILead) => void;
  refreshTrigger?: number;
}

export const LeadsList: React.FC<LeadsListProps> = ({ onLeadClick, refreshTrigger }) => {
  const [leads, setLeads] = useState<ILead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Select specific filters to avoid subscribing to the entire store
  const status = useFilterStore((state) => state.status);
  const source = useFilterStore((state) => state.source);
  const search = useFilterStore((state) => state.search);
  const sortBy = useFilterStore((state) => state.sortBy);
  const page = useFilterStore((state) => state.page);
  const limit = useFilterStore((state) => state.limit);
  const setPagination = useFilterStore((state) => state.setPagination);

  useEffect(() => {
    const fetchLeads = async () => {
      setLoading(true);
      setError('');

      try {
        const result = await leadService.getLeads({
          status,
          source,
          search,
          sortBy,
          page,
          limit,
        });
        setLeads(result.data ?? []);
        setPagination(result.pagination);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch leads';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [status, source, search, sortBy, page, limit, setPagination, refreshTrigger]);

  const getScoreColor = (score: number): string => {
    if (score >= 60) return 'text-accent-emerald';
    if (score >= 30) return 'text-primary';
    return 'text-accent-rose';
  };

  const getStatusBadgeColor = (status: string): string => {
    const colors: Record<string, string> = {
      new: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
      contacted: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
      qualified: 'bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20',
      lost: 'bg-accent-rose/10 text-accent-rose border border-accent-rose/20',
    };
    return colors[status] || 'bg-zinc-800 text-zinc-400 border border-zinc-700';
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 bg-surface-card border border-hairline rounded-xl">
        <div className="animate-spin inline-block w-8 h-8 border-3 border-primary border-t-transparent rounded-full mb-3"></div>
        <p className="text-sm text-zinc-500 font-medium">Fetching record tables...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-accent-rose py-12 bg-surface-card border border-hairline rounded-xl font-medium text-sm">
        ⚠️ {error}
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="text-center text-zinc-500 py-16 bg-surface-card border border-hairline rounded-xl font-medium text-sm">
        Zero leads recorded under these filter presets.
      </div>
    );
  }

  return (
    <div className="bg-surface-card rounded-xl border border-hairline overflow-hidden shadow-lg animate-fade-in">
      <div className="overflow-x-auto w-full scrollbar-thin">
        <table className="w-full min-w-[800px] border-collapse">
          <thead>
            <tr className="bg-canvas border-b border-hairline text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
              <th className="px-6 py-4 text-left font-bold">Name</th>
              <th className="px-6 py-4 text-left font-bold">Email</th>
              <th className="px-6 py-4 text-left font-bold">Status</th>
              <th className="px-6 py-4 text-left font-bold">Source</th>
              <th className="px-6 py-4 text-left font-bold">Performance score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline/40">
            {leads.map((lead) => (
              <tr
                key={lead.id}
                onClick={() => onLeadClick?.(lead)}
                className="hover:bg-zinc-900/65 active:bg-zinc-900 cursor-pointer transition duration-150"
              >
                <td className="px-6 py-4.5 text-xs font-bold text-white">{lead.name}</td>
                <td className="px-6 py-4.5 text-xs text-zinc-400 font-mono">{lead.email}</td>
                <td className="px-6 py-4.5 text-xs">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getStatusBadgeColor(lead.status)}`}>
                    {lead.status}
                  </span>
                </td>
                <td className="px-6 py-4.5 text-xs text-zinc-400 capitalize">{lead.source}</td>
                <td className={`px-6 py-4.5 text-xs font-extrabold font-mono ${getScoreColor(lead.leadScore)}`}>
                  {lead.leadScore} pts
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
