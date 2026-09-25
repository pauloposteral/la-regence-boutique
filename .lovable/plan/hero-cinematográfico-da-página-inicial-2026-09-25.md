# Hero cinematográfico da página inicial

## Resultado
Transformar somente a capa da página inicial em uma experiência cinematográfica premium, inspirada na arte atual e na identidade creme, dourado e marrom da La Régence. O vídeo será silencioso, elegante e contínuo, sem alterar os textos, botões ou demais páginas.

## Direção do filme
- Criar um filme horizontal exclusivo, com linguagem de publicidade de café de luxo: macro de grãos, torra artesanal, queda lenta dos grãos, vapor, moagem e extração dourada.
- Manter luz quente, contraste profundo e atmosfera tátil, com movimentos lentos de câmera e sem cortes agressivos.
- Reservar o lado esquerdo mais calmo e escuro para preservar a leitura do título e dos botões; concentrar os detalhes visuais no centro/direita.
- Produzir uma sequência em loop suave, sem texto, logotipos artificiais, embalagens inventadas ou áudio.
- Usar a imagem atual como pôster e fallback imediato, evitando tela vazia durante o carregamento.

## Comportamento na loja
- Reprodução automática, silenciosa, em loop e sem controles visíveis.
- Carregar o vídeo de forma progressiva, mantendo primeiro a imagem atual para proteger a velocidade percebida e a leitura inicial.
- Exibir a imagem estática em economia de dados, redução de movimento, navegadores incompatíveis ou falha de carregamento.
- Manter o enquadramento correto no celular e desktop, sem cortar o conteúdo principal nem deslocar os botões.
- Preservar integralmente o layout responsivo já corrigido, a navegação e os links existentes.

## Faixa de curiosidades
Substituir os emojis e nomes isolados por uma faixa editorial contínua, curta e surpreendente, por exemplo:
- “Café recém-torrado libera CO₂ por vários dias”
- “Aroma representa grande parte da percepção de sabor”
- “Altitude elevada costuma favorecer maior complexidade”
- “Torra clara revela mais a origem do grão”
- “Moer na hora preserva os compostos aromáticos”
- “Café especial começa acima de 80 pontos SCA”

A faixa manterá movimento suave, separadores dourados e repetição contínua sem saltos. Em redução de movimento, ficará estática e legível.

## Implementação técnica
- Gerar e inspecionar o clipe cinematográfico antes de integrá-lo.
- Hospedar o vídeo como ativo otimizado da aplicação e usar formatos/tamanhos adequados para web.
- Integrar o `<video>` como camada de fundo no hero, com `muted`, `autoPlay`, `loop`, `playsInline`, pôster e fallback.
- Ajustar contraste e sobreposição usando os tokens visuais existentes, sem mudar paleta ou tipografia.
- Atualizar a faixa abaixo do hero com conteúdo editorial acessível e sem lógica externa.

## Validação
- Conferir visualmente início, meio, fim e transição do loop.
- Testar em 320, 390, 768, 1024 e 1440 px.
- Confirmar título, CTAs, menu inferior e faixa sem sobreposição ou rolagem lateral.
- Testar fallback com vídeo bloqueado, redução de movimento e navegação anônima.
- Verificar carregamento, erros visuais e estado final da aplicação antes da entrega.

## Fora desta entrega
- Vídeos nas capas de Clube, Sobre e Blog.
- Áudio, botão de som ou reprodução manual.
- Uso da captura enviada como conteúdo do site; ela servirá apenas como contexto visual.
