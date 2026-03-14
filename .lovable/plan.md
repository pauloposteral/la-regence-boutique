

# Novo Tema + 50 Melhorias de Design Polish — La Régence

## Problemas Identificados nos Screenshots

### Problemas Graves
1. **Seção "Nossos Cafés" na home**: fundo totalmente preto/brown-deep — texto quase invisível ("Nossos Cafés" em cream é legível mas fraco em contraste)
2. **Cards de produto na home**: fundo cinza/card escuro com texto cortado na parte inferior — nomes dos produtos difíceis de ler
3. **Newsletter popup**: visual genérico — botão "Inscrever" sem rounded-full, borda inconsistente
4. **Página /assinatura**: hero com fundo creme sem contraste visual — parece vazio e sem impacto
5. **Página /auth**: card de login com fundo escuro (brown-deep) — inputs sem contraste, visual pesado
6. **WhatsApp button**: verde (#25D366) conflita com a paleta warm — muito saturado
7. **Bottom nav (mobile)**: sobrepõe conteúdo da página
8. **Product cards**: imagens com tamanhos inconsistentes (cafeteira azul vs pacotes de café)
9. **Scroll-to-top button**: estilo inconsistente, posição conflita com WhatsApp button
10. **CafesPage hero**: fundo brown-deep pesado demais para uma seção de catálogo

---

## Plano de 50 Melhorias

### A. Fundação de Cores (5 itens)

**1. Refinar CSS variables** — `src/index.css`
- Aumentar contraste do `--card` (está muito próximo do `--background`)
- Ajustar `--muted-foreground` para melhor legibilidade

**2. Seção escura da home (CoffeeCarousel)** — `src/components/home/CoffeeCarousel.tsx`
- Mudar fundo de `bg-background` (que herda do body cream) para um fundo mais definido com `bg-cream-100` e borda top/bottom sutil

**3. Cards de produto na home** — tom de fundo dos cards muito próximo do body
- Adicionar `bg-white` aos cards em vez de `bg-card` para criar lift visual

**4. Auth page** — `src/pages/AuthPage.tsx`
- Mudar card de fundo escuro para `bg-white` com borda `border-cream-400`
- Inputs com melhor contraste

**5. Cafes page hero** — `src/pages/CafesPage.tsx`
- Reduzir peso visual do hero escuro — usar `bg-cream-200` com texto `text-brown-dark` em vez de brown-deep

### B. Tipografia e Hierarquia (5 itens)

**6. Títulos de seção** — consistir em label dourado + título serif + subtítulo body em todas as seções
**7. Preços**: garantir `font-mono` e alinhamento consistente em todos os cards
**8. Badge "Destaque"**: mudar para `bg-gold text-white` em vez de genérico
**9. Breadcrumbs**: texto muito pequeno/fraco — aumentar contraste
**10. Labels de formulário**: estilo inconsistente entre checkout e auth

### C. Botões (5 itens)

**11. Garantir rounded-full em TODOS os botões** — auditar button.tsx variants
**12. Botão "ADICIONAR AO CARRINHO"** nos cards: melhorar hover state com scale + shadow
**13. Botão Google login** na auth: borda e estilo mais refinado
**14. Botões de filtro** (CafesPage): garantir pill shape e estados active/hover com gold
**15. Botão "Conhecer Planos"** na assinatura: adicionar arrow icon e hover glow

### D. Cards e Containers (5 itens)

**16. Product cards**: uniformizar aspect-ratio das imagens (1:1 com object-cover)
**17. Cards de método de preparo** (BrewMethods): adicionar hover shadow e border gold/20
**18. Card de login**: rounded-2xl com shadow-xl mais pronunciado
**19. Cards de assinatura**: border mais visível no plano "Mais Popular"
**20. Card do carrinho lateral**: refinamento de spacing interno

### E. Seções da Home (8 itens)

**21. Hero**: gradiente mais suave — reduzir opacidade do overlay de 98% para 92%
**22. Stats section**: melhorar contraste dos números — usar `text-gold` mais vibrante
**23. Sensory notes banner**: animação marquee — garantir smooth loop sem gap
**24. Story section**: imagem com rounded-2xl e shadow
**25. Subscription banner**: adicionar ícone decorativo e melhorar spacing
**26. Testimonials**: stars preenchidas com `fill-gold` — verificar que estão corretas
**27. Brew methods**: ícones com circle bg mais contrastante
**28. Dynamic banners**: garantir rounded-xl e hover scale

### F. Navigation e Layout (6 itens)

**29. Header**: melhorar transição scroll — adicionar border-bottom gold/10 quando scrolled
**30. Announcement bar**: adicionar ícone de shipping truck antes do texto
**31. Footer**: melhorar hierarquia visual — seção newsletter mais destaque
**32. Bottom nav mobile**: glassmorphism com backdrop-blur mais forte
**33. Mobile menu**: adicionar ícones ao lado de cada link de nav
**34. Search overlay**: melhorar empty state com sugestões visuais

### G. Páginas Internas (6 itens)

**35. ProdutoPage**: melhorar galeria com thumbnails arredondados e border gold on selected
**36. CheckoutPage**: stepper visual mais refinado — circles com gold fill quando completo
**37. SobrePage**: timeline com linha vertical dourada mais proeminente
**38. BlogPage**: cards com hover lift e image zoom
**39. QuizPage**: botões de opção com animação de seleção
**40. ContaPage**: tabs com underline dourada animada

### H. Micro-interações e Polish (5 itens)

**41. Hover em links do footer**: adicionar underline animada (slide-in from left)
**42. Cart badge**: adicionar bounce animation ao incrementar
**43. Newsletter popup**: adicionar imagem decorativa de café e melhorar visual geral
**44. Toast notifications**: garantir styling consistente com rounded-xl e borda gold
**45. Loading skeletons**: cor mais próxima de cream-200 com shimmer gold mais sutil

### I. Acessibilidade e Mobile (5 itens)

**46. Focus states**: ring de gold em vez de azul default — verificar todos os inputs
**47. WhatsApp button**: cor harmonizada — usar `bg-gold` ou manter verde mas com border cream
**48. Scroll-to-top**: reposicionar para não conflitar com WhatsApp — usar posição left
**49. Mobile: cards de produto**: garantir touch targets mínimos de 44px
**50. Mobile: font sizes**: garantir min 14px para body text em todos os breakpoints

---

## Arquivos Impactados (~25 arquivos)

| Categoria | Arquivos |
|-----------|----------|
| Foundation | `src/index.css`, `tailwind.config.ts` |
| UI | `button.tsx`, `input.tsx`, `card.tsx`, `badge.tsx` |
| Layout | `Header.tsx`, `Footer.tsx`, `BottomNav.tsx`, `NewsletterPopup.tsx`, `WhatsAppButton.tsx`, `FreeShippingBar.tsx`, `NewsletterFooter.tsx` |
| Home | `HeroSection.tsx`, `CoffeeCarousel.tsx`, `StorySection.tsx`, `SubscriptionBanner.tsx`, `TestimonialsSection.tsx`, `BrewMethods.tsx`, `SensoryNotesBanner.tsx`, `StatsSection.tsx`, `DynamicBanners.tsx`, `CollectionsSection.tsx` |
| Pages | `AuthPage.tsx`, `CafesPage.tsx`, `ProdutoPage.tsx`, `CheckoutPage.tsx`, `AssinaturaPage.tsx`, `SobrePage.tsx`, `ContaPage.tsx` |
| Product | `StickyAddToCart.tsx`, `ProductReviews.tsx`, `ProductGallery.tsx` |
| Cart | `CartDrawer.tsx` |

## Prioridade de Execução
1. Foundation (CSS + Tailwind) — base para tudo
2. UI components globais (button, card, input)
3. Layout (header, footer, nav)
4. Home sections (maior impacto visual)
5. Internal pages
6. Micro-interactions e polish final

