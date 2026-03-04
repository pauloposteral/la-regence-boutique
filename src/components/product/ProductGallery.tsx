import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star } from "lucide-react";

interface ProductImage {
  url: string;
  alt_text: string | null;
  principal: boolean;
}

interface Props {
  images: ProductImage[];
  productName: string;
  scaScore?: number | null;
  promoPercent?: number | null;
}

const ProductGallery = ({ images, productName, scaScore, promoPercent }: Props) => {
  const [selectedIdx, setSelectedIdx] = useState(() => {
    const mainIdx = images.findIndex((i) => i.principal);
    return mainIdx >= 0 ? mainIdx : 0;
  });

  const selectedImg = images[selectedIdx]?.url;

  return (
    <div className="sticky top-24 space-y-3">
      {/* Main image with zoom */}
      <div className="aspect-square bg-secondary rounded-lg flex items-center justify-center relative overflow-hidden group cursor-zoom-in">
        <AnimatePresence mode="wait">
          {selectedImg ? (
            <motion.img
              key={selectedIdx}
              src={selectedImg}
              alt={productName}
              className="w-full h-full object-cover group-hover:scale-150 transition-transform duration-500 origin-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              loading="lazy"
            />
          ) : (
            <span className="text-8xl">☕</span>
          )}
        </AnimatePresence>

        {scaScore && (
          <div className="absolute top-4 right-4 bg-primary text-primary-foreground text-sm font-body font-semibold px-3 py-1.5 rounded flex items-center gap-1.5 z-10">
            <Star className="w-4 h-4 fill-gold text-gold" />
            SCA {scaScore}
          </div>
        )}

        {promoPercent && promoPercent > 0 && (
          <div className="absolute top-4 left-4 bg-destructive text-destructive-foreground text-sm font-body font-bold px-3 py-1.5 rounded z-10">
            {promoPercent}% OFF
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setSelectedIdx(i)}
              className={`w-16 h-16 rounded border-2 overflow-hidden shrink-0 transition-all ${
                i === selectedIdx ? "border-accent" : "border-border hover:border-accent/50"
              }`}
            >
              <img src={img.url} alt={img.alt_text || productName} className="w-full h-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductGallery;
