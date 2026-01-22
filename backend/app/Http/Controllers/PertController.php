<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Task;
use App\Models\Dependency;
use Illuminate\Support\Facades\Log;

class PertController extends Controller
{
    public function generate(Project $project)
    {
        Log::info("=== PERT GENERATION FOR PROJECT {$project->id} ===");
        
        $tasks = Task::where('project_id', $project->id)->get();
        $dependencies = Dependency::where('project_id', $project->id)->get();
        
        Log::info("Tasks: {$tasks->count()}, Dependencies: {$dependencies->count()}");
        
        if($tasks->isEmpty() || $tasks->count() < 2){
            return response()->json([
                'error' => 'Need at least 2 tasks for PERT analysis',
                'nodes' => [],
                'edges' => [],
                'critical_path' => [],
                'project_duration' => 0,
            ], 400);
        }

        if($dependencies->isEmpty()){
            return response()->json([
                'error' => 'Need at least 1 dependency for PERT analysis',
                'nodes' => [],
                'edges' => [],
                'critical_path' => [],
                'project_duration' => 0,
            ], 400);
        }

        // 1️⃣ CALCULER LES DURÉES CORRECTEMENT
        $duration = [];
        Log::info("=== DURATION CALCULATION ===");
        foreach ($tasks as $task) {
            // PRIORITÉ ABSOLUE : Utiliser le champ 'duration'
            $durationFromField = floatval($task->duration);
            
            // Nettoyer les champs PERT
            $opt = $this->cleanNumber($task->optimistic_time);
            $ml = $this->cleanNumber($task->most_likely_time);
            $pes = $this->cleanNumber($task->pessimistic_time);
            $exp = $this->cleanNumber($task->expected_time);
            
            Log::info("Task {$task->id} '{$task->name}':");
            Log::info("  Duration field: {$durationFromField}");
            Log::info("  PERT fields: opt={$opt}, ml={$ml}, pes={$pes}, exp={$exp}");
            
            // Décider quelle durée utiliser
            $usePertCalculation = false;
            
            // Vérifier si les champs PERT sont valides (pas 1 ou 0)
            if ($opt > 1 && $ml > 1 && $pes > 1) {
                // Vérifier si les valeurs PERT sont cohérentes avec la durée
                $pertCalculated = ($opt + 4 * $ml + $pes) / 6;
                $difference = abs($pertCalculated - $durationFromField);
                
                // Si la différence est significative, utiliser le calcul PERT
                if ($difference > 1) {
                    $usePertCalculation = true;
                    $duration[$task->id] = $pertCalculated;
                    Log::info("  Using PERT calculation: {$pertCalculated} (different from duration {$durationFromField})");
                } else {
                    $duration[$task->id] = $durationFromField;
                    Log::info("  Using duration field: {$durationFromField} (PERT similar: {$pertCalculated})");
                }
            } else {
                // Utiliser la durée du champ
                $duration[$task->id] = $durationFromField;
                Log::info("  Using duration field: {$durationFromField} (PERT fields invalid)");
            }
            
            // Forcer une durée minimale de 1
            if ($duration[$task->id] < 1) {
                $duration[$task->id] = 1;
                Log::warning("  Duration < 1, setting to 1");
            }
            
            Log::info("  Final duration: {$duration[$task->id]}");
        }

        // 2️⃣ CONSTRUIRE LE GRAPHE
        $graph = [];
        $reverseGraph = [];
        foreach ($tasks as $task) {
            $graph[$task->id] = [];
            $reverseGraph[$task->id] = [];
        }
        
        Log::info("=== DEPENDENCY GRAPH ===");
        foreach ($dependencies as $dep) {
            $graph[$dep->predecessor_task_id][] = $dep->successor_task_id;
            $reverseGraph[$dep->successor_task_id][] = $dep->predecessor_task_id;
            
            $pred = $tasks->firstWhere('id', $dep->predecessor_task_id);
            $succ = $tasks->firstWhere('id', $dep->successor_task_id);
            Log::info("Edge: {$pred->name}({$dep->predecessor_task_id}) -> {$succ->name}({$dep->successor_task_id})");
        }

        // 3️⃣ FORWARD PASS (ES / EF)
        Log::info("=== FORWARD PASS ===");
        $ES = [];
        $EF = [];
        foreach ($tasks as $task) {
            $this->forwardPass($task->id, $graph, $reverseGraph, $duration, $ES, $EF);
        }
        
        // Log des résultats du forward pass
        foreach ($tasks as $task) {
            Log::info("Task {$task->name}: ES={$ES[$task->id]}, EF={$EF[$task->id]} (duration={$duration[$task->id]})");
        }

        // 4️⃣ BACKWARD PASS (LS / LF)
        $projectDuration = !empty($EF) ? max($EF) : 0;
        Log::info("Project duration after forward pass: {$projectDuration}");
        
        $LS = [];
        $LF = [];
        foreach ($tasks as $task) {
            $this->backwardPass($task->id, $graph, $duration, $LS, $LF, $projectDuration);
        }
        
        // Log des résultats du backward pass
        Log::info("=== BACKWARD PASS ===");
        foreach ($tasks as $task) {
            Log::info("Task {$task->name}: LS={$LS[$task->id]}, LF={$LF[$task->id]}");
        }

        // 5️⃣ CHEMIN CRITIQUE
        Log::info("=== CRITICAL PATH CALCULATION ===");
        $criticalTasks = [];
        foreach ($tasks as $task) {
            $slack = ($LS[$task->id] ?? 0) - ($ES[$task->id] ?? 0);
            $isCritical = abs($slack) < 0.001; // Tolérance pour les arrondis
            
            Log::info("Task {$task->name}: ES={$ES[$task->id]}, LS={$LS[$task->id]}, Slack={$slack}, Critical=" . ($isCritical ? 'YES' : 'NO'));
            
            if ($isCritical) {
                $criticalTasks[] = $task->id;
            }
        }

        Log::info("Critical path IDs: " . implode(', ', $criticalTasks));
        Log::info("Critical path names: " . implode(' -> ', array_map(function($id) use ($tasks) {
            $task = $tasks->firstWhere('id', $id);
            return $task ? $task->name : $id;
        }, $criticalTasks)));

        // 6️⃣ FORMAT REACT FLOW
        $nodes = [];
        foreach ($tasks as $i => $task) {
            $isCritical = in_array($task->id, $criticalTasks);
            $taskDuration = round($duration[$task->id] ?? 0, 1);
            $es = round($ES[$task->id] ?? 0, 1);
            $ef = round($EF[$task->id] ?? 0, 1);
            $ls = round($LS[$task->id] ?? 0, 1);
            $lf = round($LF[$task->id] ?? 0, 1);
            $slack = round(($ls - $es), 1);
            
            $nodes[] = [
                'id' => (string) $task->id,
                'label' => $task->name,
                'name' => $task->name,
                'critical' => $isCritical,
                'es' => $es,
                'ef' => $ef,
                'ls' => $ls,
                'lf' => $lf,
                'duration' => $taskDuration,
                'slack' => $slack,
                'full_label' => "{$task->name} (D:{$taskDuration})",
            ];
        }

        $edges = [];
        foreach ($dependencies as $i => $dep) {
            $isCriticalEdge = in_array($dep->predecessor_task_id, $criticalTasks) && 
                             in_array($dep->successor_task_id, $criticalTasks);
            $edges[] = [
                'id' => "e{$i}",
                'from' => (string) $dep->predecessor_task_id,
                'to' => (string) $dep->successor_task_id,
                'critical' => $isCriticalEdge,
            ];
        }

        Log::info("=== PERT COMPLETED ===");
        Log::info("Total duration: {$projectDuration} days");
        Log::info("Critical tasks: " . count($criticalTasks));
        
        return response()->json([
    'nodes' => $nodes,
    'edges' => $edges,
    'dependencies' => $dependencies->map(function($dep) { // <-- AJOUTEZ CE CHAMP
        return [
            'predecessor_task_id' => (string) $dep->predecessor_task_id,
            'successor_task_id' => (string) $dep->successor_task_id,
            'id' => $dep->id,
            'project_id' => $dep->project_id,
        ];
    })->toArray(),
    'critical_path' => array_map('strval', $criticalTasks),
    'project_duration' => round($projectDuration, 1),
    'summary' => [
        'total_tasks' => count($tasks),
        'total_dependencies' => count($dependencies),
        'critical_tasks' => count($criticalTasks),
    ]
]);
    }

    private function cleanNumber($value)
    {
        if (is_null($value)) return 0;
        
        // Si c'est une chaîne
        if (is_string($value)) {
            $value = trim($value);
            
            // 1. Gérer "0001", "0004", etc.
            if (preg_match('/^0+(\d+)$/', $value, $matches)) {
                $result = floatval($matches[1]);
            } 
            // 2. Extraire les nombres des chaînes
            elseif (preg_match('/(\d+\.?\d*)/', $value, $matches)) {
                $result = floatval($matches[1]);
            }
            // 3. Convertir directement si numérique
            elseif (is_numeric($value)) {
                $result = floatval($value);
            } else {
                $result = 0;
            }
            
            // 4. CONVERSION HEURES → JOURS si nécessaire
            // Si la valeur est > 8 (journée de travail), c'est probablement en heures
            if ($result > 8) {
                $old = $result;
                $result = $result / 8;
                Log::debug("Converted hours to days: {$old} -> {$result}");
            }
            
            return $result;
        }
        
        // Pour les nombres non-string
        $result = floatval($value);
        
        // Conversion heures → jours si nécessaire
        if ($result > 8) {
            $old = $result;
            $result = $result / 8;
            Log::debug("Converted hours to days: {$old} -> {$result}");
        }
        
        return $result;
    }

    private function forwardPass($taskId, $graph, $reverseGraph, $duration, &$ES, &$EF)
    {
        if (isset($ES[$taskId])) return;

        $maxEF = 0;
        foreach ($reverseGraph[$taskId] as $pred) {
            $this->forwardPass($pred, $graph, $reverseGraph, $duration, $ES, $EF);
            $maxEF = max($maxEF, $EF[$pred] ?? 0);
        }

        $ES[$taskId] = $maxEF;
        $EF[$taskId] = $ES[$taskId] + ($duration[$taskId] ?? 0);
    }

    private function backwardPass($taskId, $graph, $duration, &$LS, &$LF, $projectDuration)
    {
        if (isset($LS[$taskId])) return;

        if (empty($graph[$taskId])) {
            $LF[$taskId] = $projectDuration;
        } else {
            $LF[$taskId] = INF;
            foreach ($graph[$taskId] as $succ) {
                $this->backwardPass($succ, $graph, $duration, $LS, $LF, $projectDuration);
                $LF[$taskId] = min($LF[$taskId], $LS[$succ] ?? INF);
            }
        }

        $LS[$taskId] = ($LF[$taskId] !== INF ? $LF[$taskId] : $projectDuration) - ($duration[$taskId] ?? 0);
    }
    
    // Méthode pour debug
    public function debug(Project $project)
    {
        $tasks = Task::where('project_id', $project->id)->get();
        $dependencies = Dependency::where('project_id', $project->id)->get();
        
        $data = [
            'project' => [
                'id' => $project->id,
                'title' => $project->title,
            ],
            'tasks' => $tasks->map(function($task) {
                $opt = $this->cleanNumber($task->optimistic_time);
                $ml = $this->cleanNumber($task->most_likely_time);
                $pes = $this->cleanNumber($task->pessimistic_time);
                $exp = $this->cleanNumber($task->expected_time);
                
                return [
                    'id' => $task->id,
                    'name' => $task->name,
                    'duration' => $task->duration,
                    'optimistic_time_raw' => $task->optimistic_time,
                    'most_likely_time_raw' => $task->most_likely_time,
                    'pessimistic_time_raw' => $task->pessimistic_time,
                    'expected_time_raw' => $task->expected_time,
                    'optimistic_clean' => $opt,
                    'most_likely_clean' => $ml,
                    'pessimistic_clean' => $pes,
                    'expected_clean' => $exp,
                    'has_valid_pert' => ($opt > 1 && $ml > 1 && $pes > 1),
                ];
            }),
            'dependencies' => $dependencies->map(function($dep) use ($tasks) {
                $pred = $tasks->firstWhere('id', $dep->predecessor_task_id);
                $succ = $tasks->firstWhere('id', $dep->successor_task_id);
                
                return [
                    'id' => $dep->id,
                    'from_id' => $dep->predecessor_task_id,
                    'from_name' => $pred ? $pred->name : 'Unknown',
                    'to_id' => $dep->successor_task_id,
                    'to_name' => $succ ? $succ->name : 'Unknown',
                ];
            }),
            'counts' => [
                'tasks' => $tasks->count(),
                'dependencies' => $dependencies->count(),
            ],
            'is_pert_possible' => $tasks->count() >= 2 && $dependencies->count() >= 1,
        ];
        
        return response()->json($data);
    }
    
    // Méthode pour corriger les durées PERT
    public function fixDurations(Project $project)
    {
        $tasks = Task::where('project_id', $project->id)->get();
        $fixed = 0;
        
        foreach ($tasks as $task) {
            // Si le champ duration existe mais les champs PERT sont invalides
            if ($task->duration > 0) {
                $opt = $this->cleanNumber($task->optimistic_time);
                $ml = $this->cleanNumber($task->most_likely_time);
                $pes = $this->cleanNumber($task->pessimistic_time);
                
                // Vérifier si les champs PERT sont invalides (1 ou moins)
                $pertInvalid = ($opt <= 1 && $ml <= 1 && $pes <= 1);
                
                if ($pertInvalid) {
                    $oldValues = [
                        'optimistic' => $task->optimistic_time,
                        'most_likely' => $task->most_likely_time,
                        'pessimistic' => $task->pessimistic_time,
                        'expected' => $task->expected_time,
                    ];
                    
                    $task->update([
                        'optimistic_time' => $task->duration,
                        'most_likely_time' => $task->duration,
                        'pessimistic_time' => $task->duration,
                        'expected_time' => $task->duration,
                    ]);
                    
                    $fixed++;
                    Log::info("Fixed PERT for task {$task->id} '{$task->name}': Set all to duration={$task->duration}", $oldValues);
                }
            }
        }
        
        return response()->json([
            'message' => "Fixed {$fixed} tasks",
            'project_id' => $project->id,
        ]);
    }
}