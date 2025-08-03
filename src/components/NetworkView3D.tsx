import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { useNavigate } from 'react-router-dom';
import { useWorldContext } from '../contexts/WorldContext';
import type { Element } from '../types/world';
import * as THREE from 'three';
import SpriteText from 'three-spritetext';

interface NetworkView3DProps {
  selectedElement: Element;
  className?: string;
}

interface GraphNode {
  id: string;
  name: string;
  category: string;
  level: number;
  relationshipType?: string;
  x?: number;
  y?: number;
  z?: number;
  fx?: number;
  fy?: number;
  fz?: number;
  vx?: number;
  vy?: number;
  vz?: number;
}

interface GraphLink {
  source: string;
  target: string;
  type: string;
  color?: string;
}

// Relationship colors - same as 2D
const RELATIONSHIP_COLORS: Record<string, string> = {
  friends: '#059669',
  family: '#dc2626',
  rivals: '#7c2d12',
  location: '#2563eb',
  birthplace: '#1e3a8a',
  institutions: '#7c3aed',
  species: '#db2777',
  languages: '#0891b2',
  abilities: '#ea580c',
  traits: '#65a30d',
  objects: '#4f46e5',
  'has-location': '#059669',
  'is-location': '#059669',
  'co-located': '#16a34a',
  contains: '#14b8a6',
  default: '#4b5563',
};

// Node colors by category
const NODE_COLORS: Record<string, string> = {
  character: '#3b82f6',
  location: '#10b981',
  family: '#f59e0b',
  institution: '#8b5cf6',
  species: '#ec4899',
  object: '#f97316',
  trait: '#84cc16',
  ability: '#06b6d4',
  language: '#14b8a6',
  creature: '#ef4444',
  default: '#6b7280',
};

export function NetworkView3D({ selectedElement, className = '' }: NetworkView3DProps) {
  const { elements } = useWorldContext();
  const navigate = useNavigate();
  const fgRef = useRef<any>(null);
  const [highlightNodes, setHighlightNodes] = useState(new Set<string>());
  const [highlightLinks, setHighlightLinks] = useState(new Set<string>());
  const [hoverNode, setHoverNode] = useState<string | null>(null);
  const [maxDepth, setMaxDepth] = useState(1);

  // Build graph data - same logic as 2D
  const graphData = useMemo(() => {
    const nodes: GraphNode[] = [];
    const links: GraphLink[] = [];
    const addedNodes = new Set<string>();
    const nodesToProcess: Array<{id: string, level: number}> = [];

    // Add center node
    nodes.push({
      id: selectedElement.id,
      name: selectedElement.name || 'Unnamed',
      category: selectedElement.category || 'default',
      level: 0,
      x: 0,
      y: 0,
      z: 0,
    });
    addedNodes.add(selectedElement.id);
    nodesToProcess.push({id: selectedElement.id, level: 0});

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
      
      if (level < maxDepth) {
        nodesToProcess.push({id: elementId, level});
      }
      
      return true;
    };

    const addLink = (source: string, target: string, type: string) => {
      if (addedNodes.has(source) && addedNodes.has(target)) {
        links.push({
          source,
          target,
          type,
          color: RELATIONSHIP_COLORS[type] || RELATIONSHIP_COLORS.default,
        });
      }
    };

    const processElementRelationships = (elementId: string, currentLevel: number) => {
      const element = elements.get(elementId);
      if (!element) return;
      
      const nextLevel = currentLevel + 1;
      if (nextLevel > maxDepth) return;

      const singleLinkFields = ['location', 'birthplace', 'supertype'];
      const arrayLinkFields = [
        'friends', 'family', 'rivals', 'species', 'languages', 
        'abilities', 'traits', 'objects', 'institutions', 'members'
      ];

      for (const field of singleLinkFields) {
        const value = (element as any)[field];
        if (value && typeof value === 'string') {
          if (addNode(value, nextLevel, field)) {
            addLink(elementId, value, field);
          }
        }
      }

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

      // Reverse relationships
      elements.forEach((otherElement) => {
        if (otherElement.id !== elementId) {
          const reverseFields = ['location', 'birthplace', 'supertype'];
          for (const field of reverseFields) {
            const value = (otherElement as any)[field];
            if (value === elementId) {
              if (addNode(otherElement.id, nextLevel, `has-${field}`)) {
                addLink(elementId, otherElement.id, field);
              }
            }
          }

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

      // Co-located elements
      if (currentLevel === 0) {
        const location = (element as any).location;
        if (location && typeof location === 'string' && maxDepth >= 2) {
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

    let currentIndex = 0;
    while (currentIndex < nodesToProcess.length) {
      const { id, level } = nodesToProcess[currentIndex];
      processElementRelationships(id, level);
      currentIndex++;
    }

    // Initialize 3D positions in spherical layers
    const nodesByLevel = new Map<number, GraphNode[]>();
    nodes.forEach(node => {
      const level = node.level;
      if (!nodesByLevel.has(level)) {
        nodesByLevel.set(level, []);
      }
      nodesByLevel.get(level)!.push(node);
    });
    
    nodesByLevel.forEach((levelNodes, level) => {
      if (level === 0) {
        levelNodes[0].x = 0;
        levelNodes[0].y = 0;
        levelNodes[0].z = 0;
      } else {
        const radius = level * 100;
        levelNodes.forEach((node, index) => {
          // Distribute nodes on a sphere
          const phi = Math.acos(1 - 2 * (index + 0.5) / levelNodes.length);
          const theta = Math.sqrt(levelNodes.length * Math.PI) * phi;
          
          node.x = radius * Math.sin(phi) * Math.cos(theta);
          node.y = radius * Math.sin(phi) * Math.sin(theta);
          node.z = radius * Math.cos(phi);
        });
      }
    });

    return { nodes, links };
  }, [selectedElement, elements, maxDepth]);

  // Handle node click
  const handleNodeClick = useCallback((node: any, event: MouseEvent) => {
    // Prevent the click from interfering with controls
    event.stopPropagation();
    
    if (node.id !== selectedElement.id) {
      // Small delay to ensure controls are not interrupted
      setTimeout(() => {
        navigate(`/element/${node.id}`);
      }, 50);
    }
  }, [navigate, selectedElement.id]);

  // Handle node hover
  const handleNodeHover = useCallback((node: any) => {
    const newHighlightNodes = new Set<string>();
    const newHighlightLinks = new Set<string>();

    if (node) {
      newHighlightNodes.add(node.id);
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

  // Create 3D node objects
  const nodeThreeObject = useCallback((node: GraphNode) => {
    const isHighlighted = hoverNode === null || highlightNodes.has(node.id);
    const isCenter = node.level === 0;
    const size = isCenter ? 15 : Math.max(6, 12 - node.level * 2);
    
    // Create a group to hold sphere and label
    const group = new THREE.Group();
    
    // Create sphere
    const geometry = new THREE.SphereGeometry(size, 32, 16);
    const material = new THREE.MeshPhongMaterial({
      color: NODE_COLORS[node.category] || NODE_COLORS.default,
      opacity: isHighlighted ? 1 : 0.5,
      transparent: true,
      emissive: isCenter ? NODE_COLORS[node.category] : 0x000000,
      emissiveIntensity: isCenter ? 0.3 : 0,
    });
    
    const sphere = new THREE.Mesh(geometry, material);
    group.add(sphere);
    
    // Add text label
    if (isHighlighted || isCenter) {
      const sprite = new SpriteText(node.name);
      sprite.material.depthWrite = false;
      sprite.color = '#ffffff';
      sprite.textHeight = isCenter ? 8 : 6;
      sprite.position.y = size + 10;
      sprite.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      sprite.padding = 2;
      sprite.borderRadius = 4;
      group.add(sprite);
    }
    
    return group;
  }, [highlightNodes, hoverNode]);

  // Configure link appearance
  const getLinkColor = useCallback((link: GraphLink) => {
    const isHighlighted = highlightLinks.has(`${link.source}-${link.target}`);
    return isHighlighted ? (link.color || '#999999') : `${link.color || '#999999'}33`;
  }, [highlightLinks]);

  const getLinkWidth = useCallback((link: GraphLink) => {
    return highlightLinks.has(`${link.source}-${link.target}`) ? 3 : 1;
  }, [highlightLinks]);

  // Setup camera and controls
  useEffect(() => {
    let ensureControlsEnabled: (() => void) | undefined;
    
    if (fgRef.current) {
      // Configure forces
      fgRef.current.d3Force('charge').strength(-400);
      fgRef.current.d3Force('link').distance(100);
      
      // Set initial camera position
      fgRef.current.cameraPosition({ x: 0, y: 0, z: 300 });
      
      // Swap mouse controls: left click = pan, right click = rotate
      const controls = fgRef.current.controls();
      if (controls) {
        controls.mouseButtons = {
          LEFT: 2,   // Pan (normally right click)
          MIDDLE: 1, // Zoom (unchanged)
          RIGHT: 0   // Rotate (normally left click)
        };
        
        // Ensure controls remain enabled
        controls.enabled = true;
        
        // Re-enable controls after any interaction
        ensureControlsEnabled = () => {
          if (controls && !controls.enabled) {
            controls.enabled = true;
          }
        };
        
        // Add listeners to re-enable controls if they get disabled
        window.addEventListener('mouseup', ensureControlsEnabled);
        window.addEventListener('touchend', ensureControlsEnabled);
      }
      
      // Pin center node
      setTimeout(() => {
        const centerNode = graphData.nodes.find(n => n.level === 0);
        if (centerNode) {
          centerNode.fx = 0;
          centerNode.fy = 0;
          centerNode.fz = 0;
        }
      }, 2000);
    }
    
    // Cleanup listeners on unmount
    return () => {
      if (ensureControlsEnabled) {
        window.removeEventListener('mouseup', ensureControlsEnabled);
        window.removeEventListener('touchend', ensureControlsEnabled);
      }
    };
  }, [graphData.nodes]);

  return (
    <div className={`${className} bg-gray-900 rounded-lg shadow-sm relative overflow-hidden`}>
      <div className="w-full h-full">
        <ForceGraph3D
          ref={fgRef}
          graphData={graphData}
          nodeThreeObject={nodeThreeObject}
          nodeThreeObjectExtend={false}
          linkColor={getLinkColor}
          linkWidth={getLinkWidth}
          linkOpacity={0.6}
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
          enableNodeDrag={false}
          enableNavigationControls={true}
          enablePointerInteraction={true}
          showNavInfo={false}
          backgroundColor="#111827"
        />
      </div>

      {/* Legend */}
      <div className="absolute bottom-16 left-4 bg-gray-800/95 backdrop-blur-sm rounded-lg p-3 shadow-lg max-h-48 overflow-y-auto text-white">
        <h4 className="text-xs font-semibold mb-2">Relationships</h4>
        <div className="space-y-1">
          {(() => {
            const activeRelationships = new Set<string>();
            graphData.links.forEach(link => {
              activeRelationships.add(link.type);
            });
            
            return Array.from(activeRelationships).sort().map(type => {
              const displayName = type.replace(/-/g, ' ');
              return (
                <div key={type} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full border border-gray-600" 
                    style={{ backgroundColor: RELATIONSHIP_COLORS[type] || RELATIONSHIP_COLORS.default }}
                  />
                  <span className="text-xs text-gray-300 capitalize">{displayName}</span>
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        {/* Depth control */}
        <div className="bg-gray-800/95 backdrop-blur-sm rounded-lg p-3 shadow-lg text-white">
          <label className="text-xs font-semibold block mb-2">
            Network Depth: {maxDepth}
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={maxDepth}
            onChange={(e) => setMaxDepth(parseInt(e.target.value))}
            className="w-32 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${((maxDepth - 1) / 4) * 100}%, #4b5563 ${((maxDepth - 1) / 4) * 100}%, #4b5563 100%)`
            }}
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
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
              fgRef.current.cameraPosition({ x: 0, y: 0, z: 300 }, { x: 0, y: 0, z: 0 }, 1000);
            }
          }}
          className="bg-blue-600/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg hover:bg-blue-700/90 transition-colors flex items-center gap-2 text-white"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-sm font-medium">Recenter</span>
        </button>
        
        {/* 3D Controls info */}
        <div className="bg-gray-800/95 backdrop-blur-sm rounded-lg p-3 shadow-lg text-white text-xs">
          <div className="font-semibold mb-1">3D Controls:</div>
          <div className="space-y-0.5 text-gray-300">
            <div>• Left click: Pan</div>
            <div>• Right click: Rotate</div>
            <div>• Scroll: Zoom</div>
          </div>
        </div>
      </div>
    </div>
  );
}