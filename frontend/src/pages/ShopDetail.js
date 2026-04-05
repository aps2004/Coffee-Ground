import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Star, ArrowLeft, Clock, Tag, MessageSquare, Send, Music } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import RatingStars from '../components/RatingStars';
import ImageCollage from '../components/ImageCollage';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1738327264976-fa0b8d9af52c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHwzfHxjb3p5JTIwVUslMjBjb2ZmZWUlMjBzaG9wJTIwaW50ZXJpb3J8ZW58MHx8fHwxNzc1MjMwNjk2fDA&ixlib=rb-4.1.0&q=85",
  "https://images.unsplash.com/photo-1738327264238-ec102a3c626a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHwyfHxjb3p5JTIwVUslMjBjb2ZmZWUlMjBzaG9wJTIwaW50ZXJpb3J8ZW58MHx8fHwxNzc1MjMwNjk2fDA&ixlib=rb-4.1.0&q=85",
  "https://images.unsplash.com/photo-1545399885-fd918e63002f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHwxfHxjb3p5JTIwVUslMjBjb2ZmZWUlMjBzaG9wJTIwaW50ZXJpb3J8ZW58MHx8fHwxNzc1MjMwNjk2fDA&ixlib=rb-4.1.0&q=85",
  "https://images.unsplash.com/photo-1588591741887-802be52c1171?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHw0fHxjb3p5JTIwVUslMjBjb2ZmZWUlMjBzaG9wJTIwaW50ZXJpb3J8ZW58MHx8fHwxNzc1MjMwNjk2fDA&ixlib=rb-4.1.0&q=85"
];

export default function ShopDetail() {
  const { shopId } = useParams();
  const { user } = useAuth();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userRating, setUserRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchShop();
  }, [shopId]);

  const fetchShop = async () => {
    try {
      const res = await axios.get(`${API}/shops/${shopId}`);
      setShop(res.data);
      // Check if user already rated
      if (user) {
        const existing = res.data.ratings?.find(r => r.user_id === user.user_id);
        if (existing) {
          setUserRating(existing.rating);
          setComment(existing.comment || '');
        }
      }
    } catch (err) {
      console.error('Failed to fetch shop:', err);
    } finally {
      setLoading(false);
    }
  };

  const submitRating = async () => {
    if (!user) return;
    if (userRating === 0) return;
    setSubmitting(true);
    try {
      await axios.post(`${API}/shops/${shopId}/rate`, {
        rating: userRating,
        comment
      }, { withCredentials: true });
      await fetchShop();
    } catch (err) {
      console.error('Failed to submit rating:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#B55B49] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-[#6B5744] text-lg">Coffee shop not found</p>
        <Link to="/"><Button variant="outline">Back to Home</Button></Link>
      </div>
    );
  }

  const shopImages = shop.images?.length > 0
    ? shop.images.map(img => `${API}/files/${img.storage_path}`)
    : PLACEHOLDER_IMAGES;

  const combinedRating = shop.rating_count > 0 && shop.admin_rating > 0
    ? ((shop.admin_rating + shop.avg_user_rating) / 2).toFixed(1)
    : shop.rating_count > 0
    ? shop.avg_user_rating.toFixed(1)
    : shop.admin_rating.toFixed(1);

  return (
    <div className="min-h-screen">
      {/* Hero Image */}
      <section className="relative h-[60vh] overflow-hidden" data-testid="shop-hero">
        <img
          src={shopImages[0]}
          alt={shop.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2C1A12]/80 via-[#2C1A12]/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12">
          <div className="max-w-5xl mx-auto">
            <Link to="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-4 transition-colors" data-testid="back-to-home">
              <ArrowLeft className="w-4 h-4" /> Back to listings
            </Link>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-['Cormorant_Garamond'] text-4xl sm:text-5xl lg:text-6xl font-light text-white tracking-tight leading-none mb-3"
              data-testid="shop-name"
            >
              {shop.name}
            </motion.h1>
            <div className="flex flex-wrap items-center gap-4 text-white/80">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" /> {shop.city}{shop.address ? `, ${shop.address}` : ''}
              </span>
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-[#D4B996] fill-[#D4B996]" /> {combinedRating}
              </span>
              {shop.rating_count > 0 && (
                <span className="text-sm">({shop.rating_count} review{shop.rating_count !== 1 ? 's' : ''})</span>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-12">
        {/* Tags */}
        {shop.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8" data-testid="shop-tags">
            {shop.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="bg-[#E8E3D9] text-[#6B5744] font-medium">
                <Tag className="w-3 h-3 mr-1" /> {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-[#6B5744] text-lg leading-relaxed mb-8" data-testid="shop-description">
                {shop.description}
              </p>
              {shop.detailed_description && (
                <div className="prose max-w-none" data-testid="shop-detailed-description">
                  {shop.detailed_description.split('\n\n').map((para, i) => (
                    <p key={i} className="text-[#2C1A12]/80 leading-relaxed mb-4">
                      {para}
                    </p>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Image Collage */}
            {shopImages.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-12"
              >
                <h3 className="font-['Cormorant_Garamond'] text-2xl font-light text-[#2C1A12] mb-6">Gallery</h3>
                <ImageCollage images={shopImages} />
              </motion.div>
            )}

            {/* Shop Playlist / Music Section */}
            {shop.playlist_url && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-12"
                data-testid="shop-playlist"
              >
                <h3 className="font-['Cormorant_Garamond'] text-2xl font-light text-[#2C1A12] mb-2">
                  <Music className="w-5 h-5 inline mr-2" />
                  The Sound of {shop.name}
                </h3>
                <p className="text-[#6B5744] text-sm mb-5">
                  A playlist curated by the shop, as recommended to our editors
                </p>
                <div className="rounded overflow-hidden border border-[#E8E3D9] bg-[#2C1A12]">
                  <iframe
                    title={`${shop.name} playlist`}
                    src={(() => {
                      let url = shop.playlist_url;
                      // Convert regular Spotify URLs to embed URLs
                      if (url.includes('open.spotify.com') && !url.includes('/embed/')) {
                        url = url.replace('open.spotify.com/', 'open.spotify.com/embed/');
                      }
                      // Add required query params if missing
                      if (!url.includes('utm_source')) {
                        url += (url.includes('?') ? '&' : '?') + 'utm_source=generator&theme=0';
                      }
                      return url;
                    })()}
                    width="100%"
                    height="352"
                    frameBorder="0"
                    allowFullScreen
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    style={{ borderRadius: '0.5rem' }}
                    data-testid="spotify-embed"
                  />
                </div>
              </motion.div>
            )}

            {/* Reviews Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-12"
            >
              <h3 className="font-['Cormorant_Garamond'] text-2xl font-light text-[#2C1A12] mb-6">
                <MessageSquare className="w-5 h-5 inline mr-2" />
                Reviews
              </h3>

              {/* Rate Form */}
              {user ? (
                <div className="bg-white border border-[#E8E3D9] rounded p-6 mb-8" data-testid="rate-form">
                  <p className="text-[#2C1A12] font-medium mb-3">Rate this coffee shop</p>
                  <RatingStars
                    rating={userRating}
                    interactive={true}
                    onRate={setUserRating}
                    size="lg"
                  />
                  <Textarea
                    placeholder="Share your experience..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="mt-4 bg-[#FDFBF7] border-[#E8E3D9] focus:border-[#B55B49]"
                    data-testid="review-comment"
                  />
                  <Button
                    onClick={submitRating}
                    disabled={userRating === 0 || submitting}
                    className="mt-3 bg-[#B55B49] hover:bg-[#9a4d3e] text-white gap-2"
                    data-testid="submit-review-btn"
                  >
                    <Send className="w-4 h-4" /> {submitting ? 'Submitting...' : 'Submit Review'}
                  </Button>
                </div>
              ) : (
                <div className="bg-[#E8E3D9]/40 rounded p-6 mb-8 text-center" data-testid="login-to-rate">
                  <p className="text-[#6B5744] mb-3">Sign in to leave a review</p>
                  <Link to="/auth">
                    <Button
                      className="bg-[#B55B49] hover:bg-[#9a4d3e] text-white"
                      data-testid="sign-in-to-rate-btn"
                    >
                      Sign in to Review
                    </Button>
                  </Link>
                </div>
              )}

              {/* Reviews List */}
              {shop.ratings?.length > 0 ? (
                <div className="space-y-4" data-testid="reviews-list">
                  {shop.ratings.map((review, i) => (
                    <div key={review.rating_id || i} className="border border-[#E8E3D9] rounded p-5 bg-white">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={review.user_picture} />
                          <AvatarFallback className="bg-[#D4B996] text-[#2C1A12] text-sm">
                            {(review.user_name || 'A')[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-[#2C1A12] font-medium text-sm">{review.user_name || 'Anonymous'}</p>
                          <RatingStars rating={review.rating} size="sm" />
                        </div>
                      </div>
                      {review.comment && <p className="text-[#6B5744] text-sm mt-2">{review.comment}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#6B5744] text-sm" data-testid="no-reviews">No reviews yet. Be the first to share your experience!</p>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Rating Card */}
              <div className="bg-white border border-[#E8E3D9] rounded p-6" data-testid="rating-card">
                <h4 className="font-['Cormorant_Garamond'] text-xl text-[#2C1A12] mb-4">Ratings</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[#6B5744]">Editor's Rating</span>
                    <div className="flex items-center gap-1">
                      <RatingStars rating={shop.admin_rating} size="sm" />
                      <span className="text-sm font-medium text-[#2C1A12] ml-1">{shop.admin_rating}</span>
                    </div>
                  </div>
                  {shop.rating_count > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#6B5744]">Community ({shop.rating_count})</span>
                      <div className="flex items-center gap-1">
                        <RatingStars rating={shop.avg_user_rating} size="sm" />
                        <span className="text-sm font-medium text-[#2C1A12] ml-1">{shop.avg_user_rating}</span>
                      </div>
                    </div>
                  )}
                  <div className="border-t border-[#E8E3D9] pt-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-[#2C1A12]">Overall</span>
                    <span className="text-2xl font-['Cormorant_Garamond'] font-semibold text-[#B55B49]">{combinedRating}</span>
                  </div>
                </div>
              </div>

              {/* Location Card */}
              <div className="bg-white border border-[#E8E3D9] rounded p-6" data-testid="location-card">
                <h4 className="font-['Cormorant_Garamond'] text-xl text-[#2C1A12] mb-3">Location</h4>
                <p className="text-[#6B5744] text-sm flex items-start gap-2">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                  {shop.address || shop.city}
                </p>
                {shop.latitude && shop.longitude && (
                  <Link to="/map" className="mt-3 inline-block" data-testid="view-on-map-link">
                    <Button variant="outline" size="sm" className="border-[#E8E3D9] text-[#6B5744] hover:bg-[#E8E3D9] gap-1">
                      <MapPin className="w-3 h-3" /> View on Map
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
