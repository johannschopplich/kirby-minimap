[![Kirby Minimap](https://kirby.tools/social-card/minimap.png)](https://kirby.tools/minimap)

# Kirby Minimap

Kirby Minimap is a plugin for [Kirby CMS](https://getkirby.com) that adds a sidebar to the site view and every page view, listing the fields and blocks of the current Panel tab. Click one and the Panel scrolls to it. There is no license to activate and nothing to set up.

## When to Use

| I want to…                                           | Use                                                                 |
| ---------------------------------------------------- | ------------------------------------------------------------------- |
| Find a field or a block in a long site or page form  | Its entry in the minimap                                            |
| Split a long form into groups of fields              | Kirby's blueprint tabs – the minimap lists the current tab's fields |
| Navigate a file or user view                         | Not covered – the minimap sits beside the site view and page views  |
| Reach a field inside a `structure` or `object` field | Not covered – the outer field is a single entry                     |

## Features

- 🖱️ **Jump to a Field or Block**: Click an entry and the Panel scrolls to it.
- 🎬 **Blocks by Icon and First Words**: Every block listed with its icon and a short label.
- 🫴 **See Where You Are**: Fields and blocks in view are marked as you scroll, and required fields carry a star.

## Requirements

- Kirby 6

## Installation

### Composer (Recommended)

```bash
composer require johannschopplich/kirby-minimap
```

### Manual Installation

Download a [release](https://github.com/johannschopplich/kirby-minimap/releases) and extract it to `/site/plugins/kirby-minimap`.

## Documentation

For installation and usage, see the [Kirby Minimap documentation](https://kirby.tools/docs/minimap).

## License

[MIT](./LICENSE) License © 2025-PRESENT [Johann Schopplich](https://github.com/johannschopplich)
