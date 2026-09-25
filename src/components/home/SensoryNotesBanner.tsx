const curiosities = [
  "Café recém-torrado libera CO₂ por vários dias",
  "Aroma representa grande parte da percepção de sabor",
  "Altitude elevada costuma favorecer maior complexidade",
  "Torra clara revela mais a origem do grão",
  "Moer na hora preserva os compostos aromáticos",
  "Café especial começa acima de 80 pontos SCA",
];

const SensoryNotesBanner = () => {
  return (
    <section className="bg-card border-y border-border py-4 overflow-hidden" aria-label="Curiosidades sobre café">
      <div className="flex w-max animate-marquee items-center motion-reduce:animate-none">
        {[false, true].map((duplicate) => (
          <div key={String(duplicate)} className="flex shrink-0 items-center" aria-hidden={duplicate}>
            {curiosities.map((curiosity) => (
              <span
                key={`${duplicate}-${curiosity}`}
                className="inline-flex shrink-0 items-center gap-5 px-5 sm:px-8 font-body text-xs sm:text-sm font-medium text-muted-foreground"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" />
                {curiosity}
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
};

export default SensoryNotesBanner;
