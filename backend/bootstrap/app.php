<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

// ✅ Import your custom CORS middleware
use App\Http\Middleware\Cors;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {

        // ✅ Register global CORS middleware
        $middleware->append(Cors::class);

        // ✅ Aliases
        $middleware->alias([
            'auth' => \Illuminate\Auth\Middleware\Authenticate::class,
            'auth:sanctum' => \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        ]);

        // Optional (Harmless, recommended by Laravel)
        $middleware->append(\Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })
    ->create();
