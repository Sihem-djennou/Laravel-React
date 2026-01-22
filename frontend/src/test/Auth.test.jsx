import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Auth from "../pages/Auth.jsx";

// Utiliser vi.hoisted() correctement
const { mockPost } = vi.hoisted(() => ({
  mockPost: vi.fn()
}));

vi.mock("../axiosClient", () => {
  const mockAxiosInstance = {
    post: mockPost,
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  };
  
  // Ajouter la méthode logout si elle existe
  mockAxiosInstance.logout = vi.fn();
  
  return {
    default: mockAxiosInstance
  };
});

describe("Auth Component", () => {
  beforeEach(() => {
    // Reset mocks
    mockPost.mockClear();
    
    // Mock localStorage
    Storage.prototype.setItem = vi.fn();
    Storage.prototype.getItem = vi.fn(() => null);
    
    // Mock window.location
    delete window.location;
    window.location = { href: '' };
    
    render(<Auth />);
  });

  test("renders Get Started button", () => {
    expect(screen.getByText("Get Started")).toBeInTheDocument();
  });

  test("opens modal after clicking Get Started", () => {
    fireEvent.click(screen.getByText("Get Started"));
    expect(screen.getByTestId("sign-in-button")).toBeInTheDocument();
    expect(screen.getByTestId("sign-up-button")).toBeInTheDocument();
  });

  test("successful login", async () => {
    // Mock successful response
    mockPost.mockResolvedValueOnce({
      data: {
        token: "fake-token-123",
        user: { id: 1, name: "Test User" }
      }
    });

    // Open modal
    fireEvent.click(screen.getByText("Get Started"));
    
    // DEBUG: Voir ce qui est dans le DOM
    console.log("DOM après ouverture modal:", document.body.innerHTML);
    
    // Remplir le formulaire CORRECTEMENT
    // Méthode 1: Utiliser getAllByPlaceholderText et prendre les bons indices
    const emailInputs = screen.getAllByPlaceholderText("Email");
    const passwordInputs = screen.getAllByPlaceholderText("Password");
    
    console.log("Email inputs found:", emailInputs.length);
    console.log("Password inputs found:", passwordInputs.length);
    
    // Le formulaire de login est le PREMIER de chaque
    const loginEmail = emailInputs[0];
    const loginPassword = passwordInputs[0];
    
    fireEvent.change(loginEmail, { target: { value: "test@email.com" } });
    fireEvent.change(loginPassword, { target: { value: "123456" } });
    
    // Trouver le BON bouton "Sign In" 
    // Il y a 3 boutons "Sign In" selon le debug:
    // 1. L'onglet (data-testid="sign-in-button")
    // 2. Le bouton du formulaire de login
    // 3. ??? Peut-être un autre bouton
    
    // Méthode sûre: Chercher le bouton dans le formulaire de login
    const forms = document.querySelectorAll('form');
    console.log("Forms found:", forms.length);
    
    // Le premier formulaire devrait être le formulaire de login
    const loginForm = forms[0];
    const loginSubmitButton = loginForm.querySelector('button');
    
    console.log("Login form:", loginForm.innerHTML);
    console.log("Submit button text:", loginSubmitButton?.textContent);
    
    // Cliquer sur le bouton CORRECT
    fireEvent.click(loginSubmitButton);
    
    // Vérifier l'appel API
    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith("/login", {
        email: "test@email.com",
        password: "123456"
      });
    }, { timeout: 2000 });
  });

  test("displays login error", async () => {
    // Mock error
    mockPost.mockRejectedValueOnce({
      response: {
        data: {
          message: "Invalid email or password"
        }
      }
    });

    fireEvent.click(screen.getByText("Get Started"));
    
    // Remplir avec de mauvaises informations
    const emailInputs = screen.getAllByPlaceholderText("Email");
    const passwordInputs = screen.getAllByPlaceholderText("Password");
    
    fireEvent.change(emailInputs[0], { target: { value: "wrong@email.com" } });
    fireEvent.change(passwordInputs[0], { target: { value: "wrongpass" } });
    
    // Trouver et cliquer sur le bouton du formulaire
    const forms = document.querySelectorAll('form');
    const loginForm = forms[0];
    const submitButton = loginForm.querySelector('button');
    
    fireEvent.click(submitButton);
    
    // Attendre l'erreur
    await waitFor(() => {
      expect(screen.getByText("Invalid email or password")).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  test("closes the modal", () => {
    fireEvent.click(screen.getByText("Get Started"));
    fireEvent.click(screen.getByTestId("close-modal"));
    expect(screen.queryByTestId("sign-in-button")).not.toBeInTheDocument();
  });
});