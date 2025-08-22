import { useState, useMemo } from 'react';
import { useWorldContext } from '../../contexts/WorldContext';
import { CategoryIcon } from '../../utils/categoryIcons';
import type { Element } from '../../types/world';
import { ONLYWORLDS_CATEGORIES } from '../../constants/categories';

interface ElementQuickRefProps {
  narrative: Element;
  onElementInsert: (elementId: string, elementName: string, elementType: string) => void;
  onElementUnlink?: (elementId: string, elementType: string) => void;
}

interface LinkedElementItemProps {
  element: Element;
  isInText: boolean;
  mentionCount: number;
  onInsert: () => void;
  onUnlink?: () => void;
}

function LinkedElementItem({ element, isInText, mentionCount, onInsert, onUnlink }: LinkedElementItemProps) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div
      className="relative group"
      onMouseEnter={() => setShowPreview(true)}
      onMouseLeave={() => setShowPreview(false)}
    >
      <div className="flex items-center gap-1">
        <button
          onClick={onInsert}
          className="flex-1 text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors group"
        >
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0" title={element.category}>
              <CategoryIcon 
                category={element.category} 
                className="text-lg text-gray-600 dark:text-gray-400"
              />
            </div>
            <span className="flex-1 flex items-center text-sm font-medium text-gray-900 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
              <span className="truncate">{element.name}</span>
              {mentionCount > 0 && (
                <span className="ml-auto mr-2 text-xs text-gray-500 dark:text-gray-400">({mentionCount})</span>
              )}
            </span>
          </div>
        </button>
        
        <div className="flex items-center opacity-0 group-hover:opacity-100">
          {/* Go to element button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              const elementUrl = `/browse-tool/element/${element.id}`;
              window.open(elementUrl, '_blank');
            }}
            className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
            title="Open element in new tab"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
          
          {onUnlink && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUnlink();
              }}
              className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
              title="Unlink from narrative"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Hover preview */}
      {showPreview && element.description && (
        <div className="absolute left-full ml-2 top-0 z-20 w-64 p-3 bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-bg-border rounded-lg shadow-lg">
          <h4 className="font-medium text-gray-900 dark:text-gray-200 mb-1">{element.name}</h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-4">{element.description}</p>
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="font-medium">Category:</span> {element.category}
            {element.supertype && (
              <>
                <br />
                <span className="font-medium">Type:</span> {element.supertype}
                {element.subtype && <span> / {element.subtype}</span>}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Category field mapping - all category-based multilink fields
const CATEGORY_FIELDS: Record<string, string> = {
  'abilities': 'ability',
  'characters': 'character',
  'collectives': 'collective',
  'constructs': 'construct',
  'creatures': 'creature',
  'events': 'event',
  'families': 'family',
  'institutions': 'institution',
  'languages': 'language',
  'laws': 'law',
  'locations': 'location',
  'maps': 'map',
  'markers': 'marker',
  'narratives': 'narrative',
  'objects': 'object',
  'phenomena': 'phenomenon',
  'pins': 'pin',
  'relations': 'relation',
  'species': 'species',
  'titles': 'title',
  'traits': 'trait',
  'zones': 'zone',
};

export function ElementQuickRef({ narrative, onElementInsert, onElementUnlink }: ElementQuickRefProps) {
  const { elements } = useWorldContext();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'in-text' | 'not-in-text'>('all');
  const [sortMode, setSortMode] = useState<'count' | 'alphabet' | 'category'>('count');

  // Get all linked elements from category-based fields
  const linkedElements = useMemo(() => {
    const linked: Array<{ element: Element; fieldName: string; category: string }> = [];
    
    // Check each category field
    for (const [fieldName, categoryName] of Object.entries(CATEGORY_FIELDS)) {
      const ids = narrative[fieldName] || [];
      if (Array.isArray(ids)) {
        ids.forEach(id => {
          const element = elements.get(id);
          if (element) {
            linked.push({ element, fieldName, category: categoryName });
          }
        });
      }
    }
    
    return linked;
  }, [narrative, elements]);

  // Check which elements are mentioned in the text (either as links or plain text)
  const elementsInText = useMemo(() => {
    const textIds = new Set<string>();
    const storyText = narrative.story || '';
    
    if (!storyText) return textIds;
    
    // Check each linked element to see if it appears in the text
    linkedElements.forEach(({ element }) => {
      // Check for markdown links
      const linkPattern = new RegExp(`\\[[^\\]]*\\]\\([^):]+:${element.id}\\)`, 'g');
      if (storyText.match(linkPattern)) {
        textIds.add(element.id);
        return; // Already found, no need to check plain text
      }
      
      // Check for plain text mentions (using same strict pattern as counting)
      const nameEscaped = element.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const namePattern = new RegExp(`(?<![a-zA-Z0-9])${nameEscaped}(?![a-zA-Z0-9])`, 'gi');
      if (storyText.match(namePattern)) {
        textIds.add(element.id);
      }
    });
    
    return textIds;
  }, [narrative.story, linkedElements]);

  // Compute mention counts for each element
  const elementMentionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    const storyText = narrative.story || '';
    
    if (!storyText) return counts;
    
    // Count mentions for each linked element
    linkedElements.forEach(({ element }) => {
      let count = 0;
      
      // Count markdown links for this element
      const linkPattern = new RegExp(`\\[[^\\]]*\\]\\([^):]+:${element.id}\\)`, 'g');
      const linkMatches = storyText.match(linkPattern);
      if (linkMatches) {
        count += linkMatches.length;
      }
      
      // Count plain text mentions of the element name (case-insensitive)
      // Only match complete words - must have space/punctuation/start/end around them
      // This prevents matching "car" in "scar" or "country" in "country's"
      const nameEscaped = element.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Match only when surrounded by whitespace, punctuation, or start/end of string
      // but NOT by letters or numbers
      const namePattern = new RegExp(`(?<![a-zA-Z0-9])${nameEscaped}(?![a-zA-Z0-9])`, 'gi');
      const nameMatches = storyText.match(namePattern);
      if (nameMatches) {
        count += nameMatches.length;
      }
      
      counts.set(element.id, count);
    });
    
    return counts;
  }, [narrative.story, linkedElements]);

  // Filter linked elements based on filter mode
  const filteredElements = useMemo(() => {
    let filtered = linkedElements;
    
    // Apply filter mode
    if (filterMode === 'in-text') {
      filtered = filtered.filter(({ element }) => elementsInText.has(element.id));
    } else if (filterMode === 'not-in-text') {
      filtered = filtered.filter(({ element }) => !elementsInText.has(element.id));
    }
    
    // Create flat list with element info including mention counts
    const flatList = filtered.map(({ element, fieldName }) => ({
      element,
      isInText: elementsInText.has(element.id),
      mentionCount: elementMentionCounts.get(element.id) || 0,
      fieldName
    }));
    
    // Sort based on sort mode
    flatList.sort((a, b) => {
      if (sortMode === 'count') {
        // First sort by mention count (descending)
        if (a.mentionCount !== b.mentionCount) {
          return b.mentionCount - a.mentionCount;
        }
        // Then by in-text status
        if (a.isInText && !b.isInText) return -1;
        if (!a.isInText && b.isInText) return 1;
        // Finally alphabetically
        return a.element.name.localeCompare(b.element.name);
      } else if (sortMode === 'alphabet') {
        // Sort alphabetically by name
        return a.element.name.localeCompare(b.element.name);
      } else if (sortMode === 'category') {
        // Sort by category order (as defined in ONLYWORLDS_CATEGORIES), then by name
        const categoryIndexA = ONLYWORLDS_CATEGORIES.indexOf(a.element.category as any);
        const categoryIndexB = ONLYWORLDS_CATEGORIES.indexOf(b.element.category as any);
        
        if (categoryIndexA !== categoryIndexB) {
          // Both found in list, sort by index
          if (categoryIndexA !== -1 && categoryIndexB !== -1) {
            return categoryIndexA - categoryIndexB;
          }
          // Put unknown categories at the end
          if (categoryIndexA === -1) return 1;
          if (categoryIndexB === -1) return -1;
        }
        // Same category or both unknown, sort by name
        return a.element.name.localeCompare(b.element.name);
      }
      return 0;
    });
    
    return flatList;
  }, [linkedElements, filterMode, elementsInText, elementMentionCounts, sortMode]);

  // Count statistics
  const stats = useMemo(() => {
    const total = linkedElements.length;
    const inText = linkedElements.filter(({ element }) => elementsInText.has(element.id)).length;
    const notInText = total - inText;
    return { total, inText, notInText };
  }, [linkedElements, elementsInText]);

  if (isCollapsed) {
    return (
      <div className="w-12 bg-gray-50 dark:bg-dark-bg-secondary border-l border-gray-200 dark:border-dark-bg-border flex flex-col items-center py-4 h-full">
        <button
          onClick={() => setIsCollapsed(false)}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
          title="Expand linked elements"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 writing-mode-vertical-rl">
          Linked ({stats.total})
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-gray-50 dark:bg-dark-bg-secondary border-l border-gray-200 dark:border-dark-bg-border flex flex-col h-full">
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-200 dark:border-dark-bg-border bg-white dark:bg-dark-bg-tertiary">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300" title="Elements linked to fields in the 'Involves' section">
            Linked Elements
          </h3>
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 transition-colors"
            title="Collapse panel"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="px-3 py-1.5 bg-gray-100 dark:bg-dark-bg-tertiary border-b border-gray-200 dark:border-dark-bg-border">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span className="text-gray-600 dark:text-gray-400">
              Total: <span className="font-medium text-gray-900 dark:text-gray-200">{stats.total}</span>
            </span>
            <span className="text-green-600 dark:text-green-400">
              In text: <span className="font-medium">{stats.inText}</span>
            </span>
            <span className="text-gray-500 dark:text-gray-400">
              Not in text: <span className="font-medium">{stats.notInText}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Sort dropdowns */}
      <div className="p-2 bg-white dark:bg-dark-bg-tertiary border-b border-gray-200 dark:border-dark-bg-border">
        <div className="flex gap-2">
          <select
            value={filterMode}
            onChange={(e) => setFilterMode(e.target.value as 'all' | 'in-text' | 'not-in-text')}
            className="flex-1 px-2 py-1 text-xs bg-white dark:bg-dark-bg-secondary border border-gray-300 dark:border-dark-bg-border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-200"
          >
            <option value="all">Show all</option>
            <option value="in-text">Show in text</option>
            <option value="not-in-text">Show not in text</option>
          </select>
          
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as 'count' | 'alphabet' | 'category')}
            className="flex-1 px-2 py-1 text-xs bg-white dark:bg-dark-bg-secondary border border-gray-300 dark:border-dark-bg-border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-200"
          >
            <option value="count">Sort by count</option>
            <option value="alphabet">Sort by name</option>
            <option value="category">Sort by category</option>
          </select>
        </div>
      </div>

      {/* Element list */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredElements.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
            {filterMode === 'in-text' 
              ? 'No linked elements found in text'
              : filterMode === 'not-in-text'
                ? 'All linked elements are in text'
                : 'No elements linked to this narrative yet'}
          </p>
        ) : (
          <div className="space-y-1">
            {filteredElements.map(({ element, isInText, mentionCount, fieldName }) => (
              <LinkedElementItem
                key={element.id}
                element={element}
                isInText={isInText}
                mentionCount={mentionCount}
                onInsert={() => onElementInsert(element.id, element.name, element.category)}
                onUnlink={onElementUnlink ? () => onElementUnlink(element.id, element.category) : undefined}
              />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}