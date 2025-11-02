<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;

    // Columns that can be mass-assigned
    protected $fillable = [
        'user_id',
        'title',
        'description',
        'start_date',
        'end_date',
    ];

    // A project belongs to one user
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // A project has many tasks
    public function tasks()
    {
        return $this->hasMany(Task::class);
    }
}
