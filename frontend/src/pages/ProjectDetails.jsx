import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../axiosClient';
import './Dashboard.css';

const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Edit project state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [updating, setUpdating] = useState(false);

  // Add task state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [taskStartDate, setTaskStartDate] = useState('');
  const [taskEndDate, setTaskEndDate] = useState('');
  const [taskPredecessors, setTaskPredecessors] = useState('');

  // Edit task state
  const [showEditTaskModal, setShowEditTaskModal] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [updatingTask, setUpdatingTask] = useState(false);

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get(`/projects/${projectId}`);
      setProject(response.data);
      setEditTitle(response.data.title);
      setEditDescription(response.data.description || '');
      setEditStartDate(response.data.start_date || '');
    } catch (error) {
      console.error('Error fetching project details:', error);
      alert('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (tasks) => {
    if (!tasks || tasks.length === 0) return 0;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  // Update project
  const handleUpdateProject = async (e) => {
    e.preventDefault();
    if (updating) return;
    try {
      setUpdating(true);
      const response = await axiosClient.put(`/projects/${projectId}`, {
        title: editTitle,
        description: editDescription,
        start_date: editStartDate || null,
      });
      setProject(response.data);
      setShowEditModal(false);
      setShowMenu(false);
    } catch (error) {
      console.error('Error updating project:', error);
      alert('Failed to update project');
    } finally {
      setUpdating(false);
    }
  };

  // Delete project
  const handleDeleteProject = async () => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await axiosClient.delete(`/projects/${projectId}`);
        navigate('/dashboard');
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project');
      }
    }
  };




  const handleCreateTask = async (e) => {
  e.preventDefault();

  const dependencies = taskPredecessors
    ? taskPredecessors
        .split(',')
        .map(name => name.trim())
        .filter(name => name !== '')  // Filtre les noms vides
    : [];

  // DEBUG: Voir ce qu'on envoie
  console.log('Creating task with dependencies (names):', dependencies);

  try {
    const response = await axiosClient.post(`/projects/${projectId}/tasks`, {
      name: taskName,
      start_date: taskStartDate || null,
      end_date: taskEndDate || null,
      dependencies  // 👈 Tableau de NOMS
    });

    console.log('Task created successfully:', response.data);
    
    setShowTaskModal(false);
    setTaskName('');
    setTaskStartDate('');
    setTaskEndDate('');
    setTaskPredecessors('');
    fetchProjectDetails();
  } catch (error) {
    console.error('Error creating task:', error);
    console.error('Response data:', error.response?.data);
    alert('Failed to create task: ' + (error.response?.data?.message || error.message));
  }
};
  // Delete task
  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await axiosClient.delete(`/projects/${projectId}/tasks/${taskId}`);
        fetchProjectDetails();
      } catch (error) {
        alert('Failed to delete task');
      }
    }
  };

  // Edit task
  const handleEditTask = (task) => {
    setCurrentTask(task);
    setTaskName(task.name);
    setTaskStartDate(task.start_date || '');
    setTaskEndDate(task.end_date || '');
    setTaskPredecessors(task.predecessors ? task.predecessors.join(', ') : '');
    setShowEditTaskModal(true);
  };

  const handleUpdateTask = async (e) => {
  e.preventDefault();
  setUpdatingTask(true);

  // Convertir les noms en tableau
  const dependencies = taskPredecessors
    ? taskPredecessors
        .split(',')
        .map(name => name.trim())
        .filter(name => name !== '')
    : [];

  console.log('Updating task with:', {
    id: currentTask.id,
    name: taskName,
    start_date: taskStartDate,
    end_date: taskEndDate,
    dependencies: dependencies
  });

  try {
    const response = await axiosClient.put(`/tasks/${currentTask.id}`, {
      name: taskName,
      start_date: taskStartDate || null,
      end_date: taskEndDate || null,
      dependencies: dependencies  // 👈 Tableau de NOMS
    });

    console.log('Task updated successfully:', response.data);
    
    setShowEditTaskModal(false);
    setCurrentTask(null);
    setTaskName('');
    setTaskStartDate('');
    setTaskEndDate('');
    setTaskPredecessors('');
    fetchProjectDetails();
  } catch (error) {
    console.error('Error updating task:', error);
    console.error('Response data:', error.response?.data);
    alert('Failed to update task: ' + (error.response?.data?.message || error.message));
  } finally {
    setUpdatingTask(false);
  }
};

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-state full-page">
          <div className="loading-spinner"></div>
          <p>Loading project details...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="dashboard-container">
        <div className="error-state">
          <h2>Project not found</h2>
          <button onClick={() => navigate('/dashboard')} className="back-btn">Back to Dashboard</button>
        </div>
      </div>
    );
  }

  const progress = calculateProgress(project.tasks);

  return (
    <div className="dashboard-container">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <button className="back-button" onClick={() => navigate('/dashboard')}>← Back</button>
          <div className="header-title"><span className="site-name">Project Details</span></div>
        </div>
      </header>

      <main className="content">
        <div className="project-details-container">
          {/* Project Header */}
          <div className="project-details-header">
            <div className="project-title-section">
              <h1 className="project-details-title">{project.title}</h1>
              <span className={`project-status-badge ${progress === 100 ? 'completed' : 'in-progress'}`}>
                {progress === 100 ? 'Completed' : 'In Progress'}
              </span>
            </div>
            <div className="project-menu-container">
              <button className="menu-dots-btn" onClick={() => setShowMenu(!showMenu)}>⋮</button>
              {showMenu && (
                <div className="dropdown-menu">
                  <button className="dropdown-item" onClick={() => { setShowEditModal(true); setShowMenu(false); }}>✏️ Edit Project</button>
                  <button className="dropdown-item delete" onClick={handleDeleteProject}>🗑️ Delete Project</button>
                </div>
              )}
            </div>
          </div>

          {/* Project Info */}
          <div className="project-info-grid">
            <div className="info-card"><h3>Description</h3><p>{project.description || 'No description provided'}</p></div>
            <div className="info-card"><h3>Start Date</h3><p>{formatDate(project.start_date)}</p></div>
            <div className="info-card">
              <h3>Progress</h3>
              <div className="progress-display">
                <div className="progress-bar large"><div className="progress-fill" style={{ width: `${progress}%` }}></div></div>
                <span className="progress-text">{progress}%</span>
              </div>
            </div>
            <div className="info-card"><h3>Tasks</h3><p className="tasks-count">{project.tasks?.length || 0} tasks</p></div>
          </div>

          {/* Tasks Section */}
          <div className="tasks-section">
            <h2>Tasks</h2>
            {project.tasks && project.tasks.length > 0 ? (
              <div className="tasks-list">
                {project.tasks.map(task => (
                  <div key={task.id} className="task-card">
                    <h4 className="task-name">{task.name}</h4>
                    <p>Start: {task.start_date ? formatDate(task.start_date) : 'Not set'} | End: {task.end_date ? formatDate(task.end_date) : 'Not set'}</p>
                    <p>Status: <span className={`task-status ${task.status}`}>{task.status}</span></p>
                    {task.predecessors && task.predecessors.length > 0 && (<p>Predecessors: {task.predecessors.join(', ')}</p>)}
                    <div className="task-actions">
                      <button className="edit-btn" onClick={() => handleEditTask(task)}>✏️ Edit</button>
                      <button className="delete-btn" onClick={() => handleDeleteTask(task.id)}>🗑️ Delete</button>
                      <button className="view-btn" onClick={() => alert('Task details coming soon')}>👁️ View</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="tasks-empty-space">
                <div className="empty-icon">📝</div>
                <h3>Tasks Area</h3>
                <p>Task management features coming soon...</p>
              </div>
            )}
            <button className="create-btn" onClick={() => setShowTaskModal(true)}>➕ Create Task</button>
          </div>
        </div>
      </main>

      {/* Edit Project Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setShowEditModal(false)}>×</button>
            <h2>Edit Project</h2>
            <form onSubmit={handleUpdateProject}>
              <div className="form-group"><label htmlFor="editTitle">Project Title *</label>
                <input type="text" id="editTitle" value={editTitle} onChange={e => setEditTitle(e.target.value)} required maxLength="200"/>
              </div>
              <div className="form-group"><label htmlFor="editDescription">Description</label>
                <textarea id="editDescription" value={editDescription} onChange={e => setEditDescription(e.target.value)} rows="4"></textarea>
              </div>
              <div className="form-group"><label htmlFor="editStartDate">Start Date</label>
                <input type="date" id="editStartDate" value={editStartDate} onChange={e => setEditStartDate(e.target.value)}/>
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowEditModal(false)} disabled={updating}>Cancel</button>
                <button type="submit" className="create-btn" disabled={updating}>{updating ? 'Updating...' : 'Update Project'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Create Task</h2>
            <form onSubmit={handleCreateTask}>
              <div className="form-group"><label>Task Name *</label>
                <input type="text" value={taskName} onChange={e => setTaskName(e.target.value)} required />
              </div>
              <div className="form-group"><label>Start Date</label>
                <input type="date" value={taskStartDate} onChange={e => setTaskStartDate(e.target.value)} />
              </div>
              <div className="form-group"><label>End Date</label>
                <input type="date" value={taskEndDate} onChange={e => setTaskEndDate(e.target.value)} />
              </div>
              <div className="form-group"><label>Predecessors (IDs séparés par ,)</label>
                <input type="text" value={taskPredecessors} onChange={e => setTaskPredecessors(e.target.value)} />
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="create-btn">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditTaskModal && (
        <div className="modal-overlay" onClick={() => setShowEditTaskModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Edit Task</h2>
            <form onSubmit={handleUpdateTask}>
              <div className="form-group"><label>Task Name *</label>
                <input type="text" value={taskName} onChange={e => setTaskName(e.target.value)} required />
              </div>
              <div className="form-group"><label>Start Date</label>
                <input type="date" value={taskStartDate} onChange={e => setTaskStartDate(e.target.value)} />
              </div>
              <div className="form-group"><label>End Date</label>
                <input type="date" value={taskEndDate} onChange={e => setTaskEndDate(e.target.value)} />
              </div>
              <div className="form-group"><label>Predecessors (IDs séparés par ,)</label>
                <input type="text" value={taskPredecessors} onChange={e => setTaskPredecessors(e.target.value)} />
              </div>
              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setShowEditTaskModal(false)} disabled={updatingTask}>Cancel</button>
                <button type="submit" className="create-btn" disabled={updatingTask}>{updatingTask ? 'Updating...' : 'Update Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;
