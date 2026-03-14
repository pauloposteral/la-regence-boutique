

# Atualizar Informações da Empresa

Dados reais:
- **Razão Social**: Cafe La Regence Limitada
- **CNPJ**: 07.717.979/0001-62
- **Endereço**: Avenida Guanabara, 2919 - Stella Maris, Andradina - SP
- **Fundação**: 25/11/2005

## Decisão sobre o ano

A empresa foi fundada em **2005**, mas o site usa "desde 2006" em vários lugares. Vou manter **2005** como o ano correto de fundação.

## Arquivos a modificar

| Arquivo | Mudança |
|---------|---------|
| `src/components/layout/Footer.tsx` | CNPJ: `XX.XXX.XXX/0001-XX` → `07.717.979/0001-62` |
| `src/pages/InstitucionalPages.tsx` | CNPJ + razão social + endereço completo |
| `src/components/layout/Footer.tsx` | Endereço: adicionar rua completa |
| `index.html` | "desde 2006" → "desde 2005" nas meta tags |
| `src/components/SEOHead.tsx` | "desde 2006" → "desde 2005" |
| `src/components/home/HeroSection.tsx` | "Desde 2006" → "Desde 2005" |
| `src/components/home/StorySection.tsx` | "Desde 2006" → "Desde 2005", endereço |
| `src/components/layout/Header.tsx` | "desde 2006" → "desde 2005" |
| `src/pages/SobrePage.tsx` | Timeline: "2006" → "2005", endereço completo |
| `src/pages/Index.tsx` | JSON-LD: "desde 2006" → "desde 2005", endereço completo |
| `supabase/functions/send-email/index.ts` | "desde 2006" → "desde 2005" |

Total: 11 arquivos, substituições diretas de texto. Sem mudanças de lógica.

