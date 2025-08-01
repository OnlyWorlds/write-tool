import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorldContext } from '../contexts/WorldContext';
import { calculateReverseLinks, groupReverseLinks } from '../utils/reverseLinks';
import { CategoryIcon } from '../utils/categoryIcons';
import type { Element } from '../types/world';

interface ReverseRelationsPanelProps {
  elementId: string;
}

export function ReverseRelationsPanel({ elementId }: ReverseRelationsPanelProps) {
  const { elements } = useWorldContext();
  const navigate = useNavigate();
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [initialExpand, setInitialExpand] = useState(true);
  
  // Calculate reverse links with memoization
  const reverseLinks = useMemo(() => {
    return calculateReverseLinks(elementId, elements);
  }, [elementId, elements]);
  
  // Group by friendly labels
  const groupedLinks = useMemo(() => {
    return groupReverseLinks(reverseLinks);
  }, [reverseLinks]);
  
  // Reset initial expand when element changes
  useEffect(() => {
    setInitialExpand(true);
    setSearchQuery('');
  }, [elementId]);
  
  // Auto-expand groups on initial load or when element changes
  useEffect(() => {
    if (initialExpand && groupedLinks.size > 0) {
      const newExpanded = new Set<string>();
      // Auto-expand all groups if there are 3 or fewer, or if total items <= 10
      const totalItems = Array.from(groupedLinks.values()).reduce((sum, group) => sum + group.elements.length, 0);
      if (groupedLinks.size <= 3 || totalItems <= 10) {
        groupedLinks.forEach((_, label) => newExpanded.add(label));
      }
      setExpandedGroups(newExpanded);
      setInitialExpand(false);
    }
  }, [groupedLinks, initialExpand]);
  
  // Filter groups based on search
  const filteredGroups = useMemo(() => {
    if (!searchQuery) return groupedLinks;
    
    const query = searchQuery.toLowerCase();
    const filtered = new Map<string, { elements: Element[], fields: string[] }>();
    
    groupedLinks.forEach((group, label) => {
      const filteredElements = group.elements.filter(element => 
        element.name.toLowerCase().includes(query) ||
        element.category?.toLowerCase().includes(query) ||
        label.toLowerCase().includes(query)
      );
      
      if (filteredElements.length > 0) {
        filtered.set(label, { ...group, elements: filteredElements });
      }
    });
    
    return filtered;
  }, [groupedLinks, searchQuery]);
  
  const toggleGroup = (label: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(label)) {
      newExpanded.delete(label);
    } else {
      newExpanded.add(label);
    }
    setExpandedGroups(newExpanded);
  };
  
  const handleElementClick = (element: Element) => {
    navigate(`/element/${element.id}`);
  };
  
  // If no reverse links, show empty state
  if (groupedLinks.size === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="bg-sidebar-dark border-b border-border p-4">
          <h3 className="font-bold text-slate-800">Reverse Relations</h3>
          <p className="text-xs text-accent mt-1">Elements that reference this one</p>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-sm text-slate-500 text-center">
            No elements currently reference this one
          </p>
        </div>
      </div>
    );
  }
  
  // Calculate total reference count
  const totalReferences = Array.from(reverseLinks.values()).reduce((sum, elements) => sum + elements.length, 0);
  
  return (
    <div className="h-screen flex flex-col">
      <div className="bg-sidebar-dark border-b border-border p-4">
        <h3 className="font-bold text-slate-800">Reverse Relations</h3>
        <p className="text-xs text-accent mt-1">
          {totalReferences} {totalReferences === 1 ? 'reference' : 'references'} from {reverseLinks.size} {reverseLinks.size === 1 ? 'type' : 'types'}
        </p>
        
        {/* Search input */}
        {groupedLinks.size > 3 && (
          <div className="mt-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search references..."
              className="w-full px-3 py-1.5 text-sm bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-blue-50/30">
        <div className="space-y-3">
          {Array.from(filteredGroups.entries()).map(([label, group]) => {
            const isExpanded = expandedGroups.has(label) || filteredGroups.size === 1;
            
            return (
              <div 
                key={label} 
                className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden"
              >
                <button
                  onClick={() => toggleGroup(label)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <svg 
                      className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="font-medium text-slate-700">{label}</span>
                    <span className="text-sm text-slate-500">({group.elements.length})</span>
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="px-4 pb-3 space-y-1.5">
                    {group.elements.map(element => (
                      <button
                        key={element.id}
                        onClick={() => handleElementClick(element)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-blue-50 transition-colors group"
                      >
                        <CategoryIcon 
                          category={element.category || ''} 
                          className="text-lg text-slate-400 group-hover:text-blue-500 flex-shrink-0" 
                        />
                        <span className="text-sm text-slate-700 group-hover:text-blue-700 text-left">
                          {element.name}
                        </span>
                        <span className="text-xs text-slate-400 group-hover:text-blue-400 ml-auto">
                          {element.category}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}