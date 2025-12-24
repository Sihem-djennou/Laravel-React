<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Dependency extends Model
{
    protected $fillable = [
        'project_id',
        'predecessor_task_id',
        'successor_task_id',
    ];

    
    public $timestamps = false; // 🔥 OBLIGATOIRE
     // ⭐⭐ AJOUTEZ CES RELATIONS ⭐⭐
    
    // Relation avec la tâche prédécesseur
    public function predecessor()
    {
        return $this->belongsTo(Task::class, 'predecessor_task_id');
    }

    // Relation avec la tâche successeur
    public function successor()
    {
        return $this->belongsTo(Task::class, 'successor_task_id');
    }

    // Relation avec le projet (optionnel)
    public function project()
    {
        return $this->belongsTo(Project::class);
    }
}

