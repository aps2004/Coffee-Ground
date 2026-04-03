import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Star, Search, Coffee, Map } from 'lucide-react';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import axios from 'axios';
import RatingStars from '../components/RatingStars';
import ShopCard from '../components/ShopCard';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const HERO_IMAGE = "https://static.prod-images.emergentagent.com/jobs/58221544-2517-4c5a-a9d4-e70eb05364b4/images/e3fc247f08016374c10295982c52156d698a56a42ab114393419a8ee0a7355d4.png";

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
      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden" data-testid="hero-section">
        <div className="absolute inset-0">
          <img
            src={HERO_IMAGE}
            alt="Coffee shop interior"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#2C1A12]/70 via-[#2C1A12]/40 to-[#FDFBF7]" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1
              className="font-['Cormorant_Garamond'] text-5xl sm:text-6xl lg:text-7xl font-light text-white tracking-tight leading-none mb-6"
              data-testid="hero-title"
            >
              Discover the UK's<br />
              <span className="italic font-normal">Finest Coffee</span>
            </h1>
            <p className="text-white/80 text-base sm:text-lg max-w-xl mx-auto mb-8 font-light">
              A curated guide to the most exceptional coffee shops across the United Kingdom
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/map" data-testid="explore-map-btn">
              <Button size="lg" className="bg-[#B55B49] hover:bg-[#9a4d3e] text-white px-8 gap-2 font-medium">
                <Map className="w-4 h-4" /> Explore Map
              </Button>
            </Link>
            <a href="#listings" data-testid="browse-listings-btn">
              <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 gap-2 font-medium bg-white/5 backdrop-blur-sm">
                <Coffee className="w-4 h-4" /> Browse Listings
              </Button>
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
    </div>
  );
}
