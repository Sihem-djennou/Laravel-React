import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactFlow, { MiniMap, Controls, Background } from 'reactflow';
import 'reactflow/dist/style.css';
import axiosClient from '../axiosClient';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();

  /* ===================== STATES ===================== */
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');

  const [showPert, setShowPert] = useState(false);
   const [pertGraph, setPertGraph] = useState({ nodes: [], edges: [] });
  
  const [criticalPath, setCriticalPath] = useState([]);

  /* ===================== EFFECTS ===================== */
  useEffect(() => {
    fetchProjects();
  }, []);

  /* ===================== API ===================== */
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/projects');
      setProjects(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

 const loadPert = async (projectId) => {
  try {
    console.log('=== LOADING PERT ===');
    console.log('Project ID:', projectId);
    
    // D'abord, essayez de fixer les données si nécessaire
    try {
      const fixRes = await axiosClient.post(`/projects/${projectId}/pert/fix`);
      console.log('Fix response:', fixRes.data);
    } catch (fixErr) {
      console.log('No fix needed or fix failed:', fixErr.message);
    }

    // Maintenant chargez le PERT
    const res = await axiosClient.get(`/projects/${projectId}/pert`);
    console.log('PERT Response:', res.data);

    if (res.data.error) {
      alert(`PERT Error: ${res.data.error}`);
      return;
    }

    if (!res.data?.nodes?.length) {
      alert('No PERT data available');
      return;
    }

    // Créer les nodes pour ReactFlow
    const nodes = res.data.nodes.map((node, index) => {
      const isCritical = res.data.critical_path?.includes(node.id.toString());
      const row = Math.floor(index / 4); // 4 nodes par ligne
      const col = index % 4;
      
      return {
        id: node.id.toString(),
        position: { x: col * 220, y: row * 180 },
        data: {
          label: (
            <div style={{ 
              textAlign: 'center', 
              minWidth: '150px',
              padding: '8px'
            }}>
              <strong style={{ 
                color: isCritical ? '#d32f2f' : '#1976d2',
                fontSize: '14px'
              }}>
                {node.full_label || node.label}
              </strong>
              <div style={{ fontSize: '11px', marginTop: '6px' }}>
                ES: {node.es} | EF: {node.ef}
              </div>
              <div style={{ fontSize: '11px' }}>
                LS: {node.ls} | LF: {node.lf}
              </div>
              <div style={{ 
                fontSize: '10px', 
                color: isCritical ? '#d32f2f' : '#666',
                marginTop: '4px',
                fontWeight: isCritical ? 'bold' : 'normal'
              }}>
                {isCritical ? 'CRITICAL' : `Slack: ${node.slack}`}
              </div>
            </div>
          )
        },
        style: {
          border: isCritical ? '3px solid #d32f2f' : '2px solid #1976d2',
          borderRadius: '10px',
          padding: '10px',
          background: isCritical ? '#fff5f5' : '#f5faff',
          width: '170px',
          height: 'auto',
          boxShadow: isCritical 
            ? '0 4px 12px rgba(211, 47, 47, 0.2)' 
            : '0 3px 10px rgba(25, 118, 210, 0.1)'
        }
      };
    });

  const edges = res.data.edges?.map((e, i) => ({
  id: `e${i}`,
  source: e.from.toString(),
  target: e.to.toString(),
  animated: e.critical || false,
  style: { 
    stroke: e.critical ? '#d32f2f' : '#1976d2', 
    strokeWidth: e.critical ? 3 : 2,
    opacity: e.critical ? 1 : 0.7
  },
  className: e.critical ? 'critical' : 'normal', 
  markerEnd: {
    type: 'arrowclosed',
    color: e.critical ? '#d32f2f' : '#1976d2',
    width: 20,
    height: 20
  },
  type: 'smoothstep'
})) || [];

    console.log('Processed nodes:', nodes);
    console.log('Processed edges:', edges);
    console.log('Critical path:', res.data.critical_path);
    console.log('Project duration:', res.data.project_duration);
    
    setPertGraph({ nodes, edges });
    setCriticalPath(res.data.critical_path?.map(id => id.toString()) || []);
    setShowPert(true);

  } catch (e) {
    console.error('=== PERT LOAD ERROR ===');
    console.error('Error:', e);
    console.error('Response:', e.response?.data);
    
    // Essayez la route debug pour voir ce qui ne va pas
    try {
      const debugRes = await axiosClient.get(`/projects/${projectId}/pert/debug`);
      console.log('Debug data:', debugRes.data);
      
      if (debugRes.data.tasks && debugRes.data.dependencies) {
        alert(`Cannot generate PERT:\n- Tasks: ${debugRes.data.tasks.length}\n- Dependencies: ${debugRes.data.dependencies.length}\nNeed at least 2 tasks and 1 dependency.`);
      }
    } catch (debugErr) {
      console.error('Debug failed:', debugErr);
    }
    
    alert('Failed to load PERT: ' + (e.response?.data?.error || e.message));
  }
};

  /* ===================== ACTIONS ===================== */
  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const res = await axiosClient.post('/projects', {
        user_id: user.id,
        title,
        description,
        start_date: startDate || null,
      });
      setProjects([res.data, ...projects]);
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      setStartDate('');
    } catch {
      alert('Error creating project');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete project ?')) return;
    await axiosClient.delete(`/projects/${id}`);
    setProjects(projects.filter(p => p.id !== id));
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };
const loadProjectTasks = async (projectId) => {
  try {
    const res = await axiosClient.get(`/projects/${projectId}/tasks`);
    setTasks(res.data);
    return res.data;
  } catch (e) {
    console.error('Error loading tasks:', e);
    // Retourner un tableau vide en cas d'erreur
    return [];
  }
};

const loadProjectDependencies = async (projectId) => {
  try {
    const res = await axiosClient.get(`/projects/${projectId}/dependencies`);
    setDependencies(res.data);
    return res.data;
  } catch (e) {
    console.error('Error loading dependencies:', e);
    // Retourner un tableau vide en cas d'erreur
    return [];
  }
};

const createTask = async (projectId) => {
  try {
    const res = await axiosClient.post(`/projects/${projectId}/tasks/simple`, {
      name: taskName,
      optimistic_time: parseFloat(optimisticTime),
      most_likely_time: parseFloat(mostLikelyTime),
      pessimistic_time: parseFloat(pessimisticTime),
    });
    
    setTasks([...tasks, res.data]);
    setTaskName('');
    setOptimisticTime('');
    setMostLikelyTime('');
    setPessimisticTime('');
    
    return res.data;
  } catch (e) {
    console.error('Error creating task:', e);
    alert('Error creating task: ' + (e.response?.data?.error || e.message));
  }
};

const createDependency = async (projectId) => {
  try {
    const res = await axiosClient.post(`/projects/${projectId}/dependencies`, {
      predecessor_task_id: predecessorTaskId,
      successor_task_id: successorTaskId,
    });
    
    setDependencies([...dependencies, res.data]);
    setPredecessorTaskId('');
    setSuccessorTaskId('');
    
    return res.data;
  } catch (e) {
    console.error('Error creating dependency:', e);
    alert('Error creating dependency: ' + (e.response?.data?.error || e.message));
  }
};
  /* ===================== HELPERS ===================== */
  const filteredProjects = projects.filter(p =>
    p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* ===================== RENDER ===================== */
  return (
    <div className="dashboard-container">

      {/* ================= HEADER ================= */}
      <header className="header">
        <div className="header-content">
          <div
            className="menu-icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            ☰
          </div>
          <span className="site-name">ManaJect</span>
        </div>
      </header>

      {/* ================= SIDEBAR ================= */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-content">

          <div className="profile-section">
            <div className="profile-header">
              <div className="profile-avatar">IM</div>
              <div className="profile-info">
                <h3>Admin</h3>
                <p>Dashboard</p>
              </div>
            </div>
          </div>

          <div className="sidebar-nav">
            <button
              className={`sidebar-item ${activeSection === 'home' ? 'active' : ''}`}
              onClick={() => setActiveSection('home')}
            >
              <span className="item-icon">🏠</span>
              Home
            </button>

            <button
              className={`sidebar-item ${activeSection === 'current' ? 'active' : ''}`}
              onClick={() => setActiveSection('current')}
            >
              <span className="item-icon">🚀</span>
              Current
            </button>
          </div>

          <div className="sidebar-footer">
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>

        </div>
      </aside>

      {/* ================= CONTENT ================= */}
      <main className="content">

        {/* SEARCH + ACTIONS */}
        <div className="search-actions-container">
          <div className="search-container">
            <input
              className="search-input"
              placeholder="Search project..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <span className="search-icon">🔍</span>
          </div>

          <button
            className="create-project-btn"
            onClick={() => setShowCreateModal(true)}
          >
            <span className="btn-icon">＋</span>
            New Project
          </button>
        </div>

        {/* PROJECTS */}
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="project-grid">
            {filteredProjects.map(project => (
              <div key={project.id} className="project-card">

                <h3>{project.title}</h3>
                <p>{project.description || 'No description'}</p>

                <div className="project-actions">
                  <button onClick={() => navigate(`/projects/${project.id}`)}>
                    View
                  </button>

                  <button
                    className="pert-btn"
                    onClick={() => {
                      setShowPert(true);
                      loadPert(project.id);
                    }}
                  >
                    PERT
                  </button>

                  <button onClick={() => handleDelete(project.id)}>
                    Delete
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}
      </main>

      {/* ================= CREATE MODAL ================= */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Create Project</h3>
            <form onSubmit={handleCreateProject}>
              <input
                placeholder="Title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
              />
              <textarea
                placeholder="Description"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
              <button type="submit">Create</button>
            </form>
          </div>
        </div>
      )}

      {/* ================= PERT MODAL ================= */}
     {/* ================= PERT MODAL ================= */}
{/* ================= PERT MODAL ================= */}
{/* ================= PERT MODAL ================= */}
{showPert && (
  <div className="pert-overlay" onClick={() => setShowPert(false)}>
    <div className="pert-modal" onClick={e => e.stopPropagation()}>
      <div className="pert-header">
        <h2>PERT Planning</h2>
        <button className="close-btn" onClick={() => setShowPert(false)}>×</button>
      </div>

      <div className="pert-content">
        {/* Chemin critique */}
        <div className="critical-path">
          <h3>Critical Path</h3>
          <div className="path-list">
            {criticalPath.length > 0 ? (
              criticalPath.map((taskId, i) => {
                const task = pertGraph.nodes.find(n => n.id === taskId);
                const taskLabel = task?.data?.label?.props?.children?.[0]?.props?.children || 
                                 `Task ${taskId}`;
                return (
                  <div key={taskId} className="path-item">
                    <span className="path-index">{i + 1}</span>
                    <span>{taskLabel}</span>
                  </div>
                );
              })
            ) : (
              <p>No critical path found</p>
            )}
          </div>
        </div>

        {/* Graphe PERT */}
        <div className="pert-graph-container">
          {pertGraph.nodes.length > 0 ? (
            <ReactFlow
              nodes={pertGraph.nodes}
              edges={pertGraph.edges}
              fitView
              fitViewOptions={{ padding: 0.5 }}
            >
              <Background />
              <MiniMap />
              <Controls />
            </ReactFlow>
          ) : (
            <div className="empty-pert-graph">
              <p>No PERT data available</p>
              <p>Please add tasks and dependencies to generate the PERT chart</p>
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
};

export default Dashboard;

