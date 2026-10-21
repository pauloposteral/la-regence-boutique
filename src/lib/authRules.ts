export const MIN_PASSWORD_LENGTH = 8;

export interface SignupInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  acceptedTerms: boolean;
}

/** Returns a PT-BR error message, or null when the signup form is valid. */
export function validateSignup(input: SignupInput): string | null {
  if (!input.name.trim() || !input.email.trim() || !input.password) return "Preencha todos os campos";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) return "Informe um e-mail válido";
  if (input.password.length < MIN_PASSWORD_LENGTH) return `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres`;
  if (input.password !== input.confirmPassword) return "As senhas não coincidem";
  if (!input.acceptedTerms) return "Aceite os Termos e a Política de Privacidade";
  return null;
}

const AUTH_ERRORS: Array<[RegExp, string]> = [
  [/invalid login credentials/i, "E-mail ou senha incorretos"],
  [/email not confirmed/i, "Confirme seu e-mail antes de entrar"],
  [/user already registered|already been registered/i, "Este e-mail já está cadastrado"],
  [/password should be at least/i, `A senha deve ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres`],
  [/pwned|leaked|compromised|weak password/i, "Essa senha apareceu em vazamentos. Escolha outra"],
  [/rate limit|too many requests|security purposes/i, "Muitas tentativas. Aguarde um minuto e tente novamente"],
  [/same.*password|different from the old/i, "A nova senha deve ser diferente da anterior"],
  [/invalid email|unable to validate email/i, "Informe um e-mail válido"],
  [/expired|invalid.*(token|link)/i, "Link inválido ou expirado"],
];

export function translateAuthError(message: string): string {
  if (/missing OAuth secret|unsupported provider|provider.*not enabled/i.test(message)) {
    return "O login com Google está indisponível no momento. Entre com e-mail e senha.";
  }
  if (/access_denied|user.*cancel/i.test(message)) return "A entrada com Google foi cancelada. Tente novamente.";

  for (const [re, pt] of AUTH_ERRORS) if (re.test(message)) return pt;
  return "Não foi possível concluir. Tente novamente";
}

/** Only allow internal relative paths as post-login destination. */
export function safeNext(next: string | null | undefined, fallback = "/conta"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  try {
    let decoded = next;
    for (let i = 0; i < 3; i++) {
      if (/[\\\u0000-\u0020\u007f]/.test(decoded) || decoded.startsWith("//")) return fallback;
      const url = new URL(decoded, "https://storefront.invalid");
      if (url.origin !== "https://storefront.invalid" || url.pathname.startsWith("/auth")) return fallback;
      const again = decodeURIComponent(decoded);
      if (again === decoded) return next;
      decoded = again;
    }
  } catch { return fallback; }
  return fallback;
}
