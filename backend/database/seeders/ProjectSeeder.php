<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProjectSeeder extends Seeder
{
    public function run(): void
    {
        DB::table('projects')->insert([
            [
                'user_id' => 1, // replace with an existing user ID
                'title' => 'Sample Project',
                'description' => 'This is a sample project',
                'start_date' => now(),
                'end_date' => now()->addDays(30),
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }
}
