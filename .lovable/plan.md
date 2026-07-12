# Plano — Limpeza Profissional + 30 Melhorias

## 1. Remoções imediatas (o que incomoda hoje)

**a) Barra "Frete grátis acima de R$ 150 · Torrefação artesanal…" no topo do Header**
- Arquivo: `src/components/layout/Header.tsx` (bloco `bg-cream-100 text-foreground/70 …` acima do `<header>`).
- Remover completamente. O Header fica mais limpo, silencioso, no padrão Aesop/Le Labo.
- A informação de frete grátis continua viva no `FreeShippingBar` (que só aparece quando há itens no carrinho) e na página de produto.

**b) Toasts de "prova social" falsos ("Fulano de SP acabou de comprar…")**
- Arquivo: `src/components/product/SocialProofToast.tsx` (e onde estiver montado — provavelmente `ProdutoPage.tsx` e/ou `Layout.tsx`).
- Remover o componente do render e apagar o arquivo. Nada de nomes/cidades fabricados — quebra confiança de marca premium.
- Substituir a função ("mostrar tração") por sinais **reais**: contagem de avaliações verificadas, "X pessoas compraram nos últimos 30 dias" **somente se vier de `pedidos` real**, ou nada.

---

## 2. Bugs a corrigir nesta rodada

1. Console warning `Unknown message type: RESET_BLANK_CHECK` — filtrar/ignorar no bootstrap para não poluir o console.
2. Header: `grid-cols-3` quebra levemente em telas ~360px (logo comprime o bloco de ícones). Ajustar para `flex` com `flex-1` no centro em mobile.
3. Busca do Header: quando `searchResults` está vazio mas o usuário digitou 2+ chars, não mostra estado "nenhum resultado" — só some. Adicionar empty state.
4. `FavoriteButton` invalida `["favoritos"]` mas o Header usa `["fav-count", user?.id]` — contador só atualiza no refetch de página. Padronizar invalidations.
5. `StickyAddToCart` fica **atrás** do `BottomNav` em alguns iPhones (bottom-14 fixo, mas BottomNav usa safe-area). Usar `bottom-[calc(3.5rem+env(safe-area-inset-bottom))]`.
6. `CartDrawer` — cupom aplicado permanece após esvaziar carrinho. Limpar no `clearCart`.
7. `SEOHead` em `/` seta título mas algumas subpáginas (Blog, FAQ) caem no default — auditar e completar.

---

## 3. As 30 melhorias (agrupadas)

### Confiança & profissionalismo (1–6)
1. Remover barra de frete do topo (item 1a).
2. Remover toasts de compra falsa (item 1b).
3. Rodapé: exibir CNPJ, razão social, endereço completo e canais oficiais em bloco discreto (LGPD + confiança).
4. Selos reais: "Site seguro · Pagamento Stripe · SSL" com ícones sóbrios (sem badges kitsch).
5. Página `/politica-de-privacidade`, `/termos`, `/trocas-e-devolucoes`, `/politica-de-cookies` linkadas do footer (criar se faltarem).
6. Página "Sobre" com foto real da torrefação/equipe (placeholder profissional se ainda não houver foto do cliente).

### Header/Nav (7–10)
7. Header collapse: reduzir altura de `h-20` para `h-16` no scrolled, com transição de logo 56→40px.
8. Mega-menu leve em "Cafés" com subcategorias (Origem, Torra, Método) — desktop only.
9. Busca com estado "Nenhum resultado para …" + sugestões (top 3 produtos populares).
10. Substituir `Heart` do header por link direto "Favoritos" no menu da conta (declutter).

### Home (11–14)
11. Hero: remover sobreposições excessivas, alinhar a um único CTA primário + link secundário.
12. `CoffeeCarousel`: adicionar navegação por teclado (←/→) e aria-labels.
13. `TestimonialsSection`: usar somente reviews com `reviews.status='approved'` do banco (sem mock).
14. `SensoryNotesBanner`: reduzir densidade cromática, respeitar espaçamento premium.

### PDP — Produto (15–19)
15. Galeria: pinch-zoom mobile + lightbox desktop.
16. Bloco "Ficha técnica" estruturado (Origem, Altitude, Processo, Torra, SCA, Notas) em `<dl>` semântico.
17. Cross-sell: mostrar 4 produtos da mesma origem/torra em vez de aleatórios.
18. Estoque baixo real ("Restam X unidades") usando `variantes.estoque` — sem urgência falsa.
19. Botão "Compartilhar" com Web Share API nativa em mobile.

### Carrinho & Checkout (20–23)
20. `CartDrawer`: mostrar economia total (soma de `preco - preco_promocional`) em destaque discreto.
21. Cupom: feedback inline (verde/vermelho) sem toast intrusivo.
22. Checkout: salvar CEP no `localStorage` e pré-preencher.
23. Resumo do pedido sticky no desktop durante o checkout.

### Conta do cliente (24–26)
24. "Meus pedidos" com filtros (status, período) e busca por número.
25. Endereços: marcar padrão, editar inline, deletar com confirmação.
26. Central de preferências: opt-in granular (novidades, ofertas, blog, avaliações).

### Performance/SEO/Qualidade (27–30)
27. `content-visibility: auto` nas seções abaixo da fold da Home (LCP/CLS).
28. Sitemap dinâmico incluir `blog_posts`, `collections` e `categorias`.
29. Meta description específica por página (Cafés, Assinatura, Sobre, Blog, cada produto).
30. Lighthouse pass: garantir contraste AA em todos os `text-cream-*` sobre `bg-cream-*` e labels dourados.

---

## 4. Ordem de execução sugerida

**Onda A (limpeza + bugs, 1 sprint curto):** itens 1, 2 e bugs 1–7.
**Onda B (confiança + header + home):** itens 3–14.
**Onda C (PDP + carrinho + conta):** itens 15–26.
**Onda D (performance/SEO final):** itens 27–30 + Lighthouse.

## Detalhes técnicos

- Remoções não tocam schema nem edge functions.
- `SocialProofToast` sai do bundle (import + arquivo).
- Bugs de query invalidation resolvidos padronizando chaves em `useAuth` layer.
- Novas páginas jurídicas: rotas em `src/App.tsx` + componente em `src/pages/InstitucionalPages.tsx` (já existe, estender).
- Sem alterações no design system (paleta gold/brown, Playfair/DM Sans, pill buttons preservados).
