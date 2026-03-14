

# Gerar Imagens via Gemini 3 + Ajustar Cores Claras em Todo o Site

## Imagens a Gerar

Há 3 imagens estáticas usadas no site que precisam ser substituídas por imagens geradas via Gemini 3:

| Local | Arquivo atual | Prompt para geração |
|-------|---------------|-------------------|
| **StorySection** | `/images/torrefacao.jpeg` | "Bright airy photo of an artisanal coffee roastery interior, natural light streaming through windows, copper roaster, burlap sacks of green coffee beans, warm cream and white tones, editorial lifestyle photography, 4:5 portrait" |
| **SubscriptionBanner** | `/images/torrefacao.jpeg` | "Elegant flat lay of specialty coffee subscription box, kraft paper packaging, whole roasted beans scattered artistically, a white porcelain cup with latte art, soft natural daylight, cream background, luxury brand aesthetic, 4:3 landscape" |
| **Footer** | `/images/torrefacao.jpeg` | "Minimalist close-up of roasted specialty coffee beans on a light cream marble surface, soft natural light, shallow depth of field, warm golden tones, 4:3 landscape" |

O Hero já tem uma imagem gerada — mantê-la.

## Implementação

### 1. Atualizar edge function `generate-hero-image` → renomear para `generate-image`
- Aceitar `prompt` e `fileName` no body do request
- Reutilizar a mesma lógica de geração + upload ao bucket `public-assets`
- Adicionar ao `config.toml`: `[functions.generate-image] verify_jwt = false`

### 2. Gerar as 3 imagens via `lov-exec` (chamar a edge function 3x)
- Cada chamada usa um prompt diferente e um `fileName` diferente
- Salvar os URLs retornados

### 3. Atualizar componentes com as novas URLs
- `StorySection.tsx` — trocar `src="/images/torrefacao.jpeg"` pela URL do Storage
- `SubscriptionBanner.tsx` — trocar `src="/images/torrefacao.jpeg"` pela URL do Storage
- `Footer.tsx` — trocar `src="/images/torrefacao.jpeg"` pela URL do Storage

### 4. Ajuste de cores claras em todo o site
Revisar e garantir que **nenhum elemento escuro** permanece no tema claro:

| Arquivo | Ajuste |
|---------|--------|
| `HeroSection.tsx` | Bottom fade `from-white` → manter (já está correto) |
| `StorySection.tsx` | `bg-secondary/30` → já OK (creme sutil) |
| `SubscriptionBanner.tsx` | Remover overlay `from-black/20` da imagem |
| `Footer.tsx` | Já `bg-secondary/30` — OK |
| `Header.tsx` | Announcement bar `bg-cream-200` — OK |
| `index.css` | Verificar se `--background`, `--card`, `--secondary` estão em tons claros — já ajustados |

## Arquivos a criar/modificar

| Arquivo | Ação |
|---------|------|
| `supabase/functions/generate-hero-image/index.ts` | Refatorar para aceitar prompt customizado |
| `supabase/config.toml` | Adicionar config para nova function |
| `src/components/home/StorySection.tsx` | Nova URL de imagem |
| `src/components/home/SubscriptionBanner.tsx` | Nova URL de imagem, remover overlay escuro |
| `src/components/layout/Footer.tsx` | Nova URL de imagem |

