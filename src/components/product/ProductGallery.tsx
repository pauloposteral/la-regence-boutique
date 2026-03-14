import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";

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

const SWIPE_THRESHOLD = 50;

const ProductGallery = ({ images, productName, scaScore, promoPercent }: Props) => {
  const [selectedIdx, setSelectedIdx] = useState(() => {
    const mainIdx = images.findIndex((i) => i.principal);
    return mainIdx >= 0 ? mainIdx : 0;
  });
  const [zoomStyle, setZoomStyle] = useState<React.CSSProperties>({});
  const [direction, setDirection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedImg = images[selectedIdx]?.url;

  const goTo = useCallback((newIdx: number) => {
    if (newIdx < 0 || newIdx >= images.length || newIdx === selectedIdx) return;
    setDirection(newIdx > selectedIdx ? 1 : -1);
    setSelectedIdx(newIdx);
  }, [selectedIdx, images.length]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomStyle({ transformOrigin: `${x}% ${y}%`, transform: "scale(2)" });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setZoomStyle({ transformOrigin: "center", transform: "scale(1)" });
  }, []);

  const handleDragEnd = useCallback((_: any, info: PanInfo) => {
    if (info.offset.x < -SWIPE_THRESHOLD && selectedIdx < images.length - 1) {
      goTo(selectedIdx + 1);
    } else if (info.offset.x > SWIPE_THRESHOLD && selectedIdx > 0) {
      goTo(selectedIdx - 1);
    }
  }, [selectedIdx, images.length, goTo]);

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 200 : -200, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -200 : 200, opacity: 0 }),
  };

  return (
    <div className="sticky top-24 space-y-3">
      {/* Main image with mouse-follow zoom + swipe */}
      <div
        ref={containerRef}
        className="aspect-square bg-cream-200/30 rounded-2xl flex items-center justify-center relative overflow-hidden cursor-zoom-in border border-cream-400 touch-pan-y"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <AnimatePresence mode="wait" custom={direction}>
          {selectedImg ? (
            <motion.img
              key={selectedIdx}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
              src={selectedImg}
              alt={productName}
              className="w-full h-full object-cover will-change-transform"
              style={zoomStyle}
              loading="lazy"
              drag={images.length > 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
            />
          ) : (
            <span className="text-8xl">☕</span>
          )}
        </AnimatePresence>

        {/* Navigation arrows (desktop) */}
        {images.length > 1 && (
          <>
            <button
              onClick={() => goTo(selectedIdx - 1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center text-brown hover:bg-card transition-all opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100 z-10 border border-cream-400"
              style={{ opacity: selectedIdx > 0 ? undefined : 0, pointerEvents: selectedIdx > 0 ? "auto" : "none" }}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => goTo(selectedIdx + 1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center text-brown hover:bg-card transition-all opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100 z-10 border border-cream-400"
              style={{ opacity: selectedIdx < images.length - 1 ? undefined : 0, pointerEvents: selectedIdx < images.length - 1 ? "auto" : "none" }}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Dot indicators for mobile */}
        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`rounded-full transition-all duration-300 ${
                  i === selectedIdx ? "w-5 h-1.5 bg-gold" : "w-1.5 h-1.5 bg-card/60 hover:bg-card"
                }`}
              />
            ))}
          </div>
        )}

        {scaScore && (
          <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm text-brown text-sm font-body font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 z-10 border border-cream-400">
            <Star className="w-4 h-4 fill-gold text-gold" />
            SCA {scaScore}
          </div>
        )}

        {promoPercent && promoPercent > 0 && (
          <div className="absolute top-4 left-4 bg-destructive text-destructive-foreground text-sm font-body font-bold px-3 py-1.5 rounded-full z-10">
            {promoPercent}% OFF
          </div>
        )}
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`w-16 h-16 rounded-xl border-2 overflow-hidden shrink-0 transition-all ${
                i === selectedIdx ? "border-gold shadow-sm" : "border-cream-400 hover:border-gold/50"
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
