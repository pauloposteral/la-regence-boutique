# 30 melhorias que faltam para 100%

Estado verificado agora (08/09, 02h UTC): build sem erros; 13 cafés ativos (3 sem estoque, 13 sem código SKU); 19 imagens de produto; 18 variantes; 39 avaliações aprovadas; 3 textos no blog; 3 pedidos; 1 cupom ativo; 2 regras de frete grátis; 0 falhas de e-mail; **0 banners ativos**, **0 coleções ativas**, **0 inscritos confirmados na newsletter**; medição de audiência (Google/Meta) sem identificador configurado.

## Nota atual: 92/100

As Fases A, B e C já entraram. O que resta é acabamento comercial, conteúdo e operação.

## Bloqueadores de venda (P0)

1. Medição de audiência desligada — sem o identificador do Google Analytics e do Meta, nenhuma campanha é mensurável.
2. Duas seções da home aparecem vazias: banners e coleções não têm nenhum item ativo cadastrado.
3. Sem inscritos confirmados na newsletter — validar o fluxo de confirmação de ponta a ponta antes de divulgar.
4. Sem cupom de primeira compra visível no site (só existe o da newsletter).
5. Repor os 3 cafés esgotados ou desativá-los da vitrine para não gastar tráfego.
6. Teste real de pagamento (cartão e Pix) com valor baixo, incluindo recusa, para validar as páginas de sucesso e erro.
7. Conferir o e-mail de recibo e o remetente no domínio próprio (evita cair em spam).
8. Página de rastreio e página de erro de pagamento ainda dependem de publicação para ficarem no ar.

## Loja e conversão (P1)

9. Código de produto (SKU) ausente nos 13 cafés — necessário para etiquetas, conferência e integrações.
10. Mais fotos por café: hoje são ~1,5 fotos por produto; ideal 3 a 4 (grão, embalagem, xícara, detalhe).
11. Kits e presentes: nenhuma coleção montada — criar "Kit Descoberta", "Presente Executivo".
12. Recomendações "combina com" na página do café, além do cross-sell do carrinho.
13. Aviso de frete grátis dentro do carrinho mostrando quanto falta para atingir a regra.
14. Checkout em uma tela só com resumo fixo no celular (hoje o resumo fica longe do botão).
15. Compra rápida como visitante mais evidente, sem parecer que precisa criar conta.
16. Estoque baixo visível ("últimas 3 unidades") para criar urgência real.
17. Parcelamento e desconto Pix exibidos no card do produto, não só no checkout.

## Pós-venda e fidelidade (P1)

18. Página de fidelidade explicando os níveis e quantos pontos faltam — hoje só existe a barra na conta.
19. Cupom automático de aniversário e de retorno para quem não compra há 90 dias.
20. Programa de indicação (link do cliente, pontos para os dois).
21. Assinatura autoatendida: pausar, trocar moagem e pular o mês pela conta do cliente.
22. Pesquisa de satisfação após a entrega, com nota e comentário.

## Conteúdo e busca (P2)

23. Fotos e textos das três matérias do blog escritas por mim precisam de revisão sua e de imagens próprias.
24. Página por origem (Cerrado, Mogiana, Sul de Minas) para atrair busca orgânica.
25. Perguntas frequentes específicas por produto, marcadas para aparecer no Google.
26. Depoimentos reais com foto no lugar dos textos genéricos da home.
27. Registro do site no Google Search Console e envio do mapa do site.

## Operação e confiabilidade (P2)

28. Painel de estoque com alerta de mínimo e recompra sugerida.
29. Relatório mensal automático por e-mail: faturamento, ticket médio, cafés mais vendidos.
30. Testes automáticos dos fluxos críticos (carrinho, checkout, rastreio) — hoje existe só um teste de exemplo.

## Como eu executaria

Fase D: itens 1 a 8 (destravam venda e medição).
Fase E: itens 9 a 17 (conversão da loja).
Fase F: itens 18 a 22 (recompra).
Fase G: itens 23 a 30 (conteúdo, busca e operação).

### Detalhes técnicos

- Item 1: `VITE_GA_ID` e `VITE_META_PIXEL_ID` no ambiente; `src/lib/analytics.ts` já inicializa sozinho e respeita o consentimento de cookies.
- Itens 2/11: cadastrar registros em `banners` e `collections`/`collection_produtos` pelo admin; `DynamicBanners` e `CollectionsSection` já leem `ativo = true`.
- Item 9: preencher `produtos.sku` e exibir em `AdminProdutos` e na ficha técnica.
- Item 13: reaproveitar `regras_frete_gratis` via `calcular-frete` dentro do `CartDrawer`.
- Item 21: expandir `subscription-status`/`customer-portal` com ações de pausar/pular gravando em `assinaturas`/`assinatura_ciclos`.
- Item 29: nova função agendada reaproveitando `notify.ts` e o modelo de e-mail administrativo.

Confirme por qual fase começar, ou aprove para eu executar a Fase D.
