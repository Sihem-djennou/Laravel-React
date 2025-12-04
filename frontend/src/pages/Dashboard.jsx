import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../axiosClient';
import './Dashboard.css';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSection, setActiveSection] = useState('home');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const navigate = useNavigate();

  const [projectTitle, setProjectTitle] = useState('');
  const [projectDescription, setProjectDescription] = useState('');
  const [startDate, setStartDate] = useState('');

  // Load projects when component mounts
  useEffect(() => {
    fetchProjects();
  }, []);

  // Fetch projects from backend
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get('/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project =>
    project.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get user data from localStorage
  const getUserName = () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.name || 'User';
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
    return 'User';
  };

  const getUserEmail = () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.email || 'user@example.com';
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
    return 'user@example.com';
  };

  const getUserId = () => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.id;
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
    return null;
  };

  // Create new project
  const handleCreateProject = async (e) => {
    e.preventDefault();
    
    if (creatingProject) return;
    
    const userId = getUserId();
    if (!userId) {
      alert('User not found. Please login again.');
      return;
    }

    if (!projectTitle.trim()) {
      alert('Project title is required');
      return;
    }

    try {
      setCreatingProject(true);
      
      const response = await axiosClient.post('/projects', {
        user_id: userId,
        title: projectTitle,
        description: projectDescription,
        start_date: startDate || null,
      });

      setProjects(prevProjects => [response.data, ...prevProjects]);
      
      setProjectTitle('');
      setProjectDescription('');
      setStartDate('');
      setShowModal(false);
      
    } catch (error) {
      console.error('Error creating project:', error);
      alert('Failed to create project. Please try again.');
    } finally {
      setCreatingProject(false);
    }
  };

  // Delete project
  const handleDeleteProject = async (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await axiosClient.delete(`/projects/${projectId}`);
        setProjects(prevProjects => prevProjects.filter(project => project.id !== projectId));
      } catch (error) {
        console.error('Error deleting project:', error);
        alert('Failed to delete project.');
      }
    }
  };

  // Calculate task progress
  const calculateProgress = (tasks) => {
    if (!tasks || tasks.length === 0) return 0;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    return Math.round((completedTasks / tasks.length) * 100);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  // Navigate to project details
  const handleViewDetails = (projectId) => {
    navigate(`/projects/${projectId}`);
  };

  // Sidebar menu items
  const menuItems = [
    { icon: "🏠", label: "Home", id: "home" },
    { icon: "🚀", label: "Current Project", id: "current" }
  ];

  return (
    <div className="dashboard-container">
      {/* Animated Header */}
      <header className="header">
        <div className="header-content">
          <div 
            className="menu-icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </div>
          <div className="header-title">
            <span className="site-name">ManaJect</span>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-content">
          {/* Profile Section */}
          <div className="profile-section">
            <div className="profile-header">
              <div className="profile-avatar">
                {getUserName().charAt(0).toUpperCase()}
              </div>
              <div className="profile-info">
                <h3>{getUserName()}</h3>
                <p>{getUserEmail()}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="sidebar-nav">
            {menuItems.map((item) => (
              <button
                key={item.id}
                className={`sidebar-item ${activeSection === item.id ? 'active' : ''}`}
                onClick={() => setActiveSection(item.id)}
              >
                <span className="item-icon">{item.icon}</span>
                <span className="item-label">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="sidebar-footer">
            <button className="logout-btn">
              <span className="logout-icon">🚪</span>
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="content">
        {/* Home Section */}
        {activeSection === 'home' && (
          <div className="home-section">
            {/* Welcome Message */}
            <div className="welcome-message">
              <h1>Hello...{getUserName()}! </h1>
              <p>Start managing your projects efficiently</p>
            </div>

            {/* Search and Actions */}
            <div className="search-actions-container">
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Search for a project..."
                  className="search-input"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <span className="search-icon">🔍</span>
              </div>
              <button 
                className="create-project-btn"
                onClick={() => setShowModal(true)}
              >
                <span className="btn-icon">+</span>
                New Project
              </button>
            </div>

            {/* Projects Grid */}
            <div className="projects-section">
              <div className="section-header">
                <h2 className="section-title">My Projects</h2>
                <span className="projects-count">{filteredProjects.length} Projects</span>
              </div>

              {loading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Loading projects...</p>
                </div>
              ) : filteredProjects.length > 0 ? (
                <div className="project-grid">
                  {filteredProjects.map((project, index) => {
                    const progress = calculateProgress(project.tasks);
                    const isCompleted = progress === 100;
                    
                    return (
                      <div 
                        key={project.id} 
                        className="project-card"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="project-header">
                          <h3 className="project-name">{project.title}</h3>
                          <span className={`project-status ${isCompleted ? 'completed' : 'in-progress'}`}>
                            {isCompleted ? 'Completed' : 'In Progress'}
                          </span>
                        </div>
                        <p className="project-description">{project.description || 'No description'}</p>
                        
                        <div className="project-progress">
                          <div className="progress-bar">
                            <div 
                              className="progress-fill"
                              style={{ width: `${progress}%` }}
                            ></div>
                          </div>
                          <span className="progress-text">{progress}%</span>
                        </div>

                        <div className="project-meta">
                          <span className="tasks-count">
                            📋 {project.tasks?.length || 0} tasks
                          </span>
                          <span className="project-date">
                            📅 {formatDate(project.start_date)}
                          </span>
                        </div>

                        <div className="project-actions">
                          <button 
                            className="view-btn"
                            onClick={() => handleViewDetails(project.id)}
                          >
                            View Details
                          </button>
                          <button 
                            className="delete-btn"
                            onClick={() => handleDeleteProject(project.id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📁</div>
                  <h3>No Projects Yet</h3>
                  <p>Create your first project to get started</p>
                  <button 
                    className="create-project-btn empty-btn"
                    onClick={() => setShowModal(true)}
                  >
                    <span className="btn-icon">+</span>
                    Create My First Project
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Current Project Section */}
        {activeSection === 'current' && (
          <div className="current-project-page">
            <div className="welcome-message">
              <h1>Current Project 🚀</h1>
              <p>Track your ongoing project</p>
            </div>
            
            {projects.length > 0 ? (
              <div className="current-project-details">
                <div className="current-project-card">
                  <h3>{projects[0].title}</h3>
                  <p className="project-description">{projects[0].description || 'No description'}</p>
                  <div className="project-info">
                    <span>Start Date: {formatDate(projects[0].start_date)}</span>
                    <span>Tasks: {projects[0].tasks?.length || 0}</span>
                    <span>Progress: {calculateProgress(projects[0].tasks)}%</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-project-state">
                <div className="empty-icon">🚀</div>
                <h3>No Current Project</h3>
                <p>Start a new project to see details here</p>
                <button 
                  className="create-project-btn empty-btn"
                  onClick={() => setShowModal(true)}
                >
                  <span className="btn-icon">+</span>
                  Start a Project
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close-btn"
              onClick={() => setShowModal(false)}
            >
              ×
            </button>
            
            <h2>Create New Project</h2>
            <form onSubmit={handleCreateProject}>
              <div className="form-group">
                <label htmlFor="username">User</label>
                <input
                  type="text"
                  id="username"
                  value={getUserName()}
                  readOnly
                  disabled
                  className="readonly-input"
                />
                <small className="field-note">Automatically selected from your profile</small>
              </div>
              
              <div className="form-group">
                <label htmlFor="projectTitle">Project Title *</label>
                <input
                  type="text"
                  id="projectTitle"
                  placeholder="Enter your project title"
                  required
                  maxLength="200"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="projectDescription">Description</label>
                <textarea
                  id="projectDescription"
                  placeholder="Describe your project..."
                  rows="4"
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                ></textarea>
              </div>

              <div className="form-group">
                <label htmlFor="startDate">Start Date</label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowModal(false)}
                  disabled={creatingProject}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="create-btn"
                  disabled={creatingProject}
                >
                  {creatingProject ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;