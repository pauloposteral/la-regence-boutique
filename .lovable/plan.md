

## Plano: Finalizar todo o conteudo a 100% + melhorias "on top"

Baseado na auditoria completa do projeto, aqui estao os itens pendentes para levar o conteudo a 100%.

### 1. .gitignore — adicionar `.env` (ainda faltando)
O `.gitignore` nao tem `.env`. Adicionar.

### 2. Contato Page — salvar no banco
A `ContatoPage` tem form funcional mas nao salva no banco. Inserir na tabela `contact_messages` (criar via migration se necessario).

### 3. Sobre Page — enriquecer conteudo
Adicionar secoes faltantes:
- Secao "Processo": timeline horizontal visual (Selecao → Torra → Empacotamento → Entrega) com icones
- Secao "Produtores parceiros": 3 cards com foto Unsplash, nome, regiao, pais
- Secao CTA final: "Experimente a diferenca" com botao para /cafes

### 4. Conta Page — preferencias de cafe
Adicionar secao "Preferencias de cafe" na tab Perfil: select para torra preferida e moagem preferida, salvando em `profiles.preferred_roast` e `profiles.preferred_grind` (colunas ja existem da migration anterior).

### 5. NotFound page — design premium
Melhorar a 404 page com design alinhado ao brand: logo, ilustracao, CTA para home e cafes.

### 6. Footer — melhorias finais
- Trocar link "Responsabilidade" (aponta para /blog) para algo relevante ou remover
- Adicionar link para /faq no footer

### 7. SEO — meta tags faltantes
Adicionar `SEOHead` nas paginas que faltam: `SobrePage`, `ContaPage`, `InstitucionalPages` (cada uma).

### 8. Acessibilidade — aria-labels e skip-to-content
Verificar e adicionar aria-labels em botoes icone-only no Header (ja existem). Garantir `skip-to-content` funcional (ja existe no Layout). Foco: touch targets 44x44 no BottomNav mobile.

### Alteracoes por arquivo

| Arquivo | O que muda |
|---|---|
| `.gitignore` | Adicionar `.env` |
| Migration SQL | Criar tabela `contact_messages` |
| `src/pages/InstitucionalPages.tsx` | ContatoPage salva no Supabase |
| `src/pages/SobrePage.tsx` | +3 secoes (Processo, Produtores, CTA) + SEOHead |
| `src/pages/ContaPage.tsx` | Secao preferencias cafe na tab Perfil |
| `src/pages/NotFound.tsx` | Design premium com brand |
| `src/components/layout/Footer.tsx` | Corrigir link "Responsabilidade" |

### Detalhes tecnicos

- Tabela `contact_messages`: `id uuid pk`, `nome text`, `email text`, `assunto text`, `mensagem text`, `created_at timestamptz default now()`. RLS: insert para anon+authenticated, select so admin.
- Preferencias de cafe: `preferred_roast` e `preferred_grind` ja existem na tabela `profiles` (migration anterior). Apenas adicionar UI de select + save.
- Timeline do processo na SobrePage: 4 steps com icones Lucide (Search, Flame, Package, Truck) em layout horizontal/responsive.

