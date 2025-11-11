import { useState, useRef, useEffect } from 'react';
/*import { Search, Network, User, LogOut } from 'lucide-react';*/
/*import { supabase } from '../lib/supabase';*/
import './Dashboard.css';

export function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('home');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return;
    }

    setProjects(data || []);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Network className="logo-icon" strokeWidth={2.5} />
            <h1 className="logo-text">MANAJECT</h1>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            onClick={() => setActiveTab('home')}
            className={`nav-button ${activeTab === 'home' ? 'active' : ''}`}
          >
            Home
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`nav-button ${activeTab === 'profile' ? 'active' : ''}`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('project')}
            className={`nav-button ${activeTab === 'project' ? 'active' : ''}`}
          >
            Project
          </button>
        </nav>
      </aside>

      <main className="main-content">
        <header className="header">
          <button className="create-button">
            CREATE NEW PROJECT
          </button>

          <div className="search-container">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="profile-dropdown-container" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="profile-button"
            >
              <User className="profile-icon" />
            </button>

            {isDropdownOpen && (
              <div className="dropdown-menu">
                <button
                  onClick={handleLogout}
                  className="dropdown-item"
                >
                  <LogOut className="dropdown-icon" />
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="projects-content">
          <div className="projects-wrapper">
            {filteredProjects.length === 0 ? (
              <div className="empty-state">
                {searchTerm ? 'No projects found matching your search' : 'No projects yet'}
              </div>
            ) : (
              filteredProjects.map((project) => (
                <div key={project.id} className="project-card">
                  <h3 className="project-title">{project.name}</h3>
                  <div className="project-dates">
                    <div className="date-box">
                      <span className="date-text">start date: {formatDate(project.start_date)}</span>
                    </div>
                    <div className="date-box">
                      <span className="date-text">end date: {formatDate(project.end_date)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
