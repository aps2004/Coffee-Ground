import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Star, Search, Coffee, Map, ArrowRight, BookOpen, ChevronDown } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import axios from 'axios';
import RatingStars from '../components/RatingStars';
import ShopCard from '../components/ShopCard';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PLACEHOLDER_IMAGES = [
  "https://customer-assets.emergentagent.com/job_espresso-explorer/artifacts/7i8j6dd8_AbhishekX_Closeup_of_people_in_sydmead_style_who_are_making_c_5314aedf-4187-4e46-809e-fa933cf025bf_2.png",
  "https://customer-assets.emergentagent.com/job_espresso-explorer/artifacts/ollla97v_AbhishekX_close_up_of_people_making_coffee_with_aeropress_--v_78ccb6f4-05a9-4c44-a519-e1a2e0d0d086_1.png",
  "https://customer-assets.emergentagent.com/job_espresso-explorer/artifacts/0u1o8ppf_AbhishekX_British_Cafe_in_Sydmead_style_of_illustration_--v_7_bdf3fdff-787f-4f9a-802f-9f4e6e3b2c51_2.png",
  "https://customer-assets.emergentagent.com/job_espresso-explorer/artifacts/x2zf8kmq_AbhishekX_Closeup_of_people_in_sydmead_style_who_are_making_c_5314aedf-4187-4e46-809e-fa933cf025bf_1.png",
  "https://customer-assets.emergentagent.com/job_espresso-explorer/artifacts/2i1zvaq7_AbhishekX_British_Cafe_in_Sydmead_style_of_illustration_--v_7_bdf3fdff-787f-4f9a-802f-9f4e6e3b2c51_1.png"
];

export default function Home() {
  const [shops, setShops] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShops();
  }, [sortBy]);

  const fetchShops = async () => {
    try {
      const res = await axios.get(`${API}/shops`, { params: { sort_by: sortBy } });
      setShops(res.data);
    } catch (err) {
      console.error('Failed to fetch shops:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = shops.filter(s =>
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const featured = shops.length > 0 ? shops[0] : null;
  const featuredImages = featured?.images?.length > 0
    ? featured.images.slice(0, 3).map(img => `${API}/files/${img.storage_path}`)
    : PLACEHOLDER_IMAGES;
  const featuredRating = featured
    ? (featured.rating_count > 0 && featured.admin_rating > 0
        ? ((featured.admin_rating + featured.avg_user_rating) / 2).toFixed(1)
        : featured.admin_rating?.toFixed(1) || '0.0')
    : '0.0';

  return (
    <div className="min-h-screen">
      {/* Hero Section — "Coffee Grounds" prominent + featured shop card */}
      <section className="relative bg-[#FDFBF7] overflow-hidden" data-testid="hero-section">
        {/* Subtle decorative shapes */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[#D4B996]/8 -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-[#B55B49]/5 translate-y-1/3 -translate-x-1/4" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 flex flex-col" style={{ minHeight: 'calc(100vh - 3.5rem)' }}>
          {/* Main hero content area — grows to fill */}
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start pt-4 sm:pt-6">
            {/* Left — Main content */}
            <div className="lg:col-span-5">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
              >
                <h1
                  className="font-['Cormorant_Garamond'] text-6xl sm:text-7xl lg:text-[7rem] font-light text-[#2C1A12] tracking-tight leading-[0.95] mb-4"
                  data-testid="hero-title"
                >
                  Coffee<br />
                  <span className="italic font-normal">Grounds</span>
                </h1>
                <p className="text-[#6B5744] text-base sm:text-lg max-w-md mb-5 leading-relaxed">
                  Best Cafes and Coffee in the UK
                </p>
                <p className="text-[#6B5744]/70 text-sm max-w-sm mb-7 leading-relaxed">
                  A curated guide to the most exceptional coffee shops across the United Kingdom, handpicked by our editors.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link to="/map" data-testid="explore-map-btn">
                    <Button size="lg" className="bg-[#B55B49] hover:bg-[#9a4d3e] text-white px-8 gap-2 font-medium">
                      <MapPin className="w-4 h-4" /> Explore Map
                    </Button>
                  </Link>
                  <a href="#listings" data-testid="browse-listings-btn">
                    <Button size="lg" variant="outline" className="border-[#E8E3D9] text-[#2C1A12] hover:bg-[#E8E3D9] px-8 gap-2 font-medium">
                      <Coffee className="w-4 h-4" /> All Listings
                    </Button>
                  </a>
                </div>
              </motion.div>
            </div>

            {/* Right — Spotlight section with featured card */}
            {featured && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.25 }}
                className="lg:col-span-7"
                data-testid="featured-shop-card"
              >
                {/* Spotlight heading + shop name on the same line */}
                <div className="flex items-baseline gap-3 mb-3" data-testid="spotlight-heading">
                  <h2 className="font-['Cormorant_Garamond'] text-2xl sm:text-3xl font-light text-[#2C1A12] tracking-tight shrink-0">
                    Spotlight
                  </h2>
                  <span className="text-[#6B5744]/40 text-lg font-light">/</span>
                  <h3 className="font-['Cormorant_Garamond'] text-xl sm:text-2xl font-semibold text-[#B55B49] tracking-tight truncate" data-testid="featured-shop-name">
                    {featured.name}
                  </h3>
                </div>

                <div className="relative bg-white border border-[#E8E3D9] rounded-lg overflow-hidden shadow-[0_8px_40px_rgba(44,26,18,0.07)]">
                  {/* Featured flag — top left cream badge */}
                  <div className="absolute top-3 left-3 z-10" data-testid="featured-flag">
                    <span className="bg-[#F5F0E8] text-[#6B5744] text-[11px] font-semibold tracking-wide uppercase px-3 py-1 rounded shadow-sm border border-[#E8E3D9]/60">
                      Featured
                    </span>
                  </div>
                  {/* Image collage — 4+ images, very slow zoom on hover (4s) */}
                  <div className="grid grid-cols-12 grid-rows-2 gap-[3px] h-64 sm:h-80 bg-[#E8E3D9]">
                    <div className="col-span-6 row-span-2 overflow-hidden">
                      <img src={featuredImages[0]} alt={featured.name} className="w-full h-full object-cover transition-transform duration-[4000ms] ease-out hover:scale-110" />
                    </div>
                    <div className="col-span-3 row-span-1 overflow-hidden">
                      <img src={featuredImages[1] || featuredImages[0]} alt="" className="w-full h-full object-cover transition-transform duration-[4000ms] ease-out hover:scale-110" />
                    </div>
                    <div className="col-span-3 row-span-1 overflow-hidden">
                      <img src={featuredImages[2] || featuredImages[0]} alt="" className="w-full h-full object-cover transition-transform duration-[4000ms] ease-out hover:scale-110" />
                    </div>
                    <div className="col-span-3 row-span-1 overflow-hidden">
                      <img src={featuredImages[3] || featuredImages[1] || featuredImages[0]} alt="" className="w-full h-full object-cover transition-transform duration-[4000ms] ease-out hover:scale-110" />
                    </div>
                    <div className="col-span-3 row-span-1 overflow-hidden">
                      <img src={featuredImages[4] || featuredImages[2] || featuredImages[0]} alt="" className="w-full h-full object-cover transition-transform duration-[4000ms] ease-out hover:scale-110" />
                    </div>
                  </div>
                  {/* Footer strip — blurb with "....more" hyperlink */}
                  <div className="px-5 py-3.5 border-t border-[#E8E3D9] bg-white flex items-center gap-3" data-testid="featured-card-footer">
                    <div className="flex items-center gap-1 shrink-0">
                      <Star className="w-3.5 h-3.5 text-[#D4B996] fill-[#D4B996]" />
                      <span className="text-sm font-semibold text-[#2C1A12]">{featuredRating}</span>
                    </div>
                    <span className="text-[#E8E3D9]">|</span>
                    <p className="text-[#2C1A12]/70 text-sm leading-snug flex-1 truncate" data-testid="featured-shop-desc">
                      {featured.description}....
                    </p>
                    <Link
                      to={`/shop/${featured.shop_id}`}
                      className="text-[#B55B49] text-sm font-medium hover:underline underline-offset-2 shrink-0"
                      data-testid="featured-more-btn"
                    >
                      more
                    </Link>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Scroll down indicator — pinned to bottom of viewport fold */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="py-4 flex justify-center shrink-0"
          >
            <a href="#listings" className="flex flex-col items-center gap-1.5 text-[#6B5744] hover:text-[#B55B49] transition-colors" data-testid="scroll-indicator">
              <span className="text-sm font-medium tracking-wide">Scroll down for more shops</span>
              <motion.div
                animate={{ y: [0, 6, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ChevronDown className="w-5 h-5" />
              </motion.div>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Listings Section */}
      <section id="listings" className="max-w-7xl mx-auto px-4 sm:px-8 py-16" data-testid="listings-section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h2 className="font-['Cormorant_Garamond'] text-3xl sm:text-4xl font-light tracking-tight text-[#2C1A12] mb-2">
            Our Curated Selection
          </h2>
          <p className="text-[#6B5744] text-base">
            Handpicked coffee shops rated by our editors and the community
          </p>
        </motion.div>

        {/* Search & Sort */}
        <div className="flex flex-col sm:flex-row gap-4 mb-10" data-testid="search-sort-bar">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B5744]" />
            <Input
              placeholder="Search by name, city, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-[#E8E3D9] focus:border-[#B55B49] focus:ring-[#B55B49]/20"
              data-testid="search-input"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={sortBy === 'rating' ? 'default' : 'outline'}
              onClick={() => setSortBy('rating')}
              className={sortBy === 'rating' ? 'bg-[#B55B49] hover:bg-[#9a4d3e] text-white' : 'border-[#E8E3D9] text-[#6B5744] hover:bg-[#E8E3D9]'}
              data-testid="sort-rating-btn"
            >
              <Star className="w-4 h-4 mr-1" /> Top Rated
            </Button>
            <Button
              variant={sortBy === 'name' ? 'default' : 'outline'}
              onClick={() => setSortBy('name')}
              className={sortBy === 'name' ? 'bg-[#B55B49] hover:bg-[#9a4d3e] text-white' : 'border-[#E8E3D9] text-[#6B5744] hover:bg-[#E8E3D9]'}
              data-testid="sort-name-btn"
            >
              A-Z
            </Button>
          </div>
        </div>

        {/* Shop Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-[#E8E3D9]/40 animate-pulse rounded h-80" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20" data-testid="no-results">
            <Coffee className="w-12 h-12 text-[#D4B996] mx-auto mb-4" />
            <p className="text-[#6B5744] text-lg">No coffee shops found matching your search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8" data-testid="shop-grid">
            {filtered.map((shop, idx) => (
              <ShopCard key={shop.shop_id} shop={shop} index={idx} />
            ))}
          </div>
        )}
      </section>

      {/* CUKP Teaser Section — lighter colour distinct from footer */}
      <section className="bg-[#3D2A1E] py-16 px-4 sm:px-8" data-testid="cukp-teaser">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-[#D4B996] font-medium text-sm tracking-widest uppercase mb-3">Our Story</p>
            <h2 className="font-['Cormorant_Garamond'] text-3xl sm:text-4xl font-light text-white tracking-tight mb-4">
              The Coffee United<br />Kingdom Project
            </h2>
            <p className="text-white/70 leading-relaxed mb-6">
              Two friends. One rusted camper van. A quest to discover, document, and celebrate every exceptional coffee shop across the UK. From Borough Market to Edinburgh's Old Town, the CUKP is our love letter to British coffee culture.
            </p>
            <Link to="/cukp" data-testid="cukp-read-more-btn">
              <Button className="bg-[#B55B49] hover:bg-[#9a4d3e] text-white gap-2 font-medium">
                <BookOpen className="w-4 h-4" /> Read Our Story <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="bg-white/5 border border-white/10 rounded p-8">
              <blockquote className="font-['Cormorant_Garamond'] text-2xl italic text-white/90 leading-relaxed">
                "Every great coffee shop has a soul. Our job is simply to find it and share it with the world."
              </blockquote>
              <p className="text-[#D4B996] text-sm mt-4">Eleanor Whitfield, Co-founder</p>
              <div className="flex gap-8 mt-6 pt-6 border-t border-white/10">
                <div>
                  <p className="text-2xl font-['Cormorant_Garamond'] font-semibold text-white">2,847</p>
                  <p className="text-xs text-white/50">Cups tasted</p>
                </div>
                <div>
                  <p className="text-2xl font-['Cormorant_Garamond'] font-semibold text-white">186</p>
                  <p className="text-xs text-white/50">Cities visited</p>
                </div>
                <div>
                  <p className="text-2xl font-['Cormorant_Garamond'] font-semibold text-white">423</p>
                  <p className="text-xs text-white/50">Interviews</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
