import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../axiosClient';
import './Dashboard.css'; // Reuse the same CSS

const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchProjectDetails();
  }, [projectId]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get(`/projects/${projectId}`);
      setProject(response.data);
      // Initialize edit form with current values
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
          <button onClick={() => navigate('/dashboard')} className="back-btn">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const progress = calculateProgress(project.tasks);

  return (
    <div className="dashboard-container">
      {/* Header with Back Button */}
      <header className="header">
        <div className="header-content">
          <button 
            className="back-button"
            onClick={() => navigate('/dashboard')}
          >
            ← Back
          </button>
          <div className="header-title">
            <span className="site-name">Project Details</span>
          </div>
        </div>
      </header>

      <main className="content">
        <div className="project-details-container">
          {/* Project Header with Three-dot Menu */}
          <div className="project-details-header">
            <div className="project-title-section">
              <h1 className="project-details-title">{project.title}</h1>
              <span className={`project-status-badge ${progress === 100 ? 'completed' : 'in-progress'}`}>
                {progress === 100 ? 'Completed' : 'In Progress'}
              </span>
            </div>
            
            {/* Three-dot Menu */}
            <div className="project-menu-container">
              <button 
                className="menu-dots-btn"
                onClick={() => setShowMenu(!showMenu)}
              >
                ⋮
              </button>
              
              {showMenu && (
                <div className="dropdown-menu">
                  <button 
                    className="dropdown-item"
                    onClick={() => {
                      setShowEditModal(true);
                      setShowMenu(false);
                    }}
                  >
                    ✏️ Edit Project
                  </button>
                  <button 
                    className="dropdown-item delete"
                    onClick={handleDeleteProject}
                  >
                    🗑️ Delete Project
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Project Information */}
          <div className="project-info-grid">
            <div className="info-card">
              <h3>Description</h3>
              <p>{project.description || 'No description provided'}</p>
            </div>
            
            <div className="info-card">
              <h3>Start Date</h3>
              <p>{formatDate(project.start_date)}</p>
            </div>
            
            <div className="info-card">
              <h3>Progress</h3>
              <div className="progress-display">
                <div className="progress-bar large">
                  <div 
                    className="progress-fill"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <span className="progress-text">{progress}%</span>
              </div>
            </div>
            
            <div className="info-card">
              <h3>Tasks</h3>
              <p className="tasks-count">{project.tasks?.length || 0} tasks</p>
            </div>
          </div>

          {/* Tasks Section - Empty Space for Now */}
          <div className="tasks-section">
            <h2>Tasks</h2>
            <div className="tasks-empty-space">
              <div className="empty-icon">📝</div>
              <h3>Tasks Area</h3>
              <p>Task management features coming soon...</p>
            </div>
          </div>
        </div>
      </main>

      {/* Edit Project Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close-btn"
              onClick={() => setShowEditModal(false)}
            >
              ×
            </button>
            
            <h2>Edit Project</h2>
            <form onSubmit={handleUpdateProject}>
              <div className="form-group">
                <label htmlFor="editTitle">Project Title *</label>
                <input
                  type="text"
                  id="editTitle"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                  maxLength="200"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="editDescription">Description</label>
                <textarea
                  id="editDescription"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows="4"
                ></textarea>
              </div>

              <div className="form-group">
                <label htmlFor="editStartDate">Start Date</label>
                <input
                  type="date"
                  id="editStartDate"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowEditModal(false)}
                  disabled={updating}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="create-btn"
                  disabled={updating}
                >
                  {updating ? 'Updating...' : 'Update Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;