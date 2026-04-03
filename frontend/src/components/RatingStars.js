import React from 'react';
import { Star } from 'lucide-react';

export default function RatingStars({ rating = 0, interactive = false, onRate, size = 'md' }) {
  const sizeClass = size === 'lg' ? 'w-6 h-6' : size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <div className="flex items-center gap-0.5" data-testid="rating-stars">
      {[1, 2, 3, 4, 5].map(star => {
        const filled = star <= Math.round(rating);
        return (
          <button
            key={star}
            type="button"
            onClick={() => interactive && onRate && onRate(star)}
            className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
            disabled={!interactive}
            data-testid={`star-${star}`}
          >
            <Star
              className={`${sizeClass} ${
                filled
                  ? 'text-[#D4B996] fill-[#D4B996]'
                  : 'text-[#E8E3D9]'
              } transition-colors`}
            />
          </button>
        );
      })}
    </div>
  );
}
