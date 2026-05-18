import React from 'react';
import type { ILead, LeadStatus } from '../types/lead';

interface KanbanBoardProps {
  leads: ILead[];
  onLeadClick: (lead: ILead) => void;
  onStatusChange: (leadId: string, newStatus: LeadStatus) => void;
}

const COLUMNS: { id: LeadStatus; label: string; border: string }[] = [
  { id: 'new', label: 'New', border: 'border-t-4 border-blue-500' },
  { id: 'contacted', label: 'Contacted', border: 'border-t-4 border-purple-500' },
  { id: 'qualified', label: 'Qualified', border: 'border-t-4 border-accent-emerald' },
  { id: 'lost', label: 'Lost', border: 'border-t-4 border-accent-rose' },
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ leads, onLeadClick, onStatusChange }) => {
  const getLeadsByStatus = (status: LeadStatus) => {
    return leads.filter((lead) => lead.status === status);
  };

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('text/plain', leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: LeadStatus) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain');
    if (leadId) {
      onStatusChange(leadId, targetStatus);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 60) return 'bg-accent-emerald/10 text-accent-emerald border border-accent-emerald/20';
    if (score >= 30) return 'bg-primary/10 text-primary border border-primary/20';
    return 'bg-accent-rose/10 text-accent-rose border border-accent-rose/20';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in">
      {COLUMNS.map((column) => {
        const columnLeads = getLeadsByStatus(column.id);
        return (
          <div
            key={column.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
            className={`flex flex-col bg-surface-card rounded-xl p-4 min-h-[520px] border border-hairline shadow-lg ${column.border}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-hairline">
              <h3 className="text-xs font-bold text-white capitalize tracking-wider uppercase">{column.label}</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-canvas border border-hairline text-zinc-400">
                {columnLeads.length}
              </span>
            </div>

            {/* Cards Container */}
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[600px] scrollbar-thin">
              {columnLeads.length === 0 ? (
                <div className="flex items-center justify-center h-28 border border-dashed border-hairline rounded-lg text-xs text-zinc-500 font-medium bg-canvas/30">
                  Drag leads here
                </div>
              ) : (
                columnLeads.map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    onClick={() => onLeadClick(lead)}
                    className="p-4 bg-canvas rounded-lg border border-hairline hover:border-primary/30 hover:bg-surface-elevated/20 cursor-grab active:cursor-grabbing transition duration-150 ease-in-out shadow active:scale-[0.97] group"
                  >
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <h4 className="font-bold text-white group-hover:text-primary transition-colors text-xs truncate max-w-[70%]">
                        {lead.name}
                      </h4>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold font-mono border ${getScoreColor(lead.leadScore)}`}>
                        {lead.leadScore}
                      </span>
                    </div>

                    <p className="text-[11px] text-zinc-400 truncate mb-3 font-mono">{lead.email}</p>

                    <div className="flex justify-between items-center text-[10px] text-zinc-500 border-t border-hairline/50 pt-2.5">
                      <span className="capitalize bg-surface-card border border-hairline px-2 py-0.5 rounded text-zinc-400 font-semibold">
                        {lead.source}
                      </span>
                      <span className="font-medium font-mono text-[9px]">
                        {new Date(lead.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
