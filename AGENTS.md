# Kirby Minimap

Kirby CMS Panel plugin that renders a sidebar listing the fields and blocks of the current view's tab, and scrolls to the one that is clicked.

## Commands

```bash
composer csfix         # lives in tools/phpcs/vendor/bin/, not vendor/bin/
pnpm run test --run
pnpm run test:types
pnpm run lint
pnpm run build         # after a change in src/panel/; index.js and index.css are committed
```

## Conventions

- The plugin ships without `vendor/`, so it takes no runtime Composer dependency.
- `src/panel/site.ts` feeds kirby.tools' Panel mocks.
