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
  // OTP state
const [otpEmail, setOtpEmail] = useState("");
const [otpCode, setOtpCode] = useState("");
const [otpStep, setOtpStep] = useState(false); // false = pas encore envoyé
const [otpMessage, setOtpMessage] = useState("");

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
  // 🧾 Inscription backend
const handleRegister = async (e) => {
  e.preventDefault();
  setRegisterError("");
  setOtpMessage("");

  try {
    const response = await axiosClient.post("/register", {
      name,
      email,
      password,
      password_confirmation: passwordConfirmation,
    });

    setOtpEmail(email);       // email pour envoyer le OTP
    setOtpStep(true);         // déclenche la modale OTP

    // 🔑 Appel de la fonction pour envoyer l'OTP
    const otpResponse = await axiosClient.post("/send-otp", { email });
    setOtpMessage(otpResponse.data.message);

  } catch (error) {
    console.error("Erreur d'inscription :", error);
    setRegisterError(
      error.response?.data?.message ||
      error.response?.data?.errors?.email?.[0] ||
      "Erreur lors de la création du compte"
    );
  }
};



// 🔑 OTP - envoyer
const handleSendOTP = async (e) => {
  e.preventDefault();
  setOtpMessage("");

  try {
    const response = await axiosClient.post("/send-otp", {
      email: otpEmail
    });
    setOtpMessage(response.data.message);
    setOtpStep(true);
  } catch (error) {
    console.error("Erreur OTP :", error);
    setOtpMessage(error.response?.data?.error || "Erreur lors de l'envoi du OTP");
  }
};

// 🔑 OTP - vérifier
const handleVerifyOTP = async (e) => {
  e.preventDefault();
  setOtpMessage("");

  try {
    // 1️⃣ Vérifier l’OTP
    await axiosClient.post("/verify-otp", {
      email: otpEmail,
      otp: otpCode.trim()
    });

    // 2️⃣ LOGIN AUTOMATIQUE après OTP
    const loginResponse = await axiosClient.post("/login", {
      email: otpEmail,
      password: password // mot de passe utilisé lors de l'inscription
    });

    // 3️⃣ Sauvegarde token + user
    localStorage.setItem("token", loginResponse.data.token);
    localStorage.setItem("user", JSON.stringify(loginResponse.data.user));

    // 4️⃣ Redirection
    window.location.href = "/dashboard";

  } catch (error) {
    console.error("Erreur vérification OTP :", error);
    setOtpMessage(error.response?.data?.error || "OTP incorrect");
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

            {/* 🔙 Bouton fermer (Sign In / Sign Up) */}
<button
  className="close-modal"
  onClick={() => setShowAuth(false)}
>
  ✖
</button>

{/* 📝 OTP Modal */}
{otpStep && (
  <div className="otp-modal-overlay">
    <div className="otp-container">
      <h2>Vérification OTP</h2>

      <form onSubmit={handleVerifyOTP}>
        <input
          type="text"
          placeholder="Entrez le code OTP"
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value)}
          required
          className="form-input"
        />
        <button type="submit" className="form-button">Vérifier OTP</button>
      </form>

      {otpMessage && <p className="form-error">{otpMessage}</p>}

      <button
        className="close-modal"
        onClick={() => { setOtpStep(false); setOtpMessage(""); }}
      >
        ✖
      </button>
    </div>
  </div>
)}


          </div>
        </div>
      )}
    </div>
  );
}

export default Auth;