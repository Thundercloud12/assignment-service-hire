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
  const [showAICopilotModal, setShowAICopilotModal] = useState(false);
  const [aiCopilotTemplateId, setAICopilotTemplateId] = useState('');
  const [aiDraftOutput, setAIDraftOutput] = useState('');
  const [aiLoading, setAILoading] = useState(false);
  const [aiError, setAIError] = useState('');

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

  // Send Email
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const addToast = useNotificationStore.getState().addToast;
    if (!selectedTemplateId) {
      addToast('Please select a template to send', 'error');
      return;
    }
    setEmailLoading(true);
    try {
      await emailService.sendEmail(leadId, selectedTemplateId);
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
    setAIError('');
    try {
      const draft = await frontendAiService.generateEmailDraft(leadId, aiCopilotTemplateId || null);
      setAIDraftOutput(draft);
      addToast('AI sales copilot draft generated successfully!', 'success');
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to generate AI email draft';
      setAIError(errMsg);
      addToast(errMsg, 'error');
    } finally {
      setAILoading(false);
    }
  };

  // Tracking Mock webhook triggers
  const handleMockOpen = async (historyId: string) => {
    const addToast = useNotificationStore.getState().addToast;
    try {
      await emailService.mockOpenEmail(historyId);
      fetchEmailLogs();
      fetchTimeline();
      fetchLeadDetails(); // Score updates (+10 pts opened)
      onLeadUpdated();
      addToast('Mock email open event registered!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to trigger mock open', 'error');
    }
  };

  const handleMockClick = async (historyId: string) => {
    const addToast = useNotificationStore.getState().addToast;
    try {
      await emailService.mockClickEmail(historyId);
      fetchEmailLogs();
      fetchTimeline();
      fetchLeadDetails(); // Score updates (+15 pts clicked)
      onLeadUpdated();
      addToast('Mock email click event registered!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to trigger mock click', 'error');
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in">
      <div className="bg-surface-card text-white rounded-xl max-w-4xl w-full border border-hairline overflow-hidden shadow-2xl flex flex-col my-8 animate-scale-up">
        
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
                      {users.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.fullName} ({u.role === 'admin' ? 'Admin' : 'Agent'})
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
                      onClick={() => setShowAICopilotModal(true)}
                      className="btn-secondary flex items-center gap-1.5"
                    >
                      <span>🤖</span>
                      AI Copilot Draft
                    </button>
                    <button
                      onClick={() => setShowSendEmailForm(!showSendEmailForm)}
                      className="btn-primary"
                    >
                      {showSendEmailForm ? 'Cancel Send' : 'Send New Email'}
                    </button>
                  </div>
                </div>

                {/* Inner Send Template Form */}
                {showSendEmailForm && (
                  <form onSubmit={handleSendEmail} className="bg-canvas p-4 rounded-lg border border-hairline space-y-4 animate-fade-in">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Select Email Template</label>
                      <select
                        value={selectedTemplateId}
                        onChange={(e) => setSelectedTemplateId(e.target.value)}
                        required
                        className="w-full input-dark bg-zinc-900"
                      >
                        <option value="">-- Choose a template --</option>
                        {templates.map((t) => (
                          <option key={t._id} value={t._id}>
                            {t.name} (Subject: {t.subject})
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      type="submit"
                      disabled={emailLoading || !selectedTemplateId}
                      className="btn-primary"
                    >
                      {emailLoading ? 'Sending...' : 'Confirm Simulated Outbound'}
                    </button>
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
                          
                          {/* Simulation Buttons */}
                          <div className="flex gap-2">
                            {history.status === 'sent' && (
                              <button
                                onClick={() => handleMockOpen(history._id)}
                                className="px-2 py-0.5 bg-primary hover:bg-primary-active text-canvas rounded text-[9px] font-extrabold uppercase transition cursor-pointer"
                              >
                                Mock Open
                              </button>
                            )}
                            {(history.status === 'sent' || history.status === 'opened') && (
                              <button
                                onClick={() => handleMockClick(history._id)}
                                className="px-2 py-0.5 bg-accent-emerald/10 hover:bg-accent-emerald/20 border border-accent-emerald/30 text-accent-emerald rounded text-[9px] font-extrabold uppercase transition cursor-pointer"
                              >
                                Mock Click
                              </button>
                            )}
                          </div>
                        </div>
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

      {showAICopilotModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[60] p-4 animate-fade-in">
          <div className="bg-surface-card border border-hairline rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scale-up text-white">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-hairline bg-canvas flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Sales Email Copilot</h3>
                  <p className="text-[10px] text-zinc-400">Context-aware Llama-3 Sales Intelligence</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowAICopilotModal(false);
                  setAICopilotTemplateId('');
                  setAIDraftOutput('');
                  setAIError('');
                }} 
                className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-900 transition active:scale-[0.9]"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              
              {/* Template selector */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                  Base on Email Template (Optional)
                </label>
                <select
                  value={aiCopilotTemplateId}
                  onChange={(e) => setAICopilotTemplateId(e.target.value)}
                  className="w-full input-dark bg-zinc-900"
                  disabled={aiLoading}
                >
                  <option value="">-- No template (Introductory Outreach Fallback) --</option>
                  {templates.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <p className="text-[9px] text-zinc-500">
                  Selecting a template feeds its structure to Llama-3 to maintain consistent company branding.
                </p>
              </div>

              {/* Generate Trigger */}
              <button
                onClick={handleGenerateAIDraft}
                disabled={aiLoading}
                className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 cursor-pointer transition active:scale-[0.98]"
              >
                {aiLoading ? (
                  <>
                    <div className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Drafting Context-Aware Pitch...</span>
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    <span>Generate AI Copilot Draft</span>
                  </>
                )}
              </button>

              {/* Error box */}
              {aiError && (
                <div className="p-3 bg-accent-rose/10 border border-accent-rose/20 rounded-lg text-accent-rose font-mono text-[11px]">
                  ⚠️ Failed: {aiError}
                </div>
              )}

              {/* Output / Editor */}
              {aiDraftOutput && (
                <div className="space-y-2 animate-fade-in">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Generated Sales Pitch Draft
                  </label>
                  <textarea
                    value={aiDraftOutput}
                    onChange={(e) => setAIDraftOutput(e.target.value)}
                    rows={12}
                    className="w-full input-dark font-mono text-xs p-3 leading-relaxed bg-canvas border border-hairline focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-lg"
                  />
                  <div className="flex justify-between items-center gap-3">
                    <span className="text-[9px] text-zinc-500 font-mono">
                      Feel free to edit the generated text block above before copying or using.
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(aiDraftOutput);
                        useNotificationStore.getState().addToast('Copied draft to clipboard!', 'success');
                      }}
                      className="btn-secondary text-[10px] py-1.5 px-3 flex items-center gap-1.5"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m-2 4h5m0 0l-3-3m3 3l-3 3"></path>
                      </svg>
                      Copy to Clipboard
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
