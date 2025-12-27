import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ReactFlow, { MiniMap, Controls, Background } from "reactflow";
import "reactflow/dist/style.css";

import axiosClient from "../axiosClient";
import { buildPertNodes, buildPertEdgesWithArcs, findCriticalPath } from "../utils/pertUtils";
import PertNode from "../components/PertNode";

import "./Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const reactFlowRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  /* ================= STATE ================= */
  const [user, setUser] = useState(null);
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showPert, setShowPert] = useState(false);
  const [pertGraph, setPertGraph] = useState({ nodes: [], edges: [], projectDuration: 0 });
  const [criticalPath, setCriticalPath] = useState([]);
  const [projectStartDate, setProjectStartDate] = useState(new Date());

  /* ================= EFFECT ================= */
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/");
      return;
    }

    setUser(JSON.parse(storedUser));
    fetchProjects();
  }, []);

  /* ================= API ================= */
  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get("/projects");
      setProjects(res.data);
    } catch (err) {
      console.error("Failed to fetch projects", err);
    } finally {
      setLoading(false);
    }
  };

  const loadPert = async (projectId) => {
    try {
      const res = await axiosClient.get(`/projects/${projectId}/pert`);

      if (!res.data?.nodes?.length) {
        alert("No PERT data available");
        return;
      }

      // Extract data from response
      const rawNodes = res.data.nodes || [];
      let criticalPathData = res.data.critical_path || [];
      const projectDuration = res.data.project_duration || 0;
      const startDate = res.data.start_date ? new Date(res.data.start_date) : new Date();
      
      setProjectStartDate(startDate);

      // If no critical path provided, calculate it
      if (!criticalPathData.length) {
        criticalPathData = findCriticalPath(rawNodes);
      }

      // Build nodes and edges
      const { nodes, projectDuration: calculatedDuration } = buildPertNodes(
        rawNodes, 
        criticalPathData, 
        startDate
      );
      const edges = buildPertEdgesWithArcs(rawNodes, criticalPathData);
      
      // Add node type for ReactFlow
      const nodesWithType = nodes.map((n) => ({ ...n, type: "pertNode" }));

      setPertGraph({ 
        nodes: nodesWithType, 
        edges, 
        projectDuration: projectDuration || calculatedDuration 
      });
      setCriticalPath(criticalPathData);
      setShowPert(true);
    } catch (e) {
      console.error("Failed to load PERT:", e);
      alert("Failed to load PERT: " + (e.message || "Unknown error"));
    }
  };

  /* ================= ACTIONS ================= */
  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (reactFlowRef.current?.requestFullscreen) {
        reactFlowRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  const filteredProjects = projects.filter(
    (p) =>
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.description?.toLowerCase().includes(search.toLowerCase())
  );

  const avatarLetter = user?.name?.charAt(0)?.toUpperCase();

  /* ================= PERT GUIDE DATA ================= */
  const pertGuideItems = [
    {
      term: "ES (Early Start)",
      definition: "The earliest possible time a task can start, based on all predecessor tasks.",
      example: "If Task B depends on Task A (4 days), ES of B = Day 5"
    },
    {
      term: "EF (Early Finish)",
      definition: "The earliest possible time a task can finish (ES + Duration).",
      example: "If Task B starts on Day 5 and takes 3 days, EF = Day 8"
    },
    {
      term: "LS (Late Start)",
      definition: "The latest possible time a task can start without delaying the project.",
      example: "If project end is Day 20 and Task B takes 3 days, LS = Day 17"
    },
    {
      term: "LF (Late Finish)",
      definition: "The latest possible time a task can finish without delaying the project.",
      example: "LF = LS + Duration"
    },
    {
      term: "Slack/Float",
      definition: "The amount of time a task can be delayed without affecting project completion.",
      example: "Slack = LS - ES = LF - EF"
    },
    {
      term: "Critical Path",
      definition: "The sequence of tasks with ZERO slack - any delay delays the entire project.",
      example: "Longest path through the project network"
    }
  ];

  /* ================= RENDER ================= */
  return (
    <div className="dashboard-container">
      {/* ================= HEADER ================= */}
      <header className="header">
        <div className="header-content">
          <div className="menu-icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            ☰
          </div>
          <div className="site-name">Manaject</div>
        </div>
      </header>

      {/* ================= SIDEBAR ================= */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-content">
          <div className="profile-section">
            <div className="profile-header">
              <div className="profile-avatar">{avatarLetter}</div>
              <div className="profile-info">
                <h3>{user?.name}</h3>
                <p>{user?.email}</p>
              </div>
            </div>
          </div>

          <nav className="sidebar-nav">
            <button className="sidebar-item active">
              <span className="item-icon">🏠</span> Dashboard
            </button>
            <button className="sidebar-item">
              <span className="item-icon">📊</span> Projects
            </button>
          </nav>

          <div className="sidebar-footer">
            <button className="logout-btn" onClick={handleLogout}>
              🚪 Logout
            </button>
          </div>
        </div>
      </aside>

      {/* ================= CONTENT ================= */}
      <main className="content">
        <section className="home-section">
          <div className="welcome-message">
            <h1>Welcome back...{user?.name}</h1>
            <p>Manage your projects efficiently.</p>
          </div>

          <div className="search-actions-container">
            <div className="search-container">
              <input
                className="search-input"
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <span className="search-icon">🔍</span>
            </div>

            <button className="create-project-btn">
              <span className="btn-icon">＋</span> New Project
            </button>
          </div>

          <div className="projects-section">
            <div className="section-header">
              <h2 className="section-title">Projects</h2>
              <div className="projects-count">{filteredProjects.length} Projects</div>
            </div>

            {loading ? (
              <p className="loading-text">Loading projects...</p>
            ) : filteredProjects.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📂</div>
                <h3>No projects yet</h3>
                <p>Create your first project to get started</p>
              </div>
            ) : (
              <div className="project-grid">
                {filteredProjects.map((project) => (
                  <div className="project-card" key={project.id}>
                    <h3>{project.title}</h3>
                    <p>{project.description || "No description"}</p>

                    <div className="project-actions">
                      <button
                        className="view-btn"
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        View
                      </button>

                      <button
                        className="pert-btn"
                        onClick={() => loadPert(project.id)}
                      >
                        PERT
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {/* ================= PERT MODAL ================= */}
      {showPert && (
        <div className="pert-overlay" onClick={() => setShowPert(false)}>
          <div className={`pert-modal ${isFullscreen ? 'fullscreen' : ''}`} onClick={(e) => e.stopPropagation()}>
            <div className="pert-header">
              <div className="pert-header-left">
                <h2>PERT Planning</h2>
                <div className="pert-subtitle">
                  Project Start: {projectStartDate.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
              </div>
              <div className="pert-header-right">
                <button 
                  className="fullscreen-btn"
                  onClick={toggleFullscreen}
                  title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                  {isFullscreen ? "⤓" : "⤢"}
                </button>
                <button className="close-btn" onClick={() => setShowPert(false)}>
                  ×
                </button>
              </div>
            </div>

            <div className="pert-content">
              {/* Left Sidebar with Guide and Critical Path */}
              <div className="pert-sidebar">
                {/* PERT Terminology Guide */}
                <div className="pert-guide-card">
                  <h3>📊 PERT Terminology Guide</h3>
                  <div className="pert-terms-list">
                    {pertGuideItems.map((item, index) => (
                      <div key={index} className="pert-term-item">
                        <div className="pert-term-header">
                          <span className="pert-term-name">{item.term}</span>
                        </div>
                        <div className="pert-term-definition">{item.definition}</div>
                        <div className="pert-term-example">
                          <strong>Example:</strong> {item.example}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Edge Example */}
                  <div className="edge-example">
                    <h4>🔴 Arc Dependency Example:</h4>
                    <div className="example-visual">
                      <div className="example-node">Task A</div>
                      <div className="example-arc-container">
                        <div className="example-arc-line critical"></div>
                        <div className="example-arrow"></div>
                      </div>
                      <div className="example-node">Task B</div>
                    </div>
                    <p className="example-description">
                      <strong>Task B depends on Task A</strong><br/>
                      Arcs show task dependencies. Red arcs indicate critical path.
                    </p>
                  </div>
                </div>

                {/* Critical Path Info */}
                <div className="critical-path-card">
                  <h3>🎯 Critical Path Analysis</h3>
                  <div className="path-summary">
                    <div className="summary-item">
                      <span className="summary-label">Project Duration:</span>
                      <span className="summary-value">{pertGraph.projectDuration} days</span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Completion Date:</span>
                      <span className="summary-value">
                        {(() => {
                          const endDate = new Date(projectStartDate);
                          endDate.setDate(endDate.getDate() + pertGraph.projectDuration);
                          return endDate.toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          });
                        })()}
                      </span>
                    </div>
                    <div className="summary-item">
                      <span className="summary-label">Critical Tasks:</span>
                      <span className="summary-value critical-count">{criticalPath.length}</span>
                    </div>
                  </div>
                  
                  {criticalPath.length > 0 && (
                    <div className="critical-tasks-list">
                      <h4>Critical Tasks (Zero Slack):</h4>
                      <div className="tasks-scroll">
                        {criticalPath.map((taskId, index) => {
                          const node = pertGraph.nodes.find((n) => n.id === taskId);
                          const label = node?.data?.label?.label || node?.data?.label?.full_label || `Task ${taskId}`;
                          const duration = node?.data?.label?.duration || "N/A";
                          const es = node?.data?.label?.es || 0;
                          const ls = node?.data?.label?.ls || 0;
                          const ef = node?.data?.label?.ef || 0;
                          const lf = node?.data?.label?.lf || 0;
                          const slack = node?.data?.label?.slack || 0;
                          
                          return (
                            <div key={taskId} className="critical-task-item">
                              <div className="task-index">{index + 1}</div>
                              <div className="task-details">
                                <div className="task-name">{label}</div>
                                <div className="task-metrics">
                                  <span className="metric">ES: {es}</span>
                                  <span className="metric">EF: {ef}</span>
                                  <span className="metric">LS: {ls}</span>
                                  <span className="metric">LF: {lf}</span>
                                  <span className="metric">Slack: {slack}</span>
                                  <span className="metric">Dur: {duration}d</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* PERT Graph */}
              <div className="pert-graph-container" ref={reactFlowRef}>
                {pertGraph.nodes.length > 0 ? (
                  <div className="reactflow-wrapper">
                    <ReactFlow
                      nodes={pertGraph.nodes}
                      edges={pertGraph.edges}
                      nodeTypes={{ pertNode: PertNode }}
                      fitView
                      fitViewOptions={{ padding: 0.3, duration: 800 }}
                      defaultEdgeOptions={{
                        type: 'smoothstep',
                        animated: false,
                        style: { strokeWidth: 2 }
                      }}
                    >
                      <Background variant="dots" gap={20} size={1} />
                      <MiniMap 
                        nodeStrokeColor={(n) => (n.data?.isCritical ? '#ff4444' : '#1976d2')}
                        nodeColor={(n) => (n.data?.isCritical ? '#fff0f0' : '#e3f2fd')}
                      />
                      <Controls />
                    </ReactFlow>
                    
                    {/* Arc Legend */}
                    <div className="arc-legend">
                      <div className="arc-legend-title">Dependency Arcs:</div>
                      <div className="arc-legend-items">
                        <div className="arc-legend-item">
                          <div className="arc-sample critical"></div>
                          <span>Critical Path Arc</span>
                        </div>
                        <div className="arc-legend-item">
                          <div className="arc-sample normal"></div>
                          <span>Normal Dependency Arc</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="empty-pert-graph">
                    <div className="empty-icon">📊</div>
                    <h3>No PERT Data Available</h3>
                    <p>This project doesn't have task dependencies defined.</p>
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