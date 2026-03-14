import { useState } from "react";
import { Truck, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface ShippingOption {
  name: string;
  price: number;
  days: string;
}

const ShippingCalculator = () => {
  const [cep, setCep] = useState("");
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<ShippingOption[] | null>(null);
  const [error, setError] = useState("");

  const formatCep = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length > 5) return `${digits.slice(0, 5)}-${digits.slice(5)}`;
    return digits;
  };

  const handleCalculate = async () => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) {
      setError("CEP inválido. Digite 8 dígitos.");
      return;
    }

    setLoading(true);
    setError("");
    setOptions(null);

    try {
      // Validate CEP via ViaCEP
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();

      if (data.erro) {
        setError("CEP não encontrado.");
        setLoading(false);
        return;
      }

      // Simulated shipping options based on region
      const state = data.uf;
      const isSP = state === "SP";
      const isSudeste = ["RJ", "MG", "ES"].includes(state);

      const shippingOptions: ShippingOption[] = [
        {
          name: "Econômico",
          price: isSP ? 0 : isSudeste ? 12.90 : 18.90,
          days: isSP ? "3-5 dias úteis" : isSudeste ? "5-8 dias úteis" : "8-12 dias úteis",
        },
        {
          name: "Expresso",
          price: isSP ? 9.90 : isSudeste ? 19.90 : 29.90,
          days: isSP ? "1-2 dias úteis" : isSudeste ? "3-4 dias úteis" : "4-6 dias úteis",
        },
      ];

      // Free shipping for orders over R$150
      if (shippingOptions[0].price > 0) {
        shippingOptions[0].name += "";
      }

      setOptions(shippingOptions);
    } catch {
      setError("Erro ao calcular frete. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-body font-medium text-foreground">
        <Truck className="w-4 h-4 text-gold" />
        Calcular frete
      </div>
      <div className="flex gap-2">
        <Input
          placeholder="00000-000"
          value={cep}
          onChange={(e) => setCep(formatCep(e.target.value))}
          onKeyDown={(e) => e.key === "Enter" && handleCalculate()}
          className="font-mono text-sm h-9"
          maxLength={9}
        />
        <Button
          variant="outline"
          size="sm"
          className="font-body text-xs h-9 px-4 shrink-0 border-gold/30 hover:bg-gold/10 hover:border-gold"
          onClick={handleCalculate}
          disabled={loading}
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Calcular"}
        </Button>
      </div>
      <a
        href="https://buscacepinter.correios.com.br/app/endereco/index.php"
        target="_blank"
        rel="noopener noreferrer"
        className="text-[10px] text-gold hover:text-gold-dark font-body underline underline-offset-2 transition-colors"
      >
        Não sei meu CEP
      </a>

      {error && <p className="text-xs text-destructive font-body">{error}</p>}

      {options && (
        <div className="space-y-2 pt-1">
          {options.map((opt) => (
            <div
              key={opt.name}
              className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2.5"
            >
              <div>
                <p className="font-body text-sm font-medium text-foreground">{opt.name}</p>
                <p className="text-[10px] text-muted-foreground font-body">{opt.days}</p>
              </div>
              <span className="font-mono text-sm font-semibold text-foreground">
                {opt.price === 0 ? (
                  <span className="text-gold">Grátis</span>
                ) : (
                  `R$ ${opt.price.toFixed(2).replace(".", ",")}`
                )}
              </span>
            </div>
          ))}
          <p className="text-[10px] text-muted-foreground font-body text-center">
            🚚 Frete grátis em pedidos acima de R$ 150,00
          </p>
        </div>
      )}
    </div>
  );
};

export default ShippingCalculator;
