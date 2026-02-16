import dagre from 'dagre';

/**
 * Automatically layout family tree nodes using Dagre graph library
 * @param {Array} nodes - Array of React Flow nodes
 * @param {Array} edges - Array of React Flow edges
 * @param {string} direction - Layout direction: 'TB' (top-bottom), 'BT', 'LR', 'RL'
 * @returns {Object} - Object with layouted nodes and edges
 */
export const getLayoutedElements = (nodes, edges, direction = 'TB', layoutEdges = edges) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Configure the graph layout
  dagreGraph.setGraph({ 
    rankdir: direction,
    nodesep: 80,      // Horizontal spacing between nodes
    ranksep: 150,     // Vertical spacing between ranks (generations)
    edgesep: 50,      // Spacing between edges
    marginx: 50,      // Graph margin X
    marginy: 50,      // Graph margin Y
  });

  // Add nodes to the graph
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { 
      width: 200,  // Match the FamilyNode width
      height: 280  // Approximate height of FamilyNode with all elements
    });
  });

  // Add edges to the graph
  layoutEdges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target, edge.data || {});
  });

  // Calculate the layout
  dagre.layout(dagreGraph);

  // Apply the calculated positions back to nodes
  const layoutedNodes = nodes.map((node, index) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    if (!nodeWithPosition) {
      return {
        ...node,
        position: {
          x: index * 260,
          y: 0
        }
      };
    }
    
    // Center the node at the calculated position
    // Dagre gives us the center point, but React Flow uses top-left
    const x = nodeWithPosition.x - nodeWithPosition.width / 2;
    const y = nodeWithPosition.y - nodeWithPosition.height / 2;

    return {
      ...node,
      position: {
        x,
        y,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

/**
 * Layout nodes in a simple grid when no relationships exist.
 * Keeps members visible and spaced instead of overlapping at 0,0.
 * @param {Array} nodes - Array of React Flow nodes
 * @param {number} columns - Number of columns in the grid
 * @returns {Array} - Nodes with grid positions
 */
export const layoutNodesInGrid = (nodes, columns = 4) => {
  const colCount = Math.max(columns, 1);
  const xGap = 260;
  const yGap = 320;

  return nodes.map((node, index) => {
    const col = index % colCount;
    const row = Math.floor(index / colCount);

    return {
      ...node,
      position: {
        x: col * xGap,
        y: row * yGap,
      },
    };
  });
};

/**
 * Get the generation/level of a member in the family tree
 * Used for manual hierarchical positioning if needed
 * @param {Object} member - Family member object
 * @param {Array} allMembers - All family members
 * @param {number} depth - Current recursion depth
 * @returns {number} - Generation level (0 = root, 1 = children, etc.)
 */
export const getMemberGeneration = (member, allMembers, depth = 0, visited = new Set()) => {
  // Prevent infinite loops in case of circular relationships
  if (visited.has(member.id)) {
    return depth;
  }
  visited.add(member.id);

  // If member has parents, they're one generation deeper
  const parentIds = member.relationships?.parents || [];
  if (parentIds.length === 0) {
    return depth; // Root generation
  }

  // Find the maximum generation of parents and add 1
  const parentGenerations = parentIds
    .map(parentId => {
      const parent = allMembers.find(m => m.id === parentId);
      return parent ? getMemberGeneration(parent, allMembers, depth, new Set(visited)) : depth;
    })
    .filter(gen => gen !== undefined);

  return parentGenerations.length > 0 ? Math.max(...parentGenerations) + 1 : depth;
};

/**
 * Group members by generation for hierarchical layout
 * @param {Array} members - Array of family members
 * @returns {Object} - Members grouped by generation level
 */
export const groupByGeneration = (members) => {
  const generations = {};
  
  members.forEach(member => {
    const generation = getMemberGeneration(member, members);
    if (!generations[generation]) {
      generations[generation] = [];
    }
    generations[generation].push(member);
  });

  return generations;
};

/**
 * Calculate optimal positions for family tree without Dagre
 * Fallback method for simple hierarchical layout
 * @param {Array} members - Array of family members
 * @returns {Array} - Members with calculated positions
 */
export const calculateTreePositions = (members) => {
  const generations = groupByGeneration(members);
  const generationKeys = Object.keys(generations).sort((a, b) => a - b);
  
  const positioned = [];
  const horizontalSpacing = 250;
  const verticalSpacing = 200;

  generationKeys.forEach((genKey, genIndex) => {
    const genMembers = generations[genKey];
    const genWidth = genMembers.length * horizontalSpacing;
    const startX = -genWidth / 2 + horizontalSpacing / 2;

    genMembers.forEach((member, index) => {
      positioned.push({
        ...member,
        position: {
          x: startX + (index * horizontalSpacing),
          y: genIndex * verticalSpacing,
        },
      });
    });
  });

  return positioned;
};
