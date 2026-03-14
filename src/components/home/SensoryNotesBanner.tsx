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
  const items = [...notes, ...notes, ...notes];

  return (
    <section className="bg-cream-200 border-y border-cream-400 py-5 overflow-hidden">
      <div className="flex animate-marquee whitespace-nowrap items-center" style={{ width: 'max-content' }}>
        {items.map((note, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-2 mx-6 text-sm font-body font-medium shrink-0 text-brown"
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
