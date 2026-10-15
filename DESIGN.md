---
version: alpha
colors:
  primary: "hsl(38 42% 58%)"
  background: "hsl(37 33% 97%)"
  gold: "hsl(38 42% 58%)"
  gold-light: "hsl(39 50% 65%)"
  foreground: "hsl(30 28% 15%)"
  espresso: "hsl(30 35% 10%)"
typography:
  display:
    fontFamily: "Playfair Display, serif"
  body:
    fontFamily: "Outfit, sans-serif"
  accent:
    fontFamily: "Cormorant Garamond, serif"
rounded:
  button: "9999px"
  card: "12px"
  input: "8px"
---

## Overview
La Régence is a coffee boutique and roastery. Preserve its warm coffee/gold identity.
The existing runtime tokens in `src/index.css` and `tailwind.config.ts` are canonical.
This document records those tokens rather than introducing a rebrand. The older Lovable
knowledge mentions DM Sans, but the current runtime uses Outfit; the TV feature follows
the current runtime and does not change fonts.

## Colors
Cream backgrounds, dark brown text, warm gold accents. Use the existing `brown-deep`
token for cinematic surfaces. Video content owns the whole TV viewport; chrome is quiet.

## Typography
Display serif for brand/editorial headings; Outfit for instructions and controls.
Use actual localized Portuguese copy rather than decorative marketing filler.

## Layout
`/video`: viewport-owned landscape canvas, no store header/footer/scroll. Preserve the
video's proportions with contain by default; optional cover is explicitly labelled as cropping.
`/video/enviar`: document scrolling, upload column plus compact programming rows; stack on phones. Each row shows a 16:9
poster, title, source, duration and status. Editing and media preview open on demand;
reuse shared Collapsible. Keep search, filters and pagination above the list.
The signature is the full-screen moving product image, not a decorative dashboard.

## Elevation & Depth
Use existing borders and restrained gold accents. Reserve dark surfaces for video previews.

## Shapes
Pill buttons, rounded-xl cards, rounded-lg fields. Reuse shared accessible confirmation dialogs.

## Components
Shared `SEOHead`, Sonner notifications, AlertDialog, Supabase client and admin role RPC.
Native select is intentional for the two framing modes, accepting platform-owned popups.
Use native file picker plus drag/drop. Upload limits, progress, cancellation and errors are visible.

## Do's and Don'ts
Keep the playlist independent from commerce. Never expose upload controls to non-admins.
Autoplay starts muted. Native fullscreen requires a user gesture in standard browsers;
the canvas fills the viewport immediately and offers a remote-friendly fullscreen button.
Honor reduced motion for chrome; the requested TV videos themselves continue playing.
Existing app-wide UX/lint debt is outside this feature's scope.
