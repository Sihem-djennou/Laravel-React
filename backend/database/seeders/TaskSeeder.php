<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TaskSeeder extends Seeder
{
    public function run(): void
    {
        $project = DB::table('projects')->first();

DB::table('tasks')->insert([
    'project_id' => $project->id, // <- this will now be 2
    'name' => 'Initial Task',
    'description' => 'This is a sample task',
    'optimistic_time' => 2,
    'most_likely_time' => 3,
    'pessimistic_time' => 5,
    'expected_time' => (2 + 4*3 + 5)/6, // PERT formula
    'created_at' => now(),
    'updated_at' => now(),
]);

    }
}
