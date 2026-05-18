import React, { useState, useRef } from 'react';
import { csvService } from '../services/csv.service';

interface ImportCsvModalProps {
  onClose: () => void;
  onImportComplete: () => void;
}

interface IParsedLead {
  name: string;
  email: string;
  phone?: string;
  status?: string;
  source?: string;
  isValid: boolean;
  errorReason?: string;
}

export const ImportCsvModal: React.FC<ImportCsvModalProps> = ({ onClose, onImportComplete }) => {
  const [parsedLeads, setParsedLeads] = useState<IParsedLead[]>([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [commitLoading, setCommitLoading] = useState(false);
  const [report, setReport] = useState<{ imported: number; duplicates: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'valid' | 'invalid'>('valid');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseCsvText = (text: string): IParsedLead[] => {
    const lines = text.split(/\r?\n/);
    if (lines.length === 0) return [];

    // Find and normalize headers
    const rawHeaders = lines[0].split(',');
    const headers = rawHeaders.map((h) => h.trim().toLowerCase().replace(/^["']|["']$/g, ''));

    const leads: IParsedLead[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Quote-aware split
      const values: string[] = [];
      let current = '';
      let inQuotes = false;
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const rawLead: any = {};
      headers.forEach((header, idx) => {
        const val = values[idx]?.replace(/^["']|["']$/g, '').trim();
        if (header.includes('name')) rawLead.name = val;
        else if (header.includes('email')) rawLead.email = val;
        else if (header.includes('phone')) rawLead.phone = val;
        else if (header.includes('status')) rawLead.status = val;
        else if (header.includes('source')) rawLead.source = val;
      });

      const name = rawLead.name || '';
      const email = rawLead.email || '';
      const phone = rawLead.phone || undefined;
      const status = rawLead.status || 'new';
      const source = rawLead.source || 'other';

      let isValid = true;
      let errorReason = '';

      if (!name) {
        isValid = false;
        errorReason = 'Missing lead name';
      } else if (!email) {
        isValid = false;
        errorReason = 'Missing email address';
      } else if (!emailRegex.test(email)) {
        isValid = false;
        errorReason = 'Invalid email format';
      }

      leads.push({
        name,
        email,
        phone,
        status,
        source,
        isValid,
        errorReason,
      });
    }

    return leads;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setLoading(true);
    setReport(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCsvText(text);
      setParsedLeads(parsed);
      setLoading(false);
    };
    reader.onerror = () => {
      alert('Failed to read CSV file');
      setLoading(false);
    };
    reader.readAsText(file);
  };

  const handleCommit = async () => {
    const validLeads = parsedLeads.filter((l) => l.isValid);
    if (validLeads.length === 0) return;

    setCommitLoading(true);
    try {
      const result = await csvService.importLeads(validLeads);
      setReport({
        imported: result.data.importedCount,
        duplicates: result.data.duplicateCount,
      });
      onImportComplete();
    } catch (err: any) {
      alert(err.message || 'Import transaction failed');
    } finally {
      setCommitLoading(false);
    }
  };

  const validLeads = parsedLeads.filter((l) => l.isValid);
  const invalidLeads = parsedLeads.filter((l) => !l.isValid);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-surface-card text-white rounded-xl max-w-2xl w-full border border-hairline overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-scale-up">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-canvas p-5 border-b border-hairline">
          <h2 className="text-sm font-bold text-white flex items-center gap-2.5 uppercase tracking-wider">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
            Bulk Import Leads (CSV)
          </h2>
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-900 cursor-pointer transition active:scale-[0.9]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          
          {/* Instructions block */}
          {parsedLeads.length === 0 && (
            <div className="text-[11px] text-zinc-400 leading-relaxed border border-hairline bg-canvas p-4 rounded-lg space-y-2">
              <span className="font-bold text-zinc-200 block uppercase tracking-wider text-[10px]">CSV Format Guidelines:</span>
              <p>Your spreadsheet must be a valid `.csv` format including a header row with matches for:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1 text-primary font-mono">
                <li><span className="text-zinc-400">"name" (required)</span> - Full name of the lead</li>
                <li><span className="text-zinc-400">"email" (required)</span> - Valid email address</li>
                <li><span className="text-zinc-400">"phone" (optional)</span> - Mobile contact</li>
                <li><span className="text-zinc-400">"status" (optional)</span> - new, contacted, qualified, lost</li>
                <li><span className="text-zinc-400">"source" (optional)</span> - website, instagram, referral, other</li>
              </ul>
            </div>
          )}

          {/* Upload Box */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-hairline hover:border-primary bg-canvas hover:bg-zinc-900/40 p-8 rounded-xl text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3 group"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".csv" 
              className="hidden" 
            />
            <div className="w-11 h-11 rounded-full bg-surface-card flex items-center justify-center border border-hairline text-zinc-400 group-hover:text-primary group-hover:border-primary/40 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 13h6m-3-3v6m-9 1V4a2 2 0 012-2h6l2 2h6a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path></svg>
            </div>
            <div>
              <span className="text-xs font-bold text-white block">
                {fileName ? fileName : 'Select CSV Spreadsheet File'}
              </span>
              <span className="text-[10px] text-zinc-500 font-semibold block mt-1">
                {fileName ? 'Click to replace active file' : 'Drag and drop your spreadsheet or click to browse'}
              </span>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="animate-spin inline-block w-7 h-7 border-3 border-primary border-t-transparent rounded-full mb-3"></div>
              <p className="text-[11px] text-zinc-500 font-medium">Auditing record headers and email syntaxes...</p>
            </div>
          )}

          {/* Parsed Pre-commit Review Panels */}
          {!loading && parsedLeads.length > 0 && !report && (
            <div className="space-y-4">
              
              {/* Stats badges */}
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab('valid')}
                  className={`flex-1 p-3.5 rounded-lg border text-left transition flex items-center justify-between cursor-pointer active:scale-[0.98] ${
                    activeTab === 'valid'
                      ? 'bg-accent-emerald/10 border-accent-emerald/30 text-accent-emerald shadow-sm'
                      : 'bg-canvas border-hairline text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <span className="text-xs font-bold uppercase tracking-wider">Ready to Import</span>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-accent-emerald/20 text-accent-emerald font-mono">
                    {validLeads.length} rows
                  </span>
                </button>

                <button
                  onClick={() => setActiveTab('invalid')}
                  className={`flex-1 p-3.5 rounded-lg border text-left transition flex items-center justify-between cursor-pointer active:scale-[0.98] ${
                    activeTab === 'invalid'
                      ? 'bg-accent-rose/10 border-accent-rose/30 text-accent-rose shadow-sm'
                      : 'bg-canvas border-hairline text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <span className="text-xs font-bold uppercase tracking-wider">Format Errors</span>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-accent-rose/20 text-accent-rose font-mono">
                    {invalidLeads.length} rows
                  </span>
                </button>
              </div>

              {/* Grid Preview Table */}
              <div className="border border-hairline bg-canvas rounded-xl overflow-hidden max-h-[220px] overflow-y-auto scrollbar-thin">
                <table className="w-full text-left border-collapse text-[11px] font-mono">
                  <thead>
                    <tr className="bg-zinc-900 border-b border-hairline text-zinc-500 uppercase tracking-wider font-bold text-[9px]">
                      <th className="px-4 py-3">Lead Name</th>
                      <th className="px-4 py-3">Email Address</th>
                      <th className="px-4 py-3">{activeTab === 'valid' ? 'Parameters' : 'Error details'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline/40">
                    {(activeTab === 'valid' ? validLeads : invalidLeads).map((l, idx) => (
                      <tr key={idx} className="hover:bg-zinc-900/35">
                        <td className="px-4 py-3 font-bold text-white truncate max-w-[120px]">{l.name || '—'}</td>
                        <td className="px-4 py-3 text-zinc-400 truncate max-w-[180px]">{l.email || '—'}</td>
                        <td className="px-4 py-3">
                          {l.isValid ? (
                            <span className="text-[9px] px-2 py-0.5 rounded bg-surface-card border border-hairline text-zinc-300 uppercase font-bold">
                              {l.source} / {l.status}
                            </span>
                          ) : (
                            <span className="text-[10px] text-accent-rose font-bold">{l.errorReason}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {(activeTab === 'valid' ? validLeads : invalidLeads).length === 0 && (
                      <tr>
                        <td colSpan={3} className="text-center py-8 text-zinc-600 text-xs italic font-semibold">
                          No audited rows recorded in this state.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* Success Report Panel */}
          {report && (
            <div className="border border-primary/20 bg-primary/5 rounded-xl p-5 text-center space-y-4 animate-fade-in">
              <div className="w-11 h-11 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mx-auto">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h3 className="font-bold text-white text-sm uppercase tracking-wider">Bulk Import Transaction Completed!</h3>
              <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto text-xs pt-2">
                <div className="bg-canvas p-3 rounded-lg border border-hairline text-center">
                  <span className="text-zinc-500 block text-[9px] uppercase font-bold mb-0.5">Leads Inserted</span>
                  <span className="text-base font-extrabold text-primary font-mono">{report.imported}</span>
                </div>
                <div className="bg-canvas p-3 rounded-lg border border-hairline text-center">
                  <span className="text-zinc-500 block text-[9px] uppercase font-bold mb-0.5">Duplicates Filtered</span>
                  <span className="text-base font-extrabold text-zinc-400 font-mono">{report.duplicates}</span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-canvas border-t border-hairline flex justify-end gap-3">
          <button 
            onClick={onClose} 
            className="btn-secondary"
          >
            {report ? 'Close Wizard' : 'Cancel'}
          </button>
          
          {parsedLeads.length > 0 && !report && (
            <button
              onClick={handleCommit}
              disabled={commitLoading || validLeads.length === 0}
              className="btn-primary"
            >
              {commitLoading ? 'Saving leads...' : `Commit ${validLeads.length} Lead Records`}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
