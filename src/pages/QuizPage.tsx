import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coffee, ArrowRight, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

const QUESTIONS = [
  {
    question: "Qual momento do dia você mais aprecia café?",
    options: [
      { label: "Manhã, para despertar", tags: ["encorpado", "chocolate"] },
      { label: "Tarde, com calma", tags: ["suave", "floral"] },
      { label: "Após as refeições", tags: ["intenso", "caramelo"] },
      { label: "A qualquer hora!", tags: ["equilibrado", "nozes"] },
    ],
  },
  {
    question: "Como você prefere a intensidade?",
    options: [
      { label: "Suave e delicado", tags: ["clara", "floral", "cítrico"] },
      { label: "Equilibrado", tags: ["media", "chocolate", "nozes"] },
      { label: "Intenso e encorpado", tags: ["escura", "cacau", "especiarias"] },
      { label: "Não sei ainda", tags: ["media", "caramelo"] },
    ],
  },
  {
    question: "Qual sabor te atrai mais?",
    options: [
      { label: "Chocolate e caramelo", tags: ["chocolate", "caramelo", "cacau"] },
      { label: "Frutas e acidez", tags: ["frutas vermelhas", "cítrico", "frutas tropicais"] },
      { label: "Floral e herbal", tags: ["floral", "herbal", "jasmin"] },
      { label: "Nozes e especiarias", tags: ["nozes", "especiarias", "amêndoas"] },
    ],
  },
  {
    question: "Qual método de preparo você usa?",
    options: [
      { label: "Coador / V60", tags: ["media", "floral", "cítrico"] },
      { label: "Espresso / Moka", tags: ["fina", "intenso", "chocolate"] },
      { label: "French Press", tags: ["grossa", "encorpado", "cacau"] },
      { label: "Ainda estou descobrindo", tags: ["media", "equilibrado"] },
    ],
  },
];

const QuizPage = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [done, setDone] = useState(false);

  const { data: produtos = [] } = useQuery({
    queryKey: ["quiz-produtos"],
    queryFn: async () => {
      const { data } = await supabase
        .from("produtos")
        .select("id, nome, slug, preco, notas_sensoriais, tipo_torra, produto_imagens(url, principal)")
        .eq("ativo", true)
        .limit(20);
      return data || [];
    },
  });

  const handleAnswer = (idx: number) => {
    const newAnswers = [...answers, idx];
    setAnswers(newAnswers);
    if (step + 1 < QUESTIONS.length) {
      setStep(step + 1);
    } else {
      setDone(true);
    }
  };

  const goBack = () => {
    if (step > 0) {
      setStep(step - 1);
      setAnswers(answers.slice(0, -1));
    }
  };

  const restart = () => {
    setStep(0);
    setAnswers([]);
    setDone(false);
  };

  // Score products based on tag matching
  const getRecommendations = () => {
    const allTags: string[] = [];
    answers.forEach((ansIdx, qIdx) => {
      allTags.push(...QUESTIONS[qIdx].options[ansIdx].tags);
    });

    const scored = produtos.map((p: any) => {
      const notas = (p.notas_sensoriais || []).map((n: string) => n.toLowerCase());
      const torra = p.tipo_torra || "";
      let score = 0;
      allTags.forEach((tag) => {
        if (notas.some((n: string) => n.includes(tag.toLowerCase()))) score += 2;
        if (torra.includes(tag)) score += 1;
      });
      return { ...p, score };
    });

    return scored.sort((a: any, b: any) => b.score - a.score).slice(0, 3);
  };

  const recommendations = done ? getRecommendations() : [];

  return (
    <Layout>
      <section className="bg-gradient-espresso text-primary-foreground py-16 lg:py-24">
        <div className="container mx-auto px-4 lg:px-8 text-center">
          <Coffee className="w-8 h-8 text-gold mx-auto mb-4" />
          <h1 className="font-display text-3xl lg:text-5xl font-light">
            Descubra seu <span className="italic font-medium text-gold">Café</span>
          </h1>
          <p className="text-primary-foreground/70 font-body text-sm mt-4 max-w-md mx-auto">
            Responda 4 perguntas rápidas e encontraremos o café perfeito para você.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-background">
        <div className="container mx-auto px-4 lg:px-8 max-w-2xl">
          <AnimatePresence mode="wait">
            {!done ? (
              <motion.div key={step} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                {/* Progress */}
                <div className="flex gap-2 mb-8">
                  {QUESTIONS.map((_, i) => (
                    <div key={i} className={`flex-1 h-1.5 rounded-full transition-colors ${i <= step ? "bg-accent" : "bg-border"}`} />
                  ))}
                </div>

                <p className="font-body text-xs text-muted-foreground mb-2">Pergunta {step + 1} de {QUESTIONS.length}</p>
                <h2 className="font-display text-xl lg:text-2xl font-semibold mb-6">{QUESTIONS[step].question}</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {QUESTIONS[step].options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => handleAnswer(i)}
                      className="text-left rounded-lg border-2 border-border p-5 hover:border-accent hover:bg-accent/5 transition-all group"
                    >
                      <span className="font-body text-sm font-medium group-hover:text-accent transition-colors">{opt.label}</span>
                    </button>
                  ))}
                </div>

                {step > 0 && (
                  <button onClick={goBack} className="inline-flex items-center gap-1.5 font-body text-sm text-muted-foreground hover:text-foreground mt-6 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Voltar
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <div className="text-center mb-10">
                  <span className="text-4xl mb-4 block">☕</span>
                  <h2 className="font-display text-2xl lg:text-3xl font-semibold mb-2">Seu café ideal</h2>
                  <p className="font-body text-sm text-muted-foreground">
                    Baseado nas suas preferências, recomendamos:
                  </p>
                </div>

                {recommendations.length > 0 ? (
                  <div className="grid gap-4">
                    {recommendations.map((p: any, i: number) => {
                      const img = p.produto_imagens?.find((im: any) => im.principal)?.url || p.produto_imagens?.[0]?.url;
                      return (
                        <Link
                          key={p.id}
                          to={`/cafe/${p.slug}`}
                          className="flex items-center gap-4 border border-border rounded-lg p-4 hover:border-accent hover:bg-accent/5 transition-all group"
                        >
                          {i === 0 && <span className="text-xs font-body bg-accent text-accent-foreground px-2 py-0.5 rounded-full absolute -top-2 left-4">⭐ Melhor match</span>}
                          <div className="w-16 h-16 rounded-lg bg-secondary overflow-hidden shrink-0">
                            {img ? <img src={img} alt={p.nome} className="w-full h-full object-cover" /> : <span className="flex w-full h-full items-center justify-center text-2xl">☕</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-display text-base font-semibold group-hover:text-accent transition-colors">{p.nome}</h3>
                            <p className="font-body text-xs text-muted-foreground truncate">
                              {(p.notas_sensoriais || []).slice(0, 4).join(" · ")}
                            </p>
                            <p className="font-body text-sm font-medium mt-1">R$ {Number(p.preco).toFixed(2).replace(".", ",")}</p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-accent shrink-0" />
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center font-body text-muted-foreground">Nenhum café encontrado. Explore nosso catálogo!</p>
                )}

                <div className="flex justify-center gap-4 mt-8">
                  <Button variant="outline" size="sm" className="font-body text-xs gap-1.5" onClick={restart}>
                    <RefreshCw className="w-3.5 h-3.5" /> Refazer quiz
                  </Button>
                  <Button size="sm" className="font-body text-xs" asChild>
                    <Link to="/cafes">Ver todos os cafés</Link>
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </Layout>
  );
};

export default QuizPage;
