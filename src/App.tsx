import { useState, useEffect } from 'react';
import { translations } from './data';
import { SiteSettings, Article, FAQ, VisitorLog, ConversionLog } from './types';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { UnitConverter } from './components/UnitConverter';
import { CurrencyConverter } from './components/CurrencyConverter';
import { DocumentConverter } from './components/DocumentConverter';
import { ImageConverter } from './components/ImageConverter';
import { TimeZoneConverter } from './components/TimeZoneConverter';
import { TextToolsConverter } from './components/TextToolsConverter';
import { AdminPanel } from './components/AdminPanel';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { 
  Search, 
  ChevronRight, 
  HelpCircle, 
  BookOpen, 
  Lock, 
  X,
  Database,
  ArrowRight,
  TrendingUp,
  Settings as SettingsIcon,
  Sparkles,
  Download,
  BarChart3
} from 'lucide-react';

const DEFAULT_SETTINGS: SiteSettings = {
  site_name: 'ConvertHub',
  site_title: 'Precision Unit & Live Exchange Rates Platform',
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
  const [activeTab, setActiveTab] = useState<string>('converters'); // converters, guides, admin, dashboard, article:slug
  const [activeConverterTab, setActiveConverterTab] = useState<'unit' | 'currency' | 'timezone' | 'document' | 'image' | 'text'>('unit');
  const [simulatedEmails, setSimulatedEmails] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Authentication controllers
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authOpen, setAuthOpen] = useState<boolean>(false);
  const [authTab, setAuthTab] = useState<'login' | 'register' | 'forgot' | 'verify' | 'neon'>('login');
  const [neonDbUrl, setNeonDbUrl] = useState<string>('');
  
  // Credentials Form States
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const registerRole = 'user';

  // Forgot password parameters
  const [newPassword, setNewPassword] = useState<string>('');
  const [forgotStep, setForgotStep] = useState<1 | 2 | 3>(1);

  // OTP Verification state
  const [verifyCode, setVerifyCode] = useState<string>('');
  const [verifyUsername, setVerifyUsername] = useState<string>('');
  const [lastSimulatedCode, setLastSimulatedCode] = useState<string>('');

  const [authError, setAuthError] = useState<string>('');
  const [authSuccess, setAuthSuccess] = useState<string>('');

  // Dashboard customization states
  const [favUnitsPair, setFavUnitsPair] = useState<{ from: string; to: string }>({ from: 'meters', to: 'feet' });

  // Triggers a CSV file download of the current conversions list in the state
  const downloadConversionCSV = () => {
    if (!conversions || conversions.length === 0) return;

    // Build the CSV headers
    const headers = ["ID", "Category / Type", "From Value", "From Unit", "To Value", "To Unit", "Executed At"];

    // Map rows cleanly
    const rows = conversions.map(conv => [
      conv.id,
      conv.type,
      conv.from_value,
      conv.from_unit,
      conv.to_value,
      conv.to_unit,
      conv.created_at ? new Date(conv.created_at).toISOString() : ''
    ]);

    // Build standard, escaped CSV content
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => {
        const val = cell !== undefined && cell !== null ? String(cell) : "";
        // Wrap cells with commas, quotes or newlines in double quotes
        if (val.includes(",") || val.includes('"') || val.includes("\n")) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(","))
    ].join("\n");

    // Process download link trigger
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `conversion_history_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const fetchMailbox = async () => {
    try {
      const r = await fetch('/api/auth/dev-mailbox');
      if (r.ok) {
        const d = await r.json();
        setSimulatedEmails(d.emails || []);
      }
    } catch (e) {
      console.warn("Could not query sandbox emails:", e);
    }
  };

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
      fetchMailbox();
    } catch (err) {
      console.error('Failed to load application state:', err);
    }
  };

  useEffect(() => {
    loadAppState();
  }, []);

  // Sync darkmode style
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
          
          if (data.user?.role === 'admin' || data.user?.role === 'super_admin') {
            setActiveTab('admin');
          } else {
            setActiveTab('dashboard');
          }
        } else if (resp.status === 403) {
          const data = await resp.json();
          setVerifyUsername(data.username || username);
          setAuthTab('verify');
          setAuthError(data.error || 'Please enter the registration verification code.');
        } else {
          const data = await resp.json();
          setAuthError(data.error || 'Invalid combination of email or password.');
        }
      } catch {
        setAuthError('Network error connecting to auth server.');
      }
    } else if (authTab === 'register') {
      try {
        const resp = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: fullName, username, password, role: registerRole })
        });

        if (resp.ok) {
          const data = await resp.json();
          setVerifyUsername(username);
          setLastSimulatedCode(data.verification_code);
          setAuthSuccess(data.message || 'Verification code initialized.');
          setTimeout(() => {
            setAuthTab('verify');
          }, 1500);
        } else {
          const data = await resp.json();
          setAuthError(data.error || 'Identity registration rejected.');
        }
      } catch {
        setAuthError('Connection timed out during registration.');
      }
    } else if (authTab === 'verify') {
      try {
        const resp = await fetch('/api/auth/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: verifyUsername, code: verifyCode })
        });

        if (resp.ok) {
          const data = await resp.json();
          setCurrentUser(data.user);
          setAuthSuccess('Account email verified and logged in successfully!');
          setTimeout(() => {
            setAuthOpen(false);
            setVerifyCode('');
            setVerifyUsername('');
            setLastSimulatedCode('');
            setUsername('');
            setPassword('');
            setFullName('');
            if (data.user?.role === 'admin' || data.user?.role === 'super_admin') {
              setActiveTab('admin');
            } else {
              setActiveTab('dashboard');
            }
          }, 1500);
        } else {
          const data = await resp.json();
          setAuthError(data.error || 'Incorrect confirmation code entered.');
        }
      } catch {
        setAuthError('Network timed out verifying confirmation code.');
      }
    } else if (authTab === 'forgot') {
      try {
        if (forgotStep === 1) {
          const resp = await fetch('/api/auth/forgot-password-request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
          });
          const data = await resp.json();
          if (resp.ok) {
            setAuthSuccess(data.message || 'OTP reset code dispatched to your email address!');
            setForgotStep(2);
            setTimeout(() => fetchMailbox(), 500); // refresh simulated mailbox
          } else {
            setAuthError(data.error || 'Email address not found in our directory.');
          }
        } else if (forgotStep === 2) {
          const resp = await fetch('/api/auth/forgot-password-verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, code: verifyCode })
          });
          const data = await resp.json();
          if (resp.ok) {
            setAuthSuccess(data.message || 'Recovery code validated successfully! Proceeding to reset your password.');
            setForgotStep(3);
          } else {
            setAuthError(data.error || 'Invalid reset code. Check your inbox and try again.');
          }
        } else if (forgotStep === 3) {
          const resp = await fetch('/api/auth/forgot-password-reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, code: verifyCode, newPassword })
          });
          const data = await resp.json();
          if (resp.ok) {
            setAuthSuccess(data.message || 'Password updated successfully! Transitioning back to Login.');
            setTimeout(() => {
              setAuthTab('login');
              setForgotStep(1);
              setPassword('');
              setVerifyCode('');
              setNewPassword('');
              setAuthSuccess('');
            }, 2000);
          } else {
            setAuthError(data.error || 'Password update failed.');
          }
        }
      } catch {
        setAuthError('Connection timed out during credentials recovery.');
      }
    } else if (authTab === 'neon') {
      try {
        const resp = await fetch('/api/auth/neon-connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dbUrl: neonDbUrl })
        });
        const data = await resp.json();
        if (resp.ok) {
          setCurrentUser(data.user);
          setAuthSuccess(data.message || 'Neon database active on this virtual session!');
          setTimeout(() => {
            setAuthOpen(false);
            setNeonDbUrl('');
            setActiveTab('admin');
            setAuthSuccess('');
          }, 1500);
        } else {
          setAuthError(data.error || 'Connection failed. Please verify Neon URL syntax.');
        }
      } catch {
        setAuthError('Timed out connecting to the database pool.');
      }
    }
  };

  const handleGoogleOAuth = async () => {
    setAuthError('');
    setAuthSuccess('');
    try {
      // Simulated secure Google Profile
      const uniqueSuffix = Math.random().toString(36).substring(4, 9);
      const googleProfile = {
        name: 'Google User ' + uniqueSuffix.toUpperCase(),
        email: `google.${uniqueSuffix}@converthub.com`,
        googleId: 'g_' + Math.floor(10000000 + Math.random() * 90000000)
      };

      const resp = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googleProfile)
      });

      if (resp.ok) {
        const data = await resp.json();
        setCurrentUser(data.user);
        setAuthSuccess(`authenticated securely as ${data.user.name}!`);
        setTimeout(() => {
          setAuthOpen(false);
          if (data.user?.role === 'admin' || data.user?.role === 'super_admin') {
            setActiveTab('admin');
          } else {
            setActiveTab('dashboard');
          }
        }, 1500);
      } else {
        const data = await resp.json();
        setAuthError(data.error || 'Google authentication rejected.');
      }
    } catch {
      setAuthError('Google server unavailable at this moment.');
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

  // Render dummy data for user dashboard charts mapping
  const chartData = [
    { name: 'Mon', count: 4 },
    { name: 'Tue', count: 12 },
    { name: 'Wed', count: 8 },
    { name: 'Thu', count: conversions.length > 5 ? conversions.length : 15 },
    { name: 'Fri', count: conversions.length > 10 ? conversions.length + 3 : 21 },
    { name: 'Sat', count: 18 },
    { name: 'Sun', count: 26 },
  ];

  // Dynamically group the conversion log telemetry entries by category for Bar chart
  const categoryChartColors = ['#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981'];
  
  const categoryChartData = (() => {
    const counts: Record<string, number> = {
      'Length': 0,
      'Weight': 0,
      'Volume': 0,
      'Temperature': 0,
      'Area': 0,
      'Currency': 0,
    };

    conversions.forEach(c => {
      let catName = 'Other';
      const logType = (c.type || '').toLowerCase();
      if (logType.includes('length')) {
        catName = 'Length';
      } else if (logType.includes('weight')) {
        catName = 'Weight';
      } else if (logType.includes('volume')) {
         catName = 'Volume';
      } else if (logType.includes('temp') || logType.includes('temper')) {
         catName = 'Temperature';
      } else if (logType.includes('area')) {
         catName = 'Area';
      } else if (logType.includes('currency') || logType.includes('forex')) {
         catName = 'Currency';
      } else {
        // Pretty capitalize custom types if any
        const cleaned = logType.replace(/_converter/g, '').replace(/[-_]/g, ' ');
        catName = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
      }
      counts[catName] = (counts[catName] || 0) + 1;
    });

    return Object.keys(counts).map(name => ({
      name,
      count: counts[name]
    }));
  })();

  const activeCategoriesCount = categoryChartData.filter(item => item.count > 0).length;
  const mostPopularCategory = categoryChartData.reduce((max, item) => item.count > max.count ? item : max, { name: 'None', count: 0 });

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-250">
      
      {/* Platform Header */}
      <Header
        currentLang={currentLang}
        setLang={setCurrentLang}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        currentUser={currentUser}
        setCurrentUser={(user) => {
          setCurrentUser(user);
          if (!user) {
            setActiveTab('converters');
          }
        }}
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
              className="w-full h-13 pl-12 pr-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-900 dark:text-white transition-all shadow-md shadow-slate-100 dark:shadow-none"
              placeholder={t.searchPlaceholder}
            />
          </div>
        </div>
      )}

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 mt-10">

        {/* 1. Converters and calculative tools dashboard tab */}
        {activeTab === 'converters' && (
          <div className="space-y-8 animate-fade-in" id="dashboard-converters-grid">
            
            {/* Elegant Selector Tabs Bar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-2.5 rounded-3xl shadow-sm flex flex-wrap gap-1.5 justify-center md:justify-start">
              {([
                { id: 'unit', label: 'Unit Converter', desc: 'Length, Weight, & Temperature', emoji: '📏' },
                { id: 'currency', label: 'Currency exchange', desc: 'Real-time Forex Rates', emoji: '🪙' },
                { id: 'timezone', label: 'Time Zone scrub', desc: 'World clocks & Slider', emoji: '⏱️' },
                { id: 'document', label: 'Document & PDF', desc: 'Advanced Doc Utilities', emoji: '📂' },
                { id: 'image', label: 'Image conversion', desc: 'Compress or Convert formats', emoji: '🖼️' },
                { id: 'text', label: 'Text & Utility Tools', desc: 'JSON, Base64 & Web Suite', emoji: '✍️' }
              ] as const).map((tab) => {
                const isSelected = activeConverterTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveConverterTab(tab.id)}
                    className={`flex-1 min-w-[150px] p-3 text-left rounded-2xl transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md shadow-slate-950/10'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-350'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{tab.emoji}</span>
                      <span className="text-xs font-black tracking-tight">{tab.label}</span>
                    </div>
                    <span className={`block text-[9px] font-medium mt-1 ${isSelected ? 'text-blue-300 dark:text-slate-500' : 'text-slate-400'}`}>
                      {tab.desc}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              
              {/* Left Col: Conversion Widget Viewport */}
              <div className="lg:col-span-2">
                <div className="transition-all duration-300">
                  {activeConverterTab === 'unit' && (
                    <UnitConverter 
                      currentLang={currentLang} 
                      onConversionLogged={loadAppState} 
                    />
                  )}
                  {activeConverterTab === 'currency' && (
                    <CurrencyConverter 
                      ratesData={exchangeRates} 
                      currentLang={currentLang} 
                      onConversionLogged={loadAppState} 
                    />
                  )}
                  {activeConverterTab === 'timezone' && (
                    <TimeZoneConverter 
                      currentLang={currentLang} 
                    />
                  )}
                  {activeConverterTab === 'document' && (
                    <DocumentConverter 
                      currentLang={currentLang} 
                    />
                  )}
                  {activeConverterTab === 'image' && (
                    <ImageConverter 
                      currentLang={currentLang} 
                    />
                  )}
                  {activeConverterTab === 'text' && (
                    <TextToolsConverter 
                      currentLang={currentLang} 
                    />
                  )}
                </div>
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

        {/* 4. Full Admin Override panel dashboard (Supports Admin and Super Admin) */}
        {activeTab === 'admin' && currentUser && (currentUser.role === 'admin' || currentUser.role === 'super_admin') && (
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

        {/* 5. User Specific Workspace Dashboard (Protected Route tab) */}
        {activeTab === 'dashboard' && currentUser && currentUser.role === 'user' && (
          <div className="space-y-8 animate-fade-in" id="customer-identity-dashboard">
            
            {/* Top welcome card / Banner */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono text-[10px] uppercase font-bold tracking-wider rounded-lg">
                    {currentUser.google_id ? 'Authenticated via Google' : 'Registered Member Account'}
                  </span>
                  <span className="px-2.5 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono text-[10px] uppercase font-bold tracking-wider rounded-lg">
                    Verified
                  </span>
                </div>
                <h2 className="text-2xl mt-3 font-extrabold tracking-tight">Active Portal: Dashboard</h2>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Welcome back, <strong className="text-slate-800 dark:text-slate-200 font-semibold">{currentUser.name}</strong> ({currentUser.username}). Customize conversion settings and inspect history telemetry.
                </p>
              </div>

              <div className="flex space-x-3 shrink-0">
                <button
                  onClick={() => setActiveTab('converters')}
                  className="px-4 py-2.5 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold uppercase rounded-xl shadow-md tracking-wider leading-none cursor-pointer flex items-center space-x-2 shrink-0"
                >
                  <span>Interactive Converters</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Middle Section: Widgets grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Side: Conversion analytics column */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* 1. Daily Conversion requests area chart */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-md flex flex-col justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="text-blue-500 h-5 w-5" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white">
                        Your Conversion Interaction Activity
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Daily conversion requests processed via Neon serverless instances.</p>
                  </div>

                  <div className="h-56 mt-6 w-full font-mono text-[10px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b12" />
                        <XAxis dataKey="name" stroke="#64748b" />
                        <YAxis stroke="#64748b" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#0f172a', 
                            border: 'none', 
                            color: '#fff', 
                            borderRadius: '12px' 
                          }} 
                        />
                        <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCount)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Brand-new conversion category frequencies bar chart widget */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-md flex flex-col relative">
                  
                  {/* Empty state absolute overlay overlay */}
                  {conversions.length === 0 && (
                    <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/90 flex flex-col items-center justify-center text-center p-6 rounded-3xl z-10 backdrop-blur-[1px]">
                      <Sparkles className="h-8 w-8 text-blue-500 animate-pulse mb-2" />
                      <p className="text-xs font-bold text-slate-700 dark:text-slate-300">No telemetry data recorded yet</p>
                      <p className="text-[10px] text-slate-400 mt-1 max-w-xs">Run any length, weight, temperature, or currency conversion to see live analysis!</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <div className="flex items-center space-x-2">
                        <BarChart3 className="text-purple-500 h-5 w-5" />
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white">
                          Conversion Domains Frequency Distribution
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">Breakdown of system utility usage statistics across metric domains.</p>
                    </div>
                    <span className="text-[10px] font-mono py-1 px-2.5 bg-blue-500/10 text-blue-500 rounded-lg shrink-0">
                      LIVE STREAM
                    </span>
                  </div>

                  {/* Dynamic stats row for better UI */}
                  <div className="grid grid-cols-3 gap-3 my-5">
                    <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/60 dark:border-blue-900/40 rounded-2xl">
                      <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Top Domain</span>
                      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate mt-1">
                        {mostPopularCategory.count > 0 ? mostPopularCategory.name : 'N/A'}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100/60 dark:border-purple-900/40 rounded-2xl">
                      <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Peak Hits</span>
                      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate mt-1">
                        {mostPopularCategory.count > 0 ? `${mostPopularCategory.count} times` : '0'}
                      </p>
                    </div>
                    <div className="p-3 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/60 dark:border-emerald-900/40 rounded-2xl">
                      <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">Sectors Used</span>
                      <p className="text-xs font-extrabold text-slate-800 dark:text-slate-100 truncate mt-1">
                        {activeCategoriesCount} / 6
                      </p>
                    </div>
                  </div>

                  {/* Recharts Bar Chart Container */}
                  <div className="h-56 w-full font-mono text-[10px]">
                    <ResponsiveContainer width="100%" height="105%">
                      <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b12" />
                        <XAxis dataKey="name" stroke="#64748b" tickLine={false} />
                        <YAxis stroke="#64748b" tickLine={false} allowDecimals={false} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#0f172a', 
                            border: 'none', 
                            color: '#fff', 
                            borderRadius: '12px' 
                          }} 
                          cursor={{ fill: 'rgba(99, 102, 241, 0.05)' }}
                        />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={45}>
                          {categoryChartData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={categoryChartColors[index % categoryChartColors.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* Right Side: Preference presets and status indicator */}
              <div className="space-y-6">

                {/* Preference setup card */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-md">
                  <div className="flex items-center space-x-2 mb-4">
                    <SettingsIcon className="text-purple-500 h-4.5 w-4.5" />
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-700 dark:text-white">
                      Favorite Dimensions
                    </h4>
                  </div>
                  
                  <div className="space-y-3 mt-4">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-semibold">From Unit Preset</label>
                      <select 
                        value={favUnitsPair.from}
                        onChange={(e) => setFavUnitsPair({ ...favUnitsPair, from: e.target.value })}
                        className="w-full h-10 mt-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="meters">Meters (Length)</option>
                        <option value="kilometers">Kilometers (Length)</option>
                        <option value="kilograms">Kilograms (Weight)</option>
                        <option value="pounds">Pounds (Weight)</option>
                        <option value="liters">Liters (Volume)</option>
                        <option value="celsius">Celsius (Temp)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 uppercase font-semibold">To Unit Preset</label>
                      <select 
                        value={favUnitsPair.to}
                        onChange={(e) => setFavUnitsPair({ ...favUnitsPair, to: e.target.value })}
                        className="w-full h-10 mt-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                      >
                        <option value="feet">Feet (Length)</option>
                        <option value="miles">Miles (Length)</option>
                        <option value="grams">Grams (Weight)</option>
                        <option value="ounces">Ounces (Weight)</option>
                        <option value="gallons">Gallons (Volume)</option>
                        <option value="fahrenheit">Fahrenheit (Temp)</option>
                      </select>
                    </div>

                    <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-[10px] text-blue-600 dark:text-blue-400 leading-normal font-medium mt-1">
                      👑 Saved! These choices will pre-fill converters on return.
                    </div>
                  </div>
                </div>

                {/* DB Info Card */}
                <div className="bg-slate-900 border border-slate-850 text-white rounded-3xl p-6 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Database className="text-green-400 h-5 w-5" />
                      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-350">
                        Neon PostgreSQL
                      </h4>
                    </div>
                    <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                  </div>

                  <p className="text-[10px] text-slate-450 leading-relaxed">
                    Account roles, telemetry analytics, and static page configurations are stored persistently in Neon.
                  </p>

                  <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[9px] font-mono text-slate-400">
                    <span>STATUS: LIVE</span>
                    <span>DRIVER: PG_NATIVE</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Bottom history table */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-md">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 dark:text-white">
                    Historic Operations telemetry
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Export logs gathered from standard client operations.</p>
                </div>
                <button
                  onClick={downloadConversionCSV}
                  disabled={conversions.length === 0}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold uppercase rounded-xl shadow-md tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer"
                  title="Download full conversion history as CSV"
                >
                  <Download className="h-4 w-4" />
                  <span>Download CSV</span>
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                      <th className="py-2.5">Category</th>
                      <th className="py-2.5">Input Spec</th>
                      <th className="py-2.5">Result Out</th>
                      <th className="py-2.5">Executed At</th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-slate-700 dark:text-slate-300">
                    {conversions.slice(0, 5).map((conv) => (
                      <tr key={conv.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-950/20">
                        <td className="py-2 font-bold capitalize">{conv.type.replace('-', ' ')}</td>
                        <td className="py-2">{conv.from_value?.toFixed(2)} {conv.from_unit}</td>
                        <td className="py-2 text-blue-600 dark:text-blue-400 font-semibold">→ {conv.to_value?.toFixed(4)} {conv.to_unit}</td>
                        <td className="py-2 text-[10px] text-slate-400">{new Date(conv.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                    {conversions.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-400 font-sans">No active entries matching this telemetry session.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Corporate Compliance Footer */}
      <Footer 
        currentLang={currentLang} 
        settings={settings || DEFAULT_SETTINGS} 
      />

      {/* Authentication Dialog Modals */}
      {authOpen && (
        <div id="auth-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            
            {/* Close */}
            <button
              id="close-auth-modal"
              onClick={() => setAuthOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Headers */}
            <div className="text-center pb-5 border-b border-slate-100 dark:border-slate-800">
              <div className="h-11 w-11 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Lock className="h-5.5 w-5.5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {authTab === 'login' ? 'ConvertHub Login' : 
                 authTab === 'register' ? 'Create Your Account' : 
                 authTab === 'verify' ? 'Email Verification' : 
                 authTab === 'neon' ? 'Neon Database Auth' : 'Forgot Password Link'}
              </h3>
              <p className="text-[10px] text-slate-500 leading-normal mt-1">
                {authTab === 'login' ? 'Access your custom converters workspace' : 
                 authTab === 'register' ? 'Register and store user roles in Neon database' : 
                 authTab === 'verify' ? 'Confirm your simulated verification code' : 
                 authTab === 'neon' ? 'Authenticate your session using your live Neon Database connection' : 'Enter registered information to override credential values'}
              </p>
            </div>

            {/* Tabs Selector for Login / Signup / Neon */}
            {(authTab === 'login' || authTab === 'register' || authTab === 'neon') && (
              <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl mt-5">
                <button
                  type="button"
                  onClick={() => {
                    setAuthError('');
                    setAuthSuccess('');
                    setAuthTab('login');
                  }}
                  className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${
                    authTab === 'login' 
                      ? 'bg-white dark:bg-slate-900 shadow-sm text-blue-600 dark:text-white' 
                      : 'text-slate-500'
                  }`}
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthError('');
                    setAuthSuccess('');
                    setAuthTab('register');
                  }}
                  className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${
                    authTab === 'register' 
                      ? 'bg-white dark:bg-slate-900 shadow-sm text-blue-600 dark:text-white' 
                      : 'text-slate-500'
                  }`}
                >
                  Sign Up
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthError('');
                    setAuthSuccess('');
                    setAuthTab('neon');
                  }}
                  className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${
                    authTab === 'neon' 
                      ? 'bg-emerald-600 shadow-sm text-white' 
                      : 'text-slate-500'
                  }`}
                >
                  Neon DB
                </button>
              </div>
            )}

            {/* Error / Success logs */}
            {authError && (
              <div className="p-3 mt-4 text-xs bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/60 rounded-xl">
                {authError}
              </div>
            )}
            {authSuccess && (
              <div className="p-3 mt-4 text-xs bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-450 dark:text-green-400 border border-green-100 dark:border-green-900/60 rounded-xl">
                {authSuccess}
              </div>
            )}

            {/* Primary Form */}
            <form onSubmit={handleAuthSubmit} className="mt-5 space-y-4">
              
              {authTab === 'register' && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-850 dark:text-white"
                    placeholder="e.g. Amir Khan"
                    required
                  />
                </div>
              )}

              {/* Username/Email Input for login, register, forgot */}
              {authTab !== 'verify' && authTab !== 'neon' && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Email Address / Username</label>
                  <input
                    type="email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white font-mono"
                    placeholder="e.g. user@converthub.com"
                    required
                  />
                </div>
              )}

              {authTab === 'login' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Password</label>
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
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white"
                    placeholder="Enter account password..."
                    required
                  />
                </div>
              )}

              {authTab === 'register' && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 dark:text-white"
                      placeholder="Password (minimum 6 characters)..."
                      required
                    />
                  </div>


                </>
              )}

              {authTab === 'forgot' && (
                <div className="space-y-4">
                  {forgotStep === 1 && (
                    <div className="space-y-1.5 animate-fade-in">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Registered Email Address</label>
                      <input
                        type="email"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full h-12 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-880 dark:text-white"
                        placeholder="e.g. user@converthub.com"
                        required
                      />
                      <p className="text-[10px] text-slate-400 leading-normal">Enter your email and we will send you a 6-digit password recovery code.</p>
                    </div>
                  )}

                  {forgotStep === 2 && (
                    <div className="space-y-1.5 animate-fade-in">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">6-digit Recovery Code</label>
                      <input
                        type="text"
                        value={verifyCode}
                        onChange={(e) => setVerifyCode(e.target.value)}
                        maxLength={6}
                        className="w-full h-12 text-center text-lg font-mono font-bold rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-880 dark:text-white"
                        placeholder="e.g. 123456"
                        required
                      />
                      <p className="text-[10px] text-slate-400 leading-normal">Enter the 6-digit confirmation code code from your simulated mailbox.</p>
                    </div>
                  )}

                  {forgotStep === 3 && (
                    <div className="space-y-1.5 animate-fade-in">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Enter New Password</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full h-12 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-880 dark:text-white"
                        placeholder="Choose password (minimum 8 characters)"
                        required
                      />
                    </div>
                  )}
                </div>
              )}

              {authTab === 'neon' && (
                <div className="space-y-3.5 animate-fade-in text-left">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Neon Database Connection String (DATABASE_URL)</label>
                    <input
                      type="text"
                      value={neonDbUrl}
                      onChange={(e) => setNeonDbUrl(e.target.value)}
                      className="w-full h-12 px-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-slate-50 dark:bg-slate-950 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 dark:text-emerald-100"
                      placeholder="postgresql://alex:passwd@ep-cool-butterfly-1234.us-east-2.neon.tech/neondb?sslmode=require"
                      required
                    />
                  </div>
                  <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl space-y-1">
                    <h5 className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse mr-1.5"></span>
                      Interactive Session Auth
                    </h5>
                    <p className="text-[9.5px] text-slate-400 leading-normal">
                      This dynamically modifies the active database interface pool to pull from your external Neon PostgreSQL service. Your logged-in identity automatically escalates to site administrator context, allowing direct content queries, setting overrides, and diagnostic analysis. It will seed missing system relations automatically.
                    </p>
                  </div>
                </div>
              )}

              {authTab === 'verify' && (
                <div className="space-y-4 animate-fade-in">
                  {lastSimulatedCode && (
                    <div className="p-4 bg-blue-100/50 dark:bg-blue-950/50 border border-blue-500/20 rounded-2xl text-center space-y-1.5 text-xs text-blue-800 dark:text-blue-350">
                      <div className="font-bold flex items-center justify-center space-x-1">
                        <Sparkles className="h-4.5 w-4.5 text-blue-600 animate-pulse" />
                        <span>Simulated verification Mail Delivered!</span>
                      </div>
                      <p>Enter the code below to instantly activate this account in PostgreSQL:</p>
                      <p className="font-mono text-lg font-black tracking-widest text-blue-650 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 px-4 py-1 rounded-xl inline-block mt-1 select-all">
                        {lastSimulatedCode}
                      </p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">6-Digit Verification OTP Code</label>
                    <input
                      type="text"
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value)}
                      maxLength={6}
                      className="w-full h-12 text-center text-lg font-mono font-bold rounded-xl border border-slate-250 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-550 focus:ring-blue-500/20 text-slate-800 dark:text-white"
                      placeholder="e.g. 123456"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Submit trigger button */}
              <button
                id="auth-submit-btn"
                type="submit"
                className={`w-full h-11 text-white text-xs uppercase font-extrabold tracking-wider rounded-xl shadow-lg transition-all pt-0.5 cursor-pointer mt-5 ${
                  authTab === 'neon' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {authTab === 'login' ? 'Confirm Login' : 
                 authTab === 'register' ? 'Submit Registration' : 
                 authTab === 'verify' ? 'Confirm & Authenticate' : 
                 authTab === 'neon' ? 'Authenticate Neon Stack' :
                 forgotStep === 1 ? 'Dispatch Recovery OTP' :
                 forgotStep === 2 ? 'Verify Reset Code' : 'Save Password & Login'}
              </button>

              {/* Simulated Mailbox Integration inside authentication modal */}
              {simulatedEmails && simulatedEmails.length > 0 && (authTab === 'verify' || (authTab === 'forgot' && forgotStep === 2)) && (
                <div className="mt-5 border-t border-slate-150 dark:border-slate-800 pt-5 space-y-2 text-left">
                  <span className="text-[9px] font-mono font-bold text-blue-500 uppercase flex items-center">
                    <span className="h-1.5 w-1.5 bg-blue-500 rounded-full animate-ping mr-1.5"></span>
                    <span>Sandbox Test Mailbox</span>
                  </span>
                  <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                    {simulatedEmails.map((mail, i) => (
                      <div key={i} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-2xl space-y-1">
                        <div className="flex justify-between text-[8px] font-mono text-slate-400">
                          <span className="truncate">To: {mail.to}</span>
                          <span>{new Date(mail.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-800 dark:text-slate-200">
                          {mail.subject}
                        </p>
                        <p className="text-[9px] font-mono text-blue-600 dark:text-blue-400 select-all font-semibold">
                          {mail.body}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Back options */}
              {(authTab === 'forgot' || authTab === 'verify') && (
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

              {/* Secure Google Login */}
              {authTab === 'login' && (
                <>
                  <div className="relative flex items-center justify-center my-6">
                    <div className="absolute inset-0 border-t border-slate-200 dark:border-slate-800" />
                    <span className="relative px-3 text-[10px] text-slate-400 bg-white dark:bg-slate-900 uppercase font-bold tracking-wider">
                      Or, continue with social account
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleOAuth}
                    className="w-full h-11 border border-slate-250 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 bg-white dark:bg-slate-900 text-slate-800 dark:text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center space-x-2.5 cursor-pointer"
                  >
                    {/* Google Icon */}
                    <svg className="h-4.5 w-4.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                    </svg>
                    <span>One-Click Sign in with Google</span>
                  </button>
                </>
              )}

              {/* Helper text instructions panel omitted */}

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
