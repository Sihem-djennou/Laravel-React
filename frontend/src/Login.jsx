import React from "react";
import { Link } from "react-router-dom";
import "./App.css";

function Login() {
  return (
    <div className="login-container">
      <h2>Connexion</h2>
      <form className="login-form">
        <div className="input-group">
          <label>Email</label>
          <input type="email" placeholder="Entrez votre email" />
        </div>

        <div className="input-group">
          <label>Nom d'utilisateur</label>
          <input type="text" placeholder="Entrez votre nom d'utilisateur" />
        </div>

        <div className="input-group">
          <label>Mot de passe</label>
          <input type="password" placeholder="Entrez votre mot de passe" />
        </div>

        <button type="submit">Se connecter</button>

        <p>
          Vous n'avez pas de compte ?{" "}
          <Link to="/register" className="signup-link">Créer un compte</Link>
        </p>
      </form>
    </div>
  );
}

export default Login;
