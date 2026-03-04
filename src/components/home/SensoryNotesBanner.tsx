const notes = [
  { icon: "☕", label: "Chocolate" },
  { icon: "🍊", label: "Frutado" },
  { icon: "🌰", label: "Castanhas" },
  { icon: "🌸", label: "Floral" },
  { icon: "🍬", label: "Caramelo" },
  { icon: "🫐", label: "Frutado Escuro" },
  { icon: "🌿", label: "Herbal" },
  { icon: "☕", label: "Chocolate" },
];

const SensoryNotesBanner = () => {
  const items = [...notes, ...notes];

  return (
    <section className="py-5 overflow-hidden" style={{ backgroundColor: "hsl(var(--espresso))" }}>
      <div className="flex animate-marquee whitespace-nowrap items-center">
        {items.map((note, i) => (
          <span key={i} className="inline-flex items-center gap-2.5 mx-5 text-sm font-body font-medium uppercase tracking-[0.1em] text-white shrink-0">
            <span className="text-base">{note.icon}</span>
            {note.label}
            <span className="mx-3" style={{ color: "hsl(var(--gold))" }}>·</span>
          </span>
        ))}
      </div>
    </section>
  );
};

export default SensoryNotesBanner;
