import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';

export default function ImageCollage({ images = [] }) {
  const [selectedImage, setSelectedImage] = useState(null);

  if (images.length === 0) return null;

  // Tetris grid layout based on number of images
  const getGridClasses = (index, total) => {
    if (total === 1) return 'col-span-12 row-span-2';
    if (total === 2) {
      return index === 0 ? 'col-span-8 row-span-2' : 'col-span-4 row-span-2';
    }
    if (total === 3) {
      if (index === 0) return 'col-span-8 row-span-2';
      return 'col-span-4 row-span-1';
    }
    if (total >= 4) {
      if (index === 0) return 'col-span-8 row-span-2';
      if (index === 1) return 'col-span-4 row-span-1';
      if (index === 2) return 'col-span-4 row-span-1';
      return 'col-span-4 row-span-1';
    }
    return 'col-span-4 row-span-1';
  };

  const displayImages = images.slice(0, 5);

  return (
    <>
      <div className="grid grid-cols-12 gap-2 auto-rows-[140px]" data-testid="image-collage">
        {displayImages.map((src, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className={`${getGridClasses(i, displayImages.length)} overflow-hidden rounded bg-[#E8E3D9] cursor-pointer`}
            onClick={() => setSelectedImage(src)}
            data-testid={`collage-image-${i}`}
          >
            <img
              src={src}
              alt={`Gallery ${i + 1}`}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </motion.div>
        ))}
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl bg-[#2C1A12] border-none p-2">
          {selectedImage && (
            <img
              src={selectedImage}
              alt="Full view"
              className="w-full h-auto max-h-[80vh] object-contain rounded"
              data-testid="lightbox-image"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
