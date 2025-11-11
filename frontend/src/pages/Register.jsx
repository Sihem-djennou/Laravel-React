import React, { useState } from "react";
import axiosClient from "../axiosClient";
import { Link, useNavigate } from "react-router-dom";
import "../App.css"; // ✅ make sure animations apply

function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password_confirmation, setConfirm] = useState("");
  const [error, setError] = useState(null);

  const submit = (e) => {
    e.preventDefault();

    axiosClient
      .post("/register", {
        name,
        email,
        password,
        password_confirmation,
      })
      .then(() => {
        alert("Compte créé avec succès ✅");
        navigate("/");
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Une erreur est survenue");
      });
  };

  return (
    // ✅ Animation wrapper added here
    <div className="page slide-left">

      {/* ✅ Your old container untouched */}
      <div className="login-container">
        <h2>Créer un compte</h2>

        {error && <p className="error">{error}</p>}

        <form className="login-form" onSubmit={submit}>
          <div className="input-group">
            <label>Nom d'utilisateur</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Mot de passe</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <label>Confirmez le mot de passe</label>
            <input
              type="password"
              value={password_confirmation}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>

          <button type="submit">Créer le compte</button>

          <p>
            Vous avez déjà un compte ? <Link to="/">Se connecter</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;
