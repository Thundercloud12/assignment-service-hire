import React, { useState, useEffect } from 'react';
import { emailService, type IEmailTemplate } from '../services/email.service';
import { useNotificationStore } from '../store/notification.store';

export const TemplatesPage: React.FC = () => {
  const [templates, setTemplates] = useState<IEmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Editor states
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await emailService.getTemplates();
      setTemplates(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleCreateNew = () => {
    setEditingId(null);
    setName('');
    setSubject('');
    setBody('');
    setEditorOpen(true);
  };

  const handleEditClick = (template: IEmailTemplate) => {
    setEditingId(template._id);
    setName(template.name);
    setSubject(template.subject);
    setBody(template.body);
    setEditorOpen(true);
  };

  const handleDeleteClick = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;
    const addToast = useNotificationStore.getState().addToast;
    try {
      await emailService.deleteTemplate(id);
      fetchTemplates();
      addToast('Email template deleted successfully!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to delete template', 'error');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const addToast = useNotificationStore.getState().addToast;

    if (!name.trim()) {
      addToast('Template Name is required', 'error');
      return;
    }
    if (!subject.trim()) {
      addToast('Email Subject is required', 'error');
      return;
    }
    if (!body.trim()) {
      addToast('Email Body is required', 'error');
      return;
    }

    setSaveLoading(true);
    try {
      if (editingId) {
        await emailService.updateTemplate(editingId, { name, subject, body });
      } else {
        await emailService.createTemplate({ name, subject, body });
      }
      setEditorOpen(false);
      fetchTemplates();
      addToast('Email template saved successfully!', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to save template', 'error');
    } finally {
      setSaveLoading(false);
    }
  };

  // Preview replacement simulation
  const getRenderedPreview = () => {
    let preview = body || '<p class="text-zinc-500 italic">Body preview will render here...</p>';
    const samples: Record<string, string> = {
      name: 'Sarah Connor',
      email: 'sarah@example.com',
      phone: '+1 (555) 019-2834',
      status: 'qualified',
      source: 'referral',
    };

    Object.entries(samples).forEach(([key, val]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
      preview = preview.replace(regex, `<span class="bg-primary/20 text-primary font-bold px-1 rounded border border-primary/20">${val}</span>`);
    });

    return preview;
  };

  return (
    <div className="min-h-screen bg-canvas p-8 lg:p-10 text-white animate-fade-in">
      <div className="w-full max-w-[1280px] mx-auto">
        
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8 border-b border-hairline pb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Email Templates</h1>
            <p className="text-zinc-400 text-xs font-medium">Design performance outbound templates using variables.</p>
          </div>
          {!editorOpen && (
            <button
              onClick={handleCreateNew}
              className="btn-primary"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"></path></svg>
              Create Template
            </button>
          )}
        </div>

        {error && <div className="p-4 mb-6 bg-red-950/20 border border-red-900/30 text-red-400 rounded-lg text-xs font-medium">{error}</div>}

        {/* EDITOR AREA */}
        {editorOpen ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Template Editor Form */}
            <div className="bg-surface-card p-6 rounded-xl border border-hairline shadow-lg space-y-4">
              <h2 className="text-sm font-bold text-primary uppercase tracking-wider mb-2">
                {editingId ? 'Edit Template Record' : 'Create New Template Record'}
              </h2>

              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Template Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Welcome Message, Qualification Follow-up"
                    className="w-full input-dark"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Subject Line</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    placeholder="e.g. Hi {{name}}, glad to connect!"
                    className="w-full input-dark"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Email Body (HTML/Text)</label>
                  <textarea
                    rows={8}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    required
                    placeholder="Type email body here. Use {{name}} or {{email}} to inject lead details."
                    className="w-full p-4 bg-canvas border border-hairline rounded-lg text-xs text-white focus:outline-none focus:border-primary font-mono scrollbar-thin outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-4 border-t border-hairline">
                  <button
                    type="button"
                    onClick={() => setEditorOpen(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="btn-primary"
                  >
                    {saveLoading ? 'Saving...' : 'Save Template'}
                  </button>
                </div>
              </form>
            </div>

            {/* Template Preview and Helper variables */}
            <div className="space-y-6">
              
              {/* Dynamic Live Preview */}
              <div className="bg-surface-card p-6 rounded-xl border border-hairline shadow-lg flex flex-col h-[350px]">
                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3">Live Sample Preview</h3>
                <div className="bg-canvas p-4 rounded-lg flex-1 overflow-y-auto border border-hairline text-xs leading-relaxed scrollbar-thin text-zinc-300 font-mono">
                  <div className="pb-2.5 mb-3 border-b border-hairline text-[10px] text-zinc-500 font-bold uppercase">
                    <span className="text-zinc-400">Subject Line:</span> {subject || '(No subject line specified)'}
                  </div>
                  <div dangerouslySetInnerHTML={{ __html: getRenderedPreview() }} />
                </div>
              </div>

              {/* Variable Reference Table */}
              <div className="bg-surface-card p-6 rounded-xl border border-hairline shadow-lg text-xs">
                <h3 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-3">Template Variables Cheat Sheet</h3>
                <p className="text-zinc-400 text-[11px] mb-4 leading-relaxed font-medium">
                  Inject lead details dynamically by placing the corresponding placeholders inside brackets. They will be auto-replaced when emails are created.
                </p>
                <div className="grid grid-cols-2 gap-3 font-mono">
                  <div className="p-2 bg-canvas rounded border border-hairline">
                    <span className="font-bold text-primary block mb-0.5">{"{{name}}"}</span>
                    <span className="text-[10px] text-zinc-500">Lead's Full Name</span>
                  </div>
                  <div className="p-2 bg-canvas rounded border border-hairline">
                    <span className="font-bold text-primary block mb-0.5">{"{{email}}"}</span>
                    <span className="text-[10px] text-zinc-500">Lead's Email Address</span>
                  </div>
                  <div className="p-2 bg-canvas rounded border border-hairline">
                    <span className="font-bold text-primary block mb-0.5">{"{{phone}}"}</span>
                    <span className="text-[10px] text-zinc-500">Lead's Telephone</span>
                  </div>
                  <div className="p-2 bg-canvas rounded border border-hairline">
                    <span className="font-bold text-primary block mb-0.5">{"{{status}}"}</span>
                    <span className="text-[10px] text-zinc-500">Current Lead Status</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        ) : (
          /* LIST VIEW */
          <>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-surface-card border border-hairline rounded-xl animate-pulse">
                <div className="animate-spin inline-block w-8 h-8 border-3 border-primary border-t-transparent rounded-full mb-3"></div>
                <p className="text-sm text-zinc-500 font-medium">Fetching templates...</p>
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-20 bg-surface-card rounded-xl border border-hairline">
                <p className="text-zinc-400 mb-4 text-xs font-semibold">No email templates created yet.</p>
                <button
                  onClick={handleCreateNew}
                  className="btn-primary"
                >
                  Create Your First Template
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((tpl) => (
                  <div
                    key={tpl._id}
                    className="bg-surface-card rounded-xl border border-hairline p-5 flex flex-col justify-between hover:border-primary/20 transition duration-150 group active:scale-[0.98] shadow-md"
                  >
                    <div className="space-y-2 mb-4">
                      <h3 className="font-bold text-white group-hover:text-primary transition-colors text-xs truncate uppercase tracking-wider">
                        {tpl.name}
                      </h3>
                      <p className="text-[11px] text-zinc-400 line-clamp-3 leading-relaxed font-mono">
                        <span className="font-bold text-zinc-500">Subject:</span> {tpl.subject}
                      </p>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-zinc-500 border-t border-hairline pt-4">
                      <span className="font-bold">By: {tpl.createdBy?.fullName || 'System'}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditClick(tpl)}
                          className="px-2.5 py-1 bg-canvas hover:bg-zinc-800 border border-hairline rounded text-zinc-300 font-bold transition cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(tpl._id)}
                          className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded text-red-300 font-bold transition cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
};
