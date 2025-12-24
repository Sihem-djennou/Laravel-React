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
    'start_date',
    'duration',
    'progress',
];
protected $appends = ['end_date'];



    // A task belongs to one project
    public function project()
    {
        return $this->belongsTo(Project::class);
    }

   // Tâches dont celle-ci dépend
public function predecessors()
{
    return $this->hasMany(
        Dependency::class,
        'successor_task_id'
    );
}
 public function getEndDateAttribute()
    {
        if (!$this->start_date || !$this->duration) {
            return null;
        }

        return \Carbon\Carbon::parse($this->start_date)
            ->addDays($this->duration)
            ->toDateString();
    }


// Tâches qui dépendent de celle-ci
public function successors()
{
    return $this->hasMany(
        Dependency::class,
        'predecessor_task_id'
    );
}


    // A task may have many updates
    public function updates()
    {
        return $this->hasMany(TaskUpdate::class);
    }
    
}
