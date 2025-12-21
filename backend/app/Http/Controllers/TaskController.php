<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\Project;
use Illuminate\Http\Request;
  use App\Models\TaskUpdate;
     use App\Models\Dependency;

use Illuminate\Support\Facades\Auth; // pour récupérer l'utilisateur connecté
class TaskController extends Controller
{
 public function store(Request $request, $projectId)
{
    // Validation
    $request->validate([
        'name' => 'required|string',
        'description' => 'nullable|string',
        'optimistic_time' => 'nullable|numeric',
        'most_likely_time' => 'nullable|numeric',
        'pessimistic_time' => 'nullable|numeric',
        'expected_time' => 'nullable|numeric',
        'dependencies' => 'nullable|array'
    ]);

    // 1️⃣ Créer la tâche
    $task = Task::create([
        'project_id' => $projectId,
        'name' => $request->name,
        'description' => $request->description,
        'optimistic_time' => $request->optimistic_time,
        'most_likely_time' => $request->most_likely_time,
        'pessimistic_time' => $request->pessimistic_time,
        'expected_time' => $request->expected_time,
      
    ]);

    // 2️⃣ DEBUG: Log de début
    \Log::info('=== DÉBUT CRÉATION TÂCHE ===');
    \Log::info('Tâche créée:', ['id' => $task->id, 'name' => $task->name]);
    \Log::info('Dépendances reçues:', $request->dependencies ?? []);

    // 3️⃣ Créer les dépendances
    $createdDependencies = [];
    if ($request->has('dependencies') && is_array($request->dependencies)) {
        foreach ($request->dependencies as $depName) {
            $depName = trim($depName);
            if (!$depName) {
                \Log::warning('Nom de dépendance vide, ignoré');
                continue;
            }

            \Log::info("Recherche prédécesseur: '{$depName}'");

            // Cherche la tâche prédécesseur dans le même projet
            $predTask = Task::where('project_id', $projectId)
                            ->where('name', $depName)
                            ->first();

            if ($predTask) {
                \Log::info("Prédécesseur trouvé:", [
                    'id' => $predTask->id,
                    'name' => $predTask->name
                ]);

                // Éviter les dépendances circulaires
                if ($predTask->id === $task->id) {
                    \Log::warning("Dépendance circulaire détectée: tâche {$task->id} ne peut dépendre d'elle-même");
                    continue;
                }

                // DEBUG: Afficher ce qu'on va insérer
                \Log::info("Tentative création dépendance:", [
                    'project_id' => $projectId,
                    'predecessor_task_id' => $predTask->id,
                    'successor_task_id' => $task->id
                ]);

                try {
                    $dependency = Dependency::create([
                        'project_id' => $projectId,
                        'predecessor_task_id' => $predTask->id,
                        'successor_task_id' => $task->id,
                    ]);

                    \Log::info("✅ Dépendance créée avec ID: {$dependency->id}");
                    $createdDependencies[] = [
                        'id' => $dependency->id,
                        'predecessor' => $depName,
                        'predecessor_id' => $predTask->id
                    ];

                } catch (\Exception $e) {
                    \Log::error("❌ ERREUR SQL création dépendance: " . $e->getMessage());
                    \Log::error("Code d'erreur: " . $e->getCode());
                    
                    // Vérifier si c'est une erreur de contrainte UNIQUE
                    if ($e->getCode() == '23000' || strpos($e->getMessage(), 'Duplicate') !== false) {
                        \Log::error("PROBLÈME: Contrainte UNIQUE violée sur la table dependencies");
                        \Log::error("Vérifiez la structure de la table avec: SHOW CREATE TABLE dependencies");
                        \Log::error("Les colonnes ne devraient PAS avoir UNIQUE (sauf id)");
                    }
                }
            } else {
                \Log::warning("❌ Tâche prédécesseur '{$depName}' non trouvée pour le projet {$projectId}");
            }
        }
    } else {
        \Log::info('Aucune dépendance à créer');
    }

    // 4️⃣ Charger la tâche avec ses relations
// 4️⃣ Charger la tâche avec ses relations - CORRECTION
$task->load(['predecessors.predecessor', 'successors.successor']);
    // 5️⃣ DEBUG: Vérifier ce qui a été créé
    \Log::info('=== RÉCAPITULATIF ===');
    \Log::info("Tâche ID: {$task->id}");
    \Log::info("Dépendances créées: " . count($createdDependencies));
    \Log::info("Dépendances dans DB (requête directe):");
    
    // Requête directe pour voir ce qui est dans la table
    $dbDependencies = \DB::table('dependencies')
                        ->where('project_id', $projectId)
                        ->where('successor_task_id', $task->id)
                        ->get();
    
    \Log::info("Nombre de dépendances en DB: " . $dbDependencies->count());
    foreach ($dbDependencies as $dep) {
        \Log::info("  - Dépendance DB: pred_id={$dep->predecessor_task_id}, succ_id={$dep->successor_task_id}");
    }

    return response()->json([
        'message' => 'Tâche et dépendances enregistrées',
        'task' => $task,
        'debug' => [
            'task_id' => $task->id,
            'dependencies_sent' => $request->dependencies,
            'dependencies_created' => $createdDependencies,
            'db_dependencies_count' => $dbDependencies->count(),
            'db_dependencies' => $dbDependencies
        ]
    ]);
}


  

public function update(Request $request, $id)
{
    $task = Task::findOrFail($id);

    // Préparer les données à mettre à jour (sans dates)
    $updateData = [
        'name' => $request->name,
        'description' => $request->description ?? $task->description,
    ];

    // Mettre à jour la tâche (sans dates)
    $task->update($updateData);

    // 1️⃣ Gérer les dépendances si elles sont envoyées
    if ($request->has('dependencies') && is_array($request->dependencies)) {
        \Log::info("Mise à jour dépendances pour tâche {$task->id}", [
            'dependencies' => $request->dependencies
        ]);

        // Supprimer les anciennes dépendances
        Dependency::where('successor_task_id', $task->id)->delete();

        // Créer les nouvelles dépendances
        $createdDependencies = [];
        foreach ($request->dependencies as $depName) {
            $depName = trim($depName);
            if (empty($depName)) {
                continue;
            }

            // Chercher la tâche prédécesseur par nom
            $predTask = Task::where('project_id', $task->project_id)
                            ->where('name', $depName)
                            ->first();

            if ($predTask && $predTask->id !== $task->id) {
                try {
                    $dependency = Dependency::create([
                        'project_id' => $task->project_id,
                        'predecessor_task_id' => $predTask->id,
                        'successor_task_id' => $task->id,
                    ]);

                    $createdDependencies[] = [
                        'predecessor' => $depName,
                        'predecessor_id' => $predTask->id
                    ];

                    \Log::info("✅ Dépendance mise à jour: {$depName} -> {$task->name}");
                } catch (\Exception $e) {
                    \Log::error("❌ Erreur création dépendance: " . $e->getMessage());
                }
            } else {
                \Log::warning("Prédécesseur '{$depName}' non trouvé ou dépendance circulaire");
            }
        }
    }

    // 2️⃣ Charger les relations (sans relations imbriquées)
    $task->load(['predecessors', 'successors']);

    // 3️⃣ Récupérer les noms des prédécesseurs manuellement
    $predecessorNames = [];
    foreach ($task->predecessors as $dependency) {
        $predecessorTask = Task::find($dependency->predecessor_task_id);
        if ($predecessorTask) {
            $predecessorNames[] = $predecessorTask->name;
        }
    }

    // 4️⃣ DEBUG: Vérifier ce qui a été créé
    $dbDependencies = \DB::table('dependencies')
                        ->where('project_id', $task->project_id)
                        ->where('successor_task_id', $task->id)
                        ->get();

    \Log::info('=== MISE À JOUR TÂCHE ===');
    \Log::info("Tâche ID: {$task->id}, Nom: {$task->name}");
    \Log::info("Dépendances en DB après mise à jour: " . $dbDependencies->count());

    // 5️⃣ Retourner la réponse avec les noms des prédécesseurs
    return response()->json([
        'message' => 'Task updated successfully',
        'task' => $task,
        'predecessor_names' => $predecessorNames,
        'debug' => [
            'task_id' => $task->id,
            'dependencies_sent' => $request->has('dependencies') ? $request->dependencies : 'none',
            'dependencies_created' => $createdDependencies ?? [],
            'db_dependencies_count' => $dbDependencies->count(),
        ]
    ]);
}}