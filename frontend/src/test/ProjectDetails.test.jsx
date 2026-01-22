import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProjectDetails from "../pages/ProjectDetails.jsx";

// Utiliser vi.hoisted() 
const { mockGet, mockPut, mockPost, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPut: vi.fn(),
  mockPost: vi.fn(),
  mockDelete: vi.fn()
}));

vi.mock("../axiosClient", () => {
  return {
    default: {
      get: mockGet,
      put: mockPut,
      post: mockPost,
      delete: mockDelete,
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      }
    }
  };
});

const mockProject = {
  id: 1,
  title: "Test Project",
  description: "Test description",
  start_date: "2025-12-28",
  tasks: [
    {
      id: 101,
      name: "Task 1",
      start_date: "2025-12-28",
      duration: 5,
      status: "in-progress",
      predecessors: [],
    },
    {
      id: 102,
      name: "Task 2",
      start_date: "2025-12-29",
      duration: 3,
      status: "completed",
      predecessors: [{ predecessor_task_id: 101, predecessor: { name: "Task 1" } }],
    },
  ],
};

describe("ProjectDetails Page", () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Setup default mock implementations
    mockGet.mockImplementation((url) => {
      if (url === "/projects/1") return Promise.resolve({ data: mockProject });
      if (url === "/projects/1/tasks") return Promise.resolve({ data: mockProject.tasks });
      return Promise.resolve({ data: [] });
    });
    
    mockPut.mockResolvedValue({ data: mockProject });
    mockPost.mockResolvedValue({ data: { ...mockProject.tasks[0], id: 103 } });
    mockDelete.mockResolvedValue({});
    
    // Mock window.confirm
    window.confirm = vi.fn(() => true);
    
    // Mock localStorage
    Storage.prototype.getItem = vi.fn((key) => {
      if (key === "token") return "fake-token";
      if (key === "user") return JSON.stringify({ id: 1, name: "Test User" });
      return null;
    });
    
    // Mock window.location
    delete window.location;
    window.location = { href: '', assign: vi.fn(), replace: vi.fn() };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderComponent = () =>
    render(
      <MemoryRouter initialEntries={["/projects/1"]}>
        <Routes>
          <Route path="/projects/:projectId" element={<ProjectDetails />} />
        </Routes>
      </MemoryRouter>
    );

  test("affiche le projet et les tâches après chargement", async () => {
    renderComponent();
    
    // Vérifie le loading
    expect(screen.getByText(/loading project details/i)).toBeInTheDocument();
    
    // Attend le chargement
    await waitFor(() => expect(screen.getByText("Test Project")).toBeInTheDocument());
    
    // Vérifie les éléments affichés
    expect(screen.getByText("Test Project")).toBeInTheDocument();
    expect(screen.getByText("Test description")).toBeInTheDocument();
    expect(screen.getByText("Task 1")).toBeInTheDocument();
    expect(screen.getByText("Task 2")).toBeInTheDocument();
  });

  test("modifie un projet avec succès", async () => {
    renderComponent();
    
    // Attend que le projet soit chargé
    await waitFor(() => screen.getByText("Test Project"));
    
    // Ouvre le menu (bouton avec "⋮")
    const menuButton = screen.getByText("⋮");
    fireEvent.click(menuButton);
    
    // Cherche "Edit Project" dans le menu
    await waitFor(() => {
      expect(screen.getByText("✏️ Edit Project")).toBeInTheDocument();
    });
    
    const editButton = screen.getByText("✏️ Edit Project");
    fireEvent.click(editButton);
    
    // Vérifie que la modal s'ouvre
    await waitFor(() => {
      expect(screen.getByText("Edit Project")).toBeInTheDocument();
    });
    
    // Modifie le titre - utiliser querySelector car pas de label/input associés
    const modal = document.querySelector('.modal');
    const titleInput = modal.querySelector('input[type="text"]');
    
    expect(titleInput).toBeInTheDocument();
    fireEvent.change(titleInput, { 
      target: { value: "Projet Modifié" } 
    });
    
    // Soumet
    const updateButton = screen.getByText("Update Project");
    fireEvent.click(updateButton);
    
    // Vérifie l'appel API
    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith("/projects/1", {
        title: "Projet Modifié",
        description: "Test description",
        start_date: "2025-12-28",
      });
    });
  });

  test("crée une nouvelle tâche", async () => {
    renderComponent();
    
    // Attend que les tâches soient chargées
    await waitFor(() => screen.getByText("Task 1"));
    
    // Ouvre la modal de création de tâche
    const createButton = screen.getByText("➕ Create Task");
    fireEvent.click(createButton);
    
    // Vérifie que la modal s'ouvre
    await waitFor(() => {
      expect(screen.getByText("Create Task")).toBeInTheDocument();
    });
    
    // Remplit le formulaire avec querySelector
    const modal = document.querySelector('.modal');
    expect(modal).toBeInTheDocument();
    
    // Trouve le premier input de type text (Task Name)
    const textInputs = modal.querySelectorAll('input[type="text"]');
    expect(textInputs.length).toBeGreaterThan(0);
    const taskNameInput = textInputs[0];
    
    // Trouve l'input de type number (Duration)
    const numberInputs = modal.querySelectorAll('input[type="number"]');
    expect(numberInputs.length).toBeGreaterThan(0);
    const durationInput = numberInputs[0];
    
    fireEvent.change(taskNameInput, { 
      target: { value: "Nouvelle Tâche" } 
    });
    fireEvent.change(durationInput, { 
      target: { value: "7" } 
    });
    
    // Sélectionne un prédécesseur (Task 1)
    // Les checkboxes sont dans des labels avec le texte "Task 1"
    const task1Checkbox = screen.getByLabelText("Task 1");
    fireEvent.click(task1Checkbox);
    
    // Soumet le formulaire
    const submitButton = screen.getByText("Create");
    fireEvent.click(submitButton);
    
    // Vérifie l'appel API avec les bons paramètres
    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith("/projects/1/tasks", {
        name: "Nouvelle Tâche",
        start_date: expect.any(String), // Date du jour par défaut
        duration: 7,
        dependencies: [101], // ID de Task 1
      });
    });
  });

  test("crée une nouvelle tâche - version simplifiée", async () => {
    renderComponent();
    
    await waitFor(() => screen.getByText("Task 1"));
    
    // Ouvre la modal
    const createButton = screen.getByText("➕ Create Task");
    fireEvent.click(createButton);
    
    await waitFor(() => {
      // Vérifie que la modal est présente
      const modals = document.querySelectorAll('.modal');
      expect(modals.length).toBe(1);
    });
    
    // Utilise within pour chercher dans la modal
    const modal = document.querySelector('.modal');
    
    // Remplir avec une approche plus directe
    // Sélectionne tous les inputs et remplit les bons
    const allInputs = modal.querySelectorAll('input');
    
    // Premier input: Task Name (type="text")
    fireEvent.change(allInputs[0], { target: { value: "Ma Tâche" } });
    
    // Deuxième input: Start Date (type="date") - déjà rempli
    // Troisième input: Duration (type="number")
    fireEvent.change(allInputs[2], { target: { value: "10" } });
    
    // Cocher une checkbox
    const checkboxes = modal.querySelectorAll('input[type="checkbox"]');
    if (checkboxes.length > 0) {
      fireEvent.click(checkboxes[0]);
    }
    
    // Soumettre
    const submitBtn = modal.querySelector('button[type="submit"]');
    fireEvent.click(submitBtn);
    
    await waitFor(() => {
      expect(mockPost).toHaveBeenCalled();
    });
  });

  test("supprime une tâche", async () => {
    renderComponent();
    
    await waitFor(() => screen.getByText("Task 1"));
    
    // Cherche le bouton delete pour Task 1
    const deleteButtons = screen.getAllByText("🗑️ Delete");
    expect(deleteButtons.length).toBe(2); // Une pour chaque tâche
    
    fireEvent.click(deleteButtons[0]); // Supprime Task 1
    
    // Vérifie la confirmation
    expect(window.confirm).toHaveBeenCalledWith("Are you sure you want to delete this task?");
    
    // Vérifie l'appel API
    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith("/tasks/101");
    });
  });

  test("supprime un projet", async () => {
    renderComponent();
    
    await waitFor(() => screen.getByText("Test Project"));
    
    // Ouvre le menu
    const menuButton = screen.getByText("⋮");
    fireEvent.click(menuButton);
    
    // Attend que le menu apparaisse
    await waitFor(() => {
      expect(screen.getByText("🗑️ Delete Project")).toBeInTheDocument();
    });
    
    // Clique sur Delete Project
    const deleteProjectButton = screen.getByText("🗑️ Delete Project");
    fireEvent.click(deleteProjectButton);
    
    // Vérifie la confirmation
    expect(window.confirm).toHaveBeenCalledWith("Are you sure you want to delete this project?");
    
    // Vérifie l'appel API
    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith("/projects/1");
    });
  });

  test("ouvre et ferme la modal d'édition de tâche", async () => {
    renderComponent();
    
    await waitFor(() => screen.getByText("Task 1"));
    
    // Trouve le bouton "✏️ Edit" pour Task 1
    const editButtons = screen.getAllByText("✏️ Edit");
    expect(editButtons.length).toBe(2); // Une pour chaque tâche
    
    fireEvent.click(editButtons[0]);
    
    // Vérifie que la modal d'édition s'ouvre
    await waitFor(() => {
      expect(screen.getByText("Edit Task")).toBeInTheDocument();
    });
    
    // Modifie le nom de la tâche - utiliser querySelector
    const modal = document.querySelector('.modal');
    const textInputs = modal.querySelectorAll('input[type="text"]');
    expect(textInputs.length).toBeGreaterThan(0);
    
    const taskNameInput = textInputs[0];
    expect(taskNameInput.value).toBe("Task 1");
    
    fireEvent.change(taskNameInput, { 
      target: { value: "Task 1 Modifié" } 
    });
    
    // Soumet
    const updateButton = screen.getByText("Update");
    fireEvent.click(updateButton);
    
    // Vérifie l'appel API
    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith("/tasks/101", {
        name: "Task 1 Modifié",
        start_date: "2025-12-28",
        duration: 5,
        dependencies: [], // Pas de prédécesseurs pour Task 1
      });
    });
  });

  test("vérifie que les checkboxes fonctionnent", async () => {
    renderComponent();
    
    await waitFor(() => screen.getByText("Task 1"));
    
    // Ouvre la modal Create Task
    const createButton = screen.getByText("➕ Create Task");
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByText("Create Task")).toBeInTheDocument();
    });
    
    // Vérifie que les checkboxes existent
    const task1Checkbox = screen.getByLabelText("Task 1");
    const task2Checkbox = screen.getByLabelText("Task 2");
    
    expect(task1Checkbox).toBeInTheDocument();
    expect(task2Checkbox).toBeInTheDocument();
    
    // Teste le toggle
    expect(task1Checkbox.checked).toBe(false);
    fireEvent.click(task1Checkbox);
    expect(task1Checkbox.checked).toBe(true);
    fireEvent.click(task1Checkbox);
    expect(task1Checkbox.checked).toBe(false);
  });
});