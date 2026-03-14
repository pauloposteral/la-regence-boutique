import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Original image URL */
  src: string;
  alt: string;
  /** Aspect ratio class e.g. "aspect-[3/4]" — used for CLS prevention */
  aspectRatio?: string;
  /** Show skeleton placeholder while loading */
  showSkeleton?: boolean;
  /** Disable lazy loading (for above-the-fold images) */
  eager?: boolean;
  /** Additional wrapper className */
  wrapperClassName?: string;
}

/**
 * OptimizedImage — progressive image loading with:
 * - Native lazy loading
 * - Blur-up skeleton placeholder (CLS prevention)
 * - Intersection Observer for deferred src assignment
 * - Error fallback
 */
const OptimizedImage = ({
  src,
  alt,
  aspectRatio,
  showSkeleton = true,
  eager = false,
  wrapperClassName,
  className,
  ...props
}: OptimizedImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(eager);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (eager) return;
    const el = imgRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [eager]);

  if (error) {
    return (
      <div className={cn("flex items-center justify-center bg-muted", aspectRatio, wrapperClassName)}>
        <span className="text-4xl">☕</span>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden", aspectRatio, wrapperClassName)}>
      {/* Skeleton placeholder */}
      {showSkeleton && !loaded && (
        <div className="absolute inset-0 animate-pulse bg-muted" />
      )}
      <img
        ref={imgRef}
        src={inView ? src : undefined}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-500",
          loaded ? "opacity-100" : "opacity-0",
          className
        )}
        {...props}
      />
    </div>
  );
};

export default OptimizedImage;
