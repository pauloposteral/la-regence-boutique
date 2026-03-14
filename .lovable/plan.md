

## Plano: Replicar o Design de Referência

Analisei a imagem de referência e comparei com a implementação atual. Há diferenças significativas em vários componentes que precisam ser ajustados.

### Mudanças Necessárias

**1. Header — Layout Centralizado**
- Mover navegação (Cafés, Assinatura, Kits, Acessórios) para o lado ESQUERDO
- Centralizar o nome "La Régence" (sem logo image, apenas texto elegante)
- Manter ícones (busca, conta, carrinho) à DIREITA
- Arquivo: `Header.tsx`

**2. CoffeeCarousel — Cards de Produto Redesenhados**
- Grid de 4 colunas (não 5)
- Adicionar estrelas de avaliação abaixo do nome
- Adicionar tags de notas sensoriais com ícones coloridos (ex: 🍫 Chocolate · Citrus)
- Mostrar preço em destaque + parcelamento ("Em até 3x de R$ 11,88 s/ juros")
- Destaque verde para preço no Pix ("À vista R$ 53,90 no Pix")
- Botão "Escolher moagem" nos cards que têm variantes
- Arquivo: `CoffeeCarousel.tsx`

**3. NOVO — Banner de Notas Sensoriais (Marquee)**
- Faixa horizontal animada entre os cafés e a seção de assinatura
- Fundo escuro (espresso) com texto dourado
- "Notas sensoriais:" seguido de ícones + nomes: Chocolate, Frutado, Castanhas, Floral
- Scroll infinito horizontal (marquee CSS)
- Criar: `src/components/home/SensoryNotesBanner.tsx`

**4. SubscriptionBanner — Redesign com Imagem**
- Layout 2 colunas: texto à esquerda, imagem de café à direita
- Texto: "VELARP PET ASSINATURA/CLUB" → "Clube de Assinatura"
- Título: "Nunca fique sem o seu café preferido."
- Botão CTA dourado: "Quero fazer parte →"
- Imagem: usar `/images/torrefacao.jpeg` como placeholder
- Arquivo: `SubscriptionBanner.tsx`

**5. NOVO — Seção de Estatísticas**
- 4 colunas com números grandes e descrições
- "+7.000 dias torrando café", "+7.000 nossos clientes", "Torrefação própria", "+X mil clientes atendidos"
- Ícones decorativos (grão de café, etc.)
- Fundo claro (cream)
- Criar: `src/components/home/StatsSection.tsx`

**6. Footer — Logo Dourada no Fundo**
- Adicionar badge/selo circular dourado com logo "La Régence" centralizado na base do footer
- Reorganizar colunas para: Institucional, Atendimento, Políticas, Imprensa
- Arquivo: `Footer.tsx`

**7. Index.tsx — Reordenar Seções**
- Ordem: Hero → Banners → CoffeeCarousel → SensoryNotesBanner → SubscriptionBanner → StatsSection → Testimonials → Footer
- Arquivo: `Index.tsx`

### Arquivos Afetados
- `src/components/layout/Header.tsx` — layout centralizado
- `src/components/home/CoffeeCarousel.tsx` — cards redesenhados
- `src/components/home/SensoryNotesBanner.tsx` — NOVO
- `src/components/home/SubscriptionBanner.tsx` — redesign
- `src/components/home/StatsSection.tsx` — NOVO
- `src/components/layout/Footer.tsx` — logo badge
- `src/pages/Index.tsx` — reordenação
- `src/index.css` — animação marquee

