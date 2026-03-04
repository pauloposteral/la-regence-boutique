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
    <section className="bg-gradient-espresso py-4 overflow-hidden">
      <div className="flex animate-marquee whitespace-nowrap">
        {items.map((note, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 mx-6 text-sm font-body font-medium"
            style={{ color: "hsl(var(--gold))" }}
          >
            <span className="text-lg">{note.icon}</span>
            {note.label}
            <span className="mx-4 text-primary-foreground/20">·</span>
          </span>
        ))}
      </div>
    </section>
  );
};

export default SensoryNotesBanner;
