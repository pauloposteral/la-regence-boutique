## Remover popup de exit-intent (10% OFF)

O popup que aparece ao tentar fechar a aba (ou após 15s) está em `src/components/layout/NewsletterPopup.tsx` e é renderizado globalmente pelo `Layout.tsx`.

### O que será feito (cirúrgico)

1. Em `src/components/layout/Layout.tsx`:
   - Remover o `import NewsletterPopup from "./NewsletterPopup"`
   - Remover a linha `<NewsletterPopup />` do JSX
2. Manter o arquivo `NewsletterPopup.tsx` intacto (caso queira reativar no futuro com outra estratégia, sem exit-intent)
3. Newsletter continua disponível via `NewsletterFooter` no rodapé — ninguém perde a opção de assinar

### O que NÃO muda
- Cookie banner, PWA prompt, abandoned cart e demais overlays continuam normais
- Componente do popup permanece no codebase, só desplugado do Layout
- Zero impacto em performance, rotas ou outras features

Aprove para eu aplicar a remoção.