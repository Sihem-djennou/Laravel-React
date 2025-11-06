import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token"); // saved after login

  if (!token) {
    return <Navigate to="/" replace />; // redirect to login
  }

  return children; // allow access
}
