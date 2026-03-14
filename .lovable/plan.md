

# Concluir 100% do Projeto — Plano de Implementação

O projeto está em ~82%. Itens restantes para chegar a 100%:

---

## 1. Corrigir bugs e warnings ativos

### forwardRef warnings (console)
- **ScrollToTop.tsx**: `motion.button` dentro de `AnimatePresence` gera warning de ref — wrap com `forwardRef`
- **StorySection.tsx**, **CollectionsSection.tsx**, **TestimonialsSection.tsx**, **StatsSection.tsx**, **BrewMethods.tsx**, **SubscriptionBanner.tsx**, **DynamicBanners.tsx**: Todos usados como `lazy()` dentro de `LazySection` — `LazySection` passa children, não ref, então o warning vem do `AnimatePresence`/`PopChild` no `ScrollToTop`, não dos lazy components. Verificar e corrigir apenas o `ScrollToTop`.

### "desde 2006" restante
- `src/pages/Index.tsx` linha 28: SEOHead title ainda diz "desde 2006" — corrigir para "desde 2005"

---

## 2. Favicon SVG transparente

Criar `public/favicon.svg` — SVG minimalista baseado na logo (monograma "LR" dourado em fundo transparente). Atualizar `index.html` para usar `<link rel="icon" type="image/svg+xml" href="/favicon.svg">`.

---

## 3. E-mail transacional funcional

O `send-email` edge function atualmente apenas loga no console — não envia e-mails de verdade. Duas opções:
- **Opção A**: Configurar email infrastructure via Lovable Cloud (domínio de e-mail)
- **Opção B**: Manter como está e documentar que precisa de integração com serviço externo

Vou implementar com Lovable Cloud email infrastructure se disponível, ou adicionar template de "status_update" com tracking code que já existe mas melhorar os templates.

---

## 4. Remover bloco `.dark` do CSS

O site é light-only. O bloco `.dark` no `index.css` (linhas 63-105) é desnecessário e pode causar confusão. Remover.

---

## 5. Melhorias finais pendentes

| Item | Ação |
|------|------|
| **Exportar CSV** no admin | Adicionar botão de export CSV em AdminProdutos (lista de produtos com estoque) |
| **Rate limiting** em formulários | Já existe no send-email; adicionar debounce nos forms de newsletter e contato |
| **Focus visible** melhorado | Adicionar estilos CSS para `:focus-visible` globais |
| **Empty states** | Verificar e adicionar empty states em Favoritos, Carrinho vazio, busca sem resultados |

---

## 6. Atualizar `.lovable/plan.md` para 100%

Marcar todos os itens como concluídos.

---

## Arquivos a modificar

| Arquivo | Mudança |
|---------|---------|
| `public/favicon.svg` | Criar — SVG monograma LR |
| `index.html` | Favicon SVG ref |
| `src/index.css` | Remover bloco `.dark`, adicionar focus-visible |
| `src/components/layout/ScrollToTop.tsx` | Fix forwardRef warning |
| `src/pages/Index.tsx` | "2006" → "2005" no SEOHead |
| `src/pages/admin/AdminProdutos.tsx` | Botão exportar CSV |
| `.lovable/plan.md` | Atualizar para 100% |

Estimativa: ~7 edições, projeto finalizado.

