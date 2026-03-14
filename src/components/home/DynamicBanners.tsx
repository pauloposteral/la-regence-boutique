import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const DynamicBanners = () => {
  const { data: banners = [] } = useQuery({
    queryKey: ["banners"],
    queryFn: async () => {
      const { data } = await supabase
        .from("banners")
        .select("*")
        .eq("ativo", true)
        .order("ordem");
      return data || [];
    },
  });

  if (banners.length === 0) return null;

  return (
    <section className="py-12 bg-background">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {banners.slice(0, 3).map((banner, i) => (
            <motion.div
              key={banner.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
            >
              {banner.link ? (
                <Link to={banner.link} className="block group">
                  <BannerCard banner={banner} />
                </Link>
              ) : (
                <BannerCard banner={banner} />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

function BannerCard({ banner }: { banner: any }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-cream-400 bg-card h-48 flex items-end group-hover:border-gold/30 group-hover:scale-[1.01] transition-all duration-500">
      {banner.imagem_url && (
        <img
          src={banner.imagem_url}
          alt={banner.titulo}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
      )}
      {/* Gold hover overlay */}
      <div className="absolute inset-0 bg-gold/0 group-hover:bg-gold/10 transition-colors duration-300" />
      <div className="relative z-10 w-full p-5 bg-gradient-to-t from-brown-deep/70 to-transparent text-white">
        <h3 className="font-display text-lg font-semibold">{banner.titulo}</h3>
        {banner.subtitulo && (
          <p className="font-body text-xs text-cream-200/80 mt-1">{banner.subtitulo}</p>
        )}
      </div>
    </div>
  );
}

export default DynamicBanners;
