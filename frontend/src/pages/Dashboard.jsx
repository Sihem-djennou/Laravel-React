import React, { useEffect, useState } from "react";
import axiosClient from "../axiosClient";
import "./Dashboard.css";
import { FiHome, FiFolder, FiPlusCircle, FiLogOut, FiMenu } from "react-icons/fi";

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    axiosClient
      .get("/projects")
      .then(({ data }) => {
        setProjects(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading projects:", err);
        setLoading(false);
      });
  }, []);

  // ======== LOGOUT =========
  const handleLogout = () => {
    axiosClient
      .logout()
      .catch(() => {})
      .finally(() => {
        localStorage.removeItem("token");
        window.location.href = "/";
      });
  };

  return (
    <div className="dashboard-container">

      {/* ===== HEADER ===== */}
      <header className="header">
        <div className="header-left">
          <FiMenu className="menu-icon" onClick={() => setSidebarOpen(!sidebarOpen)} />
          <h1 className="header-title">Dashboard</h1>
        </div>

        {/* Bouton Déconnexion */}
        <button className="logout-btn" onClick={handleLogout}>
          <FiLogOut /> Déconnexion
        </button>
      </header>

      {/* ===== SIDEBAR ===== */}
      <aside className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <h2 className="sidebar-title">Navigation</h2>

        <button className="sidebar-item">
          <FiHome /> Accueil
        </button>

        <button className="sidebar-item">
          <FiFolder /> Mes Projets
        </button>

        <button className="sidebar-item">
          <FiPlusCircle /> Nouveau Projet
        </button>
      </aside>

      {/* ===== CONTENT ===== */}
      <main className="content">
        <div className="content-header">
          <h2 className="section-title">Mes Projets</h2>

          <button className="create-project-btn">
            <FiPlusCircle /> Nouveau Projet
          </button>
        </div>

        {loading ? (
          <p className="loading">Chargement des projets...</p>
        ) : projects.length === 0 ? (
          <p className="no-projects">Vous n'avez aucun projet.</p>
        ) : (
          <div className="project-grid">
            {projects.map((project) => (
              <div key={project.id} className="project-card">
                <h3>{project.name}</h3>
                <p>{project.description || "Aucune description."}</p>

                <button className="view-btn">Voir le Projet</button>
              </div>
            ))}
          </div>
        )}
      </main>

    </div>
  );
}

export default Dashboard;
