

# Por Que o Design Escuro Volta

## Causa Raiz

Em `src/App.tsx` (linha 74):
```tsx
<ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
```

O `defaultTheme` está configurado como `"dark"`. Isso aplica a classe `.dark` no `<html>`, que ativa todas as variáveis CSS escuras definidas em `index.css` (background marrom escuro, cards escuros, textos claros invertidos). **Não importa que os componentes usem `bg-cream-100`** — as variáveis CSS como `--foreground`, `--muted`, `--border` etc. são todas recalculadas para o tema escuro.

## Correção

### 1. Mudar `defaultTheme` para `"light"` em `App.tsx`
```tsx
<ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
```

### 2. Atualizar `theme-color` no `index.html`
Trocar `#2a1a0f` (marrom escuro) por `#FAF7F2` (creme claro) na meta tag.

### 3. (Opcional) Remover o bloco `.dark` do `index.css`
Se o site não precisa de modo escuro, remover as variáveis `.dark` evita que o problema volte. Se quiser manter suporte a dark mode para o futuro, pode deixar — basta que o default seja `"light"`.

## Arquivos a modificar

| Arquivo | Mudança |
|---------|---------|
| `src/App.tsx` | `defaultTheme="dark"` → `defaultTheme="light"` |
| `index.html` | `theme-color` de `#2a1a0f` para `#FAF7F2` |

Correção simples e direta — 2 linhas.

