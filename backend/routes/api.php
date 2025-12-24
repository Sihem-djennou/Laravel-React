<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TaskController;
use App\Http\Controllers\DependencyController;
use App\Http\Controllers\TaskUpdateController;
use App\Http\Controllers\PertController; //
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
       // ✅ AJOUTE ÇA
    Route::post('/projects/{projectId}/tasks', [TaskController::class, 'store']);
    Route::get('/projects/{projectId}/tasks', [TaskController::class, 'getProjectTasks']);
    Route::get('/projects/{project}/pert', [PertController::class, 'generate']);

});


/*
|
| TEST ROUTE (Public)
|--------------------------------------------------------------------------
*/

Route::get('/test', function () {
    return response()->json(['message' => 'API works ✅']);
});


/*
|--------------------------------------------------------------------------
| otp
|--------------------------------------------------------------------------
*/


Route::post('/send-otp', [AuthController::class, 'sendOTP']);
Route::post('/verify-otp', [AuthController::class, 'verifyOTP']);

// Routes pour les tâches
Route::prefix('projects/{projectId}')->group(function () {
    Route::get('/tasks', [TaskController::class, 'getProjectTasks']);
});

Route::apiResource('tasks', TaskController::class);
Route::post('/projects/{project}/tasks', [TaskController::class, 'store']);
// Route de débogage pour voir la structure de la table
Route::get('/debug/dependencies-structure', function() {
    $structure = \DB::select('SHOW CREATE TABLE dependencies');
    $dependencies = \DB::table('dependencies')->get();
    
    return response()->json([
        'table_structure' => $structure[0]->{'Create Table'},
        'total_dependencies' => $dependencies->count(),
        'dependencies' => $dependencies
    ]);
});
Route::middleware(['auth:sanctum'])->group(function () {
    // ... autres routes
    Route::apiResource('tasks', TaskController::class); // Cela inclut PUT /tasks/{id}
    // OU spécifiquement
    Route::put('/tasks/{task}', [TaskController::class, 'update']);
});
// Tasks routes
Route::get('/projects/{project}/tasks', [TaskController::class, 'index']);
Route::post('/projects/{project}/tasks', [TaskController::class, 'store']);
Route::delete('/tasks/{task}', [TaskController::class, 'destroy']);

// Dependencies routes
Route::get('/projects/{project}/dependencies', [DependencyController::class, 'index']);
Route::post('/projects/{project}/dependencies', [DependencyController::class, 'store']);
Route::delete('/dependencies/{dependency}', [DependencyController::class, 'destroy']);

// PERT route (déjà existante)
Route::get('/projects/{project}/pert', [PertController::class, 'generate']);