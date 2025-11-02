<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index()
    {
        return Task::with(['project', 'dependencies', 'updates'])->get();
    }

    public function show(Task $task)
    {
        return $task->load(['project', 'dependencies', 'updates']);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'name' => 'required|string|max:200',
            'description' => 'nullable|string',
            'optimistic_time' => 'nullable|numeric',
            'most_likely_time' => 'nullable|numeric',
            'pessimistic_time' => 'nullable|numeric',
            'expected_time' => 'nullable|numeric',
        ]);

        return Task::create($data);
    }

    public function update(Request $request, Task $task)
    {
        $data = $request->validate([
            'name' => 'sometimes|string|max:200',
            'description' => 'nullable|string',
            'optimistic_time' => 'nullable|numeric',
            'most_likely_time' => 'nullable|numeric',
            'pessimistic_time' => 'nullable|numeric',
            'expected_time' => 'nullable|numeric',
        ]);

        $task->update($data);

        return $task;
    }

    public function destroy(Task $task)
    {
        $task->delete();
        return response()->json(['message' => 'Task deleted']);
    }
}
