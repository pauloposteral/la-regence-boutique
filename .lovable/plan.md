

# Ajustar Legibilidade de Botões e Fontes

## Problemas identificados

### Hero Section
1. **`text-white/60`** em "sensorial única" — contraste muito baixo sobre fundo escuro
2. **`text-white/70`** no parágrafo descritivo — pouco legível
3. **`text-[11px]`** no subtítulo "Torrefação artesanal" — muito pequeno
4. **`text-sm`** nos botões com `tracking-[0.08em]` — texto pequeno para CTAs principais
5. **Botão outline** com `border-white/30` — borda quase invisível

### Outras seções
6. **StatsSection**: `text-cream-500` nos labels — contraste fraco sobre fundo escuro
7. **SensoryNotesBanner**: `text-muted-foreground` com `text-sm` — discreto demais
8. **BrewMethods**: `text-[11px]` nas descrições — muito pequeno

## Correções

| Arquivo | Mudança |
|---------|---------|
| `HeroSection.tsx` | `text-white/60` → `text-white/80`, `text-white/70` → `text-white/85`, `text-[11px]` → `text-xs`, botões `text-sm` → `text-base`, outline border `white/30` → `white/50` |
| `StatsSection.tsx` | `text-cream-500` → `text-cream-400` |
| `BrewMethods.tsx` | `text-[11px]` → `text-xs` |
| `SensoryNotesBanner.tsx` | `text-sm` → `text-base` |
| `SubscriptionBanner.tsx` | Botão `text-sm` → `text-base` |
| `StorySection.tsx` | `text-[11px]` subtítulos → `text-xs`, `text-[10px]` stats → `text-xs` |

Todas são alterações de classes CSS, sem mudanças de lógica.

