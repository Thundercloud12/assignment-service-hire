import React, { useState, useEffect } from 'react';
import { FilterPanel } from '../components/FilterPanel';
import { LeadsList } from '../components/LeadsList';
import { KanbanBoard } from '../components/KanbanBoard';
import { Pagination } from '../components/Pagination';
import { LeadDetailsModal } from '../components/LeadDetailsModal';
import { ImportCsvModal } from '../components/ImportCsvModal';
import { MergeDuplicatesModal } from '../components/MergeDuplicatesModal';
import { useFilterStore } from '../store/filter.store';
import { leadService } from '../services/lead.service';
import { csvService } from '../services/csv.service';
import { useNotificationStore } from '../store/notification.store';
import type { ILead, LeadSource } from '../types/lead';

export const LeadsPage: React.FC = () => {
  const { page, limit, pagination, status, source, search, sortBy } = useFilterStore();
  const [viewType, setViewType] = useState<'table' | 'kanban'>('table');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modal open states
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showMergeModal, setShowMergeModal] = useState(false);

  // Lead creation form states
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPhone, setCreatePhone] = useState('');
  const [createSource, setCreateSource] = useState<LeadSource>('website');
  const [createLoading, setCreateLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  // Kanban Specific leads loading (requires larger pagination limit to fit cards)
  const [kanbanLeads, setKanbanLeads] = useState<ILead[]>([]);
  const [kanbanLoading, setKanbanLoading] = useState(false);

  const fetchKanbanLeads = async () => {
    try {
      setKanbanLoading(true);
      const result = await leadService.getLeads({
        status,
        source,
        search,
        sortBy,
        page: 1,
        limit: 100, // Load all relevant leads to show across Kanban columns
      });
      setKanbanLeads(result.data ?? []);
    } catch (err) {
      console.error('Failed to load Kanban leads', err);
    } finally {
      setKanbanLoading(false);
    }
  };

  useEffect(() => {
    if (viewType === 'kanban') {
      fetchKanbanLeads();
    }
  }, [viewType, status, source, search, sortBy, refreshTrigger]);

  const handleLeadUpdated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleKanbanStatusChange = async (leadId: string, newStatus: any) => {
    try {
      await leadService.updateLead(leadId, { status: newStatus });
      handleLeadUpdated();
    } catch (err: any) {
      const addToast = useNotificationStore.getState().addToast;
      addToast(err.message || 'Failed to update lead status', 'error');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const addToast = useNotificationStore.getState().addToast;

    // 1. Client-Side Field Validation
    if (!createName.trim()) {
      addToast('Name is a required field', 'error');
      return;
    }
    if (!createEmail.trim()) {
      addToast('Email is a required field', 'error');
      return;
    }
    if (!createSource) {
      addToast('Source is a required field', 'error');
      return;
    }

    // 2. Client-Side Constraint Checks
    if (createName.trim().length < 2) {
      addToast('Name must be at least 2 characters long', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(createEmail.trim())) {
      addToast('Please provide a valid email address (e.g. user@example.com)', 'error');
      return;
    }

    setCreateLoading(true);
    try {
      await leadService.createLead({
        name: createName.trim(),
        email: createEmail.trim(),
        phone: createPhone.trim() || undefined,
        source: createSource,
      });
      
      // Clear form
      setCreateName('');
      setCreateEmail('');
      setCreatePhone('');
      setCreateSource('website');
      setShowCreateModal(false);

      handleLeadUpdated();
      addToast('Lead record created successfully!', 'success');
    } catch (err: any) {
      const responseErrors = err.response?.data?.errors;
      if (Array.isArray(responseErrors) && responseErrors.length > 0) {
        responseErrors.forEach((issue: any) => {
          addToast(`${issue.field}: ${issue.message}`, 'error');
        });
      } else {
        addToast(err.response?.data?.message || err.message || 'Failed to create lead', 'error');
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const handleExportCsv = async () => {
    try {
      setExportLoading(true);
      await csvService.exportLeads({
        status,
        source,
        search,
        sortBy,
      });
    } catch (err: any) {
      alert(err.message || 'Failed to export current leads list');
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas text-white p-8 lg:p-10 animate-fade-in">
      <div className="w-full max-w-[1280px] mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-4 border-b border-hairline pb-6">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight leading-none mb-2">Leads Manager</h1>
            <p className="text-zinc-400 text-xs font-medium">Review sales status funnels, perform de-duplication merges, and inspect activities.</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Switcher */}
            <div className="flex bg-surface-card rounded-lg p-1 border border-hairline">
              <button
                onClick={() => setViewType('table')}
                className={`px-3.5 py-1.5 rounded text-xs font-bold transition duration-155 active:scale-[0.96] cursor-pointer ${
                  viewType === 'table' ? 'bg-primary text-canvas' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Table View
              </button>
              <button
                onClick={() => setViewType('kanban')}
                className={`px-3.5 py-1.5 rounded text-xs font-bold transition duration-155 active:scale-[0.96] cursor-pointer ${
                  viewType === 'kanban' ? 'bg-primary text-canvas' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Kanban Board
              </button>
            </div>

            {/* CSV & Deduplication Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleExportCsv}
                disabled={exportLoading}
                className="btn-secondary transition duration-155"
                title="Export current filtered list to CSV spreadsheet"
              >
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M4 12l8 8m0 0l8-8m-8 8V4"></path></svg>
                {exportLoading ? 'Exporting...' : 'Export CSV'}
              </button>

              <button
                onClick={() => setShowImportModal(true)}
                className="btn-secondary transition duration-155"
                title="Upload list of leads from a CSV spreadsheet"
              >
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
                Import CSV
              </button>

              <button
                onClick={() => setShowMergeModal(true)}
                className="btn-secondary transition duration-155"
                title="Scan database and merge duplicate profiles"
              >
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                Deduplicate
              </button>
            </div>

            {/* Create Button */}
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary transition duration-155"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path></svg>
              Create Lead
            </button>
          </div>
        </div>

        {/* Content Layout */}
        <div className="space-y-6">
          
          {/* Top Filter Panel */}
          <FilterPanel />

          {viewType === 'table' ? (
            <div className="space-y-6">
              <LeadsList
                onLeadClick={(lead) => setSelectedLeadId(lead.id)}
                refreshTrigger={refreshTrigger}
              />
              
              {pagination && pagination.totalPages > 1 && (
                <Pagination
                  total={pagination.total}
                  page={page ?? 1}
                  limit={limit ?? 10}
                  totalPages={pagination.totalPages}
                />
              )}
            </div>
          ) : (
            /* Kanban Board View */
            <>
              {kanbanLoading ? (
                <div className="text-center py-20 text-zinc-500 animate-pulse font-medium text-sm">Loading board cards...</div>
              ) : (
                <KanbanBoard
                  leads={kanbanLeads}
                  onLeadClick={(lead) => setSelectedLeadId(lead.id)}
                  onStatusChange={handleKanbanStatusChange}
                />
              )}
            </>
          )}
        </div>

        {/* PROFILE MODAL POPUP */}
        {selectedLeadId && (
          <LeadDetailsModal
            leadId={selectedLeadId}
            onClose={() => setSelectedLeadId(null)}
            onLeadUpdated={handleLeadUpdated}
          />
        )}

        {/* NEW LEAD CREATION MODAL OVERLAY */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-surface-card border border-hairline text-white rounded-xl max-w-md w-full shadow-2xl overflow-hidden animate-scale-up">
              <div className="flex justify-between items-center bg-canvas/30 p-6 border-b border-hairline">
                <h3 className="text-sm font-bold text-white tracking-tight uppercase">Add New Lead</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-zinc-500 hover:text-white transition duration-155 active:scale-[0.9] cursor-pointer">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Name</label>
                  <input
                    type="text"
                    required
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    placeholder="Sarah Connor"
                    className="w-full input-dark"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Email</label>
                  <input
                    type="email"
                    required
                    value={createEmail}
                    onChange={(e) => setCreateEmail(e.target.value)}
                    placeholder="sarah@sky.net"
                    className="w-full input-dark"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Phone</label>
                  <input
                    type="text"
                    value={createPhone}
                    onChange={(e) => setCreatePhone(e.target.value)}
                    placeholder="+1 (555) 019-2834 (Optional)"
                    className="w-full input-dark"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Source</label>
                  <select
                    value={createSource}
                    onChange={(e) => setCreateSource(e.target.value as LeadSource)}
                    className="w-full input-dark bg-zinc-900"
                  >
                    <option value="website">Website</option>
                    <option value="instagram">Instagram</option>
                    <option value="referral">Referral</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-hairline">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createLoading}
                    className="btn-primary"
                  >
                    {createLoading ? 'Creating...' : 'Create Lead'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* IMPORT CSV MODAL OVERLAY */}
        {showImportModal && (
          <ImportCsvModal
            onClose={() => setShowImportModal(false)}
            onImportComplete={handleLeadUpdated}
          />
        )}

        {/* DEDUPLICATE MERGE WIZARD OVERLAY */}
        {showMergeModal && (
          <MergeDuplicatesModal
            onClose={() => setShowMergeModal(false)}
            onMergeComplete={handleLeadUpdated}
          />
        )}

      </div>
    </div>
  );
};
