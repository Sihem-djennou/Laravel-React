import React, { useEffect, useState } from "react";
import axiosClient from "../axiosClient";
import Navbar from "../components/Navbar";

function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Fetch all projects when dashboard loads
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

  return (
    <>
      <Navbar />

      <div className="dashboard-wrapper">
        <h1 className="title">Tableau de Bord</h1>

        <div className="project-header">
          <h2>Mes Projets</h2>
          <button className="create-project-btn">
            + Nouveau Projet
          </button>
        </div>

        {/* ✅ Loading State */}
        {loading ? (
          <p className="loading">Chargement des projets...</p>
        ) : projects.length === 0 ? (
          <p className="no-projects">Vous n'avez aucun projet.</p>
        ) : (
          <div className="project-list">
            {projects.map((project) => (
              <div key={project.id} className="project-card">
                <h3>{project.name}</h3>
                <p>{project.description || "Aucune description."}</p>

                <button className="view-btn">
                  Voir le projet
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default Dashboard;
