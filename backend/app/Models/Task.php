<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'name',
        'description',
        'optimistic_time',
        'most_likely_time',
        'pessimistic_time',
        'expected_time',
    ];

    // A task belongs to one project
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    // A task may have many dependencies (tasks depending on this)
    public function dependencies()
    {
        return $this->hasMany(Dependency::class);
    }

    // A task may have many updates
    public function updates()
    {
        return $this->hasMany(TaskUpdate::class);
    }
}
