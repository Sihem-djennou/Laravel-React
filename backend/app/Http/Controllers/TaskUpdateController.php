<?php

namespace App\Http\Controllers;

use App\Models\TaskUpdate;
use Illuminate\Http\Request;

class TaskUpdateController extends Controller
{
    public function index()
    {
        return TaskUpdate::with(['task', 'user'])->get();
    }

    public function show(TaskUpdate $taskUpdate)
    {
        return $taskUpdate->load(['task', 'user']);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'task_id' => 'required|exists:tasks,id',
            'user_id' => 'required|exists:users,id',
            'progress' => 'required|integer|between:0,100',
            'note' => 'nullable|string',
            'updated_at' => 'nullable|date',
        ]);

        return TaskUpdate::create($data);
    }

    public function update(Request $request, TaskUpdate $taskUpdate)
    {
        $data = $request->validate([
            'progress' => 'sometimes|integer|between:0,100',
            'note' => 'nullable|string',
            'updated_at' => 'nullable|date',
        ]);

        $taskUpdate->update($data);

        return $taskUpdate;
    }

    public function destroy(TaskUpdate $taskUpdate)
    {
        $taskUpdate->delete();
        return response()->json(['message' => 'Task update deleted']);
    }
}
