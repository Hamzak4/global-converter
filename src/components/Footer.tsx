import React from 'react';
import { Mail, Phone, MapPin, Shield, Info, HelpCircle } from 'lucide-react';
import { translations } from '../data';
import { SiteSettings } from '../types';

interface FooterProps {
  currentLang: 'en' | 'es' | 'ur';
  settings: SiteSettings;
}

export const Footer: React.FC<FooterProps> = ({ currentLang, settings }) => {
  const t = translations[currentLang] || translations.en;

  return (
    <footer className="w-full bg-slate-900 border-t border-slate-800 text-slate-400 mt-16 transition-colors duration-200">
      <div id="footer-container" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Company branding summary */}
          <div id="footer-brand">
            <h3 className="text-white text-lg font-bold font-sans tracking-tight mb-3">
              {settings.site_name || t.title}
            </h3>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm">
              {settings.meta_description || t.subtitle}
            </p>
            <p className="text-slate-500 text-xs mt-4">
              © {new Date().getFullYear()} {settings.company_name || 'ConvertHub Inc'}. All rights reserved under local compliance.
            </p>
          </div>

          {/* Quick links & Resources */}
          <div id="footer-links">
            <h4 className="text-white text-sm font-semibold tracking-wider uppercase mb-3">
              Resources & Privacy
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-blue-500" />
                <span className="hover:text-white transition-colors cursor-pointer">Security Protocol Policy</span>
              </li>
              <li className="flex items-center space-x-2">
                <Info className="h-4 w-4 text-blue-500" />
                <span className="hover:text-white transition-colors cursor-pointer">Terms & Conditions Agreement</span>
              </li>
              <li className="flex items-center space-x-2">
                <HelpCircle className="h-4 w-4 text-blue-500" />
                <span className="hover:text-white transition-colors cursor-pointer">Help Center Documentation</span>
              </li>
            </ul>
          </div>

          {/* Contact Details block */}
          <div id="footer-contact">
            <h4 className="text-white text-sm font-semibold tracking-wider uppercase mb-3">
              Corporate Office Coordinates
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-start space-x-2">
                <MapPin className="h-4 w-4 text-blue-500 mt-1 shrink-0" />
                <span className="text-slate-400 leading-snug">
                  {settings.company_address || '100 Silicon Blvd, Suite 400, Mountain View, CA 94043'}
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-blue-500 shrink-0" />
                <span>{settings.company_phone || '+1 (555) 0192-3847'}</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-blue-500 shrink-0" />
                <a 
                  href={`mailto:${settings.company_email || 'support@converthub-global.com'}`}
                  className="hover:text-white transition-colors"
                >
                  {settings.company_email || 'support@converthub-global.com'}
                </a>
              </li>
            </ul>
          </div>

        </div>
      </div>
    </footer>
  );
};
