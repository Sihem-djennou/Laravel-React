<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TaskUpdate extends Model
{
    use HasFactory;

    public $timestamps = false; // because migration has only updated_at

    protected $fillable = [
        'task_id',
        'user_id',
        'progress',
        'note',
        'updated_at',
    ];

    // Each task update belongs to a task
    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    // Each update is done by a user
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
