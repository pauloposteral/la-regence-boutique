import { Link } from "react-router-dom";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { Star } from "lucide-react";

interface Props {
  currentProductId?: string;
}

const RecentlyViewed = ({ currentProductId }: Props) => {
  const { recentlyViewed } = useRecentlyViewed();
  const filtered = recentlyViewed.filter((p) => p.id !== currentProductId);

  if (filtered.length === 0) return null;

  return (
    <section className="mt-16 pt-10 border-t border-border">
      <h2 className="font-display text-xl lg:text-2xl font-light mb-6 text-center">
        Vistos <span className="italic font-medium">recentemente</span>
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
        {filtered.slice(0, 6).map((p) => (
          <Link
            key={p.id}
            to={`/cafe/${p.slug}`}
            className="group flex-shrink-0 w-36 bg-card rounded-lg overflow-hidden border border-border hover:border-accent/30 hover:shadow-md transition-all"
          >
            <div className="aspect-square bg-secondary flex items-center justify-center">
              {p.imagemUrl ? (
                <img
                  src={p.imagemUrl}
                  alt={p.nome}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
              ) : (
                <span className="text-3xl">☕</span>
              )}
            </div>
            <div className="p-2.5">
              <h3 className="font-display text-xs font-semibold truncate">{p.nome}</h3>
              <span className="font-body font-semibold text-xs mt-1 block text-accent">
                R$ {p.preco.toFixed(2).replace(".", ",")}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default RecentlyViewed;
