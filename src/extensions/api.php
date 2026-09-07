<?php

use JohannSchopplich\KirbyTools\FieldNormalizer;
use JohannSchopplich\KirbyTools\FieldResolver;
use JohannSchopplich\KirbyTools\ModelResolver;
use Kirby\Cms\App;
use Kirby\Exception\NotFoundException;

return [
    'routes' => fn (App $kirby) => [
        [
            'pattern' => '__minimap__/model-fields',
            'method' => 'GET',
            'action' => function () use ($kirby) {
                $id = $kirby->request()->query()->get('id');
                $model = ModelResolver::resolveFromPath($id);

                if ($model === null) {
                    throw new NotFoundException(message: 'No model found for id: ' . $id);
                }

                return FieldNormalizer::normalizeFields(FieldResolver::resolveModelFields($model));
            }
        ]
    ]
];
