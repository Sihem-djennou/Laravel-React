import React, { useState } from "react";
import axiosClient from "../axiosClient";
import "./Auth.css";

function Auth() {
  const [activeTab, setActiveTab] = useState("login");
  const [flip, setFlip] = useState(false);

  // LOGIN state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // REGISTER state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password_confirmation, setConfirm] = useState("");
  const [registerError, setRegisterError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axiosClient.post("/login", {
        email: loginEmail,
        password: loginPassword,
      });

      localStorage.setItem("token", response.data.token);
      window.location.href = "/dashboard";

    } catch {
      setLoginError("Email ou mot de passe incorrect");
    }
  };

  const handleRegister = (e) => {
    e.preventDefault();

    axiosClient
      .post("/register", {
        name,
        email,
        password,
        password_confirmation,
      })
      .then(() => {
        alert("Compte créé ✅");
        setActiveTab("login");
        setFlip(false);
      })
      .catch((err) => {
        setRegisterError(err.response?.data?.message || "Erreur");
      });
  };

  // Switch tab
  const switchTab = (tab) => {
    setActiveTab(tab);
    setFlip(tab === "register");
  };

  return (
    <div className="auth-container">

      {/* ✅ TABS */}
      <div className="tab-buttons">
        <button
          onClick={() => switchTab("login")}
          className={activeTab === "login" ? "active" : ""}
        >
          Sign In
        </button>

        <button
          onClick={() => switchTab("register")}
          className={activeTab === "register" ? "active" : ""}
        >
          Sign Up
        </button>
      </div>

      {/* ✅ FLIP CARD */}
      <div className={`form-card ${flip ? "flip" : ""}`}>

        {/* ✅ LOGIN FORM */}
        <form className="form login-form" onSubmit={handleLogin}>
          <h2>Connexion</h2>

          {loginError && <p className="error">{loginError}</p>}

          <input
            type="email"
            placeholder="Email"
            value={loginEmail}
            onChange={(e) => setLoginEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Mot de passe"
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            required
          />

          <button type="submit">Se connecter</button>
        </form>

        {/* ✅ REGISTER FORM */}
        <form className="form register-form" onSubmit={handleRegister}>
          <h2>Créer un compte</h2>

          {registerError && <p className="error">{registerError}</p>}

          <input
            placeholder="Nom d'utilisateur"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Confirmez le mot de passe"
            value={password_confirmation}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />

          <button type="submit">Créer le compte</button>
        </form>

      </div>
    </div>
  );
}

export default Auth;
