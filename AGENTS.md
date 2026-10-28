# Kirby Minimap

Kirby CMS Panel plugin that renders a sidebar listing the fields and blocks of the current view's tab, and scrolls to the one that is clicked.

## Commands

```bash
composer csfix         # php-cs-fixer, lives in tools/phpcs/vendor/bin/, not vendor/bin/
pnpm run test --run    # Vitest
pnpm run test:types    # typecheck with vue-tsc
pnpm run lint          # ESLint
pnpm run build         # build the Panel bundle (index.js / index.css)
```

## Conventions

- The plugin ships without `vendor/`, so it takes no runtime Composer dependency.
- `src/panel/site.ts` is kirby.tools' entry: renaming or removing an export breaks the site.

## Search Hints

- `k-panel-inside` – the component the sidebar mounts itself into
- `.k-panel-minimap` – the sidebar's own class prefix, in markup and stylesheet
