const notes = [
  { icon: "🍫", label: "Chocolate" },
  { icon: "🍒", label: "Frutado" },
  { icon: "🥜", label: "Castanhas" },
  { icon: "🌸", label: "Floral" },
  { icon: "🍮", label: "Caramelo" },
  { icon: "🍯", label: "Mel" },
  { icon: "🍊", label: "Cítrico" },
  { icon: "🌶️", label: "Especiarias" },
];

const SensoryNotesBanner = () => {
  const items = [...notes, ...notes];

  return (
    <section className="bg-gradient-espresso py-5 overflow-hidden">
      <div className="flex animate-marquee whitespace-nowrap items-center">
        <span
          className="text-base font-display font-semibold mr-6 shrink-0"
          style={{ color: "hsl(var(--gold))" }}
        >
          Notas sensoriais:
        </span>
        {items.map((note, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 mx-5 text-sm font-body font-medium shrink-0"
            style={{ color: "hsl(var(--gold))" }}
          >
            <span className="text-lg">{note.icon}</span>
            {note.label}
          </span>
        ))}
      </div>
    </section>
  );
};

export default SensoryNotesBanner;
