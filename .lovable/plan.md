
# La Régence — Loja Virtual de Cafés Especiais

Loja virtual premium para a marca La Régence, cafeteria e torrefação de cafés especiais desde 2006 em Andradina-SP. Design imersivo inspirado na Jouse, com foco em storytelling e experiência sensorial.

---

## Fase 1 — Fundação: Design System e Layout Base
- **Design system premium**: Paleta de cores elegante (tons terrosos, dourado, creme), tipografia sofisticada, componentes customizados
- **Layout base**: Header com navegação (logo, busca, conta, carrinho), Footer completo com links, redes sociais e selos
- **Responsividade mobile-first**: Todos os breakpoints (375px, 768px, 1024px, 1440px)
- **Botão flutuante WhatsApp**: Contato direto com mensagem pré-formatada para (18) 99654-0883

## Fase 2 — Homepage Imersiva
- **Hero section**: Produto destaque em tela cheia com imagem e CTA
- **Seção "Nossos Cafés"**: Carrossel de cards com nome, nota sensorial principal e pontuação SCA
- **Storytelling "A Experiência La Régence"**: História da marca desde 2006, torrefação artesanal
- **Seção de depoimentos**: Avaliações de clientes
- **Métodos de preparo**: Ícones elegantes (V60, Aeropress, Italiana, Coador, French Press)
- **Banner assinatura/clube do café**
- **Feed Instagram** integrado

## Fase 3 — Backend Supabase: Banco de Dados e Auth
- **Habilitar Supabase Cloud**
- **Tabelas**: produtos (com campos específicos: notas sensoriais, SCA score, variedade, processo, origem, altitude, safra), categorias, variantes (moagem, peso), imagens, avaliações, pedidos, itens de pedido, endereços, assinaturas, cupons, blog posts
- **Autenticação**: Email/senha, login social (Google), recuperação de senha
- **RLS (Row Level Security)**: Políticas de segurança em todas as tabelas
- **Roles**: Tabela de roles para admin/cliente

## Fase 4 — Catálogo de Produtos
- **Página de listagem** com grid responsivo de cards premium (foto, nome, notas sensoriais em badges, preço, selo SCA)
- **Filtros inteligentes**: Notas sensoriais, pontuação SCA, tipo de torra, moagem, origem, faixa de preço
- **Ordenação**: Mais vendidos, novidades, preço, pontuação SCA
- **Quick view**: Visualização rápida ao clicar no card
- **Busca inteligente**: Autocomplete com sugestões de produtos, categorias e termos

## Fase 5 — Página de Produto Premium
- **Design como mini landing page** (inspiração Jouse)
- **Galeria de imagens** com zoom em alta resolução
- **Roda de sabores visual** (flavor wheel) com notas sensoriais
- **Ficha técnica elegante**: SCA, variedade, processo, origem, altitude, safra
- **Descrição sensorial narrativa**: Corpo, acidez, doçura, retrogosto
- **Seletor de variantes**: Moagem e peso com preços dinâmicos
- **Preço com destaque para desconto Pix** (10% off) e parcelamento
- **Sugestão de método de preparo**
- **Reviews/avaliações** com estrelas
- **"Você também vai gostar"**: Produtos relacionados

## Fase 6 — Carrinho e Checkout
- **Carrinho drawer lateral**: Adiciona sem redirecionar, editar quantidades, foto miniatura
- **Cálculo de frete por CEP** inline (integração ViaCEP para autocomplete de endereço)
- **Barra de progresso "Frete grátis a partir de R$ X"**
- **Cupom de desconto**
- **Upsell**: Sugestão de produto complementar
- **Checkout em etapas (stepper)**: Identificação → Endereço → Envio → Pagamento → Confirmação
- **Compra como visitante** ou logado
- **Integração Stripe**: Cartão de crédito (parcelamento), com edge function segura
- **Opção de presente**: Mensagem personalizada, entrega em outro endereço

## Fase 7 — Área do Cliente
- **Painel "Minha Conta"**: Dados pessoais, endereços salvos
- **Histórico de pedidos** com status e timeline visual
- **Lista de desejos/favoritos**
- **Recompra fácil** a partir do histórico
- **Gerenciamento de assinatura**

## Fase 8 — Clube de Assinatura
- **Página dedicada** explicando benefícios do clube
- **Planos**: Mensal, trimestral, semestral com descontos progressivos
- **Opções**: Café fixo ou surpresa (curadoria La Régence)
- **Preferências** de moagem e método de preparo
- **Gestão**: Pausar, cancelar, trocar café, alterar frequência
- **Stripe Subscriptions** para cobrança recorrente

## Fase 9 — Painel Administrativo
- **Dashboard**: Vendas do dia/semana/mês, produtos mais vendidos, ticket médio (com Recharts)
- **CRUD de produtos**: Todos os campos específicos de café + upload de imagens
- **Gestão de pedidos**: Visualizar, atualizar status
- **Gestão de estoque**: Alertas de estoque baixo
- **Gestão de cupons, banners, categorias**
- **Gestão de assinaturas e clientes**
- **Gestão de blog/conteúdo**

## Fase 10 — Conteúdo e Páginas Complementares
- **Blog/Conteúdo Educativo**: Artigos sobre métodos de preparo, guias sensoriais, receitas
- **Página "Sobre Nós"**: Storytelling com timeline visual da marca
- **Quiz "Descubra Seu Café"**: 4-5 perguntas interativas com recomendação personalizada
- **Páginas institucionais**: Política de privacidade (LGPD), termos de uso, frete, trocas, fale conosco
- **Página de rastreamento**: Busca por número do pedido

## Fase 11 — Notificações e Polimento
- **Emails transacionais** via edge functions: Confirmação de pedido, atualização de status, boas-vindas, carrinho abandonado
- **SEO**: Meta tags dinâmicas, Schema.org para produtos, sitemap, URLs amigáveis
- **Performance**: Lazy loading de imagens, otimizações de carregamento
- **Acessibilidade**: Navegação por teclado, alt texts, contraste WCAG AA
