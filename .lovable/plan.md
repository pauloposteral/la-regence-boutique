

## Plano: Scroll-to-top automático + Mobile-first responsivo

### 1. Scroll-to-top em troca de rota
O Layout já tem `useLocation` mas não faz scroll ao trocar de página. Adicionar `window.scrollTo(0, 0)` no `useEffect` que já observa `location.pathname`.

**Arquivo:** `src/components/layout/Layout.tsx`
- No `useEffect` existente (linha 43-45), adicionar `window.scrollTo(0, 0)` antes do `trackPageView`.

### 2. Remover `App.css` legado do Vite
O `App.css` tem estilos do template Vite (`#root { max-width: 1280px; padding: 2rem }`) que limitam a largura e adicionam padding indesejado. Este arquivo não é importado no `App.tsx` atual, mas se estiver importado em algum lugar, remove o import. Se não estiver importado, deletar o conteúdo.

**Arquivo:** `src/App.css` — esvaziar o conteúdo (remover `#root max-width`, `padding`, `text-align`).

### 3. Garantir responsividade mobile-first
Verificar e ajustar:
- `index.html`: confirmar `<meta name="viewport" content="width=device-width, initial-scale=1.0">` presente
- `BottomNav.tsx`: garantir touch targets 44×44 (já tem `min-w-[44px] min-h-[44px]`)
- `Header.tsx`: verificar menu mobile funcional (já tem hamburger)

Nenhuma mudança grande necessária — o projeto já usa Tailwind mobile-first. A principal correção é o `App.css` legado e o scroll-to-top.

### Alterações

| Arquivo | O que muda |
|---|---|
| `src/components/layout/Layout.tsx` | Adicionar `window.scrollTo(0, 0)` no useEffect de route change |
| `src/App.css` | Esvaziar — remover estilos legados do template Vite |

