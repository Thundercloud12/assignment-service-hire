import { useState, useCallback, useEffect } from 'react';
import { useFilterStore } from '../store/filter.store';
import { presetService, type IFilterPreset } from '../services/preset.service';
import { useNotificationStore } from '../store/notification.store';

const LEAD_STATUSES = ['new', 'contacted', 'qualified', 'lost'] as const;
const LEAD_SOURCES = ['website', 'instagram', 'referral', 'other'] as const;

const DEBOUNCE_DELAY = 300;

export const FilterPanel: React.FC = () => {
  const [searchInput, setSearchInput] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<any>(null);
  const { status, source, search, sortBy, setFilters, resetFilters } = useFilterStore();

  // Presets States
  const [presets, setPresets] = useState<IFilterPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadPresets = async () => {
    try {
      const list = await presetService.getPresets();
      setPresets(list);
    } catch (err) {
      console.error('Failed to load presets', err);
    }
  };

  useEffect(() => {
    loadPresets();
  }, []);

  const handleApplyPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    if (!presetId) {
      resetFilters();
      return;
    }
    const preset = presets.find((p) => p._id === presetId);
    if (preset) {
      setFilters({
        status: (preset.filters.status as any) || [],
        source: (preset.filters.source as any) || [],
        search: preset.filters.search || '',
        sortBy: preset.filters.sortBy as any || 'latest',
        page: 1,
      });
    }
  };

  const handleSavePreset = async (e: React.FormEvent) => {
    e.preventDefault();
    const addToast = useNotificationStore.getState().addToast;

    if (!newPresetName.trim()) {
      addToast('Preset name cannot be empty', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const currentFilters = {
        status: status || [],
        source: source || [],
        search: search || '',
        sortBy: sortBy || 'latest',
      };
      const saved = await presetService.savePreset(newPresetName.trim(), currentFilters);
      setPresets((prev) => [saved, ...prev.filter((p) => p.name !== saved.name)]);
      setSelectedPresetId(saved._id);
      setNewPresetName('');
      setShowSavePrompt(false);
      addToast('Filter preset saved successfully!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to save preset', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePreset = async (presetId: string) => {
    if (!presetId) return;
    const isConfirmed = window.confirm('Are you sure you want to delete this saved filter preset?');
    if (!isConfirmed) return;

    const addToast = useNotificationStore.getState().addToast;
    try {
      await presetService.deletePreset(presetId);
      setPresets((prev) => prev.filter((p) => p._id !== presetId));
      setSelectedPresetId('');
      resetFilters();
      addToast('Filter preset deleted successfully!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to delete preset', 'error');
    }
  };

  useEffect(() => {
    setSearchInput(search || '');
  }, [search]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchInput(value);

      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }

      const timeout = setTimeout(() => {
        setFilters({ search: value, page: 1 });
      }, DEBOUNCE_DELAY);

      setSearchTimeout(timeout);
    },
    [searchTimeout, setFilters],
  );

  const toggleStatus = (s: string) => {
    const newStatus = status?.includes(s as any)
      ? status.filter((st) => st !== s)
      : [...(status || []), s as any];
    setFilters({ status: newStatus, page: 1 });
  };

  const toggleSource = (s: string) => {
    const newSource = source?.includes(s as any)
      ? source.filter((src) => src !== s)
      : [...(source || []), s as any];
    setFilters({ source: newSource, page: 1 });
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ sortBy: e.target.value as any, page: 1 });
  };

  return (
    <div className="bg-surface-card rounded-xl border border-hairline p-5 shadow-lg space-y-4">
      
      {/* Header section with Reset button and Presets */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-hairline">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 8.293A1 1 0 013 7.586V4z"></path></svg>
          <h3 className="text-xs font-bold text-gray-200 uppercase tracking-wider">Filter & Search Leads</h3>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Preset Select Dropdown */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedPresetId}
              onChange={(e) => handleApplyPreset(e.target.value)}
              className="bg-canvas border border-hairline rounded-md px-2.5 py-1 text-xxs font-bold text-gray-300 focus:outline-none focus:border-primary transition"
            >
              <option value="">Quick Presets...</option>
              {presets.map((preset) => (
                <option key={preset._id} value={preset._id}>
                  {preset.name}
                </option>
              ))}
            </select>

            {selectedPresetId && (
              <button
                onClick={() => handleDeletePreset(selectedPresetId)}
                className="p-1.5 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-md transition duration-150 active:scale-[0.9] cursor-pointer"
                title="Delete preset"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            )}
          </div>

          <button
            onClick={() => setShowSavePrompt(true)}
            className="text-xxs font-bold uppercase tracking-wider text-primary hover:text-primary-active transition duration-150 active:scale-[0.96] cursor-pointer"
          >
            Save Preset
          </button>

          <span className="text-zinc-700">|</span>

          <button
            onClick={() => {
              resetFilters();
              setSelectedPresetId('');
            }}
            className="text-xxs font-bold uppercase tracking-wider text-zinc-400 hover:text-white transition duration-150 active:scale-[0.96] cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Save Preset Prompt Card */}
      {showSavePrompt && (
        <form onSubmit={handleSavePreset} className="p-3 bg-canvas border border-hairline rounded-lg flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex-1">
            <input
              type="text"
              required
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              placeholder="Name your preset (e.g. Hot Referrals)..."
              className="w-full bg-surface-card border border-hairline rounded px-3 py-1.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-primary"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-3 py-1.5 bg-primary hover:bg-primary-active text-canvas text-xxs font-bold rounded cursor-pointer transition duration-150 active:scale-[0.96]"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setShowSavePrompt(false)}
              className="px-3 py-1.5 bg-surface-card border border-hairline hover:bg-zinc-800 text-zinc-400 hover:text-white text-xxs font-bold rounded cursor-pointer transition duration-150 active:scale-[0.96]"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Horizontal filters grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Search Field */}
        <div className="space-y-2">
          <label className="block text-xxs font-bold uppercase tracking-wider text-zinc-400">Search</label>
          <div className="relative">
            <input
              type="text"
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="Search name or email..."
              className="w-full pl-9 pr-4 py-2 bg-canvas border border-hairline rounded-lg text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-primary transition"
            />
            <svg className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>

        {/* Status Pills */}
        <div className="space-y-2">
          <label className="block text-xxs font-bold uppercase tracking-wider text-zinc-400">Status</label>
          <div className="flex flex-wrap gap-1.5">
            {LEAD_STATUSES.map((s) => {
              const active = status?.includes(s) ?? false;
              
              return (
                <button
                  type="button"
                  key={s}
                  onClick={() => toggleStatus(s)}
                  className={`px-2.5 py-1.5 rounded-md text-xxs font-bold uppercase tracking-wide transition duration-150 border cursor-pointer active:scale-[0.94] ${
                    active 
                      ? 'bg-primary text-canvas border-primary shadow-[0_0_10px_rgba(250,255,105,0.15)]'
                      : 'bg-canvas text-zinc-400 border-hairline hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Source Pills */}
        <div className="space-y-2">
          <label className="block text-xxs font-bold uppercase tracking-wider text-zinc-400">Source</label>
          <div className="flex flex-wrap gap-1.5">
            {LEAD_SOURCES.map((s) => {
              const active = source?.includes(s) ?? false;
              
              return (
                <button
                  type="button"
                  key={s}
                  onClick={() => toggleSource(s)}
                  className={`px-2.5 py-1.5 rounded-md text-xxs font-bold uppercase tracking-wide transition duration-150 border cursor-pointer active:scale-[0.94] ${
                    active 
                      ? 'bg-primary text-canvas border-primary shadow-[0_0_10px_rgba(250,255,105,0.15)]'
                      : 'bg-canvas text-zinc-400 border-hairline hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sort dropdown */}
        <div className="space-y-2">
          <label className="block text-xxs font-bold uppercase tracking-wider text-zinc-400">Sort By</label>
          <select
            value={sortBy || 'latest'}
            onChange={handleSortChange}
            className="w-full px-3 py-2 bg-canvas border border-hairline rounded-lg text-xs text-white focus:outline-none focus:border-primary transition"
          >
            <option value="latest">Latest Created</option>
            <option value="oldest">Oldest Created</option>
            <option value="score">Highest Score</option>
          </select>
        </div>

      </div>

    </div>
  );
};
