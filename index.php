<?php

use Kirby\Cms\App;
use Kirby\Exception\LogicException;

if (version_compare(App::version() ?? '0', '6.0.0-beta', '<')) {
    throw new LogicException('Kirby Minimap requires Kirby 6');
}

App::plugin('johannschopplich/minimap', []);
