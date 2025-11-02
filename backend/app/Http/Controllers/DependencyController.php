<?php

namespace App\Http\Controllers;

use App\Models\Dependency;
use Illuminate\Http\Request;

class DependencyController extends Controller
{
    public function index()
    {
        return Dependency::with(['project', 'predecessor', 'successor'])->get();
    }

    public function show(Dependency $dependency)
    {
        return $dependency->load(['project', 'predecessor', 'successor']);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'predecessor_task_id' => 'required|exists:tasks,id',
            'successor_task_id' => 'required|exists:tasks,id',
        ]);

        return Dependency::create($data);
    }

    public function update(Request $request, Dependency $dependency)
    {
        $data = $request->validate([
            'predecessor_task_id' => 'sometimes|exists:tasks,id',
            'successor_task_id' => 'sometimes|exists:tasks,id',
        ]);

        $dependency->update($data);

        return $dependency;
    }

    public function destroy(Dependency $dependency)
    {
        $dependency->delete();
        return response()->json(['message' => 'Dependency deleted']);
    }
}
