import React from "react";
import { useNavigate } from "react-router-dom";

export default function AuthHome() {
  const navigate = useNavigate();

  return (
    <div className="page auth-home">
      <img src="/logo.png" alt="logo" className="auth-logo" />
      <h1 className="auth-title">Welcome</h1>

      <div className="auth-buttons">
        <button
          className="auth-btn login"
          onClick={() => navigate("/login")}
        >
          Sign In
        </button>

        <button
          className="auth-btn register"
          onClick={() => navigate("/register")}
        >
          Sign Up
        </button>
      </div>
    </div>
  );
}
