import { useState } from "react";
import { Truck, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface ShippingOption {
  id: string;
  name: string;
  company: string;
  price: number;
  free: boolean;
  delivery_time: number | null;
  delivery_range: { min: number; max: number } | null;
}

interface Props {
  produtoId?: string;
  varianteId?: string | null;
  quantidade?: number;
  precoUnitario?: number;
}

const ShippingCalculator = ({ produtoId, varianteId, quantidade = 1, precoUnitario = 0 }: Props) => {
  const [cep, setCep] = useState("");
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<ShippingOption[] | null>(null);
  const [freeShipping, setFreeShipping] = useState(false);
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
      const payload: any = { cep_destino: digits };
      if (produtoId) {
        payload.items = [{ produtoId, varianteId: varianteId || null, quantidade }];
        payload.subtotal = precoUnitario * quantidade;
      }

      const { data, error: fnErr } = await supabase.functions.invoke("calcular-frete", { body: payload });
      if (fnErr) throw fnErr;
      if (data?.error) throw new Error(data.error);

      const opts: ShippingOption[] = data?.options || [];
      if (opts.length === 0) {
        setError("Nenhum serviço disponível para este CEP.");
      } else {
        setOptions(opts.slice(0, 4));
        setFreeShipping(!!data?.free_shipping);
      }
    } catch (e: any) {
      console.error(e);
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
          className="font-body text-xs h-9 px-4 shrink-0 border-gold/30 hover:bg-gold/10 hover:border-gold rounded-full"
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
              key={opt.id}
              className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2.5"
            >
              <div>
                <p className="font-body text-sm font-medium text-foreground">
                  {opt.company} · {opt.name}
                </p>
                <p className="text-[10px] text-muted-foreground font-body">
                  {opt.delivery_range
                    ? `${opt.delivery_range.min}-${opt.delivery_range.max} dias úteis`
                    : opt.delivery_time
                    ? `até ${opt.delivery_time} dias úteis`
                    : ""}
                </p>
              </div>
              <span className="font-mono text-sm font-semibold text-foreground">
                {opt.free || opt.price === 0 ? (
                  <span className="text-gold">Grátis</span>
                ) : (
                  `R$ ${opt.price.toFixed(2).replace(".", ",")}`
                )}
              </span>
            </div>
          ))}
          {freeShipping && (
            <p className="text-[10px] text-gold font-body text-center">
              🎉 Frete grátis aplicado ao seu pedido
            </p>
          )}
          {!freeShipping && (
            <p className="text-[10px] text-muted-foreground font-body text-center">
              🚚 Frete grátis em pedidos acima de R$ 150,00
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ShippingCalculator;
