import React from "react";
import "./App.css";
import { Link } from "react-router-dom";

function Register() {
  return (
    <div className="login-container">
      <h2>Créer un compte</h2>

      <form className="login-form">
        <div className="input-group">
          <label>Nom d'utilisateur</label>
          <input type="text" placeholder="Entrez votre nom d'utilisateur" />
        </div>

        <div className="input-group">
          <label>Email</label>
          <input type="email" placeholder="Entrez votre email" />
        </div>

        <div className="input-group">
          <label>Mot de passe</label>
          <input type="password" placeholder="Entrez votre mot de passe" />
        </div>

        <div className="input-group">
          <label>Confirmez le mot de passe</label>
          <input type="password" placeholder="Confirmez votre mot de passe" />
        </div>

        <button type="submit">Créer le compte</button>

        <p>
          Vous avez déjà un compte ?{" "}
          <Link to="/" className="signup-link">Se connecter</Link>


        </p>
      </form>
    </div>
  );
}

export default Register;
