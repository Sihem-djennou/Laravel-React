/**
 * Utilities to build PERT nodes, edges and compute critical path.
 * Contains:
 *  - buildPertNodes(rawNodes, dependencies, criticalPath, startDate)
 *  - buildPertEdgesWithArcs(flowNodes, criticalPath, dependencies)
 *  - findCriticalPath(nodes)
 *
 * Note: buildPertEdgesWithArcs expects "flowNodes" to be the nodes array
 * returned by buildPertNodes (they contain .position x/y) so handles can
 * be chosen smartly.
 */

export function buildPertNodes(rawNodes = [], dependencies = [], criticalPath = [], startDate = new Date()) {
  console.log("=== buildPertNodes ===");
  console.log("Raw nodes:", rawNodes);
  console.log("Dependencies:", dependencies);
  
  // 1. Créez un map des prédécesseurs
  const predecessorMap = {};
  
  dependencies.forEach(dep => {
    const predId = dep.predecessor_task_id?.toString();
    const succId = dep.successor_task_id?.toString();
    
    if (predId && succId) {
      if (!predecessorMap[succId]) {
        predecessorMap[succId] = [];
      }
      if (!predecessorMap[succId].includes(predId)) {
        predecessorMap[succId].push(predId);
      }
    }
  });
  
  console.log("Predecessor map:", predecessorMap);
  
  // 2. Traitez les nœuds avec leurs prédécesseurs
  const processedNodes = rawNodes.map(node => {
    const nodeId = node.id?.toString();
    return {
      id: nodeId,
      label: node.name || node.label || `Task ${nodeId}`,
      duration: Number(node.duration) || 1,
      predecessors: predecessorMap[nodeId] || [],
      es: Number(node.es) || 0,
      ef: Number(node.ef) || 0,
      ls: Number(node.ls) || 0,
      lf: Number(node.lf) || 0,
      slack: Number(node.slack) || 0
    };
  });

  console.log("📊 VÉRIFICATION FINALE DES NŒUDS:");
  processedNodes.forEach(node => {
    console.log(`${node.id}: ${node.predecessors.length} prédécesseurs -> [${node.predecessors.join(', ')}]`);
  });

  // Calculate Early Start (ES) and Early Finish (EF) - Forward Pass
  const calculateEarlyTimes = () => {
    const visited = new Set();
    
    const calculateEF = (nodeId) => {
      const node = processedNodes.find(n => n.id === nodeId);
      if (!node || visited.has(nodeId)) return node?.ef || 0;
      visited.add(nodeId);

      if (!node.predecessors || node.predecessors.length === 0) {
        node.es = 0;
        node.ef = node.es + node.duration;
        return node.ef;
      }

      let maxPredecessorEF = 0;
      node.predecessors.forEach(predId => {
        const predNode = processedNodes.find(n => n.id === predId);
        if (predNode) {
          const predEF = calculateEF(predId);
          if (predEF > maxPredecessorEF) {
            maxPredecessorEF = predEF;
          }
        }
      });

      node.es = maxPredecessorEF;
      node.ef = node.es + node.duration;
      return node.ef;
    };

    processedNodes.forEach(node => calculateEF(node.id));
  };

  // Calculate Late Start (LS) and Late Finish (LF) - Backward Pass
  const calculateLateTimes = () => {
    const projectDuration = Math.max(...processedNodes.map(n => n.ef || 0));
    
    processedNodes.forEach(node => {
      node.lf = projectDuration;
      node.ls = projectDuration - node.duration;
    });
    
    const sortedNodes = [...processedNodes].sort((a, b) => (b.ef || 0) - (a.ef || 0));
    const visited = new Set();
    
    const calculateLS = (nodeId) => {
      const node = processedNodes.find(n => n.id === nodeId);
      if (!node || visited.has(nodeId)) return;
      visited.add(nodeId);
      
      const successors = processedNodes.filter(n => 
        n.predecessors.includes(nodeId)
      );
      
      if (successors.length > 0) {
        const minSuccessorLS = Math.min(...successors.map(s => s.ls || Infinity));
        node.lf = minSuccessorLS;
        node.ls = node.lf - node.duration;
      }
      
      node.slack = node.ls - node.es;
      
      node.predecessors.forEach(predId => {
        calculateLS(predId);
      });
    };
    
    const endNodes = processedNodes.filter(node => {
      return !processedNodes.some(n => n.predecessors.includes(node.id));
    });
    
    endNodes.forEach(node => calculateLS(node.id));
    
    return projectDuration;
  };

  const calculateLevels = () => {
    const levels = {};
    const remaining = new Set(processedNodes.map(n => n.id));

    // Niveau 0 : sans prédécesseurs
    let currentLevel = 0;
    let frontier = processedNodes
      .filter(n => n.predecessors.length === 0)
      .map(n => n.id);

    while (frontier.length > 0) {
      frontier.forEach(id => {
        levels[id] = currentLevel;
        remaining.delete(id);
      });

      const nextFrontier = [];

      processedNodes.forEach(node => {
        if (!remaining.has(node.id)) return;

        const allPredDone = node.predecessors.every(
          p => levels[p] !== undefined
        );

        if (allPredDone) {
          nextFrontier.push(node.id);
        }
      });

      frontier = nextFrontier;
      currentLevel++;
    }

    return levels;
  };

  // Calculate positions with traditional PERT layout
  const calculatePositions = () => {
    const COLUMN_SPACING = 300;
    const ROW_SPACING = 120;
    const START_X = 100;
    const START_Y = 200;

    const levels = calculateLevels();

    // Grouper par niveau
    const levelGroups = {};
    processedNodes.forEach(node => {
      const level = levels[node.id] ?? 0;
      if (!levelGroups[level]) levelGroups[level] = [];
      levelGroups[level].push(node);
    });

    const positions = {};

    Object.keys(levelGroups)
      .map(Number)
      .sort((a, b) => a - b)
      .forEach(level => {
        levelGroups[level].forEach((node, index) => {
          positions[node.id] = {
            x: START_X + level * COLUMN_SPACING,
            y: START_Y + index * ROW_SPACING,
          };
        });
      });

    return positions;
  };

  // Perform PERT calculations
  calculateEarlyTimes();
  const projectDuration = calculateLateTimes();
  const positions = calculatePositions();
  const nodes = [];

  // Calculer la position centrale pour START et END
  const taskPositions = Object.values(positions);
  const minX = taskPositions.length ? Math.min(...taskPositions.map(p => p.x)) : 0;
  const maxX = taskPositions.length ? Math.max(...taskPositions.map(p => p.x)) : 0;
  const minY = taskPositions.length ? Math.min(...taskPositions.map(p => p.y)) : 0;
  const maxY = taskPositions.length ? Math.max(...taskPositions.map(p => p.y)) : 0;
  const centerY = taskPositions.length ? (minY + maxY) / 2 : 200;

  // Build START node
  nodes.push({
    id: "start",
    position: { x: (minX || 100) - 280, y: centerY },
    data: {
      label: { 
        label: "START",
        full_label: "PROJECT START",
        duration: 0,
        start: startDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric'
        }),
        end: startDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric'
        }),
        es: 0,
        ef: 0,
        ls: 0,
        lf: 0,
        slack: 0,
        isCritical: false,
        predecessors: [],
        description: "Point de départ du projet"
      },
      isCritical: false
    },
    type: "pertNode",
    className: "pert-node start-node"
  });

  // Build task nodes
  processedNodes.forEach(node => {
    const pos = positions[node.id] || { x: 100, y: 100 };
    const isCritical = criticalPath.includes(node.id) || node.slack === 0;
    
    const startDay = new Date(startDate);
    startDay.setDate(startDay.getDate() + node.es);
    
    const endDay = new Date(startDate);
    endDay.setDate(endDay.getDate() + node.ef);
    
    const lateStartDay = new Date(startDate);
    lateStartDay.setDate(lateStartDay.getDate() + node.ls);
    
    const lateEndDay = new Date(startDate);
    lateEndDay.setDate(lateEndDay.getDate() + node.lf);

    nodes.push({
      id: node.id,
      position: pos,
      data: {
        label: {
          label: node.label,
          full_label: node.label,
          duration: node.duration,
          start: startDay.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          }),
          end: endDay.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          }),
          lateStart: lateStartDay.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          }),
          lateEnd: lateEndDay.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          }),
          es: node.es,
          ef: node.ef,
          ls: node.ls,
          lf: node.lf,
          slack: node.slack,
          isCritical,
          predecessors: node.predecessors,
          description: `Durée: ${node.duration}j | Marge: ${node.slack}j | ES:${node.es} EF:${node.ef}`
        },
        isCritical
      },
      type: "pertNode",
      className: `pert-node ${isCritical ? 'critical' : ''}`
    });
  });

  // Build END node
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + projectDuration);
  
  nodes.push({
    id: "end",
    position: { x: (maxX || 100) + 280, y: centerY },
    data: {
      label: {
        label: "END",
        full_label: "PROJECT COMPLETION",
        duration: 0,
        start: endDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric'
        }),
        end: endDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric'
        }),
        es: projectDuration,
        ef: projectDuration,
        ls: projectDuration,
        lf: projectDuration,
        slack: 0,
        isCritical: false,
        predecessors: [],
        description: "Fin du projet"
      },
      isCritical: false
    },
    type: "pertNode",
    className: "pert-node end-node"
  });

  console.log("✅ buildPertNodes TERMINÉ -", nodes.length, "nœuds créés");
  return { nodes, projectDuration };
}

/**
 * Build edges/arcs between tasks using node positions to choose handles.
 *
 * flowNodes: nodes array returned by buildPertNodes (contains position.x/y)
 * criticalPath: array of node ids (strings) that belong to the critical path
 * dependencies: raw dependencies with predecessor_task_id and successor_task_id
 */

// Remplacer buildPertEdgesWithArcs par ce code
export function buildPertEdgesWithArcs(flowNodes = [], criticalPath = [], dependencies = []) {
  console.log("=== buildPertEdgesWithArcs (robuste) ===");
  console.log("Flow nodes:", flowNodes.map(n => ({ id: n.id, pos: n.position })));
  console.log("Dependencies:", dependencies);

  const edges = [];
  const nodeIds = new Set(flowNodes.map(n => n.id?.toString()).filter(Boolean));

  // helper de style
  const makeEdge = ({ id, source, target, isCritical = false, label = '' }) => ({
    id,
    source,
    target,
    // smoothstep est souvent plus lisible pour graphes en colonnes/horizontaux
    type: 'smoothstep',
    className: isCritical ? 'pert-edge critical' : 'pert-edge normal',
    label,
    style: {
      stroke: isCritical ? '#ff4444' : '#1976d2',
      strokeWidth: isCritical ? 3 : 2,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      // dashed for non-critical if you like:
      strokeDasharray: isCritical ? undefined : '0',
    },
    markerEnd: {
      type: 'arrowclosed',
      color: isCritical ? '#ff4444' : '#1976d2'
    },
    animated: !!isCritical,
  });

  // 1) edges explicites (dépendances)
  dependencies.forEach(dep => {
    const s = dep.predecessor_task_id?.toString();
    const t = dep.successor_task_id?.toString();
    if (!s || !t) {
      console.warn("dep invalide (manque id):", dep);
      return;
    }
    if (!nodeIds.has(s)) console.warn(`Source non trouvée parmi flow nodes: ${s}`);
    if (!nodeIds.has(t)) console.warn(`Target non trouvée parmi flow nodes: ${t}`);

    const edgeIsCritical = criticalPath.includes(s) && criticalPath.includes(t);

    edges.push(makeEdge({
      id: `e-${s}-${t}`,
      source: s,
      target: t,
      isCritical: edgeIsCritical,
      label: dep.label || ''
    }));
  });

  // 2) START -> tasks sans prédécesseurs
  const taskIds = flowNodes.map(n => n.id?.toString()).filter(id => id && id !== 'start' && id !== 'end');
  const nodesWithoutPredecessors = taskIds.filter(nodeId => {
    return !dependencies.some(dep => dep.successor_task_id?.toString() === nodeId);
  });

  nodesWithoutPredecessors.forEach(nodeId => {
    edges.push(makeEdge({
      id: `e-start-${nodeId}`,
      source: 'start',
      target: nodeId,
      isCritical: criticalPath.includes(nodeId)
    }));
  });

  // 3) tasks sans successeurs -> END
  const nodesWithoutSuccessors = taskIds.filter(nodeId => {
    return !dependencies.some(dep => dep.predecessor_task_id?.toString() === nodeId);
  });

  nodesWithoutSuccessors.forEach(nodeId => {
    edges.push(makeEdge({
      id: `e-${nodeId}-end`,
      source: nodeId,
      target: 'end',
      isCritical: criticalPath.includes(nodeId)
    }));
  });

  console.log(`✅ ${edges.length} arêtes créées`);
  return edges;
}

/**
 * Find critical path from nodes (tasks with zero slack)
 */
export function findCriticalPath(nodes = []) {
  console.log("=== findCriticalPath ===");
  console.log("Nœuds d'entrée:", nodes);
  
  if (!Array.isArray(nodes) || nodes.length === 0) return [];
  
  // Créer une copie des nœuds avec les calculs
  const nodesWithCalculations = nodes.map(node => ({
    ...node,
    id: node.id?.toString(),
    duration: Number(node.duration) || 1,
    predecessors: Array.isArray(node.predecessors) ? 
      node.predecessors.map(p => p?.toString()).filter(Boolean) : [],
    es: 0,
    ef: 0,
    ls: 0,
    lf: 0,
    slack: 0
  }));
  
  console.log("Nœuds avec calculs:", nodesWithCalculations);

  // Forward Pass (ES, EF)
  const calculateForwardPass = () => {
    const visited = new Set();
    
    const calculateESEF = (nodeId) => {
      const node = nodesWithCalculations.find(n => n.id === nodeId);
      if (!node) return 0;
      if (visited.has(nodeId)) return node.ef || 0;
      visited.add(nodeId);
      
      // Si pas de prédécesseurs, ES = 0
      if (!node.predecessors || node.predecessors.length === 0) {
        node.es = 0;
      } else {
        // ES = max(EF des prédécesseurs)
        let maxPredEF = 0;
        node.predecessors.forEach(predId => {
          const predEF = calculateESEF(predId);
          if (predEF > maxPredEF) maxPredEF = predEF;
        });
        node.es = maxPredEF;
      }
      
      node.ef = node.es + node.duration;
      return node.ef;
    };
    
    // Calculer pour tous les nœuds
    nodesWithCalculations.forEach(node => {
      if (!visited.has(node.id)) {
        calculateESEF(node.id);
      }
    });
    
    console.log("Après Forward Pass:");
    nodesWithCalculations.forEach(n => {
      console.log(`${n.id}: ES=${n.es}, EF=${n.ef}`);
    });
  };

  // Backward Pass (LS, LF)
  const calculateBackwardPass = () => {
    // Durée totale du projet = max(EF)
    const projectDuration = Math.max(...nodesWithCalculations.map(n => n.ef));
    console.log(`Durée du projet: ${projectDuration} jours`);
    
    // Initialiser LF et LS
    nodesWithCalculations.forEach(node => {
      node.lf = projectDuration;
      node.ls = projectDuration - node.duration;
    });
    
    // Trier par EF décroissant pour calculer du dernier au premier
    const sortedNodes = [...nodesWithCalculations].sort((a, b) => b.ef - a.ef);
    
    sortedNodes.forEach(node => {
      // Trouver les successeurs de ce nœud
      const successors = nodesWithCalculations.filter(n => 
        n.predecessors.includes(node.id)
      );
      
      if (successors.length > 0) {
        // LF = min(LS des successeurs)
        const minSuccessorLS = Math.min(...successors.map(s => s.ls));
        node.lf = minSuccessorLS;
        node.ls = node.lf - node.duration;
      }
      
      // Calculer le slack
      node.slack = node.ls - node.es;
    });
    
    console.log("Après Backward Pass:");
    nodesWithCalculations.forEach(n => {
      console.log(`${n.id}: LS=${n.ls}, LF=${n.lf}, Slack=${n.slack}`);
    });
  };

  // Exécuter les calculs
  calculateForwardPass();
  calculateBackwardPass();

  // Extraire le chemin critique (slack = 0)
  const criticalNodes = nodesWithCalculations
    .filter(node => node.slack === 0)
    .map(node => node.id)
    .filter(id => id);
  
  console.log("Chemin critique trouvé:", criticalNodes);
  return criticalNodes;
}