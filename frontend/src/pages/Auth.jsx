import { useState } from "react";
import axiosClient from "../axiosClient";
import "./Auth.css";

function Auth() {
  const [showAuth, setShowAuth] = useState(false);
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
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [registerError, setRegisterError] = useState("");

  // 🔐 Connexion backend
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");

    try {
      const response = await axiosClient.post("/login", {
        email: loginEmail,
        password: loginPassword,
      });

      // ✅ Sauvegarder token et user
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));

      console.log("Login réussi :", response.data);
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Erreur de connexion :", error);
      setLoginError(
        error.response?.data?.message || "Email ou mot de passe incorrect"
      );
    }
  };

  // 🧾 Inscription backend
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError("");

    try {
      const response = await axiosClient.post("/register", {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });

      alert("Compte créé avec succès ✅");

      // ✅ Auto-login après inscription
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Erreur d'inscription :", error);
      setRegisterError(
        error.response?.data?.message ||
          error.response?.data?.errors?.email?.[0] ||
          "Erreur lors de la création du compte"
      );
    }
  };

  // 🎭 Changer d’onglet
  const switchTab = (tab) => {
    setActiveTab(tab);
    setFlip(tab === "register");
    setLoginError("");
    setRegisterError("");
  };

  return (
    <div className="get-started-container">
      <div className={`background ${showAuth ? "blurred" : ""}`} />

      {/* 🔘 Bouton Get Started */}
      {!showAuth && (
        <div className="get-started-button-container">
          <button
            onClick={() => setShowAuth(true)}
            className="tab-button"
          >
            Get Started
          </button>
        </div>
      )}

      {/* 🪟 Modale d’authentification */}
      {showAuth && (
        <div className="auth-modal-overlay">
          <div className="auth-container">
            <div className="tab-buttons">
              <button
                onClick={() => switchTab("login")}
                className={`tab-button ${activeTab === "login" ? "active" : ""}`}
              >
                Sign In
              </button>
              <button
                onClick={() => switchTab("register")}
                className={`tab-button ${activeTab === "register" ? "active" : ""}`}
              >
                Sign Up
              </button>
            </div>

            <div className="flip-card-wrapper">
              <div className={`flip-card ${flip ? "flipped" : ""}`}>
                {/* 🔐 LOGIN FORM */}
                <form onSubmit={handleLogin} className="form form-front">
                  <h2>Connexion</h2>
                  {loginError && <p className="form-error">{loginError}</p>}

                  <input
                    type="email"
                    placeholder="Email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    className="form-input"
                  />

                  <input
                    type="password"
                    placeholder="Mot de passe"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    className="form-input"
                  />

                  <button type="submit" className="form-button">
                    Se connecter
                  </button>
                </form>

                {/* 🧾 REGISTER FORM */}
                <form onSubmit={handleRegister} className="form form-back">
                  <h2>Créer un compte</h2>
                  {registerError && (
                    <p className="form-error">{registerError}</p>
                  )}

                  <input
                    type="text"
                    placeholder="Nom d'utilisateur"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="form-input"
                  />

                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="form-input"
                  />

                  <input
                    type="password"
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength="6"
                    className="form-input"
                  />

                  <input
                    type="password"
                    placeholder="Confirmez le mot de passe"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    required
                    minLength="6"
                    className="form-input"
                  />

                  <button type="submit" className="form-button">
                    Créer le compte
                  </button>
                </form>
              </div>
            </div>

            {/* 🔙 Bouton fermer */}
            <button
              className="close-modal"
              onClick={() => setShowAuth(false)}
            >
              ✖
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Auth;