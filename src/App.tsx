import { useState, useEffect } from 'react';
import { translations } from './data';
import { SiteSettings, Article, FAQ, VisitorLog, ConversionLog } from './types';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { UnitConverter } from './components/UnitConverter';
import { CurrencyConverter } from './components/CurrencyConverter';
import { AdminPanel } from './components/AdminPanel';
import { 
  Search, 
  ChevronRight, 
  HelpCircle, 
  BookOpen, 
  Lock, 
  X 
} from 'lucide-react';

const DEFAULT_SETTINGS: SiteSettings = {
  site_name: 'GlobalConverter',
  site_title: 'Pro Unit & Currency Converter Platform',
  meta_description: 'An advanced full-stack conversion hub featuring real-time currency converters and SEO guide formulas with custom administrative analytics.',
  logo_url: '/assets/logo.svg',
  google_analytics_id: 'G-XXXXXXXXXX',
  ads: {
    header: '',
    sidebar: '',
    between_content: '',
    footer: ''
  },
  dark_mode_enabled: true,
  default_lang: 'en',
  company_name: 'ConvertHub LLC',
  company_phone: '+1 (555) 0192-3847',
  company_email: 'support@converthub-global.com',
  company_address: '100 Silicon Blvd, Suite 400, Mountain View, CA 94043'
};

export default function App() {
  const [currentLang, setCurrentLang] = useState<'en' | 'es' | 'ur'>('en');
  const [darkMode, setDarkMode] = useState<boolean>(true);
  
  // App state from database config
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [categories, setCategories] = useState<{ id: number; name: string; slug: string }[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [exchangeRates, setExchangeRates] = useState<{ base: string; rates: Record<string, number>; updated_at: string } | null>(null);
  const [conversions, setConversions] = useState<ConversionLog[]>([]);
  const [visitors, setVisitors] = useState<VisitorLog[]>([]);

  // Navigation and dynamic routing
  const [activeTab, setActiveTab] = useState<string>('converters'); // converters, guides, admin, article:slug
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Authentication controllers
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authOpen, setAuthOpen] = useState<boolean>(false);
  const [authTab, setAuthTab] = useState<'login' | 'forgot'>('login');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  
  // Forgot Password fields
  const [fullName, setFullName] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  
  const [authError, setAuthError] = useState<string>('');
  const [authSuccess, setAuthSuccess] = useState<string>('');

  const loadAppState = async () => {
    try {
      const resp = await fetch('/api/state');
      if (resp.ok) {
        const data = await resp.json();
        setSettings(data.settings);
        setCategories(data.categories);
        setArticles(data.articles);
        setFaqs(data.faqs);
        setExchangeRates(data.exchange_rates);
        setConversions(data.conversions);
        setVisitors(data.visitors);

        if (data.settings?.default_lang && !settings) {
          setCurrentLang(data.settings.default_lang);
        }
      }
    } catch (err) {
      console.error('Failed to load application state:', err);
    }
  };

  useEffect(() => {
    loadAppState();
  }, []);

  // Sync darkmode body style safely
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [darkMode]);

  const t = translations[currentLang] || translations.en;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (authTab === 'login') {
      try {
        const resp = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });

        if (resp.ok) {
          const data = await resp.json();
          setCurrentUser(data.user);
          setAuthOpen(false);
          setUsername('');
          setPassword('');
          if (data.user?.role === 'admin') {
            setActiveTab('admin');
          }
        } else {
          const data = await resp.json();
          setAuthError(data.error || 'Invalid credentials.');
        }
      } catch {
        setAuthError('Connection failure during login request.');
      }
    } else {
      // Forgot password submission
      try {
        const resp = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            username,
            registeredName: fullName,
            newPassword
          })
        });

        if (resp.ok) {
          setAuthSuccess('Verification Confirmed! New password is now active.');
          setTimeout(() => {
            setAuthTab('login');
            setPassword('');
          }, 2000);
        } else {
          const data = await resp.json();
          setAuthError(data.error || 'Identity verification failed.');
        }
      } catch {
        setAuthError('Database sync timeout updating parameters.');
      }
    }
  };

  const handleArticleClick = async (slug: string) => {
    setActiveTab(`article:${slug}`);
    try {
      await fetch('/api/increment-views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug })
      });
      loadAppState();
    } catch (err) {
      console.error('Failed to increment views:', err);
    }
  };

  // Filter SEO pages based on search keywords
  const filteredArticles = articles.filter(art => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return art.title.toLowerCase().includes(q) || 
           art.content.toLowerCase().includes(q) || 
           art.formula.toLowerCase().includes(q);
  });

  const activeArticle = activeTab.startsWith('article:')
    ? articles.find(a => a.slug === activeTab.split(':')[1])
    : null;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-200">
      
      {/* Platform Header */}
      <Header
        currentLang={currentLang}
        setLang={setCurrentLang}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        onOpenAuth={() => {
          setAuthError('');
          setAuthSuccess('');
          setAuthTab('login');
          setAuthOpen(true);
        }}
        onTabChange={setActiveTab}
        activeTab={activeTab}
      />

      {/* Hero Header Space on Hub */}
      {activeTab === 'converters' && (
        <section id="hero-banner" className="pt-12 pb-6 text-center max-w-4xl mx-auto px-4">
          <span className="px-3.5 py-1.5 bg-blue-100 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 rounded-2xl text-xs font-mono font-semibold tracking-wider uppercase">
            🚀 All-in-One Global Dimension Platform
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-5">
            Precision Unit & Real-Time currency calculators
          </h1>
          <p className="text-sm md:text-md text-slate-500 mt-3 max-w-2xl mx-auto leading-relaxed">
            Perform enterprise-grade length, weight, volume, temperature, area and live forex market conversions seamlessly across {currentLang === 'ur' ? 'اردو' : currentLang === 'es' ? 'Español' : 'English'} layout frameworks.
          </p>
        </section>
      )}

      {/* Search and Navigation Bar on Directories */}
      {(activeTab === 'converters' || activeTab === 'guides') && (
        <div id="search-filter-section" className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-6">
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-slate-400">
              <Search className="h-5 w-5" />
            </div>
            <input
              id="global-search-query"
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (activeTab !== 'guides' && activeTab !== 'converters') {
                  setActiveTab('converters');
                }
              }}
              className="w-full h-13 pl-12 pr-4 rounded-2xl border border-slate-205 dark:border-slate-800 bg-white dark:bg-slate-900/40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white transition-all shadow-md shadow-slate-100 dark:shadow-none"
              placeholder={t.searchPlaceholder}
            />
          </div>
        </div>
      )}

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-10">

        {/* 1. Converters and calculative tools dashboard tab */}
        {activeTab === 'converters' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-8 animate-fade-in" id="dashboard-converters-grid">
            
            {/* Left Col: Conversion Widgets */}
            <div className="lg:col-span-2 space-y-6">
              <UnitConverter 
                currentLang={currentLang} 
                onConversionLogged={loadAppState} 
              />
              
              <CurrencyConverter 
                ratesData={exchangeRates} 
                currentLang={currentLang} 
                onConversionLogged={loadAppState} 
              />
            </div>

            {/* Right block: Live Sidebar conversions index log */}
            <div className="space-y-6">
              
              {/* Quick SEO Links */}
              <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  {t.latestArticles}
                </h3>
                <div className="mt-5 space-y-3">
                  {articles.slice(0, 3).map((art) => (
                    <div 
                      key={art.id}
                      onClick={() => handleArticleClick(art.slug)}
                      className="group p-3.5 bg-slate-850/50 hover:bg-slate-800 rounded-xl border border-slate-800/80 hover:border-blue-500/40 cursor-pointer transition-all"
                    >
                      <h4 className="text-xs font-semibold group-hover:text-blue-400 transition-colors leading-snug">
                        {art.title}
                      </h4>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 font-mono">
                        <span>{art.views} {t.views}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-slate-500 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  ))}
                  
                  <button
                    onClick={() => setActiveTab('guides')}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-white text-[11px] font-bold uppercase rounded-lg transition-all"
                  >
                    View All Formulas
                  </button>
                </div>
              </div>

              {/* Real-time platform conversions log ticker */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xl">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                  {t.conversionHistory}
                </h3>
                <div className="mt-5 space-y-3 max-h-80 overflow-y-auto pr-1">
                  {conversions.length === 0 ? (
                    <p className="text-xs text-slate-400 font-mono py-2">No conversions have occurred yet.</p>
                  ) : (
                    conversions.slice().reverse().slice(0, 10).map((log) => (
                      <div key={log.id} className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-850 flex items-center justify-between text-xs font-mono">
                        <div>
                          <p className="text-[10px] uppercase text-slate-400 font-bold">{log.type.replace('-', ' ')}</p>
                          <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                            {log.from_value?.toFixed(2)} {log.from_unit?.slice(0, 8)}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                            → {log.to_value?.toFixed(3)} {log.to_unit?.slice(0, 8)}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* 2. SEO Guides & Directory tab */}
        {activeTab === 'guides' && (
          <div className="space-y-8 animate-fade-in" id="guides-list">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-5">
              <h2 className="text-2xl font-bold tracking-tight">{t.latestArticles}</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Educational modules, step-by-step metric formulas, mathematical descriptions, and conversion proofs designed for search indexing.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.length === 0 ? (
                <p className="col-span-full text-center text-slate-400 text-sm py-12">
                  No formula guides correspond to your search.
                </p>
              ) : (
                filteredArticles.map((art) => (
                  <article 
                    key={art.id}
                    onClick={() => handleArticleClick(art.slug)}
                    className="p-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl cursor-pointer hover:border-blue-500/40 hover:-translate-y-1 transition-all flex flex-col justify-between h-full"
                  >
                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {art.title}
                      </h3>
                      <p className="text-xs text-slate-500 mt-2.5 leading-relaxed line-clamp-3">
                        {art.content}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between font-mono text-[10px] text-slate-400">
                      <span>{art.views} {t.views}</span>
                      <span className="flex items-center text-blue-500 font-bold uppercase tracking-wider">
                        Read Guide <ChevronRight className="h-3 ml-0.5" />
                      </span>
                    </div>
                  </article>
                ))
              )}
            </div>

            {/* General FAQs sections on Guides page */}
            <div className="mt-16 pt-12 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-xl font-bold tracking-tight mb-6">{t.frequentlyAsked}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {faqs.map((faq) => (
                  <div key={faq.id} className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl space-y-2">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-start">
                      <HelpCircle className="h-4.5 w-4.5 text-blue-500 mr-2 shrink-0 mt-0.5" />
                      <span>{faq.question}</span>
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-6.5">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* 3. Dedicated visual guide article page details */}
        {activeArticle && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 animate-fade-in" id="article-details-page">
            
            {/* Guide content */}
            <div className="lg:col-span-2 space-y-6">
              <button
                onClick={() => setActiveTab('guides')}
                className="inline-flex items-center space-x-1 text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                ← Back to Guides
              </button>

              <div className="bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800 rounded-3xl p-6 md:p-8">
                <span className="px-3 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 rounded-lg text-[10px] font-mono font-bold tracking-wider uppercase">
                  SEO INDEX TARGETED ARTICLE
                </span>
                
                <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-4">
                  {activeArticle.title}
                </h1>
                
                <div className="flex items-center space-x-4 text-xs text-slate-400 font-mono mt-3 pb-5 border-b border-slate-100 dark:border-slate-800">
                  <span>VIEWS: {activeArticle.views}</span>
                  <span>RELEASED: {new Date(activeArticle.created_at).toLocaleDateString()}</span>
                </div>

                {/* Primary Content Paragraphs */}
                <div className="mt-6 text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-4 font-sans">
                  {activeArticle.content.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>

                {/* Mathematical conversions calculations formula display */}
                <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-950/70 border border-slate-150 dark:border-slate-850 rounded-2xl space-y-4">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-blue-500" />
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white">
                      Formula & Calculation Coefficient values
                    </h3>
                  </div>
                  
                  <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 rounded-lg font-mono text-xs text-blue-600 dark:text-blue-400 font-bold">
                    {activeArticle.formula}
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed pl-1.5">
                    <strong>PRACTICAL DEMONSTRATIVE EXAMPLE:</strong><br />
                    {activeArticle.example}
                  </p>
                </div>

              </div>
            </div>

            {/* Sidebar with calculator mapping */}
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl">
                <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  Try Live Calculations Now
                </h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  Apply the math in our fully responsive interactive calculator panel.
                </p>
                <button
                  onClick={() => setActiveTab('converters')}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-750 font-bold uppercase tracking-wide text-xs rounded-xl mt-4 transition-all"
                >
                  Activate Calculators
                </button>
              </div>
            </div>

          </div>
        )}

        {/* 4. Full Admin Override panel dashboard */}
        {activeTab === 'admin' && currentUser?.role === 'admin' && (
          <AdminPanel
            currentLang={currentLang}
            settings={settings || DEFAULT_SETTINGS}
            categories={categories}
            articles={articles}
            faqs={faqs}
            visitors={visitors}
            conversions={conversions}
            onReloadState={loadAppState}
          />
        )}

      </main>

      {/* Corporate Compliance Footer */}
      <Footer 
        currentLang={currentLang} 
        settings={settings || DEFAULT_SETTINGS} 
      />

      {/* Authentication Login Dialog Modals (Overlay popup card widgets) */}
      {authOpen && (
        <div id="auth-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative">
            <button
              id="close-auth-modal"
              onClick={() => setAuthOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="text-center pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="h-11 w-11 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-3.5">
                <Lock className="h-5.5 w-5.5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {authTab === 'login' ? 'Site Member Center' : 'Password Recovery Identity System'}
              </h3>
              <p className="text-[10px] text-slate-500 leading-normal mt-1">
                {authTab === 'login' ? 'Administrative security check identity verification' : 'Registered user credential identifier check'}
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="mt-6 space-y-4">
              
              {/* Form errors indicator */}
              {authError && (
                <div className="p-3 text-xs bg-red-50 dark:bg-red-950/40 text-red-650 dark:text-red-400 border border-red-100 dark:border-red-900/60 rounded-xl">
                  {authError}
                </div>
              )}

              {/* Form success indicator */}
              {authSuccess && (
                <div className="p-3 text-xs bg-green-50 dark:bg-green-950/40 text-green-650 dark:text-green-400 border border-green-100 dark:border-green-900/60 rounded-xl">
                  {authSuccess}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase">{t.username}</label>
                <input
                  id="auth-username"
                  type="email"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white font-mono"
                  placeholder="e.g. hamxak441@gmail.com"
                  required
                />
              </div>

              {authTab === 'login' ? (
                // Login Password Field
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">{t.password}</label>
                    <button 
                      type="button"
                      onClick={() => {
                        setAuthError('');
                        setAuthSuccess('');
                        setAuthTab('forgot');
                      }}
                      className="text-[10px] text-blue-500 hover:text-blue-600 font-semibold cursor-pointer"
                    >
                      {t.forgotPassword}
                    </button>
                  </div>
                  <input
                    id="auth-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white"
                    placeholder="Enter security key..."
                    required
                  />
                </div>
              ) : (
                // Forgot Password Verification fields
                <>
                  <div className="space-y-1.5 animate-fade-in">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">{t.fullNameLabel}</label>
                    <input
                      id="auth-fullname"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-205 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white"
                      placeholder="e.g. Amir Khan"
                      required
                    />
                  </div>

                  <div className="space-y-1.5 animate-fade-in">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">{t.newPasswordLabel}</label>
                    <input
                      id="auth-newpassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white"
                      placeholder="Enter new account key..."
                      required
                    />
                  </div>
                </>
              )}

              <button
                id="auth-submit-btn"
                type="submit"
                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white text-xs uppercase font-extrabold tracking-wider rounded-xl shadow-lg transition-all pt-0.5 cursor-pointer mt-5"
              >
                {authTab === 'login' ? t.login : t.resetPasswordBtn}
              </button>

              {authTab === 'forgot' && (
                <button
                  type="button"
                  onClick={() => {
                    setAuthError('');
                    setAuthSuccess('');
                    setAuthTab('login');
                  }}
                  className="w-full text-center text-[10px] text-slate-500 hover:text-slate-900 dark:hover:text-white font-semibold flex items-center justify-center space-x-1 mt-2.5"
                >
                  <span>{t.backToLogin}</span>
                </button>
              )}

              {/* Helper text panel */}
              {authTab === 'login' && (
                <div className="mt-4 p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-850 text-[10px] text-slate-500 leading-normal">
                  <span className="font-bold text-slate-700 dark:text-slate-350 block mb-1">Testing Credentials:</span>
                  Admin user: <strong className="font-mono text-blue-600 select-all">hamxak441@gmail.com</strong> (Registered Name: <strong>Amir Khan</strong>), Password key: <strong className="font-mono text-blue-600 select-all">Ammir$1298</strong>.
                </div>
              )}

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
