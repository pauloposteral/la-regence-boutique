// One-shot, branch-scoped migration. Never changes catalog data or backend functions.
import fs from 'node:fs';
import ts from 'typescript';
const read = p => fs.readFileSync(p, 'utf8');
const write = (p, s) => fs.writeFileSync(p, s);
const edit = (p, fn) => { const old = read(p), next = fn(old); if (next !== old) { write(p, next); console.log('UPDATED', p); } };
const parse = (p, s) => ts.createSourceFile(p, s, ts.ScriptTarget.Latest, true, p.endsWith('tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
const apply = (s, changes) => { for (const e of changes.sort((a,b) => b.start-a.start)) s = s.slice(0,e.start)+e.text+s.slice(e.end); return s; };
const files = dir => fs.readdirSync(dir, {withFileTypes:true}).flatMap(e => e.isDirectory() ? files(dir+'/'+e.name) : [dir+'/'+e.name]);

edit('src/lib/utils.ts', s => s.includes('export function formatBRL') ? s : s + `

const brlFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
/** Display-only: catalog, cart and shipping amounts are in reais, not cents.
 * Accept canonical database decimals; never parse localized strings or hide invalid prices as zero.
 * Keep JSON-LD, CSV, gateway amounts and persisted values numeric/machine-readable.
 */
export function formatBRL(value: unknown): string {
  const amount = typeof value === "number" ? value
    : typeof value === "string" && /^-?\\d+(?:\\.\\d+)?$/.test(value.trim()) ? Number(value.trim())
    : NaN;
  return Number.isFinite(amount) ? brlFormatter.format(amount) : "Preço indisponível";
}
`);

edit('src/lib/authRules.ts', s => {
  const sf = parse('authRules.ts', s), changes = [];
  for (const n of sf.statements) {
    if (!ts.isFunctionDeclaration(n)) continue;
    if (n.name?.text === 'safeNext') changes.push({start:n.getStart(sf),end:n.end,text:`export function safeNext(next: string | null | undefined, fallback = "/conta"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  try {
    let decoded = next;
    for (let i = 0; i < 3; i++) {
      if (/[\\\\\\u0000-\\u0020\\u007f]/.test(decoded) || decoded.startsWith("//")) return fallback;
      const url = new URL(decoded, "https://storefront.invalid");
      if (url.origin !== "https://storefront.invalid" || url.pathname.startsWith("/auth")) return fallback;
      const again = decodeURIComponent(decoded);
      if (again === decoded) return next;
      decoded = again;
    }
  } catch { return fallback; }
  return fallback;
}`});
    if (n.name?.text === 'translateAuthError') {
      const parameter = n.parameters[0].name.getText(sf);
      changes.push({start:n.body.getStart(sf)+1,end:n.body.getStart(sf)+1,text:`
  if (/missing OAuth secret|unsupported provider|provider.*not enabled/i.test(${parameter})) {
    return "O login com Google está indisponível no momento. Entre com e-mail e senha.";
  }
  if (/access_denied|user.*cancel/i.test(${parameter})) return "A entrada com Google foi cancelada. Tente novamente.";
`});
    }
  }
  return apply(s, changes);
});

// Remove conflicting unverified installment promises, not actual payment terms.
for (const p of ['src/components/home/CoffeeCarousel.tsx','src/pages/CafesPage.tsx','src/pages/ProdutoPage.tsx','src/components/product/QuickViewModal.tsx']) {
  edit(p, s => {
    const sf = parse(p,s), changes=[];
    const visit = n => {
      if (ts.isJsxElement(n) && ['p','span'].includes(n.openingElement.tagName.getText(sf))) {
        const literal = n.children.filter(ts.isJsxText).map(c=>c.text).join(' ');
        if (/(?:3|12)x/.test(literal) && /juros/.test(literal) && /toFixed/.test(n.getText(sf))) {
          changes.push({start:n.openingElement.end,end:n.closingElement.getStart(sf),text:'Consulte as condições de parcelamento no pagamento'}); return;
        }
      }
      ts.forEachChild(n,visit);
    }; visit(sf);
    return apply(s,changes).replace(/^\s*const parcela = coffee\.preco \/ 3;\r?\n/m,'\n');
  });
}

// AST-based conversion only where a visible R$ prefix proves this is display text.
// Machine-readable toFixed(2) (JSON-LD, CSV, API values) is deliberately untouched.
let displays = 0;
for (const p of files('src').filter(p=>/\.tsx?$/.test(p) && !/\.test\.|\.spec\.|\/integrations\//.test(p))) {
  edit(p, s => {
    const sf = parse(p,s), changes=[];
    function visit(n) {
      if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression)) {
        let fixed = n;
        if (n.expression.name.text === 'replace' && n.arguments.length===2 && n.arguments[0].getText(sf).replace(/["']/g,'')==='.' && n.arguments[1].getText(sf).replace(/["']/g,'')===',') fixed=n.expression.expression;
        if (ts.isCallExpression(fixed) && ts.isPropertyAccessExpression(fixed.expression) && fixed.expression.name.text==='toFixed' && fixed.arguments[0]?.getText(sf)==='2') {
          const prefix = s.slice(0,n.getStart(sf)).match(/R\$\s*(\$\{|\{)$/);
          if (prefix) {
            let amount=fixed.expression.expression;
            if (ts.isCallExpression(amount) && amount.expression.getText(sf)==='Number' && amount.arguments.length===1) amount=amount.arguments[0];
            changes.push({start:n.getStart(sf),end:n.end,text:`formatBRL(${amount.getText(sf)})`});
            changes.push({start:n.getStart(sf)-prefix[0].length,end:n.getStart(sf)-prefix[1].length,text:''});
            displays++; return;
          }
        }
      }
      ts.forEachChild(n,visit);
    }
    visit(sf);
    if (!changes.length) return s;
    let next = 'import { formatBRL } from "@/lib/utils";\n'+apply(s,changes);
    if (!p.includes('/admin/')) next=next.replace(/\bfont-mono\b/g,'font-body tabular-nums');
    return next;
  });
}
console.log('CURRENCY_DISPLAYS', displays);
if (displays < 40) throw new Error('Unexpectedly few price displays migrated; inspect source before proceeding');
edit('src/components/home/CoffeeCarousel.tsx', s => s.replace('coffee.preco_promocional || coffee.preco','coffee.preco_promocional ?? coffee.preco').replace('formatBRL(coffee.preco)','formatBRL(basePrice)'));
edit('src/components/home/CollectionsSection.tsx', s => s.replace('product.preco_promocional || product.preco','product.preco_promocional ?? product.preco').replace('formatBRL(product.preco)','formatBRL(product.preco_promocional ?? product.preco)'));

edit('src/components/layout/Layout.tsx', s => s.replace('className="min-h-screen flex flex-col"','className="storefront min-h-screen flex flex-col"'));
edit('src/index.css', s => s + `

/* BAM-181: readable storefront, preserving the established brand and admin/TV styles. */
.storefront { font-family: "Outfit", system-ui, -apple-system, "Segoe UI", sans-serif; font-size: 16px; line-height: 1.6; }
.storefront .tabular-nums { font-variant-numeric: tabular-nums; letter-spacing: -0.015em; }
.storefront label { font-size: 0.8125rem; font-weight: 500; color: hsl(var(--foreground)); }
.storefront input:not([type="checkbox"]):not([type="radio"]), .storefront select, .storefront textarea { font-size: 16px; min-height: 44px; }
.storefront button:not([role="checkbox"]):not([role="radio"]) { min-height: 44px; }
.storefront button.bg-gold { color: hsl(var(--foreground)); font-weight: 600; }
.storefront :focus-visible { outline: 2px solid hsl(var(--espresso)); outline-offset: 3px; }
.storefront .auth-panel { line-height: 1.6; }
.storefront .auth-panel .text-muted-foreground { color: hsl(30 16% 36%); }
.storefront .auth-panel .text-gold { color: hsl(35 45% 32%); }
.storefront .auth-panel p, .storefront .auth-panel button { font-weight: 400; }
@media (max-width: 640px) {
  .storefront .auth-panel { padding: 1.5rem; }
  .storefront .auth-panel label { letter-spacing: 0.06em; }
}
`);

edit('src/pages/AuthPage.tsx', s => {
  s=s.replace(/const AuthPage = \(\) => \{/, `const AuthPage = () => {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [oauthError, setOAuthError] = useState<string | null>(null);
  useEffect(() => {
    const url = new URL(window.location.href);
    const hash = new URLSearchParams(url.hash.slice(1));
    const error = url.searchParams.get("error_description") || url.searchParams.get("error") || hash.get("error_description") || hash.get("error");
    if (!error) return;
    setOAuthError(translateAuthError(error));
    for (const key of ["error", "error_code", "error_description"]) url.searchParams.delete(key);
    url.hash = "";
    window.history.replaceState(window.history.state, "", url.pathname + url.search);
  }, []);
`);
  const sf=parse('AuthPage.tsx',s), changes=[];
  function visit(n) {
    if(ts.isVariableStatement(n) && n.declarationList.declarations.some(d=>d.name.getText(sf)==='handleGoogleLogin')) {
      changes.push({start:n.getStart(sf),end:n.end,text:`const handleGoogleLogin = async () => {
    if (googleLoading) return;
    setGoogleLoading(true);
    setOAuthError(null);
    try {
      try { sessionStorage.setItem("auth_next", next); } catch { /* sign-in still works with restricted storage */ }
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin + "/auth", skipBrowserRedirect: true },
      });
      if (error) throw error;
      if (!data.url) throw new Error("Unsupported provider");
      // Inspect configuration errors before leaving the store. A healthy cross-origin
      // OAuth redirect is opaque; the subsequent top-level navigation starts the flow.
      const check = await fetch(data.url, { redirect: "manual", credentials: "omit", cache: "no-store", signal: AbortSignal.timeout(10000) });
      if (check.type !== "opaqueredirect" && !check.ok) {
        const detail = await check.json().catch(() => ({}));
        throw new Error(typeof detail.msg === "string" ? detail.msg : "Unsupported provider");
      }
      window.location.assign(data.url);
    } catch (error) {
      const message = translateAuthError(error instanceof Error ? error.message : "Unsupported provider");
      setOAuthError(message);
      toast.error(message);
      setGoogleLoading(false);
      try { sessionStorage.removeItem("auth_next"); } catch { /* optional storage */ }
    }
  };`}); return;
    }
    if(ts.isJsxSelfClosingElement(n) && n.tagName.getText(sf)==='Input') {
      const value=n.attributes.properties.find(a=>ts.isJsxAttribute(a)&&a.name.getText(sf)==='value');
      const key=value?.initializer && ts.isJsxExpression(value.initializer) ? value.initializer.expression?.getText(sf) : '';
      const names={nome:['auth-name','name'],email:['auth-email','email'],password:['auth-password','current-password'],confirmPassword:['auth-confirm','new-password']};
      const details=names[key];
      if(details && !n.attributes.properties.some(a=>ts.isJsxAttribute(a)&&a.name.getText(sf)==='id')) changes.push({start:n.tagName.end,end:n.tagName.end,text:` id="${details[0]}"${n.attributes.properties.some(a=>ts.isJsxAttribute(a)&&a.name.getText(sf)==='autoComplete')?'':` autoComplete="${details[1]}"`}`});
    }
    if(ts.isJsxOpeningElement(n)&&n.tagName.getText(sf)==='button') {
      const raw=n.getText(sf);
      if(raw.includes('handleGoogleLogin')) changes.push({start:n.tagName.end,end:n.tagName.end,text:' disabled={loading || googleLoading} aria-busy={googleLoading}'});
      if(raw.includes('setShowPassword')&&!raw.includes('aria-label')) changes.push({start:n.tagName.end,end:n.tagName.end,text:' aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}'});
    }
    if(ts.isJsxText(n)&&n.text.trim()==='Google') changes.push({start:n.getStart(sf),end:n.end,text:'{googleLoading ? "Conectando ao Google…" : "Continuar com Google"}'});
    ts.forEachChild(n,visit);
  } visit(sf);
  s=apply(s,changes);
  s=s.replace(/(<Label\b[^>]*>)(Nome completo|Nome|E-mail|Email|Senha|Confirmar senha)(<\/Label>)/g, (all,open,label,close) => {
    const ids={'Nome completo':'auth-name',Nome:'auth-name','E-mail':'auth-email',Email:'auth-email',Senha:'auth-password','Confirmar senha':'auth-confirm'};
    return open.replace('<Label','<Label htmlFor="'+ids[label]+'"')+label+close;
  });
  s=s.replace('max-w-md','auth-panel max-w-md');
  s=s.replace('<form', '{oauthError && <p role="alert" className="mb-5 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-foreground">{oauthError}</p>}\n          <form');
  s=s.replace('const stored = sessionStorage.getItem("auth_next");','let stored: string | null = null;\n      try { stored = sessionStorage.getItem("auth_next"); } catch { /* optional storage */ }');
  s=s.replace('sessionStorage.removeItem("auth_next");\n      navigate','try { sessionStorage.removeItem("auth_next"); } catch { /* optional storage */ }\n      navigate');
  return s;
});

// Names are programmatic labels; placeholders are not labels.
for(const p of ['src/components/layout/NewsletterFooter.tsx','src/components/product/ShippingCalculator.tsx','src/pages/CafesPage.tsx']) {
  if(!fs.existsSync(p)) continue;
  edit(p,s=> {
    const sf=parse(p,s),changes=[];
    function visit(n) {
      if(ts.isJsxSelfClosingElement(n)&&['input','Input'].includes(n.tagName.getText(sf))) {
        const raw=n.getText(sf); let label;
        if(p.includes('NewsletterFooter')&&/email/.test(raw))label='Seu e-mail para receber novidades';
        if(p.includes('ShippingCalculator')&&/cep|00000/.test(raw))label='CEP para calcular o frete';
        if(p.includes('CafesPage')&&/search|busca|Buscar|buscar/.test(raw))label='Buscar cafés';
        if(label&&!raw.includes('aria-label')&&!raw.includes('htmlFor'))changes.push({start:n.tagName.end,end:n.tagName.end,text:` aria-label="${label}"`});
      }ts.forEachChild(n,visit);
    }visit(sf);return apply(s,changes);
  });
}
