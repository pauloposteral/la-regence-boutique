

# 50 Melhorias + Admin Dashboard Completo + Favicon/Logo SVG

## 1. Favicon & Logo SVG

- Copy the uploaded logo (`user-uploads://02-2.jpeg`) to `public/images/logo-laregence-original.jpeg`
- Generate an SVG version with transparent background using the logo as reference — create a simplified SVG emblem (gold cup + "LR" monogram in circle with ornamental frame)
- Save as `public/favicon.svg` and `public/images/logo-laregence.svg`
- Update `index.html`: `<link rel="icon" type="image/svg+xml" href="/favicon.svg">`
- Update `manifest.json` with the new icon references

---

## 2. Admin Dashboard — Overhaul Completo

### Dashboard Principal (AdminDashboard.tsx) — Reescrever completamente
- **8 KPI cards** (em vez de 4): Receita, Pedidos, Ticket Médio, Assinaturas Ativas, Produtos Ativos, Estoque Baixo, Novos Clientes, Taxa de Conversão
- **Gráfico de Receita vs Pedidos** combinado (BarChart + LineChart overlay)
- **Gráfico de Pizza** de status dos pedidos (pendente, enviado, entregue, cancelado)
- **Resumo rápido de estoque**: tabela com os 10 produtos com estoque mais baixo com barra visual de progresso
- **Últimos 5 pedidos** em card compacto com link para detalhes
- **Receita mensal recorrente** (assinaturas)
- **Ações rápidas**: botões para criar produto, ver pedidos pendentes, exportar relatório

### AdminProdutos.tsx — Melhorias
- Adicionar filtros por: status (ativo/inativo), estoque baixo, tipo de torra, destaque
- Adicionar ordenação por: nome, preço, estoque, data de criação
- Bulk actions: ativar/desativar múltiplos produtos de uma vez
- Indicador visual de estoque (barra de progresso colorida: verde/amarelo/vermelho)
- Preview de imagem maior no hover
- Validação de formulário (campos obrigatórios: nome, preço)

### AdminPedidos.tsx — Melhorias
- Corrigir cores de status para tema claro (atualmente usando `bg-yellow-900/30` — tema escuro)
- Adicionar filtro por data (de/até)
- Adicionar resumo no topo: total pedidos, receita, ticket médio do filtro atual
- Botão de impressão do pedido
- Nota/observação interna por pedido

### AdminClientes.tsx — Melhorias
- Exibir e-mail do cliente (buscar da tabela de pedidos ou auth)
- Filtro por clientes com/sem pedidos
- Exportar CSV de clientes
- Total de pontos de fidelidade por cliente

### AdminAssinaturas.tsx — Melhorias
- Ações: pausar, cancelar, reativar assinatura
- Filtro por status
- Receita mensal total de assinaturas no topo

### AdminBanners.tsx — Melhorias
- Drag-and-drop para reordenar (ou botões ↑↓)
- Preview da imagem no card maior
- Upload de imagem direto (em vez de URL manual)

### AdminBlog.tsx — Melhorias
- Preview do post em markdown
- Upload de imagem de capa
- Contador de caracteres no conteúdo

### AdminLayout.tsx — Melhorias
- Badge de contagem em "Pedidos" (pedidos pendentes)
- Breadcrumb na header
- Indicador de hora/data na header
- Responsividade melhorada do sidebar

---

## 3. 50 Melhorias no Projeto (Organizadas por Área)

### Frontend — Home & Navegação (1-10)
1. **Favicon SVG** com fundo transparente baseado na logo
2. **Loading skeleton** melhorado no HeroSection (shimmer)
3. **Animação de entrada** nas seções com Intersection Observer (já tem LazySection, melhorar transições)
4. **Breadcrumbs** em todas as páginas internas (Sobre, Blog, Contato, etc.)
5. **"Voltar ao topo"** botão flutuante com animação suave
6. **Meta tags OG** dinâmicas por página de produto
7. **Preload** das fontes críticas (Playfair Display) no index.html
8. **Skip to content** link para acessibilidade
9. **Focus visible** styles aprimorados para navegação por teclado
10. **404 page** com sugestões de produtos e busca

### Frontend — Produto & Catálogo (11-20)
11. **Zoom na imagem** do produto com lupa no hover
12. **Galeria de produto** com thumbnails navegáveis
13. **Tabela de informações** do café (origem, altitude, processo) formatada em tabs
14. **"Avise-me quando disponível"** para produtos sem estoque
15. **Quantidade incremental** com botões +/- estilizados
16. **Compartilhar via WhatsApp** com mensagem formatada e imagem
17. **Filtro mobile** em sheet/drawer (em vez de accordion inline)
18. **Skeleton loading** individual por card no catálogo
19. **Badge "Novo"** em produtos criados nos últimos 15 dias
20. **Preço por kg** calculado automaticamente exibido no card

### Frontend — Carrinho & Checkout (21-28)
21. **Animação ao adicionar** ao carrinho (ícone pulsa)
22. **Resumo flutuante** no checkout (sticky sidebar)
23. **Validação em tempo real** dos campos de checkout
24. **Máscara de CPF** e telefone nos inputs
25. **Auto-preenchimento** de endereço pelo CEP (ViaCEP)
26. **Cálculo de frete** visual com opções
27. **Progresso do checkout** em steps visuais (já existe, aprimorar)
28. **Confirmação de saída** se houver itens no carrinho

### Backend & Dados (29-36)
29. **Dashboard KPIs expandidos** (8 cards em vez de 4)
30. **Gráfico de pizza** de status de pedidos
31. **Relatório de estoque** com alertas visuais
32. **Bulk actions** para produtos (ativar/desativar em massa)
33. **Filtros avançados** no admin de produtos
34. **Ordenação** em todas as tabelas do admin
35. **Exportar CSV** em clientes e produtos
36. **Upload de imagens** direto nos banners e categorias

### UX & Performance (37-44)
37. **Toast notifications** melhoradas com ações contextuais
38. **Empty states** em todas as páginas (favoritos, carrinho, busca)
39. **Infinite scroll** ou "carregar mais" com animação
40. **Debounce** na busca do admin (já tem no catálogo)
41. **Optimistic updates** nos favoritos
42. **Error boundaries** mais granulares por seção
43. **Retry automático** com feedback visual em falhas de rede
44. **Preservar scroll** ao voltar do detalhe do produto

### Admin & Gestão (45-50)
45. **Pedidos pendentes badge** no menu lateral do admin
46. **Ações rápidas** no dashboard (criar produto, ver pedidos)
47. **Notas internas** nos pedidos
48. **Resumo financeiro** por período no dashboard
49. **Cores de status** corrigidas para tema claro em AdminPedidos
50. **Data/hora** e breadcrumb na header do admin

---

## Arquivos a Criar/Modificar

| Arquivo | Ação |
|---------|------|
| `public/favicon.svg` | Criar — SVG do logo com fundo transparente |
| `public/images/logo-laregence.svg` | Criar — versão SVG completa |
| `public/images/logo-laregence-original.jpeg` | Copiar upload |
| `index.html` | Atualizar favicon ref + preload fonts |
| `public/manifest.json` | Atualizar ícones