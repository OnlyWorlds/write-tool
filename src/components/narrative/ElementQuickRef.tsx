import { useState, useMemo } from 'react';
import { useWorldContext } from '../../contexts/WorldContext';
import type { Element } from '../../types/world';

interface ElementQuickRefProps {
  narrative: Element;
  onElementInsert: (elementId: string, elementName: string, elementType: string) => void;
}

type TabType = 'characters' | 'locations' | 'families' | 'collectives';

interface ElementItemProps {
  element: Element;
  type: string;
  onInsert: () => void;
}

function ElementItem({ element, type, onInsert }: ElementItemProps) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowPreview(true)}
      onMouseLeave={() => setShowPreview(false)}
    >
      <button
        onClick={onInsert}
        className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors group"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">
            {element.name}
          </span>
          <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </div>
      </button>

      {/* Hover preview */}
      {showPreview && element.description && (
        <div className="absolute left-full ml-2 top-0 z-20 w-64 p-3 bg-white dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-bg-border rounded-lg shadow-lg">
          <h4 className="font-medium text-gray-900 dark:text-gray-200 mb-1">{element.name}</h4>
          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-4">{element.description}</p>
          {element.supertype && (
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="font-medium">Type:</span> {element.supertype}
              {element.subtype && <span> / {element.subtype}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ElementQuickRef({ narrative, onElementInsert }: ElementQuickRefProps) {
  const { elements } = useWorldContext();
  const [activeTab, setActiveTab] = useState<TabType>('characters');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(true); // Start collapsed by default

  // Get linked elements by type
  const linkedElements = useMemo(() => {
    const getLinkedElements = (fieldName: string, category: string): Element[] => {
      const ids = narrative[fieldName];
      if (!ids || !Array.isArray(ids)) return [];
      return ids
        .map(id => elements.get(id))
        .filter((el): el is Element => el !== undefined && el.category === category);
    };

    return {
      characters: getLinkedElements('characters', 'character'),
      locations: getLinkedElements('locations', 'location'),
      families: getLinkedElements('families', 'family'),
      collectives: getLinkedElements('collectives', 'collective'),
    };
  }, [narrative, elements]);

  // Get all elements by category for searching
  const allElements = useMemo(() => {
    const filterByCategory = (category: string): Element[] => {
      return Array.from(elements.values())
        .filter(el => el.category === category)
        .filter(el => 
          searchTerm === '' || 
          el.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          el.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
          // Prioritize already linked elements
          const aLinked = linkedElements[activeTab].some(e => e.id === a.id);
          const bLinked = linkedElements[activeTab].some(e => e.id === b.id);
          if (aLinked && !bLinked) return -1;
          if (!aLinked && bLinked) return 1;
          return a.name.localeCompare(b.name);
        });
    };

    return {
      characters: filterByCategory('character'),
      locations: filterByCategory('location'),
      families: filterByCategory('family'),
      collectives: filterByCategory('collective'),
    };
  }, [elements, searchTerm, activeTab, linkedElements]);

  const tabs: { key: TabType; label: string; icon: React.ReactElement }[] = [
    {
      key: 'characters',
      label: 'Characters',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      key: 'locations',
      label: 'Locations',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      key: 'families',
      label: 'Families',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      key: 'collectives',
      label: 'Groups',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
  ];

  if (isCollapsed) {
    return (
      <div className="w-12 bg-gray-50 dark:bg-dark-bg-secondary border-l border-gray-200 dark:border-dark-bg-border flex flex-col items-center py-4">
        <button
          onClick={() => setIsCollapsed(false)}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
          title="Expand quick reference"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 writing-mode-vertical-rl">
          Quick Ref
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-gray-50 dark:bg-dark-bg-secondary border-l border-gray-200 dark:border-dark-bg-border flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-dark-bg-border bg-white dark:bg-dark-bg-tertiary">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">Quick Reference</h3>
          <button
            onClick={() => setIsCollapsed(true)}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
            title="Collapse panel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-dark-bg-border bg-white dark:bg-dark-bg-tertiary">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-3 py-2 text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
              activeTab === tab.key
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-bg-hover'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {linkedElements[tab.key].length > 0 && (
              <span className="ml-1 text-xs">({linkedElements[tab.key].length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="p-3 bg-white dark:bg-dark-bg-tertiary border-b border-gray-200 dark:border-dark-bg-border">
        <input
          type="text"
          placeholder={`Search ${activeTab}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-white dark:bg-dark-bg-secondary border border-gray-300 dark:border-dark-bg-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-200"
        />
      </div>

      {/* Element list */}
      <div className="flex-1 overflow-y-auto p-3">
        {linkedElements[activeTab].length > 0 && searchTerm === '' && (
          <div className="mb-3">
            <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              Linked {activeTab}
            </h4>
            <div className="space-y-1">
              {linkedElements[activeTab].map(element => (
                <ElementItem
                  key={element.id}
                  element={element}
                  type={activeTab.slice(0, -1)} // Remove 's' from plural
                  onInsert={() => onElementInsert(element.id, element.name, activeTab.slice(0, -1))}
                />
              ))}
            </div>
          </div>
        )}

        <div>
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            {searchTerm ? 'Search Results' : 'All ' + activeTab}
          </h4>
          <div className="space-y-1">
            {allElements[activeTab].length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No {activeTab} found
              </p>
            ) : (
              allElements[activeTab]
                .filter(el => !linkedElements[activeTab].some(linked => linked.id === el.id))
                .slice(0, 20)
                .map(element => (
                  <ElementItem
                    key={element.id}
                    element={element}
                    type={activeTab.slice(0, -1)}
                    onInsert={() => onElementInsert(element.id, element.name, activeTab.slice(0, -1))}
                  />
                ))
            )}
          </div>
        </div>
      </div>

      {/* Insert tip */}
      <div className="p-3 border-t border-gray-200 dark:border-dark-bg-border bg-gray-100 dark:bg-dark-bg-tertiary">
        <p className="text-xs text-gray-600 dark:text-gray-400">
          <span className="font-medium">Tip:</span> Click any element to insert a reference at your cursor position
        </p>
      </div>
    </div>
  );
}