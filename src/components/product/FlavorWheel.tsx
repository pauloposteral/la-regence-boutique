import { motion } from "framer-motion";

interface FlavorWheelProps {
  corpo: number;
  acidez: number;
  docura: number;
  retrogosto: number;
  notas: string[];
}

const FlavorWheel = ({ corpo, acidez, docura, retrogosto, notas }: FlavorWheelProps) => {
  const attributes = [
    { label: "Corpo", value: corpo, angle: 0 },
    { label: "Acidez", value: acidez, angle: 90 },
    { label: "Doçura", value: docura, angle: 180 },
    { label: "Retrogosto", value: retrogosto, angle: 270 },
  ];

  const size = 200;
  const center = size / 2;
  const maxRadius = 80;

  const getPoint = (angle: number, radius: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return {
      x: center + radius * Math.cos(rad),
      y: center + radius * Math.sin(rad),
    };
  };

  const points = attributes
    .map((a) => getPoint(a.angle, (a.value / 5) * maxRadius))
    .map((p) => `${p.x},${p.y}`)
    .join(" ");

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mb-4">
        {/* Grid circles */}
        {[1, 2, 3, 4, 5].map((level) => (
          <circle
            key={level}
            cx={center}
            cy={center}
            r={(level / 5) * maxRadius}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth={level === 5 ? 1.5 : 0.5}
            strokeDasharray={level < 5 ? "2 3" : "none"}
          />
        ))}

        {/* Axis lines */}
        {attributes.map((a) => {
          const end = getPoint(a.angle, maxRadius);
          return (
            <line
              key={a.label}
              x1={center}
              y1={center}
              x2={end.x}
              y2={end.y}
              stroke="hsl(var(--border))"
              strokeWidth={0.5}
            />
          );
        })}

        {/* Data polygon */}
        <motion.polygon
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          points={points}
          fill="hsl(var(--gold) / 0.2)"
          stroke="hsl(var(--gold))"
          strokeWidth={2}
          style={{ transformOrigin: "center" }}
        />

        {/* Data points */}
        {attributes.map((a) => {
          const p = getPoint(a.angle, (a.value / 5) * maxRadius);
          return (
            <circle
              key={a.label}
              cx={p.x}
              cy={p.y}
              r={4}
              fill="hsl(var(--gold))"
              stroke="hsl(var(--background))"
              strokeWidth={2}
            />
          );
        })}

        {/* Labels */}
        {attributes.map((a) => {
          const p = getPoint(a.angle, maxRadius + 20);
          return (
            <text
              key={a.label}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-foreground text-[11px] font-body"
            >
              {a.label}
            </text>
          );
        })}
      </svg>

      {/* Sensory notes */}
      <div className="flex flex-wrap gap-2 justify-center">
        {notas.map((nota) => (
          <span
            key={nota}
            className="text-xs font-body bg-accent/10 text-accent-foreground border border-accent/20 px-3 py-1 rounded-full"
          >
            {nota}
          </span>
        ))}
      </div>
    </div>
  );
};

export default FlavorWheel;
