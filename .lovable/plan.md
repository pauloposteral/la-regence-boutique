
# Corrigir Fundo + Redesign World-Class da Home

## Problema no Screenshot
A imagem mostra que a home page tem:
- Hero com imagem de fundo exibindo a imagem raw (mão com café) sem tratamento adequado
- BrewMethods aparece logo após (seção com ícones em cards creme)
- Abaixo, uma imagem da torrefação aparece mas sem contexto — é a StorySection
- Todas as seções entre Hero e BrewMethods (DynamicBanners, CoffeeCarousel, Collections, SensoryNotes, Subscription, Stats, Testimonials) estão vazias/ocultas por falta de dados no banco

## Diagnóstico
1. **Seções vazias**: CoffeeCarousel mostra skeletons mas apenas quando `isLoading`. Quando termina o load e `items.length === 0`, mostra skeletons infinitamente (bom). DynamicBanners retorna `null`, CollectionsSection retorna `null`. Então a home fica: Hero → (nada) → skeletons → (nada) → (nada) → (nada) → (nada) → BrewMethods → StorySection → Footer
2. **Fundo**: as seções alternam entre `bg-background` (cream 97%), `bg-cream-100` (97%), `bg-cream-200` (94%) — diferenças quase imperceptíveis, criando monotonia visual

## Plano de Redesign — "Best Store Design"

### 1. Reordenar seções da Home para impacto máximo (Index.tsx)
Nova ordem lógica (sem dados vazios no meio):
```
Hero → SensoryNotesBanner → CoffeeCarousel → StorySection → BrewMethods → SubscriptionBanner → StatsSection → TestimonialsSection
```
Mover seções estáticas (que sempre renderizam) para cima, seções data-dependent (DynamicBanners, Collections) para depois.

### 2. Hero — Elevar ao nível Aesop/Blue Bottle (HeroSection.tsx)
- Aumentar overlay levemente para melhor legibilidade: `from-black/70 via-black/40 to-black/10`
- Usar preto neutro em vez de `brown-deep` (mais cinematográfico)
- Adicionar um sutil efeito de grain/texture overlay
- Reduzir `min-h` para `75vh` para que a próxima seção apareça no viewport

### 3. Criar ritmo visual com alternância de fundos
- Seções pares: `bg-white` (puro branco para lift máximo)
- Seções ímpares: `bg-cream-100` (creme sutil)
- Eliminar `bg-cream-200` das seções — reservar apenas para announcement bar e footer

### 4. BrewMethods — redesign minimalista (BrewMethods.tsx)
- Fundo: `bg-white`
- Cards: remover fundo e borda, usar apenas ícone + texto com spacing generoso
- Ícones: bordas mais finas, `border-cream-300`
- Layout horizontal mais respirado

### 5. StorySection — composição editorial (StorySection.tsx)
- Fundo: `bg-cream-50` (quase branco)
- Imagem com `rounded-3xl` e sombra sutil
- Linha vertical dourada mais sutil

### 6. CoffeeCarousel skeletons — mais elegantes (CoffeeCarousel.tsx)
- Fundo seção: `bg-white`
- Skeletons com bordas mais finas e shimmer mais sutil

### 7. SensoryNotesBanner — mais sutil (SensoryNotesBanner.tsx)
- Fundo: `bg-white border-y border-cream-300`
- Texto mais sutil: `text-brown-light`

### 8. SubscriptionBanner — fundo branco clean (SubscriptionBanner.tsx)
- Remover pattern overlay
- Fundo: `bg-white`

### 9. StatsSection — refinamento (StatsSection.tsx)
- Fundo: `bg-cream-50`
- Remover `border-y`

### 10. TestimonialsSection — lift (TestimonialsSection.tsx)
- Fundo: `bg-white`
- Cards com `bg-cream-50` para contraste sutil

### 11. Footer — mais clean (Footer.tsx)
- Fundo: `bg-cream-50 border-t border-cream-300`
- Separadores mais sutis

### 12. Melhorias CSS globais (index.css)
- Aumentar `--card` lightness para true white: `0 0% 100%`
- Ajustar `--border` para mais sutil: `36 26% 92%`

## Arquivos a modificar (~10)

| Arquivo | Mudança principal |
|---------|-------------------|
| `src/pages/Index.tsx` | Reordenar seções, remover LazySection para seções estáticas |
| `src/components/home/HeroSection.tsx` | Overlay preto neutro, reduzir height |
| `src/components/home/BrewMethods.tsx` | Fundo branco, cards sem borda |
| `src/components/home/StorySection.tsx` | Fundo cream-50, polish |
| `src/components/home/CoffeeCarousel.tsx` | Fundo branco |
| `src/components/home/SensoryNotesBanner.tsx` | Fundo branco, texto mais sutil |
| `src/components/home/SubscriptionBanner.tsx` | Fundo branco, remover pattern |
| `src/components/home/StatsSection.tsx` | Fundo cream-50, remover borders |
| `src/components/home/TestimonialsSection.tsx` | Fundo branco, cards cream-50 |
| `src/components/layout/Footer.tsx` | Fundo cream-50 |
| `src/index.css` | Card = white, border mais sutil |
