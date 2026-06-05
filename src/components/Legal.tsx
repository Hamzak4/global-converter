import React, { useState } from 'react';
import { Mail, Check, AlertCircle, Phone, MapPin, Shield, HelpCircle } from 'lucide-react';

interface LegalProps {
  section: 'privacy' | 'terms' | 'contact';
}

export const Legal: React.FC<LegalProps> = ({ section }) => {
  const [formName, setFormName] = useState('');
  const [formMail, setFormMail] = useState('');
  const [formMsg, setFormMsg] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formName && formMail && formMsg) {
      setSubmitted(true);
      setFormMsg('');
    }
  };

  if (section === 'privacy') {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2 font-display">Privacy Policy</h1>
        <p className="text-sm font-mono text-gray-400 mb-8">Last Updated: June 4, 2026</p>
        
        <div className="space-y-6 text-gray-600 dark:text-zinc-300 leading-relaxed text-sm font-sans">
          <p>
            At <strong>GlobalConverter</strong>, accessible from our application portal, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by GlobalConverter and how we use it.
          </p>

          <h2 className="text-lg font-bold text-gray-950 dark:text-white pt-4">1. Information We Collect</h2>
          <p>
            If you contact us directly or interact with our calculators, we may record specific telemetry data such as your IP address, browser user-agent, pages viewed, and transaction quantities. This helps us optimize performance ratios and calculate local geographic data trends (e.g., regional interest in Kanal vs. Bigha).
          </p>

          <h2 className="text-lg font-bold text-gray-950 dark:text-white pt-4">2. DoubleClick DART Cookie & Google AdSense</h2>
          <p>
            Google is one of our potential third-party vendors. It also uses cookies, known as DART cookies, to serve ads to our site visitors based upon their visit to our site and other sites on the internet. However, visitors may choose to decline the use of DART cookies by visiting the Google ad and content network Privacy Policy.
          </p>

          <h2 className="text-lg font-bold text-gray-950 dark:text-white pt-4">3. Log Files</h2>
          <p>
            GlobalConverter follows a standard procedure of using server log files. These files log visitors when they visit applications. All hosting companies do this as part of hosting services' analytics. The information collected by log files includes internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date/time stamp, referring/exit pages, and number of clicks. These are not linked to any information that is personally identifiable.
          </p>

          <h2 className="text-lg font-bold text-gray-950 dark:text-white pt-4">4. GDPR and CCPA Data Rights</h2>
          <p>
            We would like to make sure you are fully aware of all of your data protection rights. Every user is entitled to the right to access, rectification, erasure, restrict processing, object to processing, and data portability. If you make a request, we have one month to respond to you.
          </p>
        </div>
      </div>
    );
  }

  if (section === 'terms') {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-2 font-display">Terms of Service</h1>
        <p className="text-sm font-mono text-gray-400 mb-8">Last Updated: June 4, 2026</p>

        <div className="space-y-6 text-gray-600 dark:text-zinc-300 leading-relaxed text-sm font-sans">
          <p>
            Welcome to <strong>GlobalConverter</strong>! These terms and conditions outline the rules and regulations for the use of GlobalConverter's Measurement and Calculation Portal.
          </p>

          <h2 className="text-lg font-bold text-gray-950 dark:text-white pt-4">1. License Scope</h2>
          <p>
            Unless otherwise stated, GlobalConverter and/or its licensors own the intellectual property rights for all material on GlobalConverter. All intellectual property rights are reserved. You may access this from GlobalConverter for your own personal use subjected to restrictions set in these terms and conditions.
          </p>

          <h2 className="text-lg font-bold text-gray-950 dark:text-white pt-4">2. Accuracy of Calculations</h2>
          <p>
            While we strive to ensure that all formulas, currency conversions, real estate multipliers (Kanal, Marla, Guntha), temperature conversions, and financial amortization calculators are mathematically precise, GlobalConverter provides all tools <strong>"AS IS"</strong>. We make no guarantees of financial accuracy, legal land borders compliance, or banking precision. Always double-check results with a certified professional.
          </p>

          <h2 className="text-lg font-bold text-gray-950 dark:text-white pt-4">3. External Adsense & Ad Delivery</h2>
          <p>
            This application displays placeholder advertisement columns. Actual deployment configurations may include Google AdSense tags. We are not liable for the exact content, links, products, or transactions triggered inside user interaction banners.
          </p>

          <h2 className="text-lg font-bold text-gray-950 dark:text-white pt-4">4. Liability Limitation</h2>
          <p>
            In no event shall GlobalConverter, nor any of its developers or officers, be held liable for anything arising out of or in any way connected with your use of this application.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Contact info column */}
        <div className="md:col-span-1 space-y-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight font-display">Contact Us</h1>
            <p className="text-sm text-gray-500 mt-2">Get in touch with GlobalConverter's engineer support desk.</p>
          </div>

          <div className="space-y-4 font-sans">
            <div className="flex items-start space-x-3.5 Card p-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-850">
              <Mail className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-gray-900 dark:text-white">Email Address</h4>
                <p className="text-xs text-gray-500">support@globalconverter.com</p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5 Card p-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-850">
              <Phone className="h-5 w-5 text-emerald-500 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-gray-900 dark:text-white">Phone Supportline</h4>
                <p className="text-xs text-gray-500">+1 (800) 555-0199</p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5 Card p-3 rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-850">
              <MapPin className="h-5 w-5 text-red-500 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-gray-900 dark:text-white">Global Headquarters</h4>
                <p className="text-xs text-gray-500">Silicon Valley, California, USA</p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form Column */}
        <div className="md:col-span-2 border border-gray-100 dark:border-zinc-800 rounded-xl p-6 bg-white dark:bg-zinc-900 shadow-sm shadow-black/5">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Send a Support Ticket</h3>
          
          {submitted ? (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 rounded-lg flex items-start space-x-3">
              <Check className="h-5 w-5 mt-0.5 text-emerald-500 shrink-0" />
              <div>
                <h4 className="font-extrabold text-sm">Message Transmitted!</h4>
                <p className="text-xs mt-1">Thank you. Your support inquiry has been safely pushed. One of our engineers will follow up within 24 hours.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-750 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Full Name</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2 select-all rounded-lg border border-gray-250 dark:border-zinc-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-750 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={formMail}
                  onChange={(e) => setFormMail(e.target.value)}
                  className="w-full px-3.5 py-2 select-all rounded-lg border border-gray-250 dark:border-zinc-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. name@domain.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-750 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Detail Message Brief</label>
                <textarea
                  required
                  rows={4}
                  value={formMsg}
                  onChange={(e) => setFormMsg(e.target.value)}
                  className="w-full px-3.5 py-2 select-all rounded-lg border border-gray-250 dark:border-zinc-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Explain exactly how we can help you today..."
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white shadow-xs focus:ring-2 cursor-pointer"
              >
                Send Support Ticket
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};

export default Legal;
