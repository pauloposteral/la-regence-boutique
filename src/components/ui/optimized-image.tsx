import { useState, useRef, useEffect, useMemo } from "react";
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
  /** sizes attr for responsive srcset (defaults to a reasonable fluid value) */
  sizes?: string;
}

/**
 * Build a Supabase Image Transformation URL when src points to a Supabase storage object.
 * Falls back to the original URL for non-Supabase sources.
 */
function transformSupabase(src: string, width: number, format: "webp" | "avif" | "auto" = "webp"): string {
  if (!src) return src;
  // Supabase storage public path: /storage/v1/object/public/<bucket>/<path>
  const idx = src.indexOf("/storage/v1/object/public/");
  if (idx === -1) return src;
  const rendered = src.replace(
    "/storage/v1/object/public/",
    "/storage/v1/render/image/public/"
  );
  const sep = rendered.includes("?") ? "&" : "?";
  return `${rendered}${sep}width=${width}&quality=78${format !== "auto" ? `&format=${format}` : ""}`;
}

function buildSrcSet(src: string, widths: number[], format: "webp" | "avif" = "webp"): string {
  return widths
    .map((w) => `${transformSupabase(src, w, format)} ${w}w`)
    .join(", ");
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
