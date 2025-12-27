/**
 * Build PERT nodes with proper PERT calculations
 */
export function buildPertNodes(rawNodes = [], criticalPath = [], startDate = new Date()) {
  rawNodes = Array.isArray(rawNodes) ? rawNodes : [];
  
  // Deep copy to avoid mutating original data
  const processedNodes = rawNodes.map(node => ({
    id: node.id?.toString() || '',
    label: node.label || `Task ${node.id}`,
    duration: node.duration || 0,
    predecessors: Array.isArray(node.predecessors) 
      ? node.predecessors.map(p => p?.toString()) 
      : [],
    es: 0,
    ef: 0,
    ls: 0,
    lf: 0,
    slack: 0
  }));

  // Calculate Early Start (ES) and Early Finish (EF) - Forward Pass
  const calculateEarlyTimes = () => {
    const visited = new Set();
    
    const calculateEF = (nodeId) => {
      const node = processedNodes.find(n => n.id === nodeId);
      if (!node || visited.has(nodeId)) return node?.ef || 0;
      visited.add(nodeId);

      if (node.predecessors.length === 0) {
        node.es = 0;
        node.ef = node.es + node.duration;
        return node.ef;
      }

      // Get max EF from all predecessors
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

    // Calculate for all nodes
    processedNodes.forEach(node => calculateEF(node.id));
  };

  // Calculate Late Start (LS) and Late Finish (LF) - Backward Pass
  const calculateLateTimes = () => {
    // Find project duration (max EF)
    const projectDuration = Math.max(...processedNodes.map(n => n.ef || 0));
    
    // Initialize all nodes with LF = projectDuration
    processedNodes.forEach(node => {
      node.lf = projectDuration;
      node.ls = projectDuration - node.duration;
    });
    
    // Process in reverse topological order
    const sortedNodes = [...processedNodes].sort((a, b) => (b.ef || 0) - (a.ef || 0));
    const visited = new Set();
    
    const calculateLS = (nodeId) => {
      const node = processedNodes.find(n => n.id === nodeId);
      if (!node || visited.has(nodeId)) return;
      visited.add(nodeId);
      
      // Find all successors of this node
      const successors = processedNodes.filter(n => 
        n.predecessors.includes(nodeId)
      );
      
      if (successors.length > 0) {
        // Find minimum LS among successors
        const minSuccessorLS = Math.min(...successors.map(s => s.ls || Infinity));
        node.lf = minSuccessorLS;
        node.ls = node.lf - node.duration;
      }
      
      // Calculate slack
      node.slack = node.ls - node.es;
      
      // Process predecessors
      node.predecessors.forEach(predId => {
        calculateLS(predId);
      });
    };
    
    // Start from end nodes (nodes with no successors)
    const endNodes = processedNodes.filter(node => {
      return !processedNodes.some(n => n.predecessors.includes(node.id));
    });
    
    endNodes.forEach(node => calculateLS(node.id));
    
    return projectDuration;
  };

  // Calculate positions - START on TOP, END on BOTTOM
  const calculatePositions = () => {
    const positions = {};
    
    // Group nodes by dependency levels
    const levels = {};
    const visited = new Set();
    
    const assignLevel = (nodeId, level = 0) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      
      const node = processedNodes.find(n => n.id === nodeId);
      if (!node) return;
      
      // Current level is max of all predecessor levels + 1
      let maxPredLevel = -1;
      node.predecessors.forEach(predId => {
        const predLevel = levels[predId] || 0;
        if (predLevel > maxPredLevel) maxPredLevel = predLevel;
      });
      
      const nodeLevel = Math.max(level, maxPredLevel + 1);
      levels[nodeId] = nodeLevel;
      
      if (!positions[nodeLevel]) positions[nodeLevel] = [];
      positions[nodeLevel].push(nodeId);
      
      // Find successors
      const successors = processedNodes.filter(n => n.predecessors.includes(nodeId));
      successors.forEach(succ => {
        assignLevel(succ.id, nodeLevel + 1);
      });
    };
    
    // Start from nodes without predecessors
    const startNodes = processedNodes.filter(n => n.predecessors.length === 0);
    startNodes.forEach(node => assignLevel(node.id, 0));
    
    // For nodes not assigned yet (cycles)
    processedNodes.forEach(node => {
      if (!levels[node.id]) {
        levels[node.id] = Object.keys(positions).length;
        if (!positions[levels[node.id]]) positions[levels[node.id]] = [];
        positions[levels[node.id]].push(node.id);
      }
    });
    
    // Calculate actual coordinates
    const nodePositions = {};
    const verticalSpacing = 150;
    const horizontalSpacing = 300;
    
    Object.entries(positions).forEach(([level, nodeIds]) => {
      const levelNum = parseInt(level);
      const x = 100 + (levelNum * horizontalSpacing);
      const yBase = 150; // Starting Y position
      
      // Center nodes vertically
      const totalHeight = (nodeIds.length - 1) * verticalSpacing;
      const startY = yBase - (totalHeight / 2);
      
      nodeIds.forEach((nodeId, index) => {
        const y = startY + (index * verticalSpacing);
        nodePositions[nodeId] = { x, y };
      });
    });
    
    return nodePositions;
  };

  // Perform PERT calculations
  calculateEarlyTimes();
  const projectDuration = calculateLateTimes();
  const positions = calculatePositions();

  const nodes = [];

  // Build START node - POSITION AT TOP
  nodes.push({
    id: "start",
    position: { x: 0, y: 100 }, // Top position
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
        description: "Project commencement point"
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
    
    // Calculate actual dates based on startDate
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
          description: `Duration: ${node.duration} days | Slack: ${node.slack} days`
        },
        isCritical
      },
      type: "pertNode",
      className: `pert-node ${isCritical ? 'critical' : ''}`
    });
  });

  // Build END node - POSITION AT BOTTOM
  const maxX = Math.max(...Object.values(positions).map(p => p.x), 0);
  const allYs = Object.values(positions).map(p => p.y);
  const maxY = allYs.length > 0 ? Math.max(...allYs) : 500;
  
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + projectDuration);
  
  nodes.push({
    id: "end",
    position: { x: maxX + 300, y: maxY + 100 }, // Bottom position
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
        description: "Project finalization point"
      },
      isCritical: false
    },
    type: "pertNode",
    className: "pert-node end-node"
  });

  return { nodes, projectDuration };
}

/**
 * Build edges/arcs between tasks with proper styling
 */
export function buildPertEdgesWithArcs(rawNodes = [], criticalPath = []) {
  rawNodes = Array.isArray(rawNodes) ? rawNodes : [];
  const edges = [];

  // Process each node to create edges with arcs
  rawNodes.forEach(node => {
    const nodeId = node.id?.toString();
    if (!nodeId) return;

    const isCritical = criticalPath.includes(nodeId);

    // Connect from START if no predecessors - ARCS FROM TOP
    if (!node.predecessors || node.predecessors.length === 0) {
      edges.push({
        id: `e-start-${nodeId}`,
        source: 'start',
        target: nodeId,
        animated: isCritical,
        type: 'smoothstep', // This creates arcs
        className: isCritical ? 'pert-edge critical' : 'pert-edge normal',
        label: isCritical ? 'CRITICAL' : '',
        style: isCritical 
          ? { 
              stroke: '#ff4444', 
              strokeWidth: 3,
              strokeDasharray: '5,5'
            } 
          : { 
              stroke: '#1976d2', 
              strokeWidth: 2 
            },
        markerEnd: {
          type: 'arrowclosed',
          color: isCritical ? '#ff4444' : '#1976d2',
          width: 20,
          height: 20
        }
      });
    }

    // Connect to predecessors - CREATE ARCS
    if (node.predecessors && node.predecessors.length > 0) {
      node.predecessors.forEach(predId => {
        const pred = predId?.toString();
        if (!pred) return;
        
        const predIsCritical = criticalPath.includes(pred);
        const edgeIsCritical = isCritical || predIsCritical;
        
        edges.push({
          id: `e-${pred}-${nodeId}`,
          source: pred,
          target: nodeId,
          animated: edgeIsCritical,
          type: 'smoothstep', // This creates arcs
          className: edgeIsCritical ? 'pert-edge critical' : 'pert-edge normal',
          label: edgeIsCritical ? 'CRITICAL' : '',
          style: edgeIsCritical 
            ? { 
                stroke: '#ff4444', 
                strokeWidth: 3,
                strokeDasharray: '5,5'
              } 
            : { 
                stroke: '#1976d2', 
                strokeWidth: 2 
              },
          markerEnd: {
            type: 'arrowclosed',
            color: edgeIsCritical ? '#ff4444' : '#1976d2',
            width: 20,
            height: 20
          }
        });
      });
    }

    // Check if this node has successors
    const hasSuccessor = rawNodes.some(otherNode => 
      otherNode.predecessors && 
      otherNode.predecessors.some(p => p?.toString() === nodeId)
    );

    // Connect to END if no successors - ARCS TO BOTTOM
    if (!hasSuccessor) {
      edges.push({
        id: `e-${nodeId}-end`,
        source: nodeId,
        target: 'end',
        animated: isCritical,
        type: 'smoothstep', // This creates arcs
        className: isCritical ? 'pert-edge critical' : 'pert-edge normal',
        label: isCritical ? 'CRITICAL' : '',
        style: isCritical 
          ? { 
              stroke: '#ff4444', 
              strokeWidth: 3,
              strokeDasharray: '5,5'
            } 
          : { 
              stroke: '#1976d2', 
              strokeWidth: 2 
            },
        markerEnd: {
          type: 'arrowclosed',
          color: isCritical ? '#ff4444' : '#1976d2',
          width: 20,
          height: 20
        }
      });
    }
  });

  // Add edge labels showing task IDs for clarity
  edges.forEach(edge => {
    if (!edge.label) {
      const sourceLabel = edge.source === 'start' ? 'START' : `Task ${edge.source}`;
      const targetLabel = edge.target === 'end' ? 'END' : `Task ${edge.target}`;
      edge.label = `${sourceLabel} → ${targetLabel}`;
      edge.labelStyle = {
        fontSize: '10px',
        fontWeight: '600',
        fill: edge.className?.includes('critical') ? '#ff4444' : '#1976d2'
      };
      edge.labelBgStyle = {
        fill: 'white',
        fillOpacity: 0.8,
        stroke: edge.className?.includes('critical') ? '#ff4444' : '#1976d2',
        strokeWidth: 1,
        rx: 4,
        ry: 4
      };
      edge.labelBgPadding = [4, 4];
    }
  });

  return edges;
}

/**
 * Find critical path from nodes (tasks with zero slack)
 */
export function findCriticalPath(nodes = []) {
  if (!Array.isArray(nodes) || nodes.length === 0) return [];
  
  // First, copy nodes and calculate slack
  const nodesWithSlack = nodes.map(node => ({
    ...node,
    predecessors: Array.isArray(node.predecessors) ? node.predecessors : [],
    slack: 0
  }));
  
  // Simple forward pass to calculate ES, EF
  const calculateForwardPass = (allNodes) => {
    const visited = new Set();
    
    const calculateEF = (nodeId) => {
      const node = allNodes.find(n => n.id?.toString() === nodeId?.toString());
      if (!node) return 0;
      if (visited.has(nodeId)) return node.ef || 0;
      visited.add(nodeId);
      
      if (!node.predecessors || node.predecessors.length === 0) {
        node.es = 0;
        node.ef = node.es + (node.duration || 0);
        return node.ef;
      }
      
      let maxPredecessorEF = 0;
      node.predecessors.forEach(predId => {
        const predEF = calculateEF(predId);
        if (predEF > maxPredecessorEF) maxPredecessorEF = predEF;
      });
      
      node.es = maxPredecessorEF;
      node.ef = node.es + (node.duration || 0);
      return node.ef;
    };
    
    allNodes.forEach(node => calculateEF(node.id));
    return allNodes;
  };
  
  // Calculate backward pass and slack
  const calculateBackwardPass = (allNodes, projectDuration) => {
    allNodes.forEach(node => {
      // Find successors
      const successors = allNodes.filter(n => 
        n.predecessors.some(p => p?.toString() === node.id?.toString())
      );
      
      if (successors.length === 0) {
        node.lf = projectDuration;
        node.ls = projectDuration - (node.duration || 0);
      } else {
        const minSuccessorLS = Math.min(...successors.map(s => s.ls || Infinity));
        node.lf = minSuccessorLS;
        node.ls = node.lf - (node.duration || 0);
      }
      
      node.slack = node.ls - node.es;
    });
    
    return allNodes;
  };
  
  // Perform calculations
  const nodesWithEF = calculateForwardPass([...nodesWithSlack]);
  const projectDuration = Math.max(...nodesWithEF.map(n => n.ef || 0));
  const nodesWithSlackCalc = calculateBackwardPass(nodesWithEF, projectDuration);
  
  // Find nodes with zero slack (critical path)
  const criticalNodes = nodesWithSlackCalc
    .filter(node => node.slack === 0)
    .map(node => node.id?.toString())
    .filter(id => id);
  
  return criticalNodes;
}