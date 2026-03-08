import { MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

const PHONE = "5518996540883";
const MESSAGE = encodeURIComponent("Olá! Gostaria de saber mais sobre os cafés da La Régence ☕");

const WhatsAppButton = () => {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.a
      href={`https://wa.me/${PHONE}?text=${MESSAGE}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 right-6 lg:bottom-6 z-40 flex items-center gap-2"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: "spring", stiffness: 200 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="Fale conosco pelo WhatsApp"
    >
      {/* Tooltip */}
      <motion.span
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: hovered ? 1 : 0, x: hovered ? 0 : 10 }}
        className="bg-card text-foreground text-xs font-body font-medium px-3 py-1.5 rounded-lg shadow-lg border border-border whitespace-nowrap pointer-events-none"
      >
        Fale conosco
      </motion.span>

      <div className="relative">
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20" />
        <div className="relative w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all">
          <MessageCircle className="w-6 h-6" />
        </div>
      </div>
    </motion.a>
  );
};

export default WhatsAppButton;
