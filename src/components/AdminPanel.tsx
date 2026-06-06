import React, { useState } from 'react';
import { translations } from '../data';
import { SiteSettings, Article, FAQ, VisitorLog, ConversionLog } from '../types';
import { 
  BarChart, 
  Settings, 
  Files, 
  MessageSquare, 
  Trash2, 
  Plus, 
  Save, 
  Terminal
} from 'lucide-react';

interface AdminPanelProps {
  currentLang: 'en' | 'es' | 'ur';
  settings: SiteSettings;
  categories: { id: number; name: string; slug: string }[];
  articles: Article[];
  faqs: FAQ[];
  visitors: VisitorLog[];
  conversions: ConversionLog[];
  onReloadState: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentLang,
  settings,
  categories,
  articles,
  faqs,
  visitors,
  conversions,
  onReloadState
}) => {
  const t = translations[currentLang] || translations.en;
  const [activeSubTab, setActiveSubTab] = useState<'analytics' | 'settings' | 'articles' | 'faqs'>('analytics');

  // Site Settings Form States
  const [siteName, setSiteName] = useState(settings.site_name);
  const [siteTitle, setSiteTitle] = useState(settings.site_title);
  const [metaDescription, setMetaDescription] = useState(settings.meta_description);
  const [gaId, setGaId] = useState(settings.google_analytics_id);
  
  const [adHeader, setAdHeader] = useState(settings.ads?.header || '');
  const [adSidebar] = useState(settings.ads?.sidebar || '');
  const [adBetween] = useState(settings.ads?.between_content || '');
  const [adFooter, setAdFooter] = useState(settings.ads?.footer || '');

  const [companyName, setCompanyName] = useState(settings.company_name || '');
  const [companyPhone, setCompanyPhone] = useState(settings.company_phone || '');
  const [companyEmail, setCompanyEmail] = useState(settings.company_email || '');
  const [companyAddress, setCompanyAddress] = useState(settings.company_address || '');

  // Article Form states
  const [artTitle, setArtTitle] = useState('');
  const [artSlug, setArtSlug] = useState('');
  const [artCategoryId, setArtCategoryId] = useState<number>(categories[0]?.id || 1);
  const [artMetaTitle, setArtMetaTitle] = useState('');
  const [artMetaDesc, setArtMetaDesc] = useState('');
  const [artImageUrl, setArtImageUrl] = useState('');
  const [artContent, setArtContent] = useState('');
  const [artFormula, setArtFormula] = useState('');
  const [artExample, setArtExample] = useState('');
  const [editingArticleId, setEditingArticleId] = useState<number | null>(null);

  // FAQ Form State
  const [faqQ, setFaqQ] = useState('');
  const [faqA, setFaqA] = useState('');
  const [faqParentType] = useState<'category' | 'article' | 'app'>('app');
  const [faqParentId] = useState('general');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const triggerMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const resp = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          site_name: siteName,
          site_title: siteTitle,
          meta_description: metaDescription,
          logo_url: settings.logo_url,
          google_analytics_id: gaId,
          ads: {
            header: adHeader,
            sidebar: adSidebar,
            between_content: adBetween,
            footer: adFooter
          },
          dark_mode_enabled: settings.dark_mode_enabled,
          default_lang: settings.default_lang,
          company_name: companyName,
          company_phone: companyPhone,
          company_email: companyEmail,
          company_address: companyAddress
        })
      });

      if (resp.ok) {
        triggerMessage('success', 'Platform settings applied successfully.');
        onReloadState();
      } else {
        triggerMessage('error', 'Failed to update configurations.');
      }
    } catch {
      triggerMessage('error', 'Network failure updating settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleArticleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!artTitle || !artSlug) return;

    setLoading(true);
    const body = {
      title: artTitle,
      slug: artSlug,
      category_id: artCategoryId,
      meta_title: artMetaTitle,
      meta_description: artMetaDesc,
      image_url: artImageUrl || 'https://images.unsplash.com/photo-1542451313-0e3100f725d6?w=600',
      content: artContent,
      formula: artFormula,
      example: artExample,
      is_seo_page: true
    };

    try {
      const url = editingArticleId ? `/api/admin/articles/${editingArticleId}` : '/api/admin/articles';
      const method = editingArticleId ? 'PUT' : 'POST';

      const resp = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (resp.ok) {
        triggerMessage('success', editingArticleId ? 'Article guide modified successfully.' : 'New SEO guide registered successfully.');
        
        // Reset states
        setArtTitle('');
        setArtSlug('');
        setArtMetaTitle('');
        setArtMetaDesc('');
        setArtImageUrl('');
        setArtContent('');
        setArtFormula('');
        setArtExample('');
        setEditingArticleId(null);
        
        onReloadState();
      }
    } catch {
      triggerMessage('error', 'Database write failed.');
    } finally {
      setLoading(false);
    }
  };

  const editArticle = (art: Article) => {
    setEditingArticleId(art.id);
    setArtTitle(art.title);
    setArtSlug(art.slug);
    setArtCategoryId(art.category_id);
    setArtMetaTitle(art.meta_title);
    setArtMetaDesc(art.meta_description);
    setArtImageUrl(art.image_url);
    setArtContent(art.content);
    setArtFormula(art.formula);
    setArtExample(art.example);
  };

  const deleteArticle = async (id: number) => {
    if (!window.confirm('Are you absolutely sure you want to delete this article guide?')) return;
    try {
      const resp = await fetch(`/api/admin/articles/${id}`, { method: 'DELETE' });
      if (resp.ok) {
        triggerMessage('success', 'Article removed successfully.');
        onReloadState();
      }
    } catch {
      triggerMessage('error', 'Removal failed.');
    }
  };

  const handleFAQSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faqQ || !faqA) return;

    setLoading(true);
    try {
      const resp = await fetch('/api/admin/faqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: faqQ,
          answer: faqA,
          parent_type: faqParentType,
          parent_id: faqParentId
        })
      });

      if (resp.ok) {
        triggerMessage('success', 'New FAQ added.');
        setFaqQ('');
        setFaqA('');
        onReloadState();
      }
    } catch {
      triggerMessage('error', 'Failed to record FAQ.');
    } finally {
      setLoading(false);
    }
  };

  const deleteFAQ = async (id: number) => {
    try {
      const resp = await fetch(`/api/admin/faqs/${id}`, { method: 'DELETE' });
      if (resp.ok) {
        triggerMessage('success', 'FAQ deleted.');
        onReloadState();
      }
    } catch {
      triggerMessage('error', 'FAQ deletion failed.');
    }
  };

  return (
    <div id="admin-panel" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      
      {/* Banner and tabs bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="px-3 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs font-mono font-medium tracking-wider uppercase">
            SECURE SYSTEM OVERRIDE
          </span>
          <h2 className="text-2xl font-bold tracking-tight mt-3">{t.adminWelcome}</h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Monitor real-time system activities, update metadata, coordinate advertising block placeholders, and edit conversion guides.
          </p>
        </div>

        {/* Sub Navigation */}
        <div className="flex flex-wrap gap-1.5 bg-slate-850 p-1.5 rounded-2xl border border-slate-850">
          {[
            { id: 'analytics', label: 'Monitor', icon: BarChart },
            { id: 'settings', label: 'Metadata', icon: Settings },
            { id: 'articles', label: 'SEO Guides', icon: Files },
            { id: 'faqs', label: 'FAQs', icon: MessageSquare }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  activeSubTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {message && (
        <div className={`mt-6 p-4 rounded-xl border text-sm flex items-center shadow-lg animate-fade-in ${
          message.type === 'success'
            ? 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
            : 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
        }`}>
          {message.text}
        </div>
      )}

      {/* Main Panel Content container */}
      <div className="mt-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8">

        {/* 1. Analytics Dashboard logs view */}
        {activeSubTab === 'analytics' && (
          <div className="space-y-8 animate-fade-in" id="admin-analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Visitor metrics */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white">
                    {t.visitorLogs} ({visitors.length})
                  </h3>
                </div>
                <div className="max-h-96 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                  {visitors.length === 0 ? (
                    <p className="text-xs text-slate-400 font-mono py-4">No active connection logs recorded yet.</p>
                  ) : (
                    visitors.map((log) => (
                      <div key={log.id} className="bg-slate-50 dark:bg-slate-950/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs font-mono space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-blue-600 dark:text-blue-400">{log.ip}</span>
                          <span className="text-slate-400 text-[10px]">{new Date(log.visited_at).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 font-semibold truncate" title={log.path}>Requested Path: {log.path}</p>
                        <p className="text-slate-400 text-[10px] truncate" title={log.user_agent}>Browser UserAgent: {log.user_agent}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Conversions metrics */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white">
                    {t.conversionHistory} ({conversions.length})
                  </h3>
                </div>
                <div className="max-h-96 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                  {conversions.length === 0 ? (
                    <p className="text-xs text-slate-400 font-mono py-4">No conversion transactions logged yet.</p>
                  ) : (
                    conversions.slice().reverse().map((log) => (
                      <div key={log.id} className="bg-slate-50 dark:bg-slate-950/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 text-xs font-mono space-y-1.5">
                        <div className="flex justify-between items-center text-[10px] text-slate-400">
                          <span className="font-semibold uppercase text-slate-500 py-0.5 px-1.5 bg-slate-200/50 dark:bg-slate-800 rounded">{log.type.replace('-', ' ')}</span>
                          <span>{new Date(log.created_at).toLocaleTimeString()}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-slate-800 dark:text-slate-200 text-[11px] font-semibold">
                          <span>{log.from_value?.toFixed(2)} {log.from_unit}</span>
                          <span className="text-blue-500">→</span>
                          <span className="text-blue-600 dark:text-blue-400">{log.to_value?.toFixed(4)} {log.to_unit}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 2. Metadata configurations management */}
        {activeSubTab === 'settings' && (
          <div className="space-y-6 animate-fade-in" id="admin-settings-form">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              App Information & Corporate Settings
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Platform Brand Name</label>
                <input 
                  type="text" 
                  value={siteName} 
                  onChange={e => setSiteName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Headings Meta Slogan</label>
                <input 
                  type="text" 
                  value={siteTitle} 
                  onChange={e => setSiteTitle(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white"
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Indexing Meta Description</label>
                <textarea 
                  rows={2}
                  value={metaDescription} 
                  onChange={e => setMetaDescription(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Google Analytics tracking ID</label>
                <input 
                  type="text" 
                  value={gaId} 
                  onChange={e => setGaId(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Corporate Company Name</label>
                <input 
                  type="text" 
                  value={companyName} 
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Contact Phone Line</label>
                <input 
                  type="text" 
                  value={companyPhone} 
                  onChange={e => setCompanyPhone(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Corporate Email ID</label>
                <input 
                  type="email" 
                  value={companyEmail} 
                  onChange={e => setCompanyEmail(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white"
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Physical Office Coordinates Address</label>
                <textarea 
                  rows={2}
                  value={companyAddress} 
                  onChange={e => setCompanyAddress(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Ads spaces blocks */}
            <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-2">
                <Terminal className="h-4 w-4" />
                <span>Ad Spaces Custom Header / Footer Embed Codes</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">ADS HEADER SLOT</span>
                  <textarea 
                    rows={3}
                    value={adHeader} 
                    onChange={e => setAdHeader(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/25 text-slate-800 dark:text-white font-mono"
                    placeholder="Enter ad code details..."
                  />
                </div>
                
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">ADS FOOTER SLOT</span>
                  <textarea 
                    rows={3}
                    value={adFooter} 
                    onChange={e => setAdFooter(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/25 text-slate-800 dark:text-white font-mono"
                    placeholder="Enter ad code details..."
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                id="save-settings-btn"
                onClick={saveSettings}
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center space-x-2 text-xs uppercase cursor-pointer"
              >
                <Save className="h-4 w-4" />
                <span>{loading ? 'Processing...' : t.saveSettings}</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. CRUD controls of SEO custom posts */}
        {activeSubTab === 'articles' && (
          <div className="space-y-8 animate-fade-in" id="admin-articles-manager">
            
            {/* Adding or editing details */}
            <form onSubmit={handleArticleSubmit} className="space-y-5 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/80 p-6 rounded-2xl">
              <h4 className="text-sm font-bold uppercase text-slate-800 dark:text-slate-100 flex items-center space-x-2">
                <Plus className="h-4.5 w-4.5" />
                <span>{editingArticleId ? 'Modify SEO Resource Guide' : t.createArticle}</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Guide Article Title</span>
                  <input 
                    type="text" 
                    value={artTitle} 
                    onChange={e => {
                      setArtTitle(e.target.value);
                      if (!editingArticleId) setArtSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                    }}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm"
                    placeholder="e.g. How to Convert Pounds to Kilograms"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Route Slug Path</span>
                  <input 
                    type="text" 
                    value={artSlug} 
                    onChange={e => setArtSlug(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm font-mono"
                    placeholder="pounds-to-kilograms-conversion"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Guides Category</span>
                  <select 
                    value={artCategoryId} 
                    onChange={e => setArtCategoryId(parseInt(e.target.value))}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm cursor-pointer"
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Indexing Meta Title</span>
                  <input 
                    type="text" 
                    value={artMetaTitle} 
                    onChange={e => setArtMetaTitle(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm"
                    placeholder="Title loaded by browser tag..."
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Formula string</span>
                  <input 
                    type="text" 
                    value={artFormula} 
                    onChange={e => setArtFormula(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm font-mono text-blue-600 dark:text-blue-400"
                    placeholder="e.g. Kilograms = Pounds * 0.453592"
                    required
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Practical Example Description</span>
                  <input 
                    type="text" 
                    value={artExample} 
                    onChange={e => setArtExample(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm"
                    placeholder="e.g. 100 lbs * 0.453592 = 45.35 kg"
                    required
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase">Description Explanation Contents (Markdown/Text)</span>
                  <textarea 
                    rows={4}
                    value={artContent} 
                    onChange={e => setArtContent(e.target.value)}
                    className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none"
                    placeholder="Provide full description context..."
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                {editingArticleId && (
                  <button 
                    type="button" 
                    onClick={() => {
                      setEditingArticleId(null);
                      setArtTitle('');
                      setArtSlug('');
                    }}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-300 uppercase"
                  >
                    {t.cancel}
                  </button>
                )}
                <button 
                  type="submit" 
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase rounded-lg"
                >
                  {editingArticleId ? 'Apply Edit Changes' : 'Build SEO Page'}
                </button>
              </div>
            </form>

            {/* List grid of existing articles */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Current Registered Guides ({articles.length})</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {articles.map(art => (
                  <div key={art.id} className="p-4 bg-slate-50 dark:bg-slate-950/30 border border-slate-200/60 dark:border-slate-800 rounded-2xl flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">{art.title}</h5>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">/{art.slug} • {art.views} {t.views}</p>
                    </div>
                    <div className="flex space-x-1 pl-3">
                      <button 
                        onClick={() => editArticle(art)}
                        className="p-1 px-2.5 bg-white dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-705 text-[10px] font-bold uppercase rounded-lg text-slate-600 dark:text-slate-300"
                      >
                        {t.edit}
                      </button>
                      
                      <button 
                        onClick={() => deleteArticle(art.id)}
                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/40 dark:hover:bg-red-900/60 dark:text-red-450 rounded-lg"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* 4. CRUD controllers of FAQs posts */}
        {activeSubTab === 'faqs' && (
          <div className="space-y-8 animate-fade-in" id="admin-faqs-manager">
            
            <form onSubmit={handleFAQSubmit} className="space-y-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 p-6 rounded-2xl">
              <h4 className="text-sm font-bold uppercase text-slate-800 dark:text-white flex items-center space-x-2">
                <Plus className="h-4.5 w-4.5" />
                <span>{t.createFAQ}</span>
              </h4>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase font-sans">Question</span>
                  <input 
                    type="text" 
                    value={faqQ} 
                    onChange={e => setFaqQ(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm"
                    placeholder="Enter basic question text..."
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase font-sans">Answer Explanation</span>
                  <textarea 
                    rows={2}
                    value={faqA} 
                    onChange={e => setFaqA(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-sm focus:outline-none"
                    placeholder="Provide explanatory response..."
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase rounded-xl">
                  Save FAQ
                </button>
              </div>
            </form>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">FAQS list ({faqs.length})</h4>
              <div className="space-y-3">
                {faqs.map(faq => (
                  <div key={faq.id} className="p-4 bg-slate-50 dark:bg-slate-950/30 border border-slate-200/60 dark:border-slate-800 rounded-2xl flex items-start justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-slate-900 dark:text-white">Q: {faq.question}</h5>
                      <p className="text-xs text-slate-500 mt-1.5 pl-3 border-l-2 border-slate-250 dark:border-slate-700">A: {faq.answer}</p>
                    </div>
                    
                    <button 
                      onClick={() => deleteFAQ(faq.id)}
                      className="p-1.5 bg-red-50 hover:bg-red-104 text-red-600 dark:bg-red-950/40 rounded-xl shrink-0 ml-4"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
