import React, { useState, useEffect } from 'react';
import { duplicateService, type IDuplicateGroup } from '../services/duplicate.service';

interface MergeDuplicatesModalProps {
  onClose: () => void;
  onMergeComplete: () => void;
}

export const MergeDuplicatesModal: React.FC<MergeDuplicatesModalProps> = ({ onClose, onMergeComplete }) => {
  const [groups, setGroups] = useState<IDuplicateGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [mergingId, setMergingId] = useState<string | null>(null);
  
  // Selection states for each group index
  const [primarySelections, setPrimarySelections] = useState<Record<number, string>>({});
  const [secondarySelections, setSecondarySelections] = useState<Record<number, string>>({});

  const fetchDuplicates = async () => {
    try {
      setLoading(true);
      const data = await duplicateService.scanDuplicates();
      setGroups(data);

      // Automatically default selections (first lead as primary, second as secondary)
      const initialPrimaries: Record<number, string> = {};
      const initialSecondaries: Record<number, string> = {};
      data.forEach((group, idx) => {
        if (group.leads.length >= 2) {
          initialPrimaries[idx] = group.leads[0].id;
          initialSecondaries[idx] = group.leads[1].id;
        }
      });
      setPrimarySelections(initialPrimaries);
      setSecondarySelections(initialSecondaries);
    } catch (err) {
      console.error('Failed to scan for duplicate leads', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuplicates();
  }, []);

  const handleSelectPrimary = (groupIdx: number, leadId: string) => {
    setPrimarySelections((prev) => ({ ...prev, [groupIdx]: leadId }));
    
    // Auto-adjust secondary selection if it collides
    const currentSecondary = secondarySelections[groupIdx];
    if (currentSecondary === leadId) {
      const group = groups[groupIdx];
      const otherLead = group.leads.find((l) => l.id !== leadId);
      if (otherLead) {
        setSecondarySelections((prev) => ({ ...prev, [groupIdx]: otherLead.id }));
      }
    }
  };

  const handleSelectSecondary = (groupIdx: number, leadId: string) => {
    setSecondarySelections((prev) => ({ ...prev, [groupIdx]: leadId }));

    // Auto-adjust primary selection if it collides
    const currentPrimary = primarySelections[groupIdx];
    if (currentPrimary === leadId) {
      const group = groups[groupIdx];
      const otherLead = group.leads.find((l) => l.id !== leadId);
      if (otherLead) {
        setPrimarySelections((prev) => ({ ...prev, [groupIdx]: otherLead.id }));
      }
    }
  };

  const handleMerge = async (groupIdx: number) => {
    const primaryId = primarySelections[groupIdx];
    const duplicateId = secondarySelections[groupIdx];

    if (!primaryId || !duplicateId || primaryId === duplicateId) {
      alert('Please select two distinct leads to merge');
      return;
    }

    const group = groups[groupIdx];
    const primaryLead = group.leads.find((l) => l.id === primaryId);
    const duplicateLead = group.leads.find((l) => l.id === duplicateId);

    const isConfirmed = window.confirm(
      `Are you sure you want to merge duplicate lead "${duplicateLead?.name}" into master record "${primaryLead?.name}"?\n\nThis will safely merge all timelines and delete "${duplicateLead?.name}". This action is irreversible.`
    );

    if (!isConfirmed) return;

    setMergingId(duplicateId);
    try {
      await duplicateService.mergeLeads(primaryId, duplicateId);
      onMergeComplete();
      
      // Re-scan remaining duplicates
      await fetchDuplicates();
    } catch (err: any) {
      alert(err.message || 'Deduplication merge failed');
    } finally {
      setMergingId(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-surface-card text-white rounded-xl max-w-3xl w-full border border-hairline overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-scale-up">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-canvas p-5 border-b border-hairline">
          <h2 className="text-sm font-bold text-white flex items-center gap-2.5 uppercase tracking-wider">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
            Lead Deduplication & Merging
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-900 cursor-pointer transition active:scale-[0.9]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          
          {loading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin inline-block w-8 h-8 border-3 border-primary border-t-transparent rounded-full mb-3"></div>
              <p className="text-[11px] text-zinc-500 font-medium">Scanning database for duplicate profile groupings...</p>
            </div>
          )}

          {!loading && groups.length === 0 && (
            <div className="border border-primary/20 bg-primary/5 rounded-xl p-8 text-center space-y-4 max-w-md mx-auto my-8 animate-fade-in">
              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mx-auto">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              </div>
              <h3 className="font-bold text-white text-sm uppercase tracking-wider">Zero Duplicates Found!</h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                Excellent! All email profiles and names are unique. No deduplication or merging actions are currently required.
              </p>
            </div>
          )}

          {!loading && groups.length > 0 && (
            <div className="space-y-6">
              <p className="text-[11px] text-zinc-400 leading-relaxed bg-canvas p-3 rounded-lg border border-hairline">
                💡 **Instruction:** We found leads sharing matching names or emails. Select which record is the primary **Master** (keeps primary profile details) and which is the **Duplicate** (deletes profile but copies phone, custom fields, and merges all email histories/activity feeds!).
              </p>

              {groups.map((group, groupIdx) => {
                const primaryId = primarySelections[groupIdx];
                const duplicateId = secondarySelections[groupIdx];

                return (
                  <div key={groupIdx} className="border border-hairline bg-canvas rounded-xl overflow-hidden shadow-sm space-y-4 p-5">
                    
                    {/* Badge */}
                    <div className="flex justify-between items-center pb-3.5 border-b border-hairline">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] px-2 py-0.5 rounded font-extrabold uppercase bg-primary/10 text-primary border border-primary/20">
                          Match: {group.field}
                        </span>
                        <span className="text-xs font-bold text-white">"{group.value}"</span>
                      </div>
                      
                      <button
                        onClick={() => handleMerge(groupIdx)}
                        disabled={mergingId !== null}
                        className="btn-primary"
                      >
                        {mergingId === duplicateId ? 'Merging...' : 'Merge Cluster'}
                      </button>
                    </div>

                    {/* Side-by-side leads cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {group.leads.map((lead) => {
                        const isSelectedPrimary = primaryId === lead.id;
                        const isSelectedSecondary = duplicateId === lead.id;

                        return (
                          <div 
                            key={lead.id} 
                            className={`p-4 rounded-lg border transition space-y-3 ${
                              isSelectedPrimary ? 'bg-primary/5 border-primary/50 text-primary shadow-[0_0_15px_rgba(250,255,105,0.08)]' : 
                              isSelectedSecondary ? 'bg-accent-rose/5 border-accent-rose/30 text-accent-rose' : 
                              'bg-surface-card border-hairline'
                            }`}
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div>
                                <h4 className="font-bold text-white text-xs">{lead.name}</h4>
                                <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{lead.email}</p>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-canvas text-zinc-400 font-bold border border-hairline font-mono">
                                {lead.leadScore} pts
                              </span>
                            </div>

                            {/* Meta properties */}
                            <div className="grid grid-cols-2 gap-2 text-[10px] text-zinc-400 pt-2 border-t border-hairline/60 leading-relaxed font-semibold">
                              <div>Source: <span className="text-zinc-200 capitalize font-bold">{lead.source}</span></div>
                              <div>Status: <span className="text-zinc-200 capitalize font-bold">{lead.status}</span></div>
                              <div className="col-span-2">Created: <span className="text-zinc-200 font-bold font-mono">{new Date(lead.createdAt).toLocaleDateString()}</span></div>
                              <div className="col-span-2">Phone: <span className="text-zinc-200 font-bold font-mono">{lead.phone || '—'}</span></div>
                            </div>

                            {/* Select Option Row */}
                            <div className="flex gap-4 pt-3 border-t border-hairline/60 text-[10px] font-bold">
                              <label className="flex items-center gap-1.5 cursor-pointer text-primary">
                                <input
                                  type="radio"
                                  name={`primary-${groupIdx}`}
                                  checked={isSelectedPrimary}
                                  onChange={() => handleSelectPrimary(groupIdx, lead.id)}
                                  className="accent-primary"
                                />
                                Set Master
                              </label>

                              <label className="flex items-center gap-1.5 cursor-pointer text-accent-rose">
                                <input
                                  type="radio"
                                  name={`secondary-${groupIdx}`}
                                  checked={isSelectedSecondary}
                                  onChange={() => handleSelectSecondary(groupIdx, lead.id)}
                                  className="accent-accent-rose"
                                />
                                Set Duplicate
                              </label>
                            </div>

                          </div>
                        );
                      })}
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-canvas border-t border-hairline flex justify-end">
          <button 
            onClick={onClose} 
            className="btn-secondary"
          >
            Close Scanner
          </button>
        </div>

      </div>
    </div>
  );
};
