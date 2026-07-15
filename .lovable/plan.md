# Plano — UX/UI + Admin + Novo Ícone

## 1. Bugs UX/UI identificados no carrinho mobile (captura 440×689)

**Problema principal:** o botão "Finalizar Compra" fica abaixo da dobra. No mobile, o `CartDrawer` é `flex-col` com header + free-shipping bar + itens + **cross-sell (3 produtos)** + footer (cupom + totais + CTA). O cross-sell empurra o CTA para fora da tela, e ainda por cima o `BottomNav` fixo (Início/Cafés/Carrinho/Conta) sobrepõe o rodapé do drawer.

**Correções cirúrgicas (sem regressão):**
1. **CartDrawer.tsx** — tornar o footer verdadeiramente sticky com `sticky bottom-0 z-10 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.12)]`, dando destaque visual ao CTA e garantindo que ele sempre apareça.
2. **CartDrawer.tsx** — colocar o CrossSell **dentro da área rolável** (não como bloco fixo depois dos itens), reduzir para **scroll horizontal** de 1 linha em mobile (`overflow-x-auto snap-x`), evitando que empurre o footer.
3. **Layout.tsx / BottomNav.tsx** — esconder o `BottomNav` quando `isOpen` do carrinho for true (ou aumentar `z-index` do drawer acima do BottomNav com `pb-[env(safe-area-inset-bottom)+72px]` para dar folga). Opção escolhida: **esconder BottomNav quando drawer aberto** — mais limpo.
4. **CartDrawer.tsx** — cupom + totais compactados em mobile (`text-xs`, `space-y-1`) para reduzir altura do footer.
5. **Micro-melhorias visuais:** título "Que tal adicionar?" recebe label dourado padrão (`text-[11px] tracking-[0.3em] uppercase text-gold`); divisor cream-400 mais suave; ícone da lixeira aparece só em `active/hover` no desktop, sempre visível no mobile.

**Outros pontos UX detectados na jornada:**
6. Free-shipping bar mostra `R$ 150,00` alinhado à direita mesmo já com frete grátis — remover o valor quando `progresso === 100%`.
7. Preço "un." aparece truncado ao lado do peso — reorganizar em duas linhas no mobile.
8. Fechamento do drawer não valida preços quando o usuário reabre em <30s — comportamento OK, apenas confirmar.

## 2. Acesso ao Admin

- **URL:** `https://www.cafelaregence.com.br/admin`
- **E-mail:** `pauloposteral@hotmail.com`
- **Senha:** `P1k487spfc`
- Rotas admin protegidas por `ProtectedRoute` + role `admin` em `profiles`.

*(Sem alteração de código — só exibir na resposta.)*

## 3. Novo Ícone gerado por IA — Monograma LR dourado

- **Prompt:** monograma "LR" entrelaçado em ouro polido (#C4A265 com highlights #D4B87A), estilo brasão minimalista art déco, sobre fundo marrom profundo #1E1A14, com fina moldura circular dourada. Serifas elegantes inspiradas em Playfair Display. Renderização premium tipo selo de coleção.
- **Ferramenta:** `imagegen--generate_image` modelo `premium` (tipografia legível), 1024×1024, PNG.
- **Destino:** `public/favicon.png` + `src/assets/logo-lr.png` (para uso futuro no header, se quiser trocar).
- **Wire-up:**
  - Substituir `<link rel="icon">` no `index.html` para `/favicon.png`.
  - `rm public/favicon.ico` (obrigatório para não sobrescrever).
  - Atualizar `apple-touch-icon` no `index.html` com o mesmo arquivo.
- **Escopo:** NÃO trocar o logo do header nesta rodada (você não pediu). Apenas o favicon/ícone da aba/PWA.

## Ordem de execução

1. Gerar imagem do monograma LR.
2. Copiar para `public/favicon.png`, deletar `favicon.ico`, atualizar `index.html`.
3. Aplicar fixes cirúrgicos no `CartDrawer.tsx` (sticky footer + cross-sell horizontal + micro-ajustes).
4. Esconder `BottomNav` quando cart estiver aberto.
5. Ajustar free-shipping bar (remover valor quando 100%).

Zero regressão. Zero mudança de escopo além do pedido.
