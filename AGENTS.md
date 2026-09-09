# Kirby Minimap

Kirby CMS Panel plugin that renders a sidebar listing the fields and blocks of the current view's tab, and scrolls to the one that is clicked.

## Commands

```bash
composer csfix         # php-cs-fixer, lives in tools/phpcs/vendor/bin/, not vendor/bin/
pnpm run test:types    # typecheck with tsc, which does not reach .vue files
pnpm run lint          # ESLint
pnpm run build         # build the Panel bundle (index.js / index.css)
```

There is no PHP test suite in this repo.

## Search Hints

- `window.panel.plugin("johannschopplich/minimap"` – Panel registration
- `App::plugin(` – PHP plugin registration
- `k-panel-inside` – the component the sidebar mounts itself into
- `__minimap__/model-fields` – API route returning the model's normalized fields
- `FieldNormalizer` – resolves a custom field type to the standard type it extends
- `.k-panel-minimap` – the sidebar's own class prefix, in markup and stylesheet
