<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TaskSeeder extends Seeder
{
    public function run(): void
    {
        $project = DB::table('projects')->first();
        
        if ($project) {
            DB::table('tasks')->insert([
                'project_id' => $project->id,
                'name' => 'Initial Task',
                'description' => 'This is a sample task',
                'start_date' => Carbon::now()->format('Y-m-d'), // Ajoutez ceci
                'duration' => 3, // Ajoutez ceci (en jours)
                'optimistic_time' => 2,
                'most_likely_time' => 3,
                'pessimistic_time' => 5,
                'expected_time' => (2 + 4*3 + 5)/6, // PERT formula
                'progress' => 0, // Ajoutez ceci
                'status' => 'pending', // Ajoutez ceci
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}