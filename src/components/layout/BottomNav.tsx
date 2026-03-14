import { Link, useLocation } from "react-router-dom";
import { Home, Coffee, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { motion } from "framer-motion";

const navItems = [
  { icon: Home, label: "Início", href: "/" },
  { icon: Coffee, label: "Cafés", href: "/cafes" },
  { icon: ShoppingBag, label: "Carrinho", href: "__cart__" },
  { icon: User, label: "Conta", href: "/conta" },
];

const BottomNav = () => {
  const location = useLocation();
  const { totalItems, openCart } = useCart();

  if (location.pathname.startsWith("/admin")) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-cream-50/90 backdrop-blur-2xl border-t border-cream-400/60 pb-safe">
      <div className="flex items-center justify-around h-14">
        {navItems.map(({ icon: Icon, label, href }) => {
          const isCart = href === "__cart__";
          const isActive = !isCart && location.pathname === href;

          if (isCart) {
            return (
              <button
                key={label}
                onClick={openCart}
                className="flex flex-col items-center gap-0.5 relative text-brown min-w-[44px] min-h-[44px] justify-center"
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {totalItems > 0 && (
                    <motion.span
                      key={totalItems}
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1.5 -right-2 w-4 h-4 bg-gold text-white text-[9px] font-bold rounded-full flex items-center justify-center badge-bounce"
                    >
                      {totalItems}
                    </motion.span>
                  )}
                </div>
                <span className="text-[10px] font-body">{label}</span>
              </button>
            );
          }

          return (
            <Link
              key={label}
              to={href}
              className={`flex flex-col items-center gap-0.5 transition-colors min-w-[44px] min-h-[44px] justify-center ${
                isActive ? "text-gold" : "text-brown"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-body">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
