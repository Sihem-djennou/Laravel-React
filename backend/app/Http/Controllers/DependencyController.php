<?php

namespace App\Http\Controllers;

use App\Models\Dependency;
use App\Models\Project;
use Illuminate\Http\Request;

class DependencyController extends Controller
{
    /**
     * Get all dependencies for a project
     */
    public function index($projectId)
    {
        $dependencies = Dependency::where('project_id', $projectId)
                                 ->with(['predecessor', 'successor'])
                                 ->get();
        
        return response()->json($dependencies);
    }

    /**
     * Create a new dependency
     */
    public function store(Request $request, $projectId)
    {
        $request->validate([
            'predecessor_task_id' => 'required|exists:tasks,id',
            'successor_task_id' => 'required|exists:tasks,id',
        ]);

        // Check if both tasks belong to the same project
        $predecessorTask = \App\Models\Task::find($request->predecessor_task_id);
        $successorTask = \App\Models\Task::find($request->successor_task_id);

        if ($predecessorTask->project_id != $projectId || 
            $successorTask->project_id != $projectId) {
            return response()->json([
                'error' => 'Both tasks must belong to the same project'
            ], 400);
        }

        // Check for circular dependency
        if ($this->wouldCreateCircularDependency(
            $request->predecessor_task_id, 
            $request->successor_task_id, 
            $projectId
        )) {
            return response()->json([
                'error' => 'Circular dependency detected'
            ], 400);
        }

        // Check if dependency already exists
        $existing = Dependency::where('project_id', $projectId)
                             ->where('predecessor_task_id', $request->predecessor_task_id)
                             ->where('successor_task_id', $request->successor_task_id)
                             ->first();
        
        if ($existing) {
            return response()->json([
                'error' => 'Dependency already exists'
            ], 400);
        }

        $dependency = Dependency::create([
            'project_id' => $projectId,
            'predecessor_task_id' => $request->predecessor_task_id,
            'successor_task_id' => $request->successor_task_id,
        ]);

        return response()->json($dependency->load(['predecessor', 'successor']));
    }

    /**
     * Delete a dependency
     */
    public function destroy($id)
    {
        $dependency = Dependency::findOrFail($id);
        $dependency->delete();
        
        return response()->json([
            'message' => 'Dependency deleted successfully'
        ]);
    }

    /**
     * Check for circular dependencies
     */
    private function wouldCreateCircularDependency($predecessorId, $successorId, $projectId)
    {
        // If successor is trying to depend on itself
        if ($predecessorId == $successorId) {
            return true;
        }

        // Get all dependencies for the project
        $dependencies = Dependency::where('project_id', $projectId)->get();
        
        // Build adjacency list
        $graph = [];
        foreach ($dependencies as $dep) {
            if (!isset($graph[$dep->predecessor_task_id])) {
                $graph[$dep->predecessor_task_id] = [];
            }
            $graph[$dep->predecessor_task_id][] = $dep->successor_task_id;
        }

        // Check if adding this dependency creates a cycle
        $visited = [];
        $recStack = [];
        
        // Add the new edge temporarily
        if (!isset($graph[$predecessorId])) {
            $graph[$predecessorId] = [];
        }
        $graph[$predecessorId][] = $successorId;

        // Check for cycle
        $hasCycle = false;
        foreach (array_keys($graph) as $node) {
            if ($this->hasCycleUtil($node, $graph, $visited, $recStack)) {
                $hasCycle = true;
                break;
            }
        }

        return $hasCycle;
    }

    /**
     * DFS utility to detect cycles
     */
    private function hasCycleUtil($node, &$graph, &$visited, &$recStack)
    {
        if (!isset($graph[$node])) {
            return false;
        }

        if (!isset($visited[$node])) {
            $visited[$node] = true;
            $recStack[$node] = true;

            foreach ($graph[$node] as $neighbor) {
                if (!isset($visited[$neighbor]) && 
                    $this->hasCycleUtil($neighbor, $graph, $visited, $recStack)) {
                    return true;
                } elseif (isset($recStack[$neighbor]) && $recStack[$neighbor]) {
                    return true;
                }
            }
        }

        $recStack[$node] = false;
        return false;
    }
}