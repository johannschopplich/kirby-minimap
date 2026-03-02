<?php

use JohannSchopplich\KirbyTools\FieldResolver;
use JohannSchopplich\KirbyTools\ModelResolver;
use Kirby\Cms\App;

return [
    'routes' => fn (App $kirby) => [
        [
            'pattern' => '__minimap__/model-fields',
            'method' => 'GET',
            'action' => function () use ($kirby) {
                $id = $kirby->request()->query()->get('id');
                $model = ModelResolver::resolveFromPath($id);
                return FieldResolver::resolveModelFields($model);
            }
        ]
    ]
];
