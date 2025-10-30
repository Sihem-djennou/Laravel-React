import React from "react";
import "./App.css";

function App() {
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
        <div> <label >don't have account</label>creat<a></a></div>
     

        <button type="submit">Se connecter</button>
      </form>
    </div>
  );
}

export default App;
