

## Analysis of the Master Plan vs. Lovable Reality

The master plan is ambitious but contains a fundamental blocker: **Lovable does not support Next.js**. Projects here run on Vite + React (SPA). There is no SSR, no App Router, no API routes, no `next/image`. This cannot be changed.

However, the vast majority of the plan's *goals* are achievable within the current stack. Here's what we can realistically build, organized by priority.

---

### What We Cannot Do (and Alternatives)

| Plan Item | Why Not | Alternative |
|-----------|---------|-------------|
| Migrate to Next.js | Lovable only supports Vite + React | Stay on Vite, use edge functions for server logic |
| SSR/SSG/ISR | No server rendering | Prerendering via `react-helmet-async` + sitemap edge function (already exists) |
| `next/image` optimization | Next.js only | Supabase Storage image transforms (already using) |
| Middleware (auth, geo) | Next.js only | Client-side auth guards (already implemented) |
| API Routes | Next.js only | Supabase Edge Functions (already using) |
| Vercel deploy | Lovable hosting | Already deployed on Lovable |

---

### What We CAN Build — Prioritized Phases

**Phase A: Design Premium Overhaul (High Impact)**
- Dark/gold color palette (`#0A0A0A`, `#C9A96E`, `#F5F0E8`)
- Add Playfair Display + Cormorant Garamond fonts
- Redesign Homepage hero with video/parallax
- Redesign ProductCard with intensity bars and flavor tags
- Redesign checkout as multi-step flow
- Dark mode as default

**Phase B: Database Schema Evolution**
- Add missing columns to existing tables: `sku`, `cost`, `compare_at_price`, `roast_level`, `intensity`, `harvest_year` on `produtos`
- Add `order_status_history` table for timeline tracking
- Add `collections` table for editorial curation
- Enhance `avaliacoes` with `title`, `aroma_rating`, `flavor_rating`, `aftertaste_rating`
- Add `order_number` sequential generation function

**Phase C: Order Tracking System**
- "Meus Pedidos" page with status timeline
- Status history table + trigger on status change
- Custom statuses including "Torrando seu café"
- Email notifications on status change (via existing `send-email` edge function)
- Realtime updates via Supabase Realtime

**Phase D: Admin Enhancements**
- Dashboard KPIs with real revenue/orders data from Recharts
- Product form with rich editor (variants, images, SEO fields)
- Order management with status update + timeline
- Customer list with purchase history
- Review moderation (approve/respond)

**Phase E: Engagement Features**
- Loyalty tiers (Bronze → Platinum) based on points
- Flavor Profile per customer based on purchase history
- Enhanced review form with detailed coffee ratings
- Referral system (points for inviting friends)

**Phase F: Marketing & SEO**
- Enhanced Schema.org structured data (Product, Review, BreadcrumbList)
- Open Graph meta tags per product page
- Blog with SEO (already partially built)
- GA4 event tracking via `gtag` script
- Facebook Pixel integration

---

### Recommended Next Step

Since the loyalty program, comparison, deletion, and performance improvements are already done, the highest-impact next batch is **Phase A: Design Premium Overhaul** — transforming the generic Lovable look into the dark/gold luxury brand identity. This is purely frontend CSS/component work and can be done immediately.

Specifically, in the next implementation message:
1. Update CSS variables and Tailwind config for dark/gold palette
2. Add Playfair Display and Cormorant Garamond fonts
3. Restyle the Header, Footer, and ProductCard components
4. Set dark mode as default theme

This gives the biggest visual transformation with no backend changes needed.

