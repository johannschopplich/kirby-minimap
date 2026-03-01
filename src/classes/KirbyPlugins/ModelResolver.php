<?php

declare(strict_types = 1);

namespace JohannSchopplich\KirbyPlugins;

use Kirby\Cms\App;
use Kirby\Cms\Find;
use Kirby\Cms\ModelWithContent;

final class ModelResolver
{
    /**
     * Resolves a model from a model ID.
     *
     * @param string $modelId The model identifier (e.g., `site`, `page-id`, `file-id`)
     * @return ModelWithContent|null The resolved model or null if not found
     */
    public static function resolveFromId(string $modelId): ModelWithContent|null
    {
        $kirby = App::instance();

        return $modelId === 'site'
            ? $kirby->site()
            : $kirby->page($modelId, drafts: true) ?? $kirby->file($modelId, drafts: true);
    }

    /**
     * Resolves a model from a Panel view path.
     *
     * @param string $path The Panel view path (e.g., `site`, `pages/xxx`, `pages/xxx/files/yyy`)
     * @return ModelWithContent|null The resolved model or null if not found
     */
    public static function resolveFromPath(string $path): ModelWithContent|null
    {
        $kirby = App::instance();

        return match (true) {
            // File patterns: account/files/*, pages/xxx/files/*, site/files/*, users/xxx/files/*
            preg_match('!(account|pages\/[^\/]+|site|users\/[^\/]+)\/files\/(.+)!', $path, $matches) => Find::file(
                match (true) {
                    str_starts_with($matches[1], 'pages/') => substr($matches[1], 6),
                    str_starts_with($matches[1], 'users/') => substr($matches[1], 6),
                    default => $matches[1]
                },
                $matches[2]
            ),
            // Page pattern: pages/xxx
            str_starts_with($path, 'pages/') => Find::page(substr($path, 6)),
            // Site
            $path === 'site' => $kirby->site(),
            default => null
        };
    }
}
