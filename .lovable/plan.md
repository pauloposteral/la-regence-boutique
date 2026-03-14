

# Migração de Cores: Warm Gold + Brown

## Resumo

Migrar toda a paleta do projeto de um tema dark/espresso para um tema claro e quente com fundo creme, dourado rico (#C4A265) como cor de destaque e marrom (#5C4A32) como contraste de texto. Inclui mudança de border-radius (todos os botões pill, cards rounded-lg/xl) sem alterar fontes, layout ou conteúdo.

## Arquivos a modificar

### 1. Fundação de cores

**`src/index.css`** — Substituir todas as CSS variables em `:root` e `.dark` com a nova paleta warm:
- Background claro: #FAF7F2 / card: #F5F0E8
- Foreground escuro: #2C2418 / muted: #9C8E7C
- Primary (gold): #C4A265 / accent: #C4A265
- Border: #E8E0D4
- Scrollbar, selection, focus-visible atualizados
- Remover as utilities `.text-gradient-gold`, `.bg-gradient-espresso` baseadas em espresso e substituir por variantes brown-deep
- Atualizar `.dark` para manter consistência (brown-deep como bg)

**`tailwind.config.ts`** — Substituir as escalas `gold`, `cream` e adicionar `brown` com as novas sub-cores:
- cream: 50-900 scale
- gold: light/DEFAULT/dark
- brown: light/DEFAULT/dark/deep

### 2. Componentes UI globais (shadcn)

**`src/components/ui/button.tsx`** — Mudar `rounded-md` para `rounded-full` no cva base. Primary: `bg-gold text-white hover:bg-gold-dark`. Outline: `border-brown text-brown hover:bg-brown hover:text-cream-100`.

**`src/components/ui/input.tsx`** — `bg-white border-cream-400 rounded-lg focus:border-gold focus:ring-gold/30`

**`src/components/ui/card.tsx`** — `rounded-lg` → `rounded-xl`

**`src/components/ui/badge.tsx`** — `rounded-full` (já é, confirmar variantes de cor)

### 3. Layout components (~8 files)

**`Header.tsx`** — Announcement bar: `bg-brown-deep text-cream-200`. Header bg: `bg-cream-100 border-cream-400`. Nav links: `text-brown hover:text-gold`. Logo: `text-brown-dark`. Icons: `text-brown hover:text-gold`. Mobile menu: `bg-cream-50`.

**`Footer.tsx`** — `bg-brown-deep`. Links: `text-cream-600 hover:text-gold`. Section titles: `text-cream-600/50`. Social icons: `border-cream-600/30 hover:border-gold`.

**`NewsletterFooter.tsx`** — Input: `bg-cream-50 border-cream-400 rounded-full`. Button: `bg-gold text-white rounded-full`.

**`BottomNav.tsx`** — `bg-cream-100 border-cream-400`. Active: `text-gold`. Inactive: `text-brown`.

**`FreeShippingBar.tsx`** — `bg-cream-200 border-cream-400`.

**`ScrollProgress.tsx`** — Bar color: `bg-gold` (already).

### 4. Home sections (~8 files)

**`HeroSection.tsx`** — Background: `bg-brown-deep`. Gradients via brown-deep. Tagline/italic: `text-gold-light`. Description: `text-cream-200/70`. CTAs: rounded-full with gold/cream border.

**`CoffeeCarousel.tsx`** — Cards: `rounded-xl`. Badges: `rounded-full`. Buttons: `rounded-full`. Intensity bars: `bg-brown` filled, `bg-cream-400` empty. Notes tags: `border-cream-500 text-brown-light rounded-full`.

**`CollectionsSection.tsx`** — Same card pattern. Buttons: `rounded-full`.

**`StorySection.tsx`** — Background: `bg-cream-200`. Text: `text-brown-dark`.

**`SubscriptionBanner.tsx`** — Background: `bg-cream-200`. CTA: `rounded-full`.

**`TestimonialsSection.tsx`** — Background: `bg-cream-100`. Cards: `rounded-xl border-cream-400`. Stars: `fill-gold text-gold`. Quote text: `text-brown`.

**`BrewMethods.tsx`** — Cards: `rounded-xl`. Text: `text-brown-dark`.

**`DynamicBanners.tsx`** — Cards: `rounded-xl`.

### 5. Cart & Checkout

**`CartDrawer.tsx`** — Background: `bg-cream-50`. Cards: `rounded-xl`. Buttons: `rounded-full`.

**`CheckoutPage.tsx`** — Inputs: nova estilização. Buttons: `rounded-full`. Cards: `rounded-xl`.

### 6. Pages (~6 files)

**`CafesPage.tsx`** — Product cards: `rounded-xl`. Filters: `rounded-full` badges. Buttons: `rounded-full`.

**`ProdutoPage.tsx`** — Cards: `rounded-xl`. Buttons: `rounded-full`.

**`AuthPage.tsx`** — Card: `rounded-xl`. Inputs: nova estilização. Buttons: `rounded-full`.

**`AssinaturaPage.tsx`** — Plan cards: `rounded-xl`. Popular card: `bg-brown-deep text-cream-100`. Buttons: `rounded-full`.

**`SobrePage.tsx`** — Background sections atualizados. Cards: `rounded-xl`.

**`BlogPage.tsx`**, **`QuizPage.tsx`**, **`ContaPage.tsx`** — Mesma migração de cores/radius.

### 7. Outros componentes

**`StickyAddToCart.tsx`**, **`ProductReviews.tsx`**, **`WhatsAppButton.tsx`**, **`PWAInstallPrompt.tsx`**, **`NewsletterPopup.tsx`** — Atualizar cores e border-radius.

## Regras mantidas
- Fontes inalteradas (Playfair Display, Cormorant Garamond, Outfit, JetBrains Mono)
- Layout/estrutura inalterados
- Conteúdo de texto inalterado

## Estimativa
~25-30 arquivos modificados. Todas as mudanças são cosméticas (cores + border-radius).

