import React from "react";
import axiosClient from "../axiosClient";
import { useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const logout = () => {
    axiosClient.post("/logout").finally(() => {
      localStorage.removeItem("TOKEN");
      navigate("/");
    });
  };

  return (
    <nav className="navbar">
      <h1>Pert Manager</h1>

      <button onClick={logout} className="logout-btn">
        Déconnexion
      </button>
    </nav>
  );
}

export default Navbar;
