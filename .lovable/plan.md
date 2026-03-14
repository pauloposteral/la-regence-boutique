

# Auditoria Completa — La Régence E-commerce: 50 Melhorias Pendentes

Após análise detalhada de todos os arquivos do projeto, identifiquei 50 melhorias organizadas por categoria.

---

## 🔴 CRÍTICO — Funcionalidade & Segurança (1-10)

1. **Validação de estoque no carrinho** — Não há verificação de estoque disponível ao adicionar itens ao carrinho; o usuário pode adicionar mais unidades do que o disponível
2. **Checkout sem autenticação obrigatória** — O checkout aceita pedidos sem login; não vincula user_id consistentemente, dificultando rastreamento
3. **Validação de cupom no servidor** — A validação de cupons acontece apenas no client-side via query; deveria ter uma edge function para evitar manipulação
4. **Limite de uso de cupom** — Não há controle de quantas vezes um cupom já foi usado (campo `uso_maximo` vs `usos_atuais`)
5. **Proteção contra double-submit** — O botão "Confirmar e Pagar" desabilita com `submitting`, mas não há idempotency key no backend
6. **Carrinho sem expiração de preço** — Preços ficam em localStorage indefinidamente; se o admin alterar preço, o carrinho mantém o valor antigo
7. **SEO: meta description dinâmica** — Páginas de produto e blog não geram og:image e og:description dinâmicos a partir do conteúdo real
8. **Falta página 404 para produtos inexistentes** — ProdutoPage mostra loading infinito se slug inválido; deveria redirecionar para NotFound
9. **Imagens sem fallback** — Se o Supabase Storage falhar, as imagens quebram sem placeholder
10. **Admin sem proteção de rota** — As rotas `/admin/*` usam `AdminLayout` mas não verificam `has_role` antes de renderizar

---

## 🟡 UX & Conversão (11-25)

11. **Breadcrumbs faltam em várias páginas** — Blog, Assinatura, Quiz, Favoritos e Comparar não têm breadcrumbs
12. **Carrinho vazio sem CTA** — O drawer de carrinho vazio mostra apenas ícone; deveria ter botão "Explorar Cafés"
13. **Sem indicador de loading no botão "Adicionar ao Carrinho"** — Feedback instantâneo mas sem spinner no botão
14. **Filtros de catálogo não persistem ao voltar** — Ao sair de um produto e voltar para `/cafes`, os filtros resetam (usa URL params mas não restaura scroll)
15. **Sem wishlist compartilhável** — Favoritos são privados; falta opção de gerar link público de lista de desejos
16. **Checkout: sem salvar endereço** — O endereço preenchido no checkout não é salvo no perfil do usuário para próximas compras
17. **Sem notificação de pedido por email real** — O edge function `send-email` existe mas não está conectado a um provedor (Resend/SendGrid)
18. **Sem confirmação visual após adicionar ao carrinho** — Toast aparece mas é discreto; falta animação no ícone do carrinho
19. **Blog sem paginação** — Carrega todos os posts de uma vez; sem lazy loading ou paginação
20. **Sem página de FAQ** — Perguntas frequentes sobre frete, devoluções, preparo de café
21. **Sem estimativa de entrega** — O checkout mostra "5-10 dias" fixo; deveria calcular baseado no CEP
22. **Footer: links "Imprensa" são placeholder** — "Press kit / café", "Parcerias e eventos" são `<span>` sem link real
23. **Sem aviso de cookies/LGPD** — Obrigatório para e-commerce brasileiro
24. **Sem opção de gift card / vale-presente** — Funcionalidade de presente existe no checkout mas não há cartões-presente compráveis
25. **Cross-sell no carrinho é aleatório** — As sugestões no CartDrawer são apenas os primeiros produtos fora do carrinho; deveria ser baseado em categoria/notas sensoriais

---

## 🟢 Performance & Técnico (26-35)

26. **Imagens de produto sem WebP/AVIF** — Usa JPG/PNG direto do storage; sem transformação de formato ou resize
27. **Bundle size: framer-motion em toda página** — Muitos componentes importam framer-motion desnecessariamente; deveria usar CSS transitions para animações simples
28. **Sem service worker real** — O manifest.json está configurado mas não há service worker para cache offline
29. **Header search: query sem sanitização** — A busca usa `.ilike` direto com input do usuário
30. **Console: possíveis warnings de React** — `useMemo` usado como `useEffect` no ProdutoPage (linhas 54-55) para setar estado
31. **Sem lazy loading para imagens do carrossel** — CoffeeCarousel carrega todas as imagens de uma vez
32. **Fontes externas bloqueantes** — Google Fonts carregado no CSS sem `font-display: optional` (apenas `display=swap`)
33. **Sem compressão gzip/brotli explícita** — Dependente do CDN; sem headers otimizados
34. **localStorage sem try/catch em todos os hooks** — `useRecentlyViewed` tem try/catch mas outros acessos diretos podem falhar em modo privado
35. **Sem rate limiting no client** — Busca no header dispara queries a cada 250ms sem debounce mínimo mais agressivo

---

## 🔵 Design & Identidade Visual (36-42)

36. **Logo no email transacional** — O edge function `send-email` não inclui a logo oficial nos templates HTML
37. **Favicon não é ICO multi-resolução** — Usa PNG direto; navegadores antigos precisam de `.ico`
38. **Sem dark mode consistente** — O bloco `.dark` foi removido mas o `ThemeProvider` ainda está no App.tsx com `next-themes`
39. **BottomNav sem indicador de página ativa animado** — Apenas muda cor; falta um dot/underline animado
40. **Cores de status inconsistentes** — `STATUS_COLORS` definido em 3 lugares diferentes com valores ligeiramente diferentes
41. **Fonte Cormorant Garamond carregada mas pouco usada** — Importa weights 300-700 + italics mas usa em poucos elementos
42. **Sem skeleton loading nos cards de produto** — CafesPage tem skeleton básico; ProdutoPage e Homepage não

---

## 📊 Analytics & Marketing (43-50)

43. **Sem tracking de eventos** — Nenhum analytics (GA4, Plausible, etc.) implementado para monitorar conversões
44. **Sem pixel do Facebook/Meta** — Importante para campanhas de marketing
45. **Sem UTM tracking** — Links de campanha não são rastreados
46. **Sem remarketing tags** — Sem Google Ads remarketing
47. **Sem evento de "início de checkout"** — Importante para medir abandono de carrinho
48. **Newsletter sem double opt-in** — Cadastro direto sem confirmação por email (requisito LGPD)
49. **Sem A/B testing framework** — Sem possibilidade de testar variações de CTA, preços, layout
50. **Sem sitemap.xml automático** — O edge function `generate-sitemap` existe mas não é chamado automaticamente nem referenciado no robots.txt

---

## Resumo por Prioridade

| Prioridade | Quantidade | Impacto |
|---|---|---|
| 🔴 Crítico | 10 | Segurança, dados, bugs |
| 🟡 UX/Conversão | 15 | Vendas, retenção |
| 🟢 Performance | 10 | Velocidade, SEO técnico |
| 🔵 Design | 7 | Consistência visual |
| 📊 Analytics | 8 | Monitoramento, marketing |

### Recomendação de execução
Começar pelos itens **críticos** (1-10), depois **UX** (11-25) que impactam diretamente vendas, e em paralelo os de **performance** (26-35). Design e analytics podem ser implementados de forma incremental.

