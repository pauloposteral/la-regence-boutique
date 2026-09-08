# Deixar a loja perfeita em todos os tamanhos de tela

Correção cirúrgica de responsividade: nada de redesenho, só ajustes de layout onde hoje algo vaza da tela, fica escondido ou pequeno demais para o dedo. Base: o print do iPhone enviado (440px de largura).

## O que está errado hoje

1. **Botões da capa vazam pela lateral** — "Explorar Cafés" e "Clube de Assinatura" ficam lado a lado mesmo no celular, então o segundo é cortado (visível no print).
2. **Faixa de notas de sabor coberta pelo menu inferior** — o rodapé fixo de navegação tapa parte do conteúdo da home.
3. **Botão de WhatsApp e "voltar ao topo" flutuando sobre o conteúdo** no celular, sem respeitar a área segura do iPhone.
4. **Tabelas do painel admin** (pedidos, assinaturas, comparação) estouram a largura no celular/tablet.
5. **Grades apertadas em telas médias** — formulários do admin com 3 a 5 colunas fixas; catálogo pulando de 1 para 5 colunas.
6. **Alvos de toque menores que 44px** em alguns ícones e seletores.
7. **Textos e títulos** com escala grande demais em telas de 320–380px.

## O que vai ser feito

### Capa (home)
- Botões empilhados e em largura total no celular, lado a lado a partir de tablet.
- Escala do título ajustada para telas estreitas; altura da capa usando altura real da janela do celular (sem corte pela barra do navegador).
- Indicador "Scroll" escondido no celular, onde não sobra espaço.

### Elementos fixos
- Reserva de espaço correta no fim da página para o menu inferior, incluindo a área segura do iPhone.
- WhatsApp e "voltar ao topo" reposicionados acima do menu inferior, sem sobrepor botões de compra.
- Botão fixo "adicionar ao carrinho" da página do produto alinhado ao mesmo espaçamento.

### Catálogo e listas
- Grade de cafés: 1 coluna no celular, 2 no tablet, 3 em telas médias, 4 em desktop grande (hoje pula direto para 5).
- Filtros e ordenação em largura total no celular.
- Cartões de produto com preço, notas e selo "Esgotado" sem quebrar em telas estreitas.

### Carrinho e checkout
- Revisão do rolar do carrinho com o botão de finalizar sempre visível em telas baixas.
- Checkout em coluna única no celular, com resumo do pedido no topo.

### Painel administrativo
- Tabelas com rolagem horizontal controlada e coluna principal fixa.
- Formulários passam de colunas fixas para 1 coluna no celular e 2–3 a partir de tablet.
- Cartões de indicadores em 2 colunas no celular.

### Regras gerais
- Todo botão e ícone clicável com no mínimo 44×44px.
- Trava contra rolagem lateral indesejada em qualquer página.
- Imagens e vídeos sempre limitados à largura da tela.

## Verificação

Cada tela principal (home, catálogo, produto, carrinho, checkout, conta, admin) conferida em 320px, 390px, 768px, 1024px e 1440px, com capturas antes/depois, e teste de abertura em janela anônima.

## Detalhes técnicos

- Ajustes só em classes Tailwind e utilitários de `src/index.css`; nenhuma mudança de lógica, dados ou rotas.
- `mb-bottom-nav` passa a somar `env(safe-area-inset-bottom)`; `pb-safe` aplicado nos elementos fixos.
- Uso de `dvh` para altura da capa com fallback `vh`.
- `overflow-x: clip` no `body` e revisão dos `min-w-[...]` das tabelas.
- Verificação com Playwright nos breakpoints citados + `tsgo --noEmit`.
