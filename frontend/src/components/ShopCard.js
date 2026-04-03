import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Star } from 'lucide-react';
import { Badge } from './ui/badge';
import RatingStars from './RatingStars';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1738327264976-fa0b8d9af52c?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHwzfHxjb3p5JTIwVUslMjBjb2ZmZWUlMjBzaG9wJTIwaW50ZXJpb3J8ZW58MHx8fHwxNzc1MjMwNjk2fDA&ixlib=rb-4.1.0&q=85",
  "https://images.unsplash.com/photo-1545399885-fd918e63002f?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHwxfHxjb3p5JTIwVUslMjBjb2ZmZWUlMjBzaG9wJTIwaW50ZXJpb3J8ZW58MHx8fHwxNzc1MjMwNjk2fDA&ixlib=rb-4.1.0&q=85",
  "https://images.unsplash.com/photo-1588591741887-802be52c1171?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NTJ8MHwxfHNlYXJjaHw0fHxjb3p5JTIwVUslMjBjb2ZmZWUlMjBzaG9wJTIwaW50ZXJpb3J8ZW58MHx8fHwxNzc1MjMwNjk2fDA&ixlib=rb-4.1.0&q=85"
];

export default function ShopCard({ shop, index }) {
  const images = shop.images?.length > 0
    ? shop.images.slice(0, 3).map(img => `${API}/files/${img.storage_path}`)
    : PLACEHOLDER_IMAGES.slice(0, 3);

  const combinedRating = shop.rating_count > 0 && shop.admin_rating > 0
    ? ((shop.admin_rating + shop.avg_user_rating) / 2).toFixed(1)
    : shop.rating_count > 0
    ? shop.avg_user_rating.toFixed(1)
    : (shop.admin_rating || 0).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Link to={`/shop/${shop.shop_id}`} className="group block" data-testid={`shop-card-${shop.shop_id}`}>
        <div className="bg-white border border-[#E8E3D9] rounded overflow-hidden hover:shadow-[0_8px_32px_rgba(44,26,18,0.08)] transition-all hover:-translate-y-1">
          {/* Image Collage */}
          <div className="grid grid-cols-12 gap-1 h-56 bg-[#E8E3D9]">
            <div className="col-span-8 row-span-2 overflow-hidden">
              <img
                src={images[0]}
                alt={shop.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="col-span-4 overflow-hidden">
              <img
                src={images[1] || images[0]}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div className="col-span-4 overflow-hidden">
              <img
                src={images[2] || images[0]}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-5">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-['Cormorant_Garamond'] text-xl font-semibold text-[#2C1A12] group-hover:text-[#B55B49] transition-colors leading-tight">
                {shop.name}
              </h3>
              <div className="flex items-center gap-1 bg-[#E8E3D9]/60 px-2 py-1 rounded shrink-0 ml-2">
                <Star className="w-3.5 h-3.5 text-[#D4B996] fill-[#D4B996]" />
                <span className="text-sm font-semibold text-[#2C1A12]">{combinedRating}</span>
              </div>
            </div>
            <p className="text-[#6B5744] text-xs flex items-center gap-1 mb-3">
              <MapPin className="w-3 h-3" /> {shop.city}{shop.address ? ` — ${shop.address}` : ''}
            </p>
            <p className="text-[#6B5744] text-sm leading-relaxed line-clamp-2">
              {shop.description}
            </p>
            {shop.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {shop.tags.slice(0, 3).map(tag => (
                  <Badge key={tag} variant="secondary" className="bg-[#E8E3D9]/60 text-[#6B5744] text-xs px-2 py-0">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
            {shop.rating_count > 0 && (
              <p className="text-xs text-[#6B5744]/60 mt-3">
                {shop.rating_count} community review{shop.rating_count !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
