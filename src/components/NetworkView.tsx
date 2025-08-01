import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { useNavigate } from 'react-router-dom';
import { useWorldContext } from '../contexts/WorldContext';
import type { Element } from '../types/world';

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

// Relationship types and their colors
const RELATIONSHIP_COLORS: Record<string, string> = {
  friends: '#10b981', // green
  family: '#f59e0b', // amber
  rivals: '#ef4444', // red
  location: '#3b82f6', // blue
  institutions: '#8b5cf6', // purple
  species: '#ec4899', // pink
  languages: '#06b6d4', // cyan
  abilities: '#f97316', // orange
  traits: '#84cc16', // lime
  objects: '#6366f1', // indigo
  default: '#6b7280', // gray
};

// Node colors by category
const NODE_COLORS: Record<string, string> = {
  character: '#1e40af',
  location: '#065f46',
  family: '#7c2d12',
  institution: '#4c1d95',
  species: '#701a75',
  object: '#713f12',
  trait: '#14532d',
  ability: '#7c2d12',
  language: '#0c4a6e',
  default: '#1f2937',
};

export function NetworkView({ selectedElement, className = '' }: NetworkViewProps) {
  const { elements } = useWorldContext();
  const navigate = useNavigate();
  const fgRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlightNodes, setHighlightNodes] = useState(new Set<string>());
  const [highlightLinks, setHighlightLinks] = useState(new Set<string>());
  const [hoverNode, setHoverNode] = useState<string | null>(null);

  // Build graph data from element relationships
  const graphData = useMemo(() => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const addedNodes = new Set<string>();

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

    // Helper to add a node if not already added
    const addNode = (elementId: string, level: number, relationshipType: string): boolean => {
      if (addedNodes.has(elementId)) return false;
      
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
      return true;
    };

    // Helper to add a link
    const addLink = (source: string, target: string, type: string) => {
      links.push({
        source,
        target,
        type,
        color: RELATIONSHIP_COLORS[type] || RELATIONSHIP_COLORS.default,
      });
    };

    // Extract all relationships from the selected element
    const processRelationships = () => {
      // Single link fields
      const singleLinkFields = ['location', 'birthplace', 'supertype'];
      
      // Array link fields
      const arrayLinkFields = [
        'friends', 'family', 'rivals', 'species', 'languages', 
        'abilities', 'traits', 'objects', 'institutions', 'members'
      ];

      // Process single link fields
      for (const field of singleLinkFields) {
        const value = (selectedElement as any)[field];
        if (value && typeof value === 'string') {
          if (addNode(value, 1, field)) {
            addLink(selectedElement.id, value, field);
          }
        }
      }

      // Process array link fields
      for (const field of arrayLinkFields) {
        const values = (selectedElement as any)[field];
        if (Array.isArray(values)) {
          for (const value of values) {
            if (typeof value === 'string' && addNode(value, 1, field)) {
              addLink(selectedElement.id, value, field);
            }
          }
        }
      }

      // Find reverse relationships - elements that link TO this element
      elements.forEach((element) => {
        if (element.id !== selectedElement.id) {
          // Check single link fields
          const reverseFields = ['location', 'birthplace', 'supertype'];
          for (const field of reverseFields) {
            const value = (element as any)[field];
            if (value === selectedElement.id) {
              if (addNode(element.id, 1, `has-${field}`)) {
                addLink(selectedElement.id, element.id, field);
              }
            }
          }

          // Check array link fields
          const reverseArrayFields = [
            'friends', 'family', 'rivals', 'species', 'languages', 
            'abilities', 'traits', 'objects', 'institutions', 'members'
          ];
          for (const field of reverseArrayFields) {
            const values = (element as any)[field];
            if (Array.isArray(values) && values.includes(selectedElement.id)) {
              if (addNode(element.id, 1, `is-${field}`)) {
                addLink(selectedElement.id, element.id, field);
              }
            }
          }
        }
      });

      // Special handling for location - show other elements at the same location
      const location = (selectedElement as any).location;
      if (location && typeof location === 'string') {
        // Find all other elements at this location
        elements.forEach((element) => {
          if (element.id !== selectedElement.id && 
              (element as any).location === location &&
              addNode(element.id, 2, 'co-located')) {
            addLink(location, element.id, 'contains');
          }
        });
      }
    };

    processRelationships();

    // Initialize positions for better starting layout
    const angleStep = (2 * Math.PI) / Math.max(1, nodes.length - 1);
    nodes.forEach((node, index) => {
      if (node.level === 0) {
        // Center node at origin
        node.x = 0;
        node.y = 0;
      } else if (node.level === 1) {
        // First level in inner circle
        const angle = angleStep * (index - 1);
        node.x = Math.cos(angle) * 100;
        node.y = Math.sin(angle) * 100;
      } else {
        // Second level in outer circle
        const angle = angleStep * (index - 1);
        node.x = Math.cos(angle) * 150;
        node.y = Math.sin(angle) * 150;
      }
    });

    return { nodes, links };
  }, [selectedElement, elements]);

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

  // Paint nodes
  const paintNode = useCallback((node: GraphNode, ctx: CanvasRenderingContext2D) => {
    const isHighlighted = hoverNode === null || highlightNodes.has(node.id);
    const isCenter = node.level === 0;
    const size = isCenter ? 16 : node.level === 1 ? 12 : 8;
    
    // Draw node circle
    ctx.beginPath();
    ctx.arc(node.x || 0, node.y || 0, size, 0, 2 * Math.PI);
    
    // Fill color based on category
    const baseColor = NODE_COLORS[node.category] || NODE_COLORS.default;
    ctx.fillStyle = isHighlighted ? baseColor : `${baseColor}33`;
    ctx.fill();
    
    // Border
    ctx.strokeStyle = isCenter ? '#ffffff' : baseColor;
    ctx.lineWidth = isCenter ? 3 : 1;
    ctx.stroke();
    
    // Draw label
    if (isHighlighted) {
      ctx.font = `${isCenter ? '18px' : '14px'} Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillStyle = isHighlighted ? '#000000' : '#666666';
      ctx.fillText(node.name, node.x || 0, (node.y || 0) + size + 4);
      
      // Show relationship type for non-center nodes
      if (node.relationshipType && !isCenter) {
        ctx.font = '10px Arial';
        ctx.fillStyle = '#666666';
        ctx.fillText(`(${node.relationshipType})`, node.x || 0, (node.y || 0) + size + 14);
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
      
      // Initialize node positions around center
      const angleStep = (2 * Math.PI) / (graphData.nodes.length - 1);
      graphData.nodes.forEach((node, index) => {
        if (node.level === 0) {
          // Center node stays at origin
          node.x = 0;
          node.y = 0;
        } else {
          // Position other nodes in a circle around center
          const angle = angleStep * (index - 1);
          const radius = node.level === 1 ? 100 : 150;
          node.x = Math.cos(angle) * radius;
          node.y = Math.sin(angle) * radius;
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
            ctx.arc(node.x || 0, node.y || 0, node.level === 0 ? 16 : node.level === 1 ? 12 : 8, 0, 2 * Math.PI);
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
            
            // Show only active relationships
            return Array.from(activeRelationships).sort().map(type => (
              <div key={type} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: RELATIONSHIP_COLORS[type] || RELATIONSHIP_COLORS.default }}
                />
                <span className="text-xs text-gray-600">{type}</span>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Instructions and Reset */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
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
        
        {/* Instructions */}
        <div className="bg-slate-100/95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <p className="text-xs text-gray-600">
            • Click nodes to navigate<br/>
            • Drag to pan, scroll to zoom<br/>
            • Hover to highlight connections
          </p>
        </div>
      </div>
    </div>
  );
}