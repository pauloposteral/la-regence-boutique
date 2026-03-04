import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

interface PromotionCountdownProps {
  /** End date for the promotion (defaults to end of current month) */
  endDate?: string;
}

const PromotionCountdown = ({ endDate }: PromotionCountdownProps) => {
  const target = endDate
    ? new Date(endDate)
    : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59);

  const calcRemaining = () => {
    const diff = Math.max(0, target.getTime() - Date.now());
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff % 86400000) / 3600000),
      minutes: Math.floor((diff % 3600000) / 60000),
      seconds: Math.floor((diff % 60000) / 1000),
    };
  };

  const [remaining, setRemaining] = useState(calcRemaining);

  useEffect(() => {
    const interval = setInterval(() => setRemaining(calcRemaining()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (remaining.days === 0 && remaining.hours === 0 && remaining.minutes === 0 && remaining.seconds === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 bg-destructive/10 rounded-lg px-3 py-2 flex-wrap">
      <Clock className="w-3.5 h-3.5 text-destructive shrink-0" />
      <span className="font-body text-xs text-destructive font-medium whitespace-nowrap">Promoção encerra em</span>
      <div className="flex gap-1.5 ml-auto">
        {[
          { value: remaining.days, label: "d" },
          { value: remaining.hours, label: "h" },
          { value: remaining.minutes, label: "m" },
          { value: remaining.seconds, label: "s" },
        ].map((unit) => (
          <span
            key={unit.label}
            className="bg-destructive/20 text-destructive font-mono text-xs font-bold px-1.5 py-0.5 rounded"
          >
            {String(unit.value).padStart(2, "0")}{unit.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default PromotionCountdown;
