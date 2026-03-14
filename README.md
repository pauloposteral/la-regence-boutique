# La Régence Boutique ☕

Loja virtual premium de cafés especiais — experiência de compra que supera a Nespresso em funcionalidade e se inspira em Aesop/Le Labo em design.

## Stack

- **Frontend:** Vite + React 18 + TypeScript + Tailwind CSS + shadcn/ui + Framer Motion
- **Backend:** Supabase (Postgres, Auth, Storage, Edge Functions, Realtime)
- **Pagamentos:** Stripe (Checkout, Subscriptions, Webhooks)
- **Hosting:** Lovable

## Setup local

```sh
git clone <YOUR_GIT_URL>
cd la-regence
npm install
cp .env.example .env   # preencha com suas credenciais
npm run dev
```

## Variáveis de ambiente

Veja `.env.example` para a lista completa. Nunca commite o `.env`.

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run preview` | Preview do build |
| `npm run test` | Testes unitários |
| `npm run lint` | ESLint |

## Funcionalidades

- Catálogo de cafés especiais com filtros e busca
- Carrinho com validação de preços em tempo real
- Checkout multi-step com Stripe
- Programa de fidelidade com tiers (Bronze → Platinum)
- Sistema de assinaturas mensais
- Avaliações detalhadas (aroma, sabor, finalização)
- Painel administrativo completo
- Rastreio de pedidos com timeline visual
- PWA com suporte offline
- SEO com JSON-LD structured data
