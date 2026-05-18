import React, { useState, useEffect } from 'react';
import { analyticsService, type IAnalyticsData } from '../services/analytics.service';
import { NetworkGraph } from '../components/NetworkGraph';
import { graphService, type INetworkGraphData } from '../services/graph.service';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<IAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Graph tab toggle state
  const [activeTab, setActiveTab] = useState<'dashboard' | 'network'>('dashboard');
  const [networkData, setNetworkData] = useState<INetworkGraphData | null>(null);
  const [networkLoading, setNetworkLoading] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await analyticsService.getDashboardAnalytics();
      setData(response);
    } catch (err: any) {
      setError(err.message || 'Failed to load analytics dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchNetworkGraph = async () => {
    try {
      setNetworkLoading(true);
      const res = await graphService.getNetworkGraph();
      setNetworkData(res);
    } catch (err) {
      console.error('Failed to load network graph data', err);
    } finally {
      setNetworkLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (activeTab === 'network' && !networkData) {
      fetchNetworkGraph();
    }
  }, [activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen bg-canvas text-white flex items-center justify-center p-8">
        <div className="flex flex-col items-center justify-center py-20 bg-surface-card border border-hairline rounded-xl max-w-sm w-full">
          <div className="animate-spin inline-block w-8 h-8 border-3 border-primary border-t-transparent rounded-full mb-3"></div>
          <p className="text-sm text-zinc-500 font-medium">Fetching analytics metrics...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-canvas text-white flex items-center justify-center p-8">
        <div className="bg-surface-card p-6 rounded-xl border border-hairline max-w-md w-full text-center space-y-4">
          <p className="text-accent-rose text-xs font-bold font-mono">⚠️ {error || 'Could not fetch dashboard metrics'}</p>
          <button onClick={fetchAnalytics} className="btn-primary w-full">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const { kpis, statusDistribution, sourceDistribution, leadsOverTime, assigneePerformance } = data;

  // Render minimal inline SVG trend chart
  const renderTrendChart = () => {
    if (leadsOverTime.length === 0) {
      return <div className="text-center text-zinc-500 py-16 text-xs font-semibold uppercase">No historical trends in past 7 days</div>;
    }

    const width = 600;
    const height = 180;
    const padding = 30;

    // Find bounds
    const maxVal = Math.max(...leadsOverTime.map((d) => d.count), 5); // default min top scale is 5

    // Calculate coordinates
    const points = leadsOverTime.map((d, index) => {
      const x = padding + (index / Math.max(leadsOverTime.length - 1, 1)) * (width - padding * 2);
      const y = height - padding - (d.count / maxVal) * (height - padding * 2);
      return { x, y, label: d.date, count: d.count };
    });

    const pathData = points.reduce((acc, p, i) => {
      return i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    return (
      <div className="w-full bg-canvas p-4 rounded-xl border border-hairline flex flex-col items-center">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[180px] overflow-visible">
          {/* Grid lines */}
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#2a2a2a" strokeWidth={1} />
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#1a1a1a" strokeWidth={1} strokeDasharray="3 3" />
          
          {/* Area under curve */}
          {points.length > 0 && (
            <path
              d={`${pathData} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`}
              fill="url(#yellowGradient)"
              opacity={0.12}
            />
          )}

          {/* Trend line */}
          <path d={pathData} fill="none" stroke="#faff69" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

          {/* Dots on points */}
          {points.map((p, i) => (
            <g key={i} className="group cursor-pointer">
              <circle cx={p.x} cy={p.y} r={4.5} fill="#faff69" className="hover:scale-150 transition duration-100" />
              {/* Tooltip on point */}
              <text x={p.x} y={p.y - 12} textAnchor="middle" fill="#faff69" fontSize="9" fontWeight="800" className="hidden group-hover:block font-mono">
                {p.count}
              </text>
            </g>
          ))}

          {/* X Axis dates */}
          {points.map((p, i) => {
            const formattedDate = new Date(p.label).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            return (
              <text key={i} x={p.x} y={height - 10} textAnchor="middle" fill="#888888" fontSize="8" fontWeight="600" className="font-mono">
                {formattedDate}
              </text>
            );
          })}

          <defs>
            <linearGradient id="yellowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#faff69" />
              <stop offset="100%" stopColor="#faff69" stopOpacity={0} />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-canvas p-8 lg:p-10 text-white animate-fade-in">
      <div className="w-full max-w-[1280px] mx-auto">
        
        {/* Header with Switcher Tabs */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8 border-b border-hairline pb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Analytics Dashboard</h1>
            <p className="text-zinc-400 text-xs font-medium">Track agent performance leaderboard, status distributions, and conversion ratios.</p>
          </div>

          <div className="flex bg-canvas border border-hairline p-1 rounded-lg self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 text-xxs font-bold uppercase tracking-wider rounded-md transition duration-150 active:scale-[0.95] cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-primary text-canvas shadow-[0_0_10px_rgba(250,255,105,0.25)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Metrics Dashboard
            </button>
            <button
              onClick={() => setActiveTab('network')}
              className={`px-4 py-2 text-xxs font-bold uppercase tracking-wider rounded-md transition duration-150 active:scale-[0.95] cursor-pointer ${
                activeTab === 'network'
                  ? 'bg-primary text-canvas shadow-[0_0_10px_rgba(250,255,105,0.25)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Relationship Network
            </button>
          </div>
        </div>

        {activeTab === 'network' ? (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-surface-card p-6 rounded-xl border border-hairline shadow-lg">
              <h2 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">CRM Connection Network</h2>
              <p className="text-[10px] text-zinc-500 font-medium mb-6">Interactive force-directed relationships showing shared company domains and referrer chains. Drag nodes to explore.</p>
              
              {networkLoading ? (
                <div className="flex flex-col items-center justify-center py-32">
                  <div className="animate-spin inline-block w-8 h-8 border-3 border-primary border-t-transparent rounded-full mb-3"></div>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Compiling connection maps...</p>
                </div>
              ) : networkData ? (
                <NetworkGraph data={networkData} />
              ) : (
                <div className="text-center text-zinc-500 py-16 text-xs font-bold uppercase">No connection map compiled</div>
              )}
            </div>
          </div>
        ) : (
          <>

        {/* KPI HEADERS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          <div className="bg-surface-card p-6 rounded-xl border border-hairline shadow-lg flex flex-col justify-between hover:border-primary/20 transition duration-150">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-3">Total Leads</span>
            <span className="text-4xl font-extrabold text-primary font-mono tracking-tight">{kpis.totalLeads}</span>
            <span className="text-[10px] text-zinc-500 font-medium mt-3 block">Accumulated contacts</span>
          </div>

          <div className="bg-surface-card p-6 rounded-xl border border-hairline shadow-lg flex flex-col justify-between hover:border-primary/20 transition duration-150">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-3">Conversion Funnel</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-primary font-mono tracking-tight">{kpis.conversionRate}%</span>
              <span className="text-[10px] text-zinc-400 font-bold uppercase">Qualified</span>
            </div>
            {/* progress bar */}
            <div className="w-full bg-canvas rounded-full h-1.5 mt-3.5 border border-hairline">
              <div className="h-full rounded-full bg-primary" style={{ width: `${kpis.conversionRate}%` }}></div>
            </div>
          </div>

          <div className="bg-surface-card p-6 rounded-xl border border-hairline shadow-lg flex flex-col justify-between hover:border-primary/20 transition duration-150">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-3">Average Lead Score</span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-primary font-mono tracking-tight">{kpis.avgLeadScore}</span>
              <span className="text-[10px] text-zinc-500 font-bold uppercase">/ 100</span>
            </div>
            <div className="w-full bg-canvas rounded-full h-1.5 mt-3.5 border border-hairline">
              <div className="h-full rounded-full bg-primary" style={{ width: `${kpis.avgLeadScore}%` }}></div>
            </div>
          </div>

          <div className="bg-surface-card p-6 rounded-xl border border-hairline shadow-lg flex flex-col justify-between hover:border-primary/20 transition duration-150">
            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mb-3">Contact Engagement</span>
            <span className="text-4xl font-extrabold text-white font-mono tracking-tight">{kpis.contactedLeads}</span>
            <span className="text-[10px] text-zinc-500 font-medium mt-3 block">Leads actively contacted</span>
          </div>

        </div>

        {/* MIDDLE CHARTS AREA */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          
          {/* Trend line */}
          <div className="bg-surface-card p-6 rounded-xl border border-hairline shadow-lg lg:col-span-2 flex flex-col justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Lead Generation Trend</h3>
              <p className="text-[10px] text-zinc-500 font-medium mt-0.5">Leads created in past 7 days</p>
            </div>
            {renderTrendChart()}
          </div>

          {/* Status Distribution */}
          <div className="bg-surface-card p-6 rounded-xl border border-hairline shadow-lg flex flex-col justify-between gap-4">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Status Channels</h3>
              <p className="text-[10px] text-zinc-500 font-medium mt-0.5">Contacts grouped by lead state</p>
            </div>
            
            <div className="space-y-4 my-2">
              {statusDistribution.map((item) => {
                const ratio = kpis.totalLeads > 0 ? (item.count / kpis.totalLeads) * 100 : 0;
                
                let barColor = 'bg-blue-500';
                if (item.status === 'qualified') barColor = 'bg-accent-emerald';
                if (item.status === 'contacted') barColor = 'bg-purple-500';
                if (item.status === 'lost') barColor = 'bg-accent-rose';

                return (
                  <div key={item.status} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold text-zinc-300">
                      <span className="capitalize">{item.status}</span>
                      <span className="font-mono">
                        {item.count} <span className="text-[9px] text-zinc-500">({Math.round(ratio)}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-canvas rounded-full h-2 border border-hairline">
                      <div className={`h-full rounded-full ${barColor}`} style={{ width: `${ratio}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-[10px] text-zinc-500 font-medium border-t border-hairline pt-3">
              Distribution reflects absolute lead channels
            </div>
          </div>

        </div>

        {/* BOTTOM AREA GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Source distribution */}
          <div className="bg-surface-card p-6 rounded-xl border border-hairline shadow-lg">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Source Distributions</h3>
            <p className="text-[10px] text-zinc-500 font-medium mb-6">Origins and channels of generated leads</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {sourceDistribution.map((item) => {
                const ratio = kpis.totalLeads > 0 ? Math.round((item.count / kpis.totalLeads) * 100) : 0;
                return (
                  <div key={item.source} className="p-4 bg-canvas rounded-xl border border-hairline flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-bold uppercase text-zinc-500 capitalize mb-1">{item.source}</span>
                    <span className="text-xl font-extrabold text-white mb-2 font-mono">{item.count}</span>
                    <span className="text-[9px] text-zinc-500 font-bold bg-surface-card border border-hairline px-2 py-0.5 rounded">{ratio}% ratio</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* User performance / assignees leaderboard */}
          <div className="bg-surface-card p-6 rounded-xl border border-hairline shadow-lg flex flex-col gap-4">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1">Lead Assignments Leaderboard</h3>
              <p className="text-[10px] text-zinc-500 font-medium">Ownership stats of active sales representatives</p>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-hairline text-zinc-500 font-bold uppercase text-[9px] tracking-wider">
                    <th className="py-2.5 px-3">Sales Representative</th>
                    <th className="py-2.5 px-3 text-right">Leads Assigned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline/40">
                  {assigneePerformance.length === 0 ? (
                    <tr>
                      <td colSpan={2} className="py-6 px-3 text-center text-zinc-500 italic text-[11px] font-semibold uppercase">
                        No lead assignments recorded yet.
                      </td>
                    </tr>
                  ) : (
                    assigneePerformance.map((user) => (
                      <tr key={user._id} className="hover:bg-zinc-900/40 transition">
                        <td className="py-3 px-3">
                          <div className="font-bold text-white text-xs">{user.fullName}</div>
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{user.email}</div>
                        </td>
                        <td className="py-3 px-3 text-right font-extrabold text-primary font-mono text-xs">
                          {user.count}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </>
    )}

      </div>
    </div>
  );
};
