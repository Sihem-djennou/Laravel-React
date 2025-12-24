<?php

namespace App\Http\Controllers;

use Carbon\Carbon;
use App\Models\Task;
use App\Models\Project;
use Illuminate\Http\Request;
use App\Models\TaskUpdate;
use App\Models\Dependency;
use Illuminate\Support\Facades\Log;

class TaskController extends Controller
{
    // ... autres méthodes existantes ...
    
    /**
     * Créer une tâche avec date de début, durée et prédécesseurs
     */
    public function store(Request $request, $projectId)
    {
        $request->validate([
            'name' => 'required|string',
            'description' => 'nullable|string',
            'start_date' => 'required|date',
            'duration' => 'required|integer|min:1',
            'dependencies' => 'nullable|array',
        ]);

        // Remplir automatiquement les champs PERT avec la durée (EN JOURS)
        $durationValue = floatval($request->duration);
        
        $task = Task::create([
            'project_id' => $projectId,
            'name' => $request->name,
            'description' => $request->description,
            'start_date' => $request->start_date,
            'duration' => $durationValue,
            // Remplir les champs PERT avec la même valeur EN JOURS
            'optimistic_time' => $durationValue,
            'most_likely_time' => $durationValue,
            'pessimistic_time' => $durationValue,
            'expected_time' => $durationValue,
        ]);

        if ($request->dependencies) {
            foreach ($request->dependencies as $predId) {
                if ($predId != $task->id) {
                    Dependency::create([
                        'project_id' => $projectId,
                        'predecessor_task_id' => $predId,
                        'successor_task_id' => $task->id,
                    ]);
                }
            }
        }

        return response()->json(
            $task->load('predecessors.predecessor'),
            201
        );
    }
    
    public function destroy(Task $task)
    {
        // Supprimer les dépendances liées (IMPORTANT)
        $task->predecessors()->delete();
        $task->successors()->delete();

        $task->delete();

        return response()->json([
            'message' => 'Task deleted successfully'
        ], 200);
    }
    
    /**
     * Récupérer toutes les tâches d'un projet (pour le dropdown)
     */
    public function getProjectTasks($projectId)
    {
        $tasks = Task::where('project_id', $projectId)
                    ->orderBy('name')
                    ->get(['id', 'name', 'start_date', 'duration']);
        $tasks->transform(function ($task) {
            $task->end_date = $task->end_date; 
            return $task;
        });
        return response()->json($tasks);
    }
    
    public function update(Request $request, Task $task)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'start_date' => 'nullable|date',
            'duration' => 'nullable|integer|min:1',
            'dependencies' => 'nullable|array'
        ]);

        $task->update([
            'name' => $data['name'],
            'start_date' => $data['start_date'] ?? null,
            'duration' => $data['duration'] ?? null,
        ]);

        if (isset($data['dependencies'])) {
            // Supprimer les anciennes dépendances
            $task->predecessors()->delete();

            // Ajouter les nouvelles dépendances avec project_id
            foreach ($data['dependencies'] as $predId) {
                $task->predecessors()->create([
                    'predecessor_task_id' => $predId,
                    'successor_task_id' => $task->id,
                    'project_id' => $task->project_id
                ]);
            }
        }

        return response()->json($task, 200);
    }
    
    /**
     * Nouvelle méthode pour créer une tâche simple avec interface utilisateur
     * CORRIGÉE : Garder tout en JOURS, pas de conversion en heures
     */
    public function createTaskWithUI(Request $request, $projectId)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'nullable|date',
            'duration' => 'required|numeric|min:0.5|max:365',
            'optimistic_days' => 'required|numeric|min:0.1',
            'most_likely_days' => 'required|numeric|min:0.1',
            'pessimistic_days' => 'required|numeric|min:0.1',
            'predecessor_ids' => 'nullable|array',
            'predecessor_ids.*' => 'exists:tasks,id'
        ]);
        
        // GARDER TOUT EN JOURS, pas de conversion en heures
        $optimisticDays = $request->optimistic_days;
        $mostLikelyDays = $request->most_likely_days;
        $pessimisticDays = $request->pessimistic_days;
        
        // Calculer expected en JOURS (pas en heures)
        $expectedDays = ($optimisticDays + 4 * $mostLikelyDays + $pessimisticDays) / 6;
        
        $task = Task::create([
            'project_id' => $projectId,
            'name' => $request->name,
            'description' => $request->description,
            'start_date' => $request->start_date,
            'duration' => $request->duration,
            'optimistic_time' => $optimisticDays, // JOURS
            'most_likely_time' => $mostLikelyDays, // JOURS
            'pessimistic_time' => $pessimisticDays, // JOURS
            'expected_time' => $expectedDays, // JOURS
        ]);
        
        // Créer les dépendances
        if ($request->predecessor_ids) {
            foreach ($request->predecessor_ids as $predecessorId) {
                Dependency::create([
                    'project_id' => $projectId,
                    'predecessor_task_id' => $predecessorId,
                    'successor_task_id' => $task->id,
                ]);
            }
        }
        
        return response()->json([
            'message' => 'Task created successfully',
            'task' => $task->load(['predecessors.predecessor'])
        ]);
    }
    
    /**
     * Corriger les temps PERT existants (convertir heures en jours si nécessaire)
     */
    public function fixTaskTimes($projectId)
    {
        $tasks = Task::where('project_id', $projectId)->get();
        $fixed = 0;
        
        foreach ($tasks as $task) {
            // Si les champs PERT sont > 8 (probablement en heures), convertir en jours
            $needsFix = false;
            $fields = ['optimistic_time', 'most_likely_time', 'pessimistic_time', 'expected_time'];
            
            foreach ($fields as $field) {
                $value = $task->$field;
                if (is_numeric($value) && $value > 8) {
                    $needsFix = true;
                    break;
                }
            }
            
            if ($needsFix) {
                $oldValues = [
                    'opt' => $task->optimistic_time,
                    'ml' => $task->most_likely_time,
                    'pes' => $task->pessimistic_time,
                    'exp' => $task->expected_time,
                ];
                
                // Convertir heures en jours (diviser par 8)
                $task->update([
                    'optimistic_time' => $task->optimistic_time / 8,
                    'most_likely_time' => $task->most_likely_time / 8,
                    'pessimistic_time' => $task->pessimistic_time / 8,
                    'expected_time' => $task->expected_time / 8,
                ]);
                
                $fixed++;
                Log::info("Fixed task {$task->name} ({$task->id}): Converted hours to days", $oldValues);
            }
        }
        
        return response()->json([
            'message' => "Fixed {$fixed} tasks (converted hours to days where necessary)",
            'project_id' => $projectId,
        ]);
    }
    
    /**
     * Corriger les valeurs "0001" dans les champs PERT
     */
    public function fixPertZeroValues($projectId)
    {
        $tasks = Task::where('project_id', $projectId)->get();
        $fixed = 0;
        
        foreach ($tasks as $task) {
            // Vérifier si les champs PERT contiennent "0001", "001", "01" ou 1
            $needsFix = false;
            $fields = ['optimistic_time', 'most_likely_time', 'pessimistic_time', 'expected_time'];
            
            foreach ($fields as $field) {
                $value = $task->$field;
                if ($value == 1 || $value == '1' || $value == '01' || $value == '001' || $value == '0001') {
                    $needsFix = true;
                    break;
                }
            }
            
            if ($needsFix && $task->duration > 0) {
                $oldValues = [
                    'opt' => $task->optimistic_time,
                    'ml' => $task->most_likely_time,
                    'pes' => $task->pessimistic_time,
                    'exp' => $task->expected_time,
                ];
                
                // Remplacer par la durée réelle
                $task->update([
                    'optimistic_time' => $task->duration,
                    'most_likely_time' => $task->duration,
                    'pessimistic_time' => $task->duration,
                    'expected_time' => $task->duration,
                ]);
                
                $fixed++;
                Log::info("Fixed task {$task->name} ({$task->id}): Replaced '0001' with duration {$task->duration}", $oldValues);
            }
        }
        
        return response()->json([
            'message' => "Fixed {$fixed} tasks (replaced '0001' values with real durations)",
            'project_id' => $projectId,
        ]);
    }
}