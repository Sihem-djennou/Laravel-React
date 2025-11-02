<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\DependencyController;
use App\Http\Controllers\TaskUpdateController;

Route::apiResource('users', UserController::class);
Route::apiResource('projects', ProjectController::class);
Route::apiResource('tasks', TaskController::class);
Route::apiResource('dependencies', DependencyController::class);
Route::apiResource('task-updates', TaskUpdateController::class);

Route::get('/test', function () {
    return response()->json('API works');
});
