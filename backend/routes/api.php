<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\DependencyController;
use App\Http\Controllers\TaskUpdateController;

/*
|--------------------------------------------------------------------------
| AUTH ROUTES (Public)
|--------------------------------------------------------------------------
*/

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);


/*
|--------------------------------------------------------------------------
| PROTECTED ROUTES (Require Sanctum Token)
|--------------------------------------------------------------------------
*/

Route::middleware(['auth:sanctum'])->group(function () {

    // ✅ Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/profile', [AuthController::class, 'profile']);

    // ✅ CRUD modules
    Route::apiResource('users',        UserController::class);
    Route::apiResource('projects',     ProjectController::class);
    Route::apiResource('tasks',        TaskController::class);
    Route::apiResource('dependencies', DependencyController::class);
    Route::apiResource('task-updates', TaskUpdateController::class);
});


/*
|--------------------------------------------------------------------------
| TEST ROUTE (Public)
|--------------------------------------------------------------------------
*/

Route::get('/test', function () {
    return response()->json(['message' => 'API works ✅']);
});
