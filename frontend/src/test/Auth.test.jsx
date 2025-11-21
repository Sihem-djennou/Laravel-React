// src/test/Auth.test.jsx
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, test, vi, expect, beforeEach } from "vitest";
import Auth from "../pages/Auth"; // adapte le chemin si nécessaire
import axiosClient from "../axiosClient";

// Remplace jest.mock par vi.mock pour Vitest
vi.mock("../axiosClient");

describe("Auth Component", () => {
  beforeEach(() => {
    // Clear mocks avant chaque test
    vi.clearAllMocks();
    localStorage.clear();
  });

  test("affiche le bouton Get Started", () => {
    render(<Auth />);
    expect(screen.getByText("Get Started")).toBeInTheDocument();
  });

  test("ouvre la modale après clic", () => {
    render(<Auth />);
    fireEvent.click(screen.getByText("Get Started"));
    expect(screen.getByText("Connexion")).toBeInTheDocument();
    expect(screen.getByText("Créer un compte")).toBeInTheDocument();
  });

  test("bascule vers l’onglet Register (flip card)", () => {
    render(<Auth />);
    fireEvent.click(screen.getByText("Get Started"));

    fireEvent.click(screen.getByText("Sign Up"));
    expect(screen.getByPlaceholderText("Nom d'utilisateur")).toBeInTheDocument();
  });

  test("réalise un login réussi", async () => {
    // Mock axiosClient pour le login réussi
    axiosClient.post.mockResolvedValue({
      data: { token: "abc123", user: { name: "Test" } },
    });

    render(<Auth />);
    fireEvent.click(screen.getByText("Get Started"));

    const emailInputs = screen.getAllByPlaceholderText("Email");
    fireEvent.change(emailInputs[0], { target: { value: "test@email.com" } });

    const passwordInputs = screen.getAllByPlaceholderText("Mot de passe");
    fireEvent.change(passwordInputs[0], { target: { value: "123456" } });

    fireEvent.click(screen.getByText("Se connecter"));

    await waitFor(() => {
      expect(localStorage.getItem("token")).toBe("abc123");
    });
  });

  test("affiche une erreur de login", async () => {
    // Mock axiosClient pour retourner une erreur
    axiosClient.post.mockRejectedValue({
      response: { data: { message: "Email incorrect" } },
    });

    render(<Auth />);
    fireEvent.click(screen.getByText("Get Started"));

    const emailInputs = screen.getAllByPlaceholderText("Email");
    fireEvent.change(emailInputs[0], { target: { value: "wrong@email.com" } });

    const passwordInputs = screen.getAllByPlaceholderText("Mot de passe");
    fireEvent.change(passwordInputs[0], { target: { value: "wrongpass" } });

    fireEvent.click(screen.getByText("Se connecter"));

    await waitFor(() => {
      expect(
        screen.getByText((content) => content.includes("Email incorrect"))
      ).toBeInTheDocument();
    });
  });

  test("ferme la modale", () => {
    render(<Auth />);
    fireEvent.click(screen.getByText("Get Started"));

    const closeBtn = screen.getByText("✖");
    fireEvent.click(closeBtn);

    expect(screen.queryByText("Connexion")).not.toBeInTheDocument();
  });
});
