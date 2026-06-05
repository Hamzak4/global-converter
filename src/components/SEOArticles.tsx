import React from 'react';
import { ArrowLeft, BookOpen, Clock, Calendar, HelpCircle, ChevronRight, Share2, Printer } from 'lucide-react';
import { Article, FAQ, Category } from '../types';

interface SEOArticlesProps {
  article: Article;
  categories: Category[];
  allFaqs: FAQ[];
  navigate: (path: string) => void;
}

export const SEOArticles: React.FC<SEOArticlesProps> = ({ article, categories, allFaqs, navigate }) => {
  const catName = categories.find(c => c.id === article.category_id)?.name || 'General';
  const relatedFAQs = allFaqs.filter(f => f.parent_id === article.slug || f.parent_id === String(article.id));

  // Prints the page beautifully
  const handlePrint = () => {
    window.print();
  };

  return (
    <article className="max-w-4xl mx-auto py-8" id="seo-knowledge-article-viewport">
      
      {/* Back to Guides */}
      <button
        onClick={() => navigate('/blog')}
        className="flex items-center space-x-1.5 text-xs font-semibold text-gray-500 hover:text-blue-600 mb-6 group transition-colors"
        id="back-to-guides-btn"
      >
        <ArrowLeft className="h-4 w-4 transform group-hover:-translate-x-1 transition-transform" />
        <span>Return to All Reference Material</span>
      </button>

      {/* Hero Category Badge & Metadata Header */}
      <header className="space-y-4 mb-8">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-zinc-800 text-blue-600 dark:text-blue-400">
          {catName}
        </span>
        
        <h1 className="text-3xl sm:text-4.5xl font-extrabold tracking-tight text-gray-900 dark:text-white leading-tight">
          {article.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 font-mono">
          <span className="flex items-center"><Clock className="h-3.5 w-3.5 mr-1" /> 4 Min Read</span>
          <span className="flex items-center"><Calendar className="h-3.5 w-3.5 mr-1" /> Published: {new Date(article.created_at).toLocaleDateString()}</span>
          <span>Views: <strong>{article.views + 1}</strong></span>
        </div>
      </header>

      {/* Featured Banner Graphic */}
      <div className="aspect-video w-full rounded-2xl overflow-hidden bg-gray-100 mb-8 border border-gray-100 shadow-sm">
        <img
          src={article.image_url}
          alt={article.title}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover"
        />
      </div>

      {/* Core Grid layout for content and side guides */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main core reading text */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Main Markdown equivalent formatted content card */}
          <div 
            className="prose prose-blue dark:prose-invert text-gray-700 dark:text-zinc-300 leading-relaxed text-sm space-y-6"
            id="markdown-rendered-content"
          >
            {article.content.split('\n\n').map((paragraph, index) => {
              if (paragraph.startsWith('### ')) {
                return (
                  <h3 key={index} className="text-lg font-bold text-gray-900 dark:text-white pt-4">
                    {paragraph.replace('### ', '')}
                  </h3>
                );
              }
              if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                return (
                  <p key={index} className="font-extrabold text-blue-600 dark:text-blue-400">
                    {paragraph.replace(/\*\*/g, '')}
                  </p>
                );
              }
              if (paragraph.startsWith('1. ') || paragraph.startsWith('- ')) {
                return (
                  <ul key={index} className="list-disc pl-5 space-y-1 text-xs">
                    {paragraph.split('\n').map((li, lIdx) => (
                      <li key={lIdx}>{li.replace(/^(\d+\.|-)\s+/, '')}</li>
                    ))}
                  </ul>
                );
              }
              return (
                <p key={index} className="whitespace-pre-line">
                  {paragraph}
                </p>
              );
            })}
          </div>

          {/* FAQ Schema Markup Accordions for Core Web Indexing (FAQ Schema support) */}
          {relatedFAQs.length > 0 && (
            <section className="pt-6 border-t border-gray-100 dark:border-zinc-800" id="faq-accordions-render-list">
              <h3 className="text-lg font-extrabold text-gray-950 dark:text-white mb-4 flex items-center">
                <HelpCircle className="h-5 w-5 text-amber-500 mr-2" />
                <span>Frequently Answered FAQs</span>
              </h3>

              <div className="space-y-4">
                {relatedFAQs.map((faq) => (
                  <div 
                    key={faq.id} 
                    className="p-4 bg-gray-50/50 dark:bg-zinc-800/20 border border-gray-200 dark:border-zinc-800 rounded-xl"
                  >
                    <h4 className="font-extrabold text-xs text-gray-900 dark:text-white mb-1.5">{faq.question}</h4>
                    <p className="text-xs text-gray-550 dark:text-zinc-400 leading-relaxed">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>

        {/* Floating Side Tools */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Quick Stats panel Card */}
          <div className="card p-5 border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 w-full relative">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 mb-3">Formula Summary Box</h4>
            
            <div className="space-y-4 text-xs font-semibold">
              <div className="p-3 bg-amber-500/10 dark:bg-zinc-800 rounded-lg border border-amber-500/20">
                <span className="text-[9px] font-mono font-bold uppercase text-amber-600 dark:text-amber-400">Calculation equation</span>
                <p className="font-mono text-gray-800 dark:text-amber-300 mt-1">{article.formula || 'Varies by fractional base ratio'}</p>
              </div>

              <div className="p-3 bg-blue-500/10 dark:bg-zinc-800 rounded-lg border border-blue-500/20">
                <span className="text-[9px] font-mono font-bold uppercase text-blue-600 dark:text-blue-400">Practical Example proof</span>
                <p className="font-mono text-gray-800 dark:text-blue-300 mt-1 text-[11px] leading-relaxed">{article.example || 'Provided in guide body contents'}</p>
              </div>
              
              <div className="pt-2">
                <button
                  onClick={handlePrint}
                  className="w-full flex items-center justify-center space-x-2 py-2 border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 rounded-xl hover:bg-gray-50 font-bold text-gray-700 dark:text-zinc-300 transition-all text-xs shadow-sm"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Cheat-sheet</span>
                </button>
              </div>
            </div>
          </div>

          {/* Strategic Related Categories guide redirects */}
          <div className="card p-5 border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl space-y-3 shadow-sm">
            <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Support Tools Desk</h4>
            <div className="space-y-1">
              <button onClick={() => navigate('/')} className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 text-xs font-semibold text-gray-750 hover:text-blue-600 transition-all">
                <span>Unit Converter Tool</span>
                <ChevronRight className="h-4 w-4 text-gray-405" />
              </button>
              <button onClick={() => navigate('/calculators')} className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 text-xs font-semibold text-gray-750 hover:text-blue-600 transition-all">
                <span>Calculators Suite</span>
                <ChevronRight className="h-4 w-4 text-gray-405" />
              </button>
            </div>
          </div>

        </div>

      </div>

    </article>
  );
};

export default SEOArticles;
