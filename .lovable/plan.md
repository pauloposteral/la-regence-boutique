

## Plano: Hero Espetacular + 30 Melhorias Visuais (UI Polish)

### Imagens Enviadas
- **02.jpeg**: Logo La Régence (logomarca da marca, fundo dourado/creme)
- **PHOTO-3.jpeg**: Logo "La Régence Roasters" (foto da torrefacao/ambiente)

Ambas serao copiadas para `public/` e usadas no hero e em toda a loja.

---

### 1. Hero Section -- Redesign Completo

**Antes**: Placeholder com emoji de cafe e caixa vazia. Sem imagem real, sem logo.

**Depois**:
- Fullscreen hero com a foto da torrefacao (PHOTO-3.jpeg) como background com overlay escuro gradiente
- Logo real (02.jpeg) centralizada no topo do hero, com tamanho responsivo
- Texto principal sobre a imagem com tipografia Cormorant Garamond elegante
- Layout mobile-first: em mobile a logo fica centralizada acima do texto, botoes empilhados
- Em desktop: layout com logo + texto lado a esquerdo, imagem parcialmente visivel a direita
- Animacoes suaves de entrada com framer-motion (fade + parallax sutil)
- Cores integradas: dourado da logo (`gold`), espresso escuro como overlay, cream nos textos

### 2. Copiar imagens para o projeto
- `public/images/logo-laregence.jpeg` (02.jpeg)
- `public/images/torrefacao.jpeg` (PHOTO-3.jpeg)

### 3. 30 Melhorias Visuais (Polish Completo)

**Header (3 melhorias)**
1. Logo real no header substituindo texto "La Régence" por img + texto
2. Header com efeito de scroll (background mais opaco e sombra ao scroll)
3. Mobile menu com animacao slide-down mais suave e backdrop blur

**Home Sections (8 melhorias)**
4. CoffeeCarousel: hover com elevacao + sombra suave dourada, badge SCA com fundo dourado
5. CoffeeCarousel: imagem com aspect-ratio corrigido e object-fit cover
6. StorySection: substituir placeholder (emoji fabrica) pela foto real da torrefacao
7. StorySection: adicionar borda dourada decorativa lateral
8. BrewMethods: icones SVG ou Lucide em vez de emojis. Cards com hover glow dourado
9. TestimonialsSection: avatares com iniciais estilizadas (circulos coloridos)
10. SubscriptionBanner: adicionar textura de graos de fundo sutil
11. DynamicBanners: hover com overlay dourado sutil

**Produto Page (5 melhorias)**
12. Badge "Fora de estoque" vermelho para produtos sem estoque
13. Botao "Adicionar ao carrinho" desabilitado quando estoque = 0
14. Gallery com thumbnail navigation mais refinada
15. Ficha tecnica com icones coloridos e layout grid mais limpo
16. Preco com destaque visual maior (font-size, cor dourada no Pix)

**Carrinho/Checkout (4 melhorias)**
17. CartDrawer: borda superior dourada decorativa
18. CartDrawer: animacao de shake no botao quando item adicionado
19. Checkout stepper com icones preenchidos e linha de progresso animada
20. Resumo do pedido com visual card mais premium

**Footer (3 melhorias)**
21. Logo real no footer
22. Separador decorativo com linha dourada fina
23. Icones de pagamento com visual badges mais polidos

**Paginas internas (4 melhorias)**
24. AuthPage: logo real, background com textura sutil de graos
25. CafesPage: hero section com gradiente mais rico e textura
26. QuizPage: progress bar dourada, cards com borda dourada no hover
27. AssinaturaPage: badges dos planos com brilho/glow dourado

**Global Polish (3 melhorias)**
28. Scroll-to-top button suave (aparece apos scroll)
29. Skeleton loaders com shimmer dourado (em vez de cinza)
30. WhatsApp button: pulse animation sutil + tooltip "Fale conosco"

---

### Detalhes tecnicos

- As duas imagens serao salvas em `public/images/`
- O hero usara a foto `torrefacao.jpeg` como `background-image` com overlay CSS (nao tag img) para performance
- Todas as melhorias serao feitas dentro dos componentes existentes, sem criar novos arquivos exceto:
  - `src/components/layout/ScrollToTop.tsx` (novo, para o botao scroll-to-top)
- Mobile-first: todas as classes Tailwind iniciam com base mobile e escalam para `sm:`, `md:`, `lg:`
- O bug de `forwardRef` no CartDrawer sera corrigido (warning no console)
- Nenhuma alteracao de banco de dados necessaria

### Arquivos que serao editados
- `src/components/home/HeroSection.tsx` (redesign completo)
- `src/components/home/CoffeeCarousel.tsx`
- `src/components/home/StorySection.tsx`
- `src/components/home/BrewMethods.tsx`
- `src/components/home/TestimonialsSection.tsx`
- `src/components/home/SubscriptionBanner.tsx`
- `src/components/home/DynamicBanners.tsx`
- `src/components/layout/Header.tsx`
- `src/components/layout/Footer.tsx`
- `src/components/layout/WhatsAppButton.tsx`
- `src/components/layout/Layout.tsx` (add ScrollToTop)
- `src/components/cart/CartDrawer.tsx` (fix forwardRef + polish)
- `src/pages/AuthPage.tsx`
- `src/pages/CafesPage.tsx`
- `src/pages/ProdutoPage.tsx`
- `src/pages/CheckoutPage.tsx`
- `src/pages/QuizPage.tsx`
- `src/pages/AssinaturaPage.tsx`
- `src/components/layout/ScrollToTop.tsx` (novo)

