import { z } from "zod";

export const cpfSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .pipe(z.string().length(11, "CPF deve ter 11 dígitos"));

export const phoneSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .pipe(z.string().min(10, "Telefone inválido").max(11, "Telefone inválido"));

export const emailSchema = z.string().trim().email("E-mail inválido");

export const cepSchema = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .pipe(z.string().length(8, "CEP inválido"));

export const checkoutSchema = z.object({
  nome: z.string().trim().min(2, "Nome é obrigatório"),
  email: emailSchema,
  telefone: z.string().optional(),
  cpf: z.string().optional(),
  cep: z.string().min(8, "CEP é obrigatório"),
  logradouro: z.string().min(1, "Logradouro é obrigatório"),
  numero: z.string().min(1, "Número é obrigatório"),
  complemento: z.string().optional(),
  bairro: z.string().min(1, "Bairro é obrigatório"),
  cidade: z.string().min(1, "Cidade é obrigatória"),
  estado: z.string().length(2, "Estado inválido"),
  frete: z.enum(["padrao", "expresso"]),
  presente: z.boolean(),
  mensagemPresente: z.string().optional(),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;
