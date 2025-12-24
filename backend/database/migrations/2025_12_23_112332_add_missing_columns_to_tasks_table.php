<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            // Vérifie si la colonne existe avant de l'ajouter
            if (!Schema::hasColumn('tasks', 'start_date')) {
                $table->date('start_date')->nullable()->after('description');
            }
            
            if (!Schema::hasColumn('tasks', 'duration')) {
                $table->integer('duration')->default(1)->after('start_date');
            }
            
            if (!Schema::hasColumn('tasks', 'progress')) {
                $table->integer('progress')->default(0)->after('expected_time');
            }
            
            if (!Schema::hasColumn('tasks', 'status')) {
                $table->string('status')->default('pending')->after('progress');
            }
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            // Supprime les colonnes si elles existent
            if (Schema::hasColumn('tasks', 'start_date')) {
                $table->dropColumn('start_date');
            }
            
            if (Schema::hasColumn('tasks', 'duration')) {
                $table->dropColumn('duration');
            }
            
            if (Schema::hasColumn('tasks', 'progress')) {
                $table->dropColumn('progress');
            }
            
            if (Schema::hasColumn('tasks', 'status')) {
                $table->dropColumn('status');
            }
        });
    }
};