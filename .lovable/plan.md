

## Plano: Próxima rodada de melhorias — Segurança, Carrinho inteligente, Image fallbacks e Perfil

Baseado na auditoria e no guia fornecido, vou implementar o próximo bloco de melhorias focando em itens ainda pendentes de alto impacto.

### O que será feito (8 melhorias)

1. **.gitignore — adicionar `.env`** (Sessão 1 do guia)
   - O `.env` não está no `.gitignore`; adicionar para evitar commits acidentais

2. **Cleanup de lockfiles** — remover `bun.lockb` (duplicado de `bun.lock`)

3. **Criar `.env.example`** com variáveis necessárias (sem valores reais)

4. **README.md atualizado** com informações reais do projeto La Régence

5. **Image fallback global** — criar componente ou handler `onError` para imagens de produto que quebram, mostrando placeholder

6. **Carrinho: validar preços atualizados** — ao abrir o cart drawer, revalidar preços dos itens contra o banco, alertando se mudaram

7. **Produto inexistente → 404** — ProdutoPage já trata `error || !produto` com uma mensagem, mas pode melhorar com `Navigate` para NotFound após um delay

8. **Salvar endereço do checkout no perfil** — após pedido confirmado, salvar o endereço na tabela `enderecos` se o usuário estiver logado

### Alterações por arquivo

| Arquivo | Alteração |
|---|---|
| `.gitignore` | Adicionar `.env` |
| `.env.example` | Criar com variáveis template |
| `README.md` | Reescrever com info real do projeto |
| `bun.lockb` | Deletar (manter apenas `bun.lock`) |
| `src/contexts/CartContext.tsx` | Adicionar validação de preço ao abrir carrinho |
| `src/pages/CheckoutPage.tsx` | Salvar endereço na tabela `enderecos` após pedido |
| `src/components/ui/optimized-image.tsx` | Adicionar `onError` fallback |

### Detalhes técnicos

- A validação de preço no carrinho fará um `select` em `produtos` + `variantes` ao abrir o drawer, comparando com os preços armazenados em localStorage. Se divergir, atualiza silenciosamente e mostra toast.
- O fallback de imagem usará o placeholder SVG existente em `public/placeholder.svg`.
- O salvamento de endereço no checkout fará um `upsert` na tabela `enderecos` com o `user_id` logado, marcando como principal se for o primeiro.

