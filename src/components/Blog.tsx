import React, { useState } from 'react';
import { FileText, Award, Calendar, ChevronRight, Eye, Tag, Search } from 'lucide-react';
import { Article, Category } from '../types';

interface BlogProps {
  articles: Article[];
  categories: Category[];
  navigate: (path: string) => void;
}

export const Blog: React.FC<BlogProps> = ({ articles, categories, navigate }) => {
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter regular blog articles (exclude dynamic search index terms if preferred, or include them all!)
  const filteredArticles = articles.filter(art => {
    const matchesCat = activeCategory === null || art.category_id === activeCategory;
    const matchesSearch = art.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          art.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-10" id="blog-guides-root">
      
      {/* Blog Hero Heading */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">Finance & Calculations Guides</h1>
        <p className="text-sm text-gray-405 leading-relaxed">
          Read certified expert analyses on real estate, South Asian land measurements, live foreign exchanges, and global tax systems.
        </p>
      </div>

      {/* Content layout grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Side Filters Columns */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Quick Search bar */}
          <div className="card p-4 border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 block">Filter Articles</h3>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 select-all pr-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white"
                id="blog-search-query-bar"
              />
            </div>
          </div>

          {/* Categories select checklist */}
          <div className="card p-4 border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 block">Categories</h3>
            <div className="flex flex-col space-y-1 text-xs">
              
              <button
                onClick={() => setActiveCategory(null)}
                className={`w-full text-left p-2 rounded-lg font-bold transition-all ${activeCategory === null ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400' : 'text-gray-650 hover:bg-gray-50'}`}
              >
                All Articles
              </button>

              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveCategory(c.id)}
                  className={`w-full text-left p-2 rounded-lg font-bold transition-all ${activeCategory === c.id ? 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400' : 'text-gray-650 hover:bg-gray-50'}`}
                >
                  {c.name}
                </button>
              ))}

            </div>
          </div>

        </div>

        {/* Right Articles Index List grid */}
        <div className="lg:col-span-3">
          
          {filteredArticles.length === 0 ? (
            <div className="text-center p-12 bg-gray-50 dark:bg-zinc-800/10 rounded-2xl border border-dashed text-gray-400">
              <p className="font-semibold select-none">No articles located matching current category filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="blog-articles-index-grid">
              {filteredArticles.map((art) => {
                const catName = categories.find(c => c.id === art.category_id)?.name || 'General';
                return (
                  <article
                    key={art.id}
                    className="group card overflow-hidden border border-gray-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    
                    {/* Hero Image */}
                    <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
                      <img
                        src={art.image_url}
                        alt={art.title}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <span className="absolute top-3 left-3 px-2 py-0.5 rounded bg-black/75 text-white text-[10px] font-bold tracking-wider uppercase font-mono">
                        {catName}
                      </span>
                    </div>

                    {/* Meta info and content brief */}
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3 text-[10px] font-mono text-gray-400">
                          <span className="flex items-center"><Calendar className="h-3 w-3 mr-1" /> {new Date(art.created_at).toLocaleDateString()}</span>
                          <span className="flex items-center"><Eye className="h-3 w-3 mr-1" /> {art.views} views</span>
                        </div>

                        <h3 className="font-extrabold text-sm text-gray-900 dark:text-white group-hover:text-blue-600 leading-tight">
                          {art.title}
                        </h3>
                        
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                          {art.meta_description}
                        </p>
                      </div>

                      <div className="pt-4">
                        <button
                          onClick={() => navigate(`/pages/${art.slug}`)}
                          className="text-xs font-extrabold text-blue-600 dark:text-blue-400 inline-flex items-center space-x-1 hover:underline"
                        >
                          <span>Explore Guide</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                  </article>
                );
              })}
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default Blog;
