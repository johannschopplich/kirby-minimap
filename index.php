<?php

use Kirby\Cms\App;

@include_once __DIR__ . '/vendor/autoload.php';

App::plugin('johannschopplich/minimap', [
    'api' => require __DIR__ . '/src/extensions/api.php'
]);
