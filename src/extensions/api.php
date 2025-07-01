<?php

use Kirby\Cms\App;
use Kirby\Cms\Find;
use Kirby\Form\Form;

return [
    'routes' => fn (App $kirby) => [
        [
            'pattern' => '__minimap__/model-fields',
            'method' => 'GET',
            'action' => function () use ($kirby) {
                $id = $kirby->request()->query()->get('id');

                // Decode encoded Panel view path
                $model = match (true) {
                    // See `filePattern` in Kirby's `config/api/routes/files.php`
                    preg_match('!(account|pages\/[^\/]+|site|users\/[^\/]+)\/files\/(.+)!', $id, $matches) => Find::file(
                        match (true) {
                            str_starts_with($matches[1], 'pages/') => substr($matches[1], 6),
                            str_starts_with($matches[1], 'users/') => substr($matches[1], 6),
                            default => $matches[1]
                        },
                        $matches[2]
                    ),
                    str_starts_with($id, 'pages/') => Find::page(substr($id, 6)),
                    $id === 'site' => $kirby->site(),
                    default => null
                };

                $fields = $model->blueprint()->fields();
                $languageCode = $model->kirby()->languageCode();
                $content = $model->content($languageCode)->toArray();
                $form = new Form([
                    'fields' => $fields,
                    'values' => $content,
                    'model' => $model,
                    'strict' => true
                ]);

                $fields = $form->fields()->toArray();
                unset($fields['title'], $fields['slug']);

                foreach ($fields as $index => $props) {
                    unset($fields[$index]['value']);
                }

                return $fields;
            }
        ]
    ]
];
