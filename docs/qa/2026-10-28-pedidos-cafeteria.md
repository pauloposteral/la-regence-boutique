# Acesso ao cardápio da cafeteria

O cabeçalho desktop, menu mobile e rodapé da Boutique passam a oferecer **Pedir na cafeteria**, com navegação de documento para `https://pdv.posteral.com.br/la-regence`. O cardápio mantém sua própria sacola e encaminhamento por WhatsApp para confirmação pela equipe. Este acesso não cria pedidos automaticamente no Hub nem compartilha o checkout de cafés e assinaturas.

## Validação em 28/10/2026

Base: `8b88931268bb5bcbe82255ff8296de2aa5824042`.

- 229 testes existentes passaram, em 24 arquivos.
- TypeScript de aplicação e configuração Node passaram; build Vite passou.
- Chromium 134 e WebKit 27.2: 360, 390, 768, 1024 e 1440 px; destino, navegação de documento, foco pelo teclado, alvos de 44/46 px, ausência de sobreposição e de rolagem horizontal verificados. Nenhum erro de página observado. Requisição de saída interceptada no teste, sem envio de pedido.
- Revisão visual em celular e desktop; foco escuro e `gold-ink` preservam a identidade com legibilidade.
- `npm ci` e instalação limpa `bun install --frozen-lockfile` passaram. Locks reparados sem alterar versões existentes: 56 opcionais de plataforma adicionados, cinco mapas de opcionais completados e três URLs de aliases corrigidas. 546 pares canônicos nome/versão iguais entre os locks; `package.json` inalterado.
- `git diff --check` passou.

Limites: três erros `no-explicit-any` preexistentes em Header permanecem; lint global não está declarado aprovado. O aviso de chunk principal acima de 500 kB permanece. Navegadores rodaram em Linux; WebKit não substitui teste em um aparelho iOS real. Nenhuma emissão fiscal, pagamento ou mensagem foi executada.

## Publicação e reversão

Publicar o commit sincronizado pelo GitHub no projeto Lovable existente e verificar os links no domínio público. A reversão deve reverter este commit e republicar, preservando alterações posteriores. O cardápio da Vercel e a API/Hub não são alterados por esta entrega.
