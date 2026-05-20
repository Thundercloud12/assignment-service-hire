import React, { useState, useEffect } from 'react';
import type { ILead, LeadStatus, LeadSource } from '../types/lead';
import { leadService } from '../services/lead.service';
import { authService } from '../services/auth.service';
import { activityService, type IActivityData } from '../services/activity.service';
import { emailService, type IEmailTemplate, type IEmailHistoryData } from '../services/email.service';
import { aiService as frontendAiService } from '../services/ai.service';
import type { IUser } from '../types/auth';
import { useAuthStore } from '../store/auth.store';
import { useNotificationStore } from '../store/notification.store';
import { ScoreInfluencerGraph } from './ScoreInfluencerGraph';
import { graphService, type IScoreInfluencerData } from '../services/graph.service';

interface LeadDetailsModalProps {
  leadId: string;
  onClose: () => void;
  onLeadUpdated: () => void;
}

type TabType = 'general' | 'timeline' | 'emails' | 'influencers';

export const LeadDetailsModal: React.FC<LeadDetailsModalProps> = ({ leadId, onClose, onLeadUpdated }) => {
  const { user: currentUser } = useAuthStore();
  const [lead, setLead] = useState<ILead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Tab control
  const [activeTab, setActiveTab] = useState<TabType>('general');

  // Available users for assignment
  const [users, setUsers] = useState<IUser[]>([]);

  // Form states (General)
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<LeadStatus>('new');
  const [source, setSource] = useState<LeadSource>('website');
  const [assignedTo, setAssignedTo] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  // Timeline / Notes state
  const [activities, setActivities] = useState<IActivityData[]>([]);
  const [note, setNote] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);

  // Emails states
  const [templates, setTemplates] = useState<IEmailTemplate[]>([]);
  const [emailHistory, setEmailHistory] = useState<IEmailHistoryData[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [showSendEmailForm, setShowSendEmailForm] = useState(false);

  // AI Copilot States
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);
  const [composerSubject, setComposerSubject] = useState('');
  const [composerBody, setComposerBody] = useState('');
  const [aiLoading, setAILoading] = useState(false);

  // Score influencer graph states
  const [scoreGraphData, setScoreGraphData] = useState<IScoreInfluencerData | null>(null);
  const [scoreGraphLoading, setScoreGraphLoading] = useState(false);

  // Fetch full details
  const fetchLeadDetails = async () => {
    try {
      if (!lead) setLoading(true);
      setError('');
      const data = await leadService.getLeadById(leadId);
      setLead(data);
      
      // Initialize form
      setName(data.name);
      setEmail(data.email);
      setPhone(data.phone || '');
      setStatus(data.status);
      setSource(data.source);
      setAssignedTo(data.assignedTo || '');

      // Refresh score graph in background if influencers tab is active
      if (activeTab === 'influencers') {
        fetchScoreGraph(true);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch details');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await authService.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users', err);
    }
  };

  const fetchTimeline = async () => {
    try {
      const result = await activityService.getActivities(leadId, 1, 50);
      setActivities(result.data);
    } catch (err) {
      console.error('Failed to load activity logs', err);
    }
  };

  const fetchEmailLogs = async () => {
    try {
      const data = await emailService.getEmailHistory(leadId);
      setEmailHistory(data);
    } catch (err) {
      console.error('Failed to load email logs', err);
    }
  };

  const fetchTemplates = async () => {
    try {
      const data = await emailService.getTemplates();
      setTemplates(data);
    } catch (err) {
      console.error('Failed to load email templates', err);
    }
  };

  const fetchScoreGraph = async (silent = false) => {
    try {
      if (!silent) setScoreGraphLoading(true);
      const data = await graphService.getScoreInfluencer(leadId);
      setScoreGraphData(data);
    } catch (err) {
      console.error('Failed to load score graph factors', err);
    } finally {
      if (!silent) setScoreGraphLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadDetails();
    fetchUsers();
    fetchTimeline();
    fetchEmailLogs();
    fetchTemplates();
  }, [leadId]);

  useEffect(() => {
    if (activeTab === 'influencers') {
      fetchScoreGraph();
    }
  }, [activeTab, leadId]);

  // Handle Updates
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const addToast = useNotificationStore.getState().addToast;

    // 1. Client-Side Field Validation
    if (!name.trim()) {
      addToast('Name is a required field', 'error');
      return;
    }
    if (!email.trim()) {
      addToast('Email is a required field', 'error');
      return;
    }
    if (!source) {
      addToast('Source is a required field', 'error');
      return;
    }

    // 2. Client-Side Constraint Checks
    if (name.trim().length < 2) {
      addToast('Name must be at least 2 characters long', 'error');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      addToast('Please provide a valid email address (e.g. user@example.com)', 'error');
      return;
    }

    setSaveLoading(true);
    try {
      const updated = await leadService.updateLead(leadId, {
        name,
        email,
        phone: phone || undefined,
        status,
        source,
        assignedTo: assignedTo || undefined,
      });
      setLead(updated);
      onLeadUpdated();
      fetchTimeline(); // Logged changes will show in timeline
      addToast('Lead record updated successfully!', 'success');
    } catch (err: any) {
      const responseErrors = err.response?.data?.errors;
      if (Array.isArray(responseErrors) && responseErrors.length > 0) {
        responseErrors.forEach((issue: any) => {
          addToast(`${issue.field}: ${issue.message}`, 'error');
        });
      } else {
        addToast(err.response?.data?.message || err.message || 'Failed to save changes', 'error');
      }
    } finally {
      setSaveLoading(false);
    }
  };

  // Add Manual Note
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    const addToast = useNotificationStore.getState().addToast;
    if (!note.trim()) {
      addToast('Note content cannot be empty', 'error');
      return;
    }
    setNoteLoading(true);
    try {
      await activityService.addNote(leadId, note);
      setNote('');
      fetchTimeline();
      // Scoring increases +5 pts for notes
      fetchLeadDetails(); 
      onLeadUpdated();
      addToast('Note posted successfully!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to post note', 'error');
    } finally {
      setNoteLoading(false);
    }
  };

  // Handle Template Selection & Variable Hydration
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (!templateId) {
      setComposerSubject('');
      setComposerBody('');
      return;
    }
    const template = templates.find((t) => t._id === templateId);
    if (template && lead) {
      let subj = template.subject;
      let bod = template.body;
      const variablesMap: Record<string, string> = {
        name: lead.name,
        email: lead.email,
        phone: lead.phone || '',
        status: lead.status,
        source: lead.source,
      };
      Object.entries(variablesMap).forEach(([key, val]) => {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
        subj = subj.replace(regex, val);
        bod = bod.replace(regex, val);
      });
      setComposerSubject(subj);
      setComposerBody(bod);
    }
  };

  // Send Email
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const addToast = useNotificationStore.getState().addToast;
    if (!composerSubject.trim() || !composerBody.trim()) {
      addToast('Please provide both a subject and a body for the email', 'error');
      return;
    }
    setEmailLoading(true);
    try {
      await emailService.sendCustomEmail(leadId, composerSubject, composerBody);
      setComposerSubject('');
      setComposerBody('');
      setSelectedTemplateId('');
      setShowSendEmailForm(false);
      fetchEmailLogs();
      fetchTimeline();
      fetchLeadDetails(); // Score updates (+5 pts sent)
      onLeadUpdated();
      addToast('Email dispatched successfully!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to send email', 'error');
    } finally {
      setEmailLoading(false);
    }
  };

  // Trigger Context-Aware AI Generation
  const handleGenerateAIDraft = async () => {
    const addToast = useNotificationStore.getState().addToast;
    setAILoading(true);
    try {
      const draft = await frontendAiService.generateEmailDraft(leadId, selectedTemplateId || null);
      
      let subject = 'AI Draft';
      let body = draft;

      const subjectMatch = draft.match(/^Subject:\s*(.+)$/im);
      if (subjectMatch) {
        subject = subjectMatch[1].trim();
        body = draft.replace(/^Subject:\s*(.+)$\n*/im, '').trim();
      }

      setComposerSubject(subject);
      setComposerBody(body);
      setShowSendEmailForm(true);
      addToast('AI sales copilot draft generated successfully! You can now review and edit it.', 'success');
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to generate AI email draft';
      addToast(errMsg, 'error');
    } finally {
      setAILoading(false);
    }
  };



  const getScoreColor = (score: number) => {
    if (score >= 60) return 'text-accent-emerald bg-accent-emerald/10 border-accent-emerald/20';
    if (score >= 30) return 'text-primary bg-primary/10 border-primary/20';
    return 'text-accent-rose bg-accent-rose/10 border-accent-rose/20';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-surface-card text-white p-8 rounded-xl max-w-sm w-full text-center border border-hairline">
          <div className="animate-spin inline-block w-8 h-8 border-3 border-primary border-t-transparent rounded-full mb-4"></div>
          <p className="text-zinc-500 text-xs font-semibold">Loading profile timelines...</p>
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-surface-card text-white p-8 rounded-xl max-w-sm w-full text-center border border-hairline space-y-4">
          <p className="text-accent-rose text-xs font-bold font-mono">⚠️ {error || 'Lead not found'}</p>
          <button onClick={onClose} className="btn-secondary w-full">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 p-4 overflow-y-auto animate-fade-in">
      <div className="bg-surface-card text-white rounded-xl max-w-7xl w-[98%] border border-hairline shadow-2xl flex flex-col my-8 animate-scale-up">
        
        {/* Modal Header */}
        <div className="flex justify-between items-start bg-canvas p-6 border-b border-hairline">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-white tracking-tight">{lead.name}</h2>
              <span className={`px-2 py-0.5 text-[10px] font-bold rounded border font-mono ${getScoreColor(lead.leadScore)}`}>
                {lead.leadScore} pts
              </span>
            </div>
            <p className="text-xs text-zinc-400 font-mono">{lead.email}</p>
          </div>
          
          <button onClick={onClose} className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-900 cursor-pointer transition active:scale-[0.9]">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {/* Inner layout split */}
        <div className="flex flex-col md:flex-row flex-1">
          
          {/* Main content Area with tabs */}
          <div className="flex-1 p-6 border-b md:border-b-0 md:border-r border-hairline">
            
            {/* Tabs Selector */}
            <div className="flex border-b border-hairline mb-6 gap-6 text-xs font-bold uppercase tracking-wider">
              <button
                onClick={() => setActiveTab('general')}
                className={`pb-3 border-b-2 cursor-pointer transition-colors ${
                  activeTab === 'general' ? 'border-primary text-primary' : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Overview & Edit
              </button>
              <button
                onClick={() => setActiveTab('timeline')}
                className={`pb-3 border-b-2 cursor-pointer transition-colors ${
                  activeTab === 'timeline' ? 'border-primary text-primary' : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Notes & Timeline
              </button>
              <button
                onClick={() => setActiveTab('emails')}
                className={`pb-3 border-b-2 cursor-pointer transition-colors ${
                  activeTab === 'emails' ? 'border-primary text-primary' : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Outbound Emails
              </button>
              <button
                onClick={() => setActiveTab('influencers')}
                className={`pb-3 border-b-2 cursor-pointer transition-colors ${
                  activeTab === 'influencers' ? 'border-primary text-primary' : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Score Factors Graph
              </button>
            </div>

            {/* TAB PANELS */}

            {/* 1. General Profile & Edit */}
            {activeTab === 'general' && (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full input-dark"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full input-dark"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Phone</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full input-dark"
                      placeholder="Optional"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Source</label>
                    <select
                      value={source}
                      onChange={(e) => setSource(e.target.value as LeadSource)}
                      className="w-full input-dark bg-zinc-900"
                    >
                      <option value="website">Website</option>
                      <option value="instagram">Instagram</option>
                      <option value="referral">Referral</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as LeadStatus)}
                      className="w-full input-dark bg-zinc-900"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="qualified">Qualified</option>
                      <option value="lost">Lost</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Assign Owner {currentUser?.role !== 'admin' && <span className="text-[9px] text-zinc-500 font-normal lowercase">(Admins only)</span>}
                    </label>
                    <select
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                      disabled={currentUser?.role !== 'admin'}
                      className="w-full input-dark bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Unassigned</option>
                      {users
                        .filter((u) => u.role === 'sales_user')
                        .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.fullName} (Sales Rep)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-hairline">
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="btn-primary"
                  >
                    {saveLoading ? 'Saving...' : 'Save Updates'}
                  </button>
                </div>
              </form>
            )}

            {/* 2. Timeline & Note taking */}
            {activeTab === 'timeline' && (
              <div className="space-y-6">
                
                {/* Note creation box */}
                <form onSubmit={handleAddNote} className="space-y-2">
                  <textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Type a new update, follow-up log, or custom note..."
                    className="w-full p-3 bg-canvas border border-hairline rounded-lg text-xs text-white focus:outline-none focus:border-primary outline-none"
                    required
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={noteLoading || !note.trim()}
                      className="btn-secondary px-4 py-2 text-xxs font-bold uppercase"
                    >
                      {noteLoading ? 'Posting...' : 'Add Log Entry'}
                    </button>
                  </div>
                </form>

                {/* Timeline Feed */}
                <div className="relative pl-6 border-l border-hairline space-y-5 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                  {activities.length === 0 ? (
                    <div className="text-zinc-500 text-xs py-4 pl-2 font-semibold uppercase">No timeline logs recorded yet.</div>
                  ) : (
                    activities.map((act) => (
                      <div key={act._id} className="relative group text-xs">
                        
                        {/* Bullet point on left border */}
                        <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-canvas bg-primary shadow-[0_0_10px_rgba(250,255,105,0.4)]"></div>
                        
                        <div className="bg-canvas p-3 rounded-lg border border-hairline">
                          <div className="flex justify-between items-center mb-1 text-[10px]">
                            <span className="font-bold text-zinc-300 capitalize">
                              {act.actionType.replace(/_/g, ' ')}
                            </span>
                            <span className="text-zinc-500 font-mono">
                              {new Date(act.createdAt).toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          {/* Dynamic description of changes */}
                          <div className="text-zinc-400 text-xs mt-1.5">
                            {act.actionType === 'note_added' && (
                              <p className="italic text-white">"{act.newValue}"</p>
                            )}
                            {act.actionType === 'status_changed' && (
                              <p>
                                Status moved from <span className="text-accent-rose font-bold capitalize">"{act.oldValue || 'none'}"</span> to{' '}
                                <span className="text-accent-emerald font-bold capitalize">"{act.newValue}"</span>
                              </p>
                            )}
                            {act.actionType === 'assigned_to_user' && (
                              <p>Lead ownership assigned</p>
                            )}
                            {act.actionType === 'email_sent' && (
                              <p>Outbound email dispatched: <span className="text-primary font-bold">"{act.newValue}"</span></p>
                            )}
                            {act.actionType === 'email_opened' && (
                              <p>Recipient opened email: <span className="text-zinc-200 font-bold">"{act.newValue}"</span></p>
                            )}
                            {act.actionType === 'email_clicked' && (
                              <p>Recipient clicked link inside: <span className="text-primary font-bold">"{act.newValue}"</span></p>
                            )}
                            {act.actionType === 'score_updated' && (
                              <p>
                                Lead score modified from <span className="font-bold text-primary">{act.oldValue}</span> to{' '}
                                <span className="font-bold text-accent-emerald">{act.newValue}</span>{' '}
                                <span className="text-zinc-500 text-[10px]">({act.metadata?.reason})</span>
                              </p>
                            )}
                          </div>
                          
                          <div className="text-[9px] text-zinc-500 mt-2 text-right font-bold uppercase">
                            Logged by: {act.performedBy?.fullName}
                          </div>
                        </div>

                      </div>
                    ))
                  )}
                </div>

              </div>
            )}

            {/* 3. Outbound Email simulated log & Dispatch */}
            {activeTab === 'emails' && (
              <div className="space-y-6">
                
                {/* Outbound sending button */}
                <div className="flex justify-between items-center border-b border-hairline pb-4">
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Outbound Email History</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowSendEmailForm(!showSendEmailForm)}
                      className="btn-primary"
                    >
                      {showSendEmailForm ? 'Cancel Send' : 'Compose New Email'}
                    </button>
                  </div>
                </div>

                {/* Inner Send Template Form */}
                {showSendEmailForm && (
                  <form onSubmit={handleSendEmail} className="bg-canvas p-5 rounded-xl border border-hairline space-y-4 animate-fade-in shadow-lg flex flex-col">
                    
                    {/* Top Action Bar */}
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div className="flex-1 space-y-1.5">
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Starting Point (Optional Template)</label>
                        <select
                          value={selectedTemplateId}
                          onChange={(e) => handleTemplateSelect(e.target.value)}
                          className="w-full input-dark bg-zinc-900"
                        >
                          <option value="">-- Start from scratch --</option>
                          {templates.map((t) => (
                            <option key={t._id} value={t._id}>
                              {t.name} (Subject: {t.subject})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={handleGenerateAIDraft}
                          disabled={aiLoading}
                          className="btn-secondary flex items-center gap-1.5 h-[42px]"
                          title="Generate a highly personalized draft using recent interactions and selected template structure."
                        >
                          <span>🤖</span>
                          {aiLoading ? 'Drafting...' : 'AI Copilot Rewrite'}
                        </button>
                      </div>
                    </div>

                    {/* Split View: Editor & Preview */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-hairline">
                      
                      {/* Left Side: Code/Text Editor */}
                      <div className="space-y-4 flex flex-col">
                        <div className="space-y-1.5">
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Email Subject</label>
                          <input
                            type="text"
                            value={composerSubject}
                            onChange={(e) => setComposerSubject(e.target.value)}
                            required
                            className="w-full input-dark"
                            placeholder="Compelling subject line..."
                          />
                        </div>
                        
                        <div className="space-y-1.5 flex-1 flex flex-col">
                          <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Email HTML Body</label>
                          <textarea
                            value={composerBody}
                            onChange={(e) => setComposerBody(e.target.value)}
                            required
                            rows={14}
                            className="w-full p-3 bg-zinc-900 border border-hairline rounded-lg text-sm text-white focus:outline-none focus:border-primary outline-none whitespace-pre-wrap font-mono resize-y flex-1"
                            placeholder="<p>Write your email here...</p>"
                          />
                        </div>
                      </div>

                      {/* Right Side: Live HTML Preview */}
                      <div className="space-y-1.5 flex flex-col">
                        <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Live Render Preview</label>
                        <div 
                          className="flex-1 w-full p-5 bg-white border border-zinc-200 rounded-lg overflow-y-auto text-black text-sm"
                          style={{ minHeight: '340px' }}
                        >
                          {composerSubject && (
                            <div className="border-b border-zinc-200 pb-3 mb-4">
                              <h3 className="font-bold text-lg text-zinc-800">{composerSubject}</h3>
                            </div>
                          )}
                          <div 
                            className="prose prose-sm prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-a:text-blue-600 max-w-none text-zinc-800"
                            dangerouslySetInnerHTML={{ 
                              __html: composerBody || '<p class="text-zinc-400 italic">HTML preview will appear here...</p>' 
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Send Button */}
                    <div className="flex justify-end pt-4 border-t border-hairline">
                      <button
                        type="submit"
                        disabled={emailLoading || !composerSubject || !composerBody}
                        className="btn-primary flex items-center gap-2"
                      >
                        {emailLoading ? 'Sending...' : 'Send Email Now'}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                      </button>
                    </div>
                  </form>
                )}

                {/* Email History Logs List */}
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin">
                  {emailHistory.length === 0 ? (
                    <div className="text-zinc-500 text-xs py-4 font-semibold uppercase">No outbound emails dispatched yet.</div>
                  ) : (
                    emailHistory.map((history) => (
                      <div key={history._id} className="p-4 bg-canvas border border-hairline rounded-lg space-y-3 font-mono text-xs">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <h4 className="font-bold text-white text-xs">{history.subject}</h4>
                            <p className="text-[10px] text-zinc-500 mt-1">Recipient: {history.recipientEmail}</p>
                          </div>
                          
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                            history.status === 'clicked' ? 'bg-accent-emerald/10 text-accent-emerald border-accent-emerald/20' :
                            history.status === 'opened' ? 'bg-primary/10 text-primary border-primary/20' :
                            'bg-surface-card text-zinc-400 border-hairline'
                          }`}>
                            {history.status}
                          </span>
                        </div>

                        {/* Interactive triggers to simulate opened/clicked */}
                        <div className="flex justify-between items-center text-[10px] pt-2 border-t border-hairline">
                          <span className="text-zinc-500 font-bold uppercase text-[9px]">
                            Sent:{' '}
                            {new Date(history.createdAt).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          
                          {/* View Button */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => setExpandedEmailId(expandedEmailId === history._id ? null : history._id)}
                              className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-[9px] font-extrabold uppercase transition cursor-pointer border border-zinc-700"
                            >
                              {expandedEmailId === history._id ? 'Hide Email' : 'View Email'}
                            </button>
                          </div>
                        </div>

                        {/* Expanded View */}
                        {expandedEmailId === history._id && (
                          <div className="mt-3 p-4 bg-white rounded-lg text-black text-sm border border-zinc-200 shadow-inner animate-fade-in">
                            <div 
                              className="prose prose-sm prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-a:text-blue-600 max-w-none text-zinc-800"
                              dangerouslySetInnerHTML={{ __html: history.body }}
                            />
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'influencers' && (
              <div className="space-y-4 animate-fade-in">
                <div className="flex justify-between items-center border-b border-hairline pb-4">
                  <div>
                    <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Score Contributor Flow</h3>
                    <p className="text-[10px] text-zinc-500 font-medium mt-0.5">Visualize positive engagement and recency inputs streaming into {name}'s rating.</p>
                  </div>
                </div>

                {scoreGraphLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="animate-spin inline-block w-6 h-6 border-3 border-primary border-t-transparent rounded-full mb-3"></div>
                    <p className="text-xxs text-zinc-500 font-bold uppercase tracking-wider">Mapping score orbits...</p>
                  </div>
                ) : scoreGraphData ? (
                  <ScoreInfluencerGraph data={scoreGraphData} />
                ) : (
                  <div className="text-center text-zinc-500 py-12 text-xs font-bold uppercase">No score mapping calculated</div>
                )}
              </div>
            )}

          </div>

          {/* Quick Info Sidebar */}
          <div className="w-full md:w-64 bg-canvas p-6 flex flex-col gap-6">
            
            <div>
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-3">Lead Score breakdown</h3>
              <div className="p-4 bg-surface-card rounded-lg border border-hairline space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400 font-semibold">Total Score:</span>
                  <span className="font-extrabold text-primary font-mono text-sm">{lead.leadScore} / 100</span>
                </div>
                
                {/* Visual score bar */}
                <div className="w-full bg-canvas rounded-full h-1.5 border border-hairline">
                  <div
                    className={`h-full rounded-full ${
                      lead.leadScore >= 60 ? 'bg-accent-emerald' :
                      lead.leadScore >= 30 ? 'bg-primary' :
                      'bg-accent-rose'
                    }`}
                    style={{ width: `${lead.leadScore}%` }}
                  ></div>
                </div>

                <div className="text-[10px] text-zinc-500 font-medium border-t border-hairline pt-2 leading-relaxed">
                  Calculated dynamically from:
                  <ul className="list-disc pl-3 mt-1 space-y-0.5">
                    <li>Source weight (1/3)</li>
                    <li>Status count (1/3)</li>
                    <li>Activity intervals (1/3)</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Meta Properties</h3>
              <div className="space-y-3 text-xs font-semibold">
                <div>
                  <span className="text-zinc-500 block text-[9px] uppercase mb-0.5">Created At:</span>
                  <span className="text-zinc-300 font-mono">
                    {new Date(lead.createdAt).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
                
                <div>
                  <span className="text-zinc-500 block text-[9px] uppercase mb-0.5">Last Contacted:</span>
                  <span className="text-zinc-300 font-mono">
                    {lead.lastContactedAt
                      ? new Date(lead.lastContactedAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'Never'}
                  </span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
