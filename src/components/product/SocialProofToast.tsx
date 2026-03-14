import { useEffect, useRef, useState, useCallback } from "react";
import { ShoppingBag, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useProdutos } from "@/hooks/useProdutos";

const CITIES = [
  "São Paulo", "Rio de Janeiro", "Belo Horizonte", "Curitiba", "Porto Alegre",
  "Brasília", "Salvador", "Florianópolis", "Campinas", "Recife",
];

const FIRST_NAMES = [
  "Ana", "Bruno", "Carla", "Diego", "Elisa", "Fabio", "Gabi", "Hugo",
  "Isabela", "João", "Lara", "Marcos", "Nina", "Pedro", "Raquel",
];

const MINUTES_AGO = [2, 3, 5, 7, 10, 12, 15, 18, 20, 25];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const SocialProofToast = () => {
  const { data: produtos = [] } = useProdutos();
  const [notification, setNotification] = useState<{
    name: string;
    city: string;
    product: string;
    minutes: number;
    imageUrl?: string;
  } | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const showNotification = useCallback(() => {
    if (produtos.length === 0) return;
    const p = pick(produtos);
    const imgUrl = p.imagens?.find((i: any) => i.principal)?.url || p.imagens?.[0]?.url;
    setNotification({
      name: pick(FIRST_NAMES),
      city: pick(CITIES),
      product: p.nome,
      minutes: pick(MINUTES_AGO),
      imageUrl: imgUrl,
    });

    timeoutRef.current = setTimeout(() => setNotification(null), 5000);
  }, [produtos]);

  useEffect(() => {
    if (produtos.length === 0) return;

    // First notification after 15-30 seconds
    const initialDelay = 15000 + Math.random() * 15000;
    const firstTimeout = setTimeout(() => {
      showNotification();
      // Then every 25-45 seconds
      intervalRef.current = setInterval(showNotification, 25000 + Math.random() * 20000);
    }, initialDelay);

    return () => {
      clearTimeout(firstTimeout);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [produtos.length, showNotification]);

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          initial={{ x: -320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -320, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 25 }}
          className="fixed bottom-24 left-4 z-40 max-w-[280px] bg-card border border-cream-400 rounded-xl shadow-lg shadow-brown/10 p-3 cursor-pointer"
          onClick={() => setNotification(null)}
        >
          <div className="flex items-center gap-3">
            {notification.imageUrl ? (
              <img
                src={notification.imageUrl}
                alt=""
                className="w-12 h-12 rounded-lg object-cover shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-cream-200 flex items-center justify-center shrink-0">
                <ShoppingBag className="w-5 h-5 text-gold" />
              </div>
            )}
            <div className="min-w-0">
              <p className="font-body text-xs text-foreground leading-snug">
                <span className="font-semibold">{notification.name}</span> comprou{" "}
                <span className="font-semibold text-gold">{notification.product}</span>
              </p>
              <p className="flex items-center gap-1 text-[10px] text-muted-foreground font-body mt-0.5">
                <MapPin className="w-2.5 h-2.5" />
                {notification.city} · {notification.minutes} min atrás
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SocialProofToast;
