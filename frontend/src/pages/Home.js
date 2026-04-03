import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Star, Search, Coffee, Map, ArrowRight, BookOpen } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import axios from 'axios';
import RatingStars from '../components/RatingStars';
import ShopCard from '../components/ShopCard';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function CoffeeCupIllustration() {
  return (
    <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Saucer */}
      <ellipse cx="200" cy="320" rx="150" ry="30" fill="#E8E3D9" />
      <ellipse cx="200" cy="315" rx="130" ry="24" fill="#F0EBE3" />
      {/* Cup body */}
      <path d="M120 180 C120 180 115 300 200 300 C285 300 280 180 280 180 Z" fill="#FDFBF7" stroke="#D4B996" strokeWidth="3" />
      {/* Coffee surface */}
      <ellipse cx="200" cy="185" rx="80" ry="18" fill="#8B5E3C" />
      <ellipse cx="200" cy="183" rx="70" ry="14" fill="#A0714B" />
      {/* Latte art - simple heart */}
      <path d="M190 178 C190 172 195 170 200 174 C205 170 210 172 210 178 C210 184 200 190 200 190 C200 190 190 184 190 178Z" fill="#D4B996" opacity="0.7" />
      {/* Handle */}
      <path d="M280 210 C320 210 320 270 280 270" stroke="#D4B996" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* Steam lines */}
      <motion.path d="M170 150 C170 130 185 135 185 115" stroke="#D4B996" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5"
        initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.5 }} transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }} />
      <motion.path d="M200 145 C200 125 215 130 215 110" stroke="#D4B996" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.4"
        initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.4 }} transition={{ duration: 2.5, delay: 0.3, repeat: Infinity, repeatType: "reverse" }} />
      <motion.path d="M230 150 C230 130 245 135 245 115" stroke="#D4B996" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5"
        initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.5 }} transition={{ duration: 2, delay: 0.6, repeat: Infinity, repeatType: "reverse" }} />
      {/* Coffee beans scattered */}
      <ellipse cx="80" cy="280" rx="12" ry="8" transform="rotate(-30 80 280)" fill="#6B4226" opacity="0.3" />
      <line x1="76" y1="276" x2="84" y2="284" stroke="#5A3520" strokeWidth="1" opacity="0.3" />
      <ellipse cx="320" cy="260" rx="10" ry="7" transform="rotate(20 320 260)" fill="#6B4226" opacity="0.25" />
      <line x1="317" y1="256" x2="323" y2="264" stroke="#5A3520" strokeWidth="1" opacity="0.25" />
      <ellipse cx="100" cy="340" rx="10" ry="7" transform="rotate(15 100 340)" fill="#6B4226" opacity="0.2" />
      <ellipse cx="310" cy="330" rx="9" ry="6" transform="rotate(-20 310 330)" fill="#6B4226" opacity="0.2" />
    </svg>
  );
}

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

  return (
    <div className="min-h-screen">
      {/* Hero Section — Illustration Style */}
      <section className="relative bg-[#FDFBF7] overflow-hidden" data-testid="hero-section">
        {/* Decorative background shapes */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[#D4B996]/10 -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full bg-[#B55B49]/5 translate-y-1/3 -translate-x-1/4" />
        <div className="absolute top-1/3 left-1/4 w-3 h-3 rounded-full bg-[#D4B996]/30" />
        <div className="absolute top-1/4 right-1/3 w-2 h-2 rounded-full bg-[#B55B49]/20" />
        <div className="absolute bottom-1/4 left-1/3 w-4 h-4 rounded-full bg-[#D4B996]/20" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 py-16 sm:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[60vh]">
            {/* Left - Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <p className="text-[#B55B49] font-medium text-sm tracking-widest uppercase mb-5">
                Coffee Grounds
              </p>
              <h1
                className="font-['Cormorant_Garamond'] text-5xl sm:text-6xl lg:text-7xl font-light text-[#2C1A12] tracking-tight leading-[1.05] mb-6"
                data-testid="hero-title"
              >
                Best Cafes and<br />Coffee in<br />
                <span className="italic font-normal text-[#B55B49]">the UK</span>
              </h1>
              <p className="text-[#6B5744] text-base sm:text-lg max-w-md mb-10 leading-relaxed">
                A curated guide to the most exceptional coffee shops across the United Kingdom, handpicked by our editors.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/map" data-testid="explore-map-btn">
                  <Button size="lg" className="bg-[#B55B49] hover:bg-[#9a4d3e] text-white px-8 gap-2 font-medium">
                    <Map className="w-4 h-4" /> Explore Map
                  </Button>
                </Link>
                <a href="#listings" data-testid="browse-listings-btn">
                  <Button size="lg" variant="outline" className="border-[#E8E3D9] text-[#2C1A12] hover:bg-[#E8E3D9] px-8 gap-2 font-medium">
                    <Coffee className="w-4 h-4" /> Browse Listings
                  </Button>
                </a>
              </div>
            </motion.div>

            {/* Right - Illustration */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="hidden lg:flex items-center justify-center"
            >
              <div className="w-[380px] h-[380px]">
                <CoffeeCupIllustration />
              </div>
            </motion.div>
          </div>

          {/* Stats bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap gap-8 sm:gap-16 mt-8 pt-8 border-t border-[#E8E3D9]"
          >
            <div>
              <p className="text-2xl font-['Cormorant_Garamond'] font-semibold text-[#2C1A12]">6+</p>
              <p className="text-xs text-[#6B5744]">Curated Shops</p>
            </div>
            <div>
              <p className="text-2xl font-['Cormorant_Garamond'] font-semibold text-[#2C1A12]">6</p>
              <p className="text-xs text-[#6B5744]">Cities Covered</p>
            </div>
            <div>
              <p className="text-2xl font-['Cormorant_Garamond'] font-semibold text-[#2C1A12]">4.3 - 4.9</p>
              <p className="text-xs text-[#6B5744]">Editor Ratings</p>
            </div>
            <div>
              <p className="text-2xl font-['Cormorant_Garamond'] font-semibold text-[#B55B49]">Free</p>
              <p className="text-xs text-[#6B5744]">Always Open Access</p>
            </div>
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

      {/* CUKP Teaser Section */}
      <section className="bg-[#2C1A12] py-16 px-4 sm:px-8" data-testid="cukp-teaser">
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
