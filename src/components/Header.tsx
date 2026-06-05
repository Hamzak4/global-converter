import React, { useState, useEffect } from 'react';
import { Globe, Sun, Moon, LogIn, LogOut, ShieldAlert } from 'lucide-react';
import { LANGUAGES, translations } from '../data';

interface HeaderProps {
  currentLang: 'en' | 'es' | 'ur';
  setLang: (lang: 'en' | 'es' | 'ur') => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  currentUser: any;
  setCurrentUser: (user: any) => void;
  onOpenAuth: () => void;
  onTabChange: (tab: string) => void;
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentLang,
  setLang,
  darkMode,
  setDarkMode,
  currentUser,
  setCurrentUser,
  onOpenAuth,
  onTabChange,
  activeTab
}) => {
  const t = translations[currentLang] || translations.en;
  const [langOpen, setLangOpen] = useState(false);

  useEffect(() => {
    const handleClose = () => setLangOpen(false);
    window.addEventListener('click', handleClose);
    return () => window.removeEventListener('click', handleClose);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/90 dark:border-slate-800 dark:bg-slate-900/90 backdrop-blur-md transition-colors duration-200">
      <div id="header-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div 
          id="brand-logo" 
          onClick={() => onTabChange('converters')}
          className="flex items-center space-x-2.5 cursor-pointer hover:opacity-90"
        >
          <div className="h-10 w-10 bg-blue-600 dark:bg-blue-500 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Globe className="h-5.5 w-5.5 animate-spin" style={{ animationDuration: '40s' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold font-sans tracking-tight text-slate-900 dark:text-white leading-none">
              {t.title}
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sans tracking-wide mt-0.5">
              {t.subtitle}
            </p>
          </div>
        </div>

        {/* Navigation Categories Tabs */}
        <nav className="hidden md:flex space-x-1 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl">
          <button
            id="nav-tab-converters"
            onClick={() => onTabChange('converters')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'converters'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t.converters}
          </button>
          <button
            id="nav-tab-guides"
            onClick={() => onTabChange('guides')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'guides' || activeTab.startsWith('article:')
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t.guides}
          </button>
          
          {currentUser && currentUser.role === 'user' && (
            <button
              id="nav-tab-dashboard"
              onClick={() => onTabChange('dashboard')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center space-x-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Dashboard</span>
            </button>
          )}
          
          {currentUser && (currentUser.role === 'admin' || currentUser.role === 'super_admin') && (
            <button
              id="nav-tab-admin"
              onClick={() => onTabChange('admin')}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center space-x-1.5 ${
                activeTab === 'admin'
                  ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 shadow-sm'
                  : 'text-red-600 dark:text-red-400 hover:bg-slate-200/50 dark:hover:bg-slate-700/30'
              }`}
            >
              <ShieldAlert className="h-4 w-4" />
              <span>{currentUser.role === 'super_admin' ? 'Super Admin' : t.admin}</span>
            </button>
          )}
        </nav>

        {/* Configurations list (Language dropdown, dark theme selector, authentication controls) */}
        <div id="controls-panel" className="flex items-center space-x-3">
          
          {/* Custom Language selection dropdown */}
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setLangOpen(!langOpen);
              }}
              className="flex items-center space-x-1 px-3 py-1.5 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 text-xs transition-colors cursor-pointer"
              id="lang-drop-btn"
              type="button"
            >
              <Globe className="h-3.5 w-3.5 mr-1" />
              <span className="font-semibold uppercase">{currentLang}</span>
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-2 w-36 origin-top-right rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-xl z-50 animate-fade-in">
                <div className="py-1">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLang(lang.code as any);
                        setLangOpen(false);
                      }}
                      type="button"
                      className={`flex w-full items-center px-4 py-2 text-left text-xs transition-colors ${
                        currentLang === lang.code
                          ? 'bg-blue-50 dark:bg-slate-900/60 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Theme custom selector */}
          <button
            id="theme-toggler"
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
            title="Toggle theme mode"
          >
            {darkMode ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5" />}
          </button>

          {/* User Signin toggle dashboard control */}
          {currentUser ? (
            <div className="flex items-center space-x-2.5 pl-1.5 border-l border-slate-200 dark:border-slate-800">
              <div className="hidden lg:block text-right">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-none">
                  {currentUser.name}
                </p>
                <p className="text-[9px] uppercase tracking-wider font-mono text-slate-500 mt-1">
                  {currentUser.role}
                </p>
              </div>
              <button
                id="sign-out-btn"
                onClick={() => setCurrentUser(null)}
                className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-all"
                title={t.signOut}
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <button
              id="open-auth-btn"
              onClick={onOpenAuth}
              className="flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-50 text-xs font-semibold rounded-xl shadow-md transition-all cursor-pointer"
            >
              <LogIn className="h-4 w-4" />
              <span>{t.signIn}</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
};
