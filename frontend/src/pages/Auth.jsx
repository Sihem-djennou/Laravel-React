import { useState, useEffect } from "react";
import axiosClient from "../axiosClient";
import "./Auth.css";

function Auth() {
  const [showAuth, setShowAuth] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [flip, setFlip] = useState(false);

  /* ================= LOGIN ================= */
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  /* ================= REGISTER ================= */
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [registerError, setRegisterError] = useState("");

  /* ================= OTP ================= */
  const [otpEmail, setOtpEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState(Array(6).fill(""));
  const [otpStep, setOtpStep] = useState(false);
  const [otpMessage, setOtpMessage] = useState("");
  const [timer, setTimer] = useState(60);

  /* ================= OTP TIMER ================= */
  useEffect(() => {
    if (!otpStep || timer === 0) return;
    const interval = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [otpStep, timer]);

  /* ================= LOGIN ================= */
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");

    try {
      const res = await axiosClient.post("/login", {
        email: loginEmail,
        password: loginPassword,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      window.location.href = "/dashboard";
    } catch (err) {
      setLoginError(err.response?.data?.message || "Invalid email or password");
    }
  };

  /* ================= REGISTER ================= */
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError("");
    setOtpMessage("");

    try {
      await axiosClient.post("/register", {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      });

      await axiosClient.post("/send-otp", { email });

      setOtpEmail(email);
      setOtpStep(true);
      setTimer(60);
      setOtpMessage("OTP code sent to your email.");
    } catch (err) {
      setRegisterError(
        err.response?.data?.message ||
        err.response?.data?.errors?.email?.[0] ||
        "Registration failed"
      );
    }
  };

  /* ================= OTP INPUT ================= */
  const handleOtpChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otpDigits];
    newOtp[index] = value;
    setOtpDigits(newOtp);

    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  /* ================= VERIFY OTP ================= */
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const otp = otpDigits.join("");

    try {
      await axiosClient.post("/verify-otp", { email: otpEmail, otp });

      const loginRes = await axiosClient.post("/login", {
        email: otpEmail,
        password,
      });

      localStorage.setItem("token", loginRes.data.token);
      localStorage.setItem("user", JSON.stringify(loginRes.data.user));
      window.location.href = "/dashboard";
    } catch (err) {
      setOtpMessage(err.response?.data?.error || "Invalid OTP code");
    }
  };

  /* ================= RESEND OTP ================= */
  const handleSendOTP = async () => {
    try {
      await axiosClient.post("/send-otp", { email: otpEmail });
      setOtpDigits(Array(6).fill(""));
      setTimer(60);
      setOtpMessage("New OTP sent.");
    } catch {
      setOtpMessage("Failed to resend OTP.");
    }
  };

  /* ================= TAB SWITCH ================= */
  const switchTab = (tab) => {
    setActiveTab(tab);
    setFlip(tab === "register");
    setLoginError("");
    setRegisterError("");
  };

  return (
    <div className="get-started-container">
      <div className={`background ${showAuth ? "blurred" : ""}`} />

      {!showAuth && (
        <div className="get-started-button-container">
          <button className="tab-button" onClick={() => setShowAuth(true)}>
            Get Started
          </button>
        </div>
      )}

      {showAuth && (
        <div className="auth-modal-overlay">
          <div className="auth-container">

            {/* Tabs */}
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

            {/* Flip Card */}
            <div className="flip-card-wrapper">
              <div className={`flip-card ${flip ? "flipped" : ""}`}>

                {/* LOGIN */}
                <form onSubmit={handleLogin} className="form form-front">
                  <h2>Sign In</h2>
                  {loginError && <p className="form-error">{loginError}</p>}
                  <input className="form-input" placeholder="Email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} />
                  <input className="form-input" type="password" placeholder="Password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} />
                  <button className="form-button">Sign In</button>
                </form>

                {/* REGISTER */}
                <form onSubmit={handleRegister} className="form form-back">
                  <h2>Create Account</h2>
                  {registerError && <p className="form-error">{registerError}</p>}
                  <input className="form-input" placeholder="Username" value={name} onChange={e => setName(e.target.value)} />
                  <input className="form-input" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
                  <input className="form-input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                  <input className="form-input" type="password" placeholder="Confirm Password" value={passwordConfirmation} onChange={e => setPasswordConfirmation(e.target.value)} />
                  <button className="form-button">Create Account</button>
                </form>
              </div>
            </div>

            <button className="close-modal" onClick={() => setShowAuth(false)}>✖</button>
          </div>
        </div>
      )}

      {/* ================= OTP MODAL ================= */}
      {otpStep && (
        <div className="otp-modal-overlay">
          <div className="otp-container otp-animate">
            <h2>OTP Verification</h2>

            <form onSubmit={handleVerifyOTP}>
              <div className="otp-inputs">
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    className="otp-box"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, i)}
                  />
                ))}
              </div>

              <button className="form-button">Verify OTP</button>
            </form>

            {otpMessage && <p className="form-success">{otpMessage}</p>}

            {timer > 0 ? (
              <p className="otp-timer">
                Resend available in <span>{timer}</span>s
              </p>
            ) : (
              <button className="resend-otp-btn" onClick={handleSendOTP}>
                Resend OTP
              </button>
            )}

            <button className="close-modal" onClick={() => setOtpStep(false)}>✖</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Auth;
