import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Tag, Clock } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CATEGORY_COLORS = {
  Devices: 'bg-[#D4B996]/20 text-[#8B6914]',
  Machines: 'bg-[#B55B49]/10 text-[#B55B49]',
  Personas: 'bg-[#6B8F71]/15 text-[#4A7050]',
  Techniques: 'bg-[#7B8EA8]/15 text-[#4A6380]',
};

export default function ArticleDetail() {
  const { articleId } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await axios.get(`${API}/articles/${articleId}`);
        setArticle(res.data);
      } catch (err) {
        console.error('Failed to fetch article:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [articleId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#B55B49] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center gap-4">
        <p className="text-[#6B5744] text-lg">Article not found.</p>
        <Link to="/labs" className="text-[#B55B49] hover:underline text-sm">Back to Labs</Link>
      </div>
    );
  }

  const formattedDate = article.created_at
    ? new Date(article.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="min-h-screen bg-[#FDFBF7]" data-testid="article-detail-page">
      {/* Back link */}
      <div className="max-w-3xl mx-auto px-4 sm:px-8 pt-6">
        <Link
          to="/labs"
          className="inline-flex items-center gap-1.5 text-sm text-[#6B5744] hover:text-[#B55B49] transition-colors"
          data-testid="back-to-labs"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Labs
        </Link>
      </div>

      {/* Article Header */}
      <motion.header
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto px-4 sm:px-8 pt-8 pb-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Badge className={`text-xs font-medium ${CATEGORY_COLORS[article.category] || 'bg-[#E8E3D9] text-[#6B5744]'}`}>
            {article.category}
          </Badge>
          {formattedDate && (
            <span className="flex items-center gap-1 text-xs text-[#6B5744]/60">
              <Clock className="w-3 h-3" /> {formattedDate}
            </span>
          )}
        </div>

        <h1
          className="font-['Cormorant_Garamond'] text-3xl sm:text-4xl lg:text-5xl font-light text-[#2C1A12] tracking-tight leading-tight mb-4"
          data-testid="article-title"
        >
          {article.title}
        </h1>

        {article.summary && (
          <p className="text-[#6B5744] text-base sm:text-lg leading-relaxed max-w-2xl" data-testid="article-summary">
            {article.summary}
          </p>
        )}

        {/* Author */}
        {article.author_name && (
          <div className="flex items-center gap-3 mt-6 pt-6 border-t border-[#E8E3D9]" data-testid="article-author">
            {article.author_image ? (
              <img
                src={`${API}/files/${article.author_image}`}
                alt={article.author_name}
                className="w-10 h-10 rounded-full object-cover border border-[#E8E3D9]"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[#D4B996]/30 flex items-center justify-center">
                <User className="w-4 h-4 text-[#6B5744]" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-[#2C1A12]">{article.author_name}</p>
              {article.author_bio && (
                <p className="text-xs text-[#6B5744]/70">{article.author_bio}</p>
              )}
            </div>
          </div>
        )}
      </motion.header>

      {/* Cover Image */}
      {article.cover_image && (
        <div className="max-w-4xl mx-auto px-4 sm:px-8 mb-10">
          <div className="rounded-lg overflow-hidden border border-[#E8E3D9]">
            <img
              src={`${API}/files/${article.cover_image}`}
              alt={article.title}
              className="w-full h-auto max-h-[480px] object-cover"
              data-testid="article-cover-image"
            />
          </div>
        </div>
      )}

      {/* Article Content (Rich HTML) */}
      {article.content ? (
        <motion.article
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="max-w-3xl mx-auto px-4 sm:px-8 pb-16"
        >
          <div
            className="article-content prose-coffee"
            dangerouslySetInnerHTML={{ __html: article.content }}
            data-testid="article-content"
          />
        </motion.article>
      ) : article.sections?.length > 0 ? (
        /* Fallback: render sections if no content field */
        <motion.article
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="max-w-3xl mx-auto px-4 sm:px-8 pb-16 space-y-10"
        >
          {article.sections.map((section, idx) => (
            <section key={idx} data-testid={`article-section-${idx}`}>
              {section.heading && (
                <h2 className="font-['Cormorant_Garamond'] text-2xl font-semibold text-[#2C1A12] mb-4">
                  {section.heading}
                </h2>
              )}
              {section.image_path && (
                <div className="rounded-lg overflow-hidden border border-[#E8E3D9] mb-4">
                  <img
                    src={`${API}/files/${section.image_path}`}
                    alt={section.heading || ''}
                    className="w-full h-auto max-h-[400px] object-cover"
                  />
                </div>
              )}
              {section.body && (
                <div className="text-[#2C1A12]/80 leading-relaxed space-y-4">
                  {section.body.split('\n\n').map((para, pIdx) => (
                    <p key={pIdx}>{para}</p>
                  ))}
                </div>
              )}
            </section>
          ))}
        </motion.article>
      ) : null}

      {/* Tags */}
      {article.tags?.length > 0 && (
        <div className="max-w-3xl mx-auto px-4 sm:px-8 pb-10">
          <div className="flex items-center gap-2 flex-wrap pt-6 border-t border-[#E8E3D9]" data-testid="article-tags">
            <Tag className="w-3.5 h-3.5 text-[#6B5744]/50" />
            {article.tags.map(tag => (
              <span key={tag} className="text-xs text-[#6B5744]/60 bg-[#E8E3D9]/50 px-2.5 py-1 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Back to Labs */}
      <div className="max-w-3xl mx-auto px-4 sm:px-8 pb-16">
        <Link
          to="/labs"
          className="inline-flex items-center gap-1.5 text-sm text-[#B55B49] hover:underline underline-offset-2"
          data-testid="bottom-back-to-labs"
        >
          <ArrowLeft className="w-4 h-4" /> All articles
        </Link>
      </div>
    </div>
  );
}
