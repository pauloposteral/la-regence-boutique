

# Gerar Nova Imagem Hero via Gemini 3

## Plano

Criar uma edge function que usa o modelo `google/gemini-3-pro-image-preview` (Nano banana pro — melhor qualidade) para gerar uma imagem cinematográfica de café artesanal, ideal para o hero da La Régence. A imagem será salva no Storage do projeto e referenciada no HeroSection.

### Prompt da imagem
"Professional cinematic photography of artisanal specialty coffee beans being freshly roasted in a copper drum roaster, warm golden light, steam rising, shallow depth of field, luxury coffee brand aesthetic, dark moody tones with warm highlights, 16:9 landscape composition, ultra high quality"

### Passos

1. **Criar edge function `generate-hero-image`** que:
   - Chama o Lovable AI Gateway com modelo `google/gemini-3-pro-image-preview`
   - Recebe a imagem base64
   - Faz upload para o Storage bucket `public-assets`
   - Retorna a URL pública

2. **Criar bucket `public-assets`** via migration (se não existir) para armazenar imagens geradas

3. **Atualizar `HeroSection.tsx`** para usar a nova imagem gerada (substituir `/images/torrefacao.jpeg` pela URL do Storage)

### Arquivos a criar/modificar

| Arquivo | Ação |
|---------|------|
| `supabase/functions/generate-hero-image/index.ts` | Criar — edge function para gerar e salvar imagem |
| `src/components/home/HeroSection.tsx` | Atualizar URL da imagem |

### Alternativa mais simples
Em vez de criar infraestrutura de Storage, posso gerar a imagem via edge function, fazer download do base64, converter para arquivo e colocá-lo em `public/images/hero-coffee.png` diretamente no repositório. Isso é mais simples e evita dependência de Storage para um asset estático.

**Abordagem recomendada**: Gerar via edge function → salvar base64 como arquivo em `public/images/` → atualizar HeroSection.

