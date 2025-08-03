import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useNavigate } from 'react-router-dom';
import { useWorldContext } from '../contexts/WorldContext';
import type { Element } from '../types/world';
import { getCategoryIconName } from '../utils/categoryIcons';

interface NetworkViewProps {
  selectedElement: Element;
  className?: string;
}

interface GraphNode {
  id: string;
  name: string;
  category: string;
  level: number; // 0 for center, 1 for direct connections, 2 for second-degree
  relationshipType?: string; // friend, family, location, etc.
  x?: number;
  y?: number;
  fx?: number; // Fixed x position
  fy?: number; // Fixed y position
  vx?: number; // Velocity x
  vy?: number; // Velocity y
}

interface GraphLink {
  source: string;
  target: string;
  type: string; // relationship type
  color?: string;
}

// Relationship types and their colors - enhanced for better contrast
const RELATIONSHIP_COLORS: Record<string, string> = {
  friends: '#059669', // emerald-600
  family: '#dc2626', // red-600
  rivals: '#7c2d12', // orange-900
  location: '#2563eb', // blue-600
  birthplace: '#1e3a8a', // blue-900
  institutions: '#7c3aed', // violet-600
  species: '#db2777', // pink-600
  languages: '#0891b2', // cyan-600
  abilities: '#ea580c', // orange-600
  traits: '#65a30d', // lime-600
  objects: '#4f46e5', // indigo-600
  'has-location': '#059669', // emerald-600
  'is-location': '#059669', // emerald-600
  'co-located': '#16a34a', // green-600
  contains: '#14b8a6', // teal-600
  default: '#4b5563', // gray-600
};

// Node colors by category - enhanced palette
const NODE_COLORS: Record<string, string> = {
  character: '#3b82f6', // blue-500
  location: '#10b981', // emerald-500
  family: '#f59e0b', // amber-500
  institution: '#8b5cf6', // violet-500
  species: '#ec4899', // pink-500
  object: '#f97316', // orange-500
  trait: '#84cc16', // lime-500
  ability: '#06b6d4', // cyan-500
  language: '#14b8a6', // teal-500
  creature: '#ef4444', // red-500
  default: '#6b7280', // gray-500
};

// Icon map for categories (Material Icons font names)
const CATEGORY_ICONS: Record<string, string> = {
  character: 'person',
  location: 'castle',
  family: 'supervisor_account',
  creature: 'bug_report',
  institution: 'business',
  trait: 'ac_unit',
  species: 'child_care',
  ability: 'auto_fix_high',
  language: 'translate',
  object: 'hub',
  map: 'map',
  zone: 'architecture',
  collective: 'groups',
  title: 'military_tech',
  phenomenon: 'thunderstorm',
  law: 'gavel',
  event: 'event',
  construct: 'api',
  marker: 'place',
  pin: 'push_pin',
  narrative: 'menu_book',
  world: 'public',
  default: 'category',
};

export function NetworkView({ selectedElement, className = '' }: NetworkViewProps) {
  const { elements } = useWorldContext();
  const navigate = useNavigate();
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlightNodes, setHighlightNodes] = useState(new Set<string>());
  const [highlightLinks, setHighlightLinks] = useState(new Set<string>());
  const [hoverNode, setHoverNode] = useState<string | null>(null);
  const [maxDepth, setMaxDepth] = useState(1); // Control how many levels deep to show

  // Build graph data from element relationships
  const graphData = useMemo(() => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const addedNodes = new Set<string>();
    const nodesToProcess: Array<{id: string, level: number}> = [];

    // Add center node at origin
    nodes.push({
      id: selectedElement.id,
      name: selectedElement.name || 'Unnamed',
      category: selectedElement.category || 'default',
      level: 0,
      x: 0,
      y: 0,
    });
    addedNodes.add(selectedElement.id);
    nodesToProcess.push({id: selectedElement.id, level: 0});

    // Helper to add a node if not already added
    const addNode = (elementId: string, level: number, relationshipType: string): boolean => {
      if (addedNodes.has(elementId) || level > maxDepth) return false;
      
      const element = elements.get(elementId);
      if (!element) return false;

      nodes.push({
        id: elementId,
        name: element.name || 'Unnamed',
        category: element.category || 'default',
        level,
        relationshipType,
      });
      addedNodes.add(elementId);
      
      // Add to processing queue if we haven't reached max depth
      if (level < maxDepth) {
        nodesToProcess.push({id: elementId, level});
      }
      
      return true;
    };

    // Helper to add a link
    const addLink = (source: string, target: string, type: string) => {
      // Only add link if both nodes exist
      if (addedNodes.has(source) && addedNodes.has(target)) {
        links.push({
          source,
          target,
          type,
          color: RELATIONSHIP_COLORS[type] || RELATIONSHIP_COLORS.default,
        });
      }
    };

    // Process relationships for a specific element
    const processElementRelationships = (elementId: string, currentLevel: number) => {
      const element = elements.get(elementId);
      if (!element) return;
      
      const nextLevel = currentLevel + 1;
      if (nextLevel > maxDepth) return;

      // Single link fields
      const singleLinkFields = ['location', 'birthplace', 'supertype'];
      
      // Array link fields
      const arrayLinkFields = [
        'friends', 'family', 'rivals', 'species', 'languages', 
        'abilities', 'traits', 'objects', 'institutions', 'members'
      ];

      // Process single link fields
      for (const field of singleLinkFields) {
        const value = (element as any)[field];
        if (value && typeof value === 'string') {
          if (addNode(value, nextLevel, field)) {
            addLink(elementId, value, field);
          }
        }
      }

      // Process array link fields
      for (const field of arrayLinkFields) {
        const values = (element as any)[field];
        if (Array.isArray(values)) {
          for (const value of values) {
            if (typeof value === 'string' && addNode(value, nextLevel, field)) {
              addLink(elementId, value, field);
            }
          }
        }
      }

      // Find reverse relationships - elements that link TO this element
      elements.forEach((otherElement) => {
        if (otherElement.id !== elementId) {
          // Check single link fields
          const reverseFields = ['location', 'birthplace', 'supertype'];
          for (const field of reverseFields) {
            const value = (otherElement as any)[field];
            if (value === elementId) {
              if (addNode(otherElement.id, nextLevel, `has-${field}`)) {
                addLink(elementId, otherElement.id, field);
              }
            }
          }

          // Check array link fields
          const reverseArrayFields = [
            'friends', 'family', 'rivals', 'species', 'languages', 
            'abilities', 'traits', 'objects', 'institutions', 'members'
          ];
          for (const field of reverseArrayFields) {
            const values = (otherElement as any)[field];
            if (Array.isArray(values) && values.includes(elementId)) {
              if (addNode(otherElement.id, nextLevel, `is-${field}`)) {
                addLink(elementId, otherElement.id, field);
              }
            }
          }
        }
      });

      // Special handling for location - show other elements at the same location
      if (currentLevel === 0) { // Only for the center element
        const location = (element as any).location;
        if (location && typeof location === 'string' && maxDepth >= 2) {
          // Find all other elements at this location
          elements.forEach((otherElement) => {
            if (otherElement.id !== elementId && 
                (otherElement as any).location === location &&
                addNode(otherElement.id, 2, 'co-located')) {
              addLink(location, otherElement.id, 'contains');
            }
          });
        }
      }
    };

    // Process nodes level by level
    let currentIndex = 0;
    while (currentIndex < nodesToProcess.length) {
      const { id, level } = nodesToProcess[currentIndex];
      processElementRelationships(id, level);
      currentIndex++;
    }

    // Initialize positions for better starting layout
    // Group nodes by level for better positioning
    const nodesByLevel = new Map<number, GraphNode[]>();
    nodes.forEach(node => {
      const level = node.level;
      if (!nodesByLevel.has(level)) {
        nodesByLevel.set(level, []);
      }
      nodesByLevel.get(level)!.push(node);
    });
    
    // Position nodes by level
    nodesByLevel.forEach((levelNodes, level) => {
      if (level === 0) {
        // Center node at origin
        levelNodes[0].x = 0;
        levelNodes[0].y = 0;
      } else {
        // Position nodes in concentric circles
        const radius = level * 80; // Increase radius by 80 for each level
        const angleStep = (2 * Math.PI) / levelNodes.length;
        levelNodes.forEach((node, index) => {
          const angle = angleStep * index;
          node.x = Math.cos(angle) * radius;
          node.y = Math.sin(angle) * radius;
        });
      }
    });

    return { nodes, links };
  }, [selectedElement, elements, maxDepth]);

  // Handle node click - navigate to element
  const handleNodeClick = useCallback((node: any) => {
    if (node.id !== selectedElement.id) {
      navigate(`/element/${node.id}`);
    }
  }, [navigate, selectedElement.id]);

  // Handle node hover
  const handleNodeHover = useCallback((node: any) => {
    const newHighlightNodes = new Set<string>();
    const newHighlightLinks = new Set<string>();

    if (node) {
      newHighlightNodes.add(node.id);
      // Highlight connected nodes and links
      graphData.links.forEach(link => {
        if (link.source === node.id || link.target === node.id) {
          newHighlightLinks.add(`${link.source}-${link.target}`);
          newHighlightNodes.add(link.source as string);
          newHighlightNodes.add(link.target as string);
        }
      });
    }

    setHighlightNodes(newHighlightNodes);
    setHighlightLinks(newHighlightLinks);
    setHoverNode(node?.id || null);
  }, [graphData.links]);

  // Paint nodes with icons and improved design
  const paintNode = useCallback((node: GraphNode, ctx: CanvasRenderingContext2D) => {
    const isHighlighted = hoverNode === null || highlightNodes.has(node.id);
    const isCenter = node.level === 0;
    // Gradually decrease size as we go deeper
    const size = isCenter ? 20 : Math.max(8, 18 - node.level * 2);
    
    // Draw node circle with gradient
    ctx.beginPath();
    ctx.arc(node.x || 0, node.y || 0, size, 0, 2 * Math.PI);
    
    // Create gradient for depth
    const gradient = ctx.createRadialGradient(
      (node.x || 0) - size/3, (node.y || 0) - size/3, 0,
      node.x || 0, node.y || 0, size
    );
    
    const baseColor = NODE_COLORS[node.category] || NODE_COLORS.default;
    if (isHighlighted) {
      gradient.addColorStop(0, `${baseColor}ee`);
      gradient.addColorStop(1, baseColor);
    } else {
      gradient.addColorStop(0, `${baseColor}66`);
      gradient.addColorStop(1, `${baseColor}44`);
    }
    
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Border with glow effect for center node
    if (isCenter) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = baseColor;
    }
    ctx.strokeStyle = isCenter ? '#000000' : baseColor;
    ctx.lineWidth = isCenter ? 3 : 2;
    ctx.stroke();
    ctx.shadowBlur = 0;
    
    // Draw icon using Material Icons font
    const iconName = CATEGORY_ICONS[node.category] || CATEGORY_ICONS.default;
    ctx.font = `${isCenter ? '16px' : '12px'} "Material Icons Outlined"`;
    ctx.fillStyle = isHighlighted ? '#374151' : '#6b7280';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(iconName, node.x || 0, node.y || 0);
    
    // Draw label with background for better readability
    if (isHighlighted) {
      const fontSize = isCenter ? 14 : 12;
      ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
      ctx.textAlign = 'center';
      
      // Measure text for background
      const nameMetrics = ctx.measureText(node.name);
      const labelY = (node.y || 0) + size + 8;
      
      // Draw name background
      ctx.fillStyle = 'rgba(249, 250, 251, 0.95)';
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 1;
      const padding = 4;
      const bgHeight = fontSize + padding * 2;
      
      ctx.beginPath();
      ctx.roundRect(
        (node.x || 0) - nameMetrics.width / 2 - padding,
        labelY - bgHeight / 2,
        nameMetrics.width + padding * 2,
        bgHeight,
        4
      );
      ctx.fill();
      ctx.stroke();
      
      // Draw name text
      ctx.fillStyle = '#4b5563';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.name, node.x || 0, labelY);
      
      // Show relationship type for non-center nodes with better styling
      if (node.relationshipType && !isCenter) {
        const relY = labelY + bgHeight / 2 + 8;
        const relText = node.relationshipType.replace(/-/g, ' ');
        const relMetrics = ctx.measureText(relText);
        
        // Relationship background
        ctx.font = '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.fillStyle = RELATIONSHIP_COLORS[node.relationshipType] || RELATIONSHIP_COLORS.default;
        ctx.globalAlpha = 0.15;
        ctx.beginPath();
        ctx.roundRect(
          (node.x || 0) - relMetrics.width / 2 - 3,
          relY - 6,
          relMetrics.width + 6,
          12,
          3
        );
        ctx.fill();
        ctx.globalAlpha = 1;
        
        // Relationship text
        ctx.fillStyle = RELATIONSHIP_COLORS[node.relationshipType] || RELATIONSHIP_COLORS.default;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(relText, node.x || 0, relY);
      }
    }
  }, [highlightNodes, hoverNode]);

  // Configure link appearance
  const getLinkColor = useCallback((link: GraphLink) => {
    const isHighlighted = highlightLinks.has(`${link.source}-${link.target}`);
    return isHighlighted ? (link.color || '#999999') : `${link.color || '#999999'}33`;
  }, [highlightLinks]);

  const getLinkWidth = useCallback((link: GraphLink) => {
    return highlightLinks.has(`${link.source}-${link.target}`) ? 2 : 1;
  }, [highlightLinks]);

  // Configure forces and center graph on mount
  useEffect(() => {
    if (fgRef.current) {
      // Configure forces for better spacing
      fgRef.current.d3Force('charge').strength(-300);
      fgRef.current.d3Force('link').distance(80);
      
      // Add a stronger center force to keep nodes more centered
      fgRef.current.d3Force('center').strength(0.5);
      
      // Set the center force position explicitly
      const centerForce = fgRef.current.d3Force('center');
      if (centerForce) {
        centerForce.x(0).y(0);
      }
      
      // Group nodes by level for initial positioning
      const nodesByLevel = new Map<number, typeof graphData.nodes>();
      graphData.nodes.forEach(node => {
        const level = node.level;
        if (!nodesByLevel.has(level)) {
          nodesByLevel.set(level, []);
        }
        nodesByLevel.get(level)!.push(node);
      });
      
      // Initialize node positions around center
      nodesByLevel.forEach((levelNodes, level) => {
        if (level === 0) {
          // Center node stays at origin
          levelNodes[0].x = 0;
          levelNodes[0].y = 0;
        } else {
          // Position nodes in concentric circles
          const radius = level * 80;
          const angleStep = (2 * Math.PI) / levelNodes.length;
          levelNodes.forEach((node, index) => {
            const angle = angleStep * index;
            node.x = Math.cos(angle) * radius;
            node.y = Math.sin(angle) * radius;
          });
        }
      });
      
      // Reheat the simulation to apply new positions
      fgRef.current.d3ReheatSimulation();
      
      // Pin the center node after initial layout
      setTimeout(() => {
        const centerNode = graphData.nodes.find(n => n.level === 0);
        if (centerNode && fgRef.current) {
          centerNode.fx = 0;
          centerNode.fy = 0;
        }
      }, 2000);
      
      // Initial setup without animation
      if (fgRef.current) {
        // Set initial zoom and center without animation
        fgRef.current.zoom(0.8, 0);
        fgRef.current.centerAt(0, 0, 0);
      }
      
      // One smooth adjustment after graph settles
      setTimeout(() => {
        if (fgRef.current) {
          // Smooth transition to ensure proper centering
          fgRef.current.centerAt(0, 0, 500);
        }
      }, 100);
    }
  }, [graphData.nodes]);

  return (
    <div className={`${className} bg-white rounded-lg shadow-sm relative overflow-hidden`} ref={containerRef}>
      {/* Graph container */}
      <div className="w-full h-full flex items-center justify-center">
        <ForceGraph2D
          ref={fgRef}
          graphData={graphData}
          nodeRelSize={1}
          nodeCanvasObject={paintNode}
          d3AlphaDecay={0.02}
          d3VelocityDecay={0.3}
          nodePointerAreaPaint={(node, color, ctx) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            const size = node.level === 0 ? 20 : Math.max(8, 18 - node.level * 2);
            ctx.arc(node.x || 0, node.y || 0, size, 0, 2 * Math.PI);
            ctx.fill();
          }}
          linkColor={getLinkColor}
          linkWidth={getLinkWidth}
          linkDirectionalParticles={2}
          linkDirectionalParticleSpeed={0.005}
          linkDirectionalParticleWidth={2}
          linkDirectionalParticleColor={() => '#ffffff'}
          onNodeClick={handleNodeClick}
          onNodeHover={handleNodeHover}
          onBackgroundClick={() => {
            setHighlightNodes(new Set());
            setHighlightLinks(new Set());
            setHoverNode(null);
          }}
          enableNodeDrag={true}
          enableZoomInteraction={true}
          enablePanInteraction={true}
          enableZoomPanInteraction={true}
          minZoom={0.5}
          maxZoom={2}
          warmupTicks={0}
          cooldownTicks={100}
          onZoom={({ k }) => {
            // Constrain zoom to prevent nodes from going out of bounds
            if (k < 0.5 && fgRef.current) {
              fgRef.current.zoom(0.5);
            }
          }}
        />
      </div>

      {/* Legend - context aware based on relationships actually shown */}
      <div className="absolute bottom-16 left-4 bg-slate-100/95 backdrop-blur-sm rounded-lg p-3 shadow-lg max-h-48 overflow-y-auto">
        <h4 className="text-xs font-semibold mb-2 text-gray-700">Relationships</h4>
        <div className="space-y-1">
          {(() => {
            // Collect unique relationship types from current graph
            const activeRelationships = new Set<string>();
            graphData.links.forEach(link => {
              activeRelationships.add(link.type);
            });
            
            // Show only active relationships with formatted names
            return Array.from(activeRelationships).sort().map(type => {
              const displayName = type.replace(/-/g, ' ');
              return (
                <div key={type} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full border border-gray-300" 
                    style={{ backgroundColor: RELATIONSHIP_COLORS[type] || RELATIONSHIP_COLORS.default }}
                  />
                  <span className="text-xs text-gray-600 capitalize">{displayName}</span>
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        {/* Depth control */}
        <div className="bg-slate-100/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <label className="text-xs font-semibold text-gray-700 block mb-2">
            Network Depth: {maxDepth}
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={maxDepth}
            onChange={(e) => setMaxDepth(parseInt(e.target.value))}
            className="w-32 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((maxDepth - 1) / 4) * 100}%, #e5e7eb ${((maxDepth - 1) / 4) * 100}%, #e5e7eb 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
          </div>
        </div>
        
        {/* Reset button */}
        <button
          onClick={() => {
            if (fgRef.current) {
              fgRef.current.centerAt(0, 0, 500);
              fgRef.current.zoom(0.8, 500);
            }
          }}
          className="bg-blue-100/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg hover:bg-blue-200/90 transition-colors flex items-center gap-2 text-blue-900"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-sm font-medium">Recenter</span>
        </button>
      </div>
    </div>
  );
}