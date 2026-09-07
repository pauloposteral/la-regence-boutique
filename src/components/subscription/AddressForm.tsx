import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface EnderecoAssinatura {
  destinatario: string;
  telefone: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  referencia: string;
}

export const emptyEndereco: EnderecoAssinatura = {
  destinatario: "",
  telefone: "",
  cep: "",
  logradouro: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  referencia: "",
};

export function validarEndereco(e: EnderecoAssinatura): string | null {
  if (!e.destinatario.trim()) return "Informe quem vai receber o café";
  if (e.cep.replace(/\D/g, "").length !== 8) return "CEP incompleto";
  if (!e.logradouro.trim()) return "Informe a rua";
  if (!e.numero.trim()) return "Informe o número (use s/n se não houver)";
  if (!e.bairro.trim()) return "Informe o bairro";
  if (!e.cidade.trim()) return "Informe a cidade";
  if (e.estado.trim().length !== 2) return "Informe a UF (2 letras)";
  return null;
}

const maskCep = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
};

const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{0,2})(\d{0,4})(\d{0,4})/, (_, a, b, c) => [a && `(${a}`, a.length === 2 ? ") " : "", b, c && `-${c}`].join("")).trim();
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3");
};

interface Props {
  value: EnderecoAssinatura;
  onChange: (v: EnderecoAssinatura) => void;
  disabled?: boolean;
}

const AddressForm = ({ value, onChange, disabled }: Props) => {
  const [buscando, setBuscando] = useState(false);
  const [cepErro, setCepErro] = useState<string | null>(null);

  const set = (patch: Partial<EnderecoAssinatura>) => onChange({ ...value, ...patch });

  const buscarCep = async (cep: string) => {
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setBuscando(true);
    setCepErro(null);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await res.json();
      if (data.erro) {
        setCepErro("CEP não encontrado — preencha o endereço manualmente.");
        return;
      }
      set({
        logradouro: data.logradouro || value.logradouro,
        bairro: data.bairro || value.bairro,
        cidade: data.localidade || value.cidade,
        estado: data.uf || value.estado,
      });
    } catch {
      setCepErro("Não conseguimos buscar o CEP agora — preencha manualmente.");
    } finally {
      setBuscando(false);
    }
  };

  const field = "font-body text-sm rounded-lg border-cream-500 focus-visible:ring-gold/30";

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="font-body text-xs text-brown">Quem vai receber *</Label>
          <Input className={field} value={value.destinatario} disabled={disabled}
            onChange={(e) => set({ destinatario: e.target.value })} placeholder="Nome completo" />
        </div>
        <div className="space-y-1.5">
          <Label className="font-body text-xs text-brown">Telefone (WhatsApp)</Label>
          <Input className={field} value={value.telefone} disabled={disabled} inputMode="tel"
            onChange={(e) => set({ telefone: maskPhone(e.target.value) })} placeholder="(11) 90000-0000" />
        </div>
      </div>

      <div className="grid sm:grid-cols-[1fr_2fr] gap-4">
        <div className="space-y-1.5">
          <Label className="font-body text-xs text-brown">CEP *</Label>
          <div className="relative">
            <Input className={field} value={value.cep} disabled={disabled} inputMode="numeric"
              onChange={(e) => {
                const cep = maskCep(e.target.value);
                set({ cep });
                if (cep.replace(/\D/g, "").length === 8) buscarCep(cep);
              }}
              placeholder="00000-000" />
            {buscando && <Loader2 className="w-4 h-4 animate-spin text-gold absolute right-3 top-1/2 -translate-y-1/2" />}
          </div>
          {cepErro && <p className="font-body text-[11px] text-destructive">{cepErro}</p>}
        </div>
        <div className="space-y-1.5">
          <Label className="font-body text-xs text-brown">Rua *</Label>
          <Input className={field} value={value.logradouro} disabled={disabled}
            onChange={(e) => set({ logradouro: e.target.value })} placeholder="Rua, avenida…" />
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label className="font-body text-xs text-brown">Número *</Label>
          <Input className={field} value={value.numero} disabled={disabled}
            onChange={(e) => set({ numero: e.target.value })} placeholder="123 ou s/n" />
        </div>
        <div className="space-y-1.5">
          <Label className="font-body text-xs text-brown">Complemento</Label>
          <Input className={field} value={value.complemento} disabled={disabled}
            onChange={(e) => set({ complemento: e.target.value })} placeholder="Apto, bloco…" />
        </div>
        <div className="space-y-1.5">
          <Label className="font-body text-xs text-brown">Bairro *</Label>
          <Input className={field} value={value.bairro} disabled={disabled}
            onChange={(e) => set({ bairro: e.target.value })} />
        </div>
      </div>

      <div className="grid sm:grid-cols-[2fr_1fr] gap-4">
        <div className="space-y-1.5">
          <Label className="font-body text-xs text-brown">Cidade *</Label>
          <Input className={field} value={value.cidade} disabled={disabled}
            onChange={(e) => set({ cidade: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label className="font-body text-xs text-brown">UF *</Label>
          <Input className={field} value={value.estado} disabled={disabled} maxLength={2}
            onChange={(e) => set({ estado: e.target.value.toUpperCase() })} placeholder="SP" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="font-body text-xs text-brown">Ponto de referência</Label>
        <Input className={field} value={value.referencia} disabled={disabled}
          onChange={(e) => set({ referencia: e.target.value })} placeholder="Portaria, casa dos fundos…" />
      </div>
    </div>
  );
};

export default AddressForm;
