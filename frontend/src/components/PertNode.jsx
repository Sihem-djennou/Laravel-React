import { Handle, Position } from 'reactflow';

const PertNode = ({ data }) => {
  const { label = {}, isCritical = false, dependencyLevel = 0 } = data || {};
  const {
    full_label = "Unknown Task",
    description = "",
    start = "N/A",
    end = "N/A",
    duration = 0,
    slack = 0,
    es = 0,
    ef = 0,
    ls = 0,
    lf = 0
  } = label;

  // Déterminer la couleur du badge selon le niveau
  const getLevelColor = (level) => {
    const colors = [
      '#4CAF50', // Niveau 0 - Vert
      '#2196F3', // Niveau 1 - Bleu
      '#FF9800', // Niveau 2 - Orange
      '#9C27B0', // Niveau 3 - Violet
      '#F44336', // Niveau 4 - Rouge
      '#795548', // Niveau 5 - Marron
      '#607D8B', // Niveau 6+ - Gris
    ];
    return colors[Math.min(level, colors.length - 1)];
  };

  const badgeColor = getLevelColor(dependencyLevel);

  return (
    <div className={`pert-node-wrapper ${isCritical ? 'critical' : ''}`}>
      {/* Handle gauche pour les connexions entrantes */}
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        style={{ 
          background: isCritical ? '#e53935' : '#1976d2',
          width: '12px',
          height: '12px',
          border: '2px solid #fff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      />
      
      {/* Badge de niveau de dépendance */}
      <div 
        className="dependency-level-badge"
        style={{ 
          backgroundColor: isCritical ? '#ff4444' : badgeColor
        }}
      >
        Niveau {dependencyLevel}
      </div>
      
      {/* Contenu du nœud */}
      <div className="pert-node-header">
        <strong>{full_label}</strong>
        {isCritical && <span className="critical-badge">CRITICAL</span>}
      </div>
      
      {description && (
        <div className="pert-description">
          {description}
        </div>
      )}
      
      <div className="pert-dates">
        <div className="date-row">
          <span className="date-label">Début:</span>
          <span className="date-value">{start}</span>
        </div>
        <div className="date-row">
          <span className="date-label">Fin:</span>
          <span className="date-value">{end}</span>
        </div>
      </div>
      
      <div className="pert-metrics">
        <div className="metric-item">
          <span className="metric-label">ES:</span>
          <span className="metric-value">{es}</span>
          <span className="metric-label">EF:</span>
          <span className="metric-value">{ef}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">LS:</span>
          <span className="metric-value">{ls}</span>
          <span className="metric-label">LF:</span>
          <span className="metric-value">{lf}</span>
        </div>
        <div className="metric-item">
          <span className="metric-label">Durée:</span>
          <span className="metric-value">{duration}d</span>
          <span className="metric-label">Marge:</span>
          <span className={`metric-value ${slack === 0 ? 'zero-slack' : ''}`}>
            {slack}d
          </span>
        </div>
      </div>
      
      {isCritical && (
        <div className="pert-warning">
          ⚠️ Sur le chemin critique
        </div>
      )}
      
      {/* Handle droit pour les connexions sortantes */}
      <Handle
        type="source"
        position={Position.Right}
        id="source-right"
        style={{ 
          background: isCritical ? '#e53935' : '#1976d2',
          width: '12px',
          height: '12px',
          border: '2px solid #fff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
      />
    </div>
  );
};

export default PertNode;