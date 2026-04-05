import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, ArrowRight, Clock, User } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CATEGORIES = ['All', 'Devices', 'Machines', 'Personas', 'Techniques'];

const CATEGORY_COLORS = {
  Devices: 'bg-[#D4B996]/20 text-[#8B6914]',
  Machines: 'bg-[#B55B49]/10 text-[#B55B49]',
  Personas: 'bg-[#6B8F71]/15 text-[#4A7050]',
  Techniques: 'bg-[#7B8EA8]/15 text-[#4A6380]',
};

export default function LabsPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchArticles();
  }, [activeCategory]);

  const fetchArticles = async () => {
    try {
      const params = {};
      if (activeCategory !== 'All') params.category = activeCategory;
      const res = await axios.get(`${API}/articles`, { params });
      setArticles(res.data);
    } catch (err) {
      console.error('Failed to fetch articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = articles.filter(a =>
    a.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.summary?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.author_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#FDFBF7]" data-testid="labs-page">
      {/* Header */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 pt-10 pb-6">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <p className="text-[#B55B49] font-medium text-sm tracking-widest uppercase mb-3">Coffee Grind</p>
          <h1 className="font-['Cormorant_Garamond'] text-4xl sm:text-5xl font-light text-[#2C1A12] tracking-tight leading-tight mb-2" data-testid="labs-title">
            Labs
          </h1>
          <p className="text-[#6B5744] text-base max-w-lg mb-8">
            Deep dives into the devices, machines, people, and techniques that shape the world of specialty coffee.
          </p>
        </motion.div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-6" data-testid="category-filters">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat
                  ? 'bg-[#2C1A12] text-white'
                  : 'bg-[#E8E3D9]/50 text-[#6B5744] hover:bg-[#E8E3D9]'
              }`}
              data-testid={`filter-${cat.toLowerCase()}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-md mb-10">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B5744]" />
          <Input
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-[#E8E3D9] focus:border-[#B55B49]"
            data-testid="labs-search"
          />
        </div>
      </section>

      {/* Articles Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 pb-16">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map(i => <div key={i} className="bg-[#E8E3D9]/30 animate-pulse rounded-lg h-72" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20" data-testid="no-articles">
            <p className="text-[#6B5744] text-lg">No articles found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8" data-testid="articles-grid">
            {filtered.map((article, idx) => (
              <motion.div
                key={article.article_id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.08 }}
              >
                <Link to={`/labs/${article.article_id}`} className="group block" data-testid={`article-card-${article.article_id}`}>
                  <div className="bg-white border border-[#E8E3D9] rounded-lg overflow-hidden hover:shadow-[0_8px_32px_rgba(44,26,18,0.08)] transition-all hover:-translate-y-0.5">
                    {/* Cover image */}
                    {article.cover_image ? (
                      <div className="h-48 overflow-hidden bg-[#E8E3D9]">
                        <img src={article.cover_image.startsWith('http') ? article.cover_image : `${API}/files/${article.cover_image}`} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      </div>
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-[#E8E3D9] to-[#D4B996]/30 flex items-center justify-center">
                        <span className="font-['Cormorant_Garamond'] text-4xl text-[#D4B996]/50 italic">{article.category}</span>
                      </div>
                    )}
                    {/* Content */}
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`text-xs font-medium ${CATEGORY_COLORS[article.category] || 'bg-[#E8E3D9] text-[#6B5744]'}`}>
                          {article.category}
                        </Badge>
                        {article.sections?.length > 0 && (
                          <span className="text-xs text-[#6B5744]/50">{article.sections.length} sections</span>
                        )}
                      </div>
                      <h3 className="font-['Cormorant_Garamond'] text-xl font-semibold text-[#2C1A12] group-hover:text-[#B55B49] transition-colors leading-snug mb-2">
                        {article.title}
                      </h3>
                      <p className="text-[#6B5744] text-sm leading-relaxed line-clamp-2 mb-4">
                        {article.summary}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 text-[#6B5744]" />
                          <span className="text-xs text-[#6B5744]">{article.author_name}</span>
                        </div>
                        <span className="text-[#B55B49] text-sm font-medium group-hover:underline underline-offset-2 flex items-center gap-1">
                          Read <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
