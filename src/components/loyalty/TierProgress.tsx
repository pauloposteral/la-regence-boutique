import { Award, Crown } from "lucide-react";
import { getTierFromPoints, getProgressToNext } from "@/lib/loyalty";

interface Props {
  points: number;
  compact?: boolean;
}

const TierProgress = ({ points, compact = false }: Props) => {
  const tier = getTierFromPoints(points);
  const { pct, remaining, next } = getProgressToNext(points);

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs font-body">
        <Crown className={`w-3.5 h-3.5 ${tier.color}`} />
        <span className={`font-semibold ${tier.color}`}>{tier.label}</span>
        <span className="text-muted-foreground">· {points} pts</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gold/10 via-gold/5 to-transparent border border-gold/20 rounded-2xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="font-body text-[10px] text-muted-foreground uppercase tracking-[0.2em] mb-1">
            Seu nível
          </p>
          <div className="flex items-center gap-2">
            <Crown className={`w-5 h-5 ${tier.color}`} />
            <h3 className={`font-display text-2xl font-bold ${tier.color}`}>{tier.label}</h3>
          </div>
        </div>
        <div className="text-right">
          <Award className="w-6 h-6 text-gold ml-auto mb-1" />
          <p className="font-display text-2xl font-bold text-gold">{points}</p>
          <p className="font-body text-[10px] text-muted-foreground uppercase tracking-wider">pontos</p>
        </div>
      </div>

      {next ? (
        <>
          <div className="flex items-center justify-between text-xs font-body mb-1.5">
            <span className="text-brown-light">{tier.label}</span>
            <span className="text-muted-foreground">Faltam {remaining} pts para {next.label}</span>
          </div>
          <div className="h-2 bg-cream-300 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gold to-gold-dark rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </>
      ) : (
        <p className="font-body text-xs text-gold text-center mt-2">
          ✨ Você atingiu o nível máximo. Aproveite todos os benefícios.
        </p>
      )}

      <ul className="mt-4 space-y-1">
        {tier.perks.map((perk) => (
          <li key={perk} className="font-body text-xs text-foreground/70 flex items-start gap-2">
            <span className="text-gold mt-0.5">✓</span> {perk}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TierProgress;
