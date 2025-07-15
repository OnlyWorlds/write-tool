import { ChevronDownIcon, ChevronRightIcon, PlusIcon, SearchIcon } from './icons';
import { useWorldContext } from '../contexts/WorldContext';
import { useSidebarStore } from '../stores/uiStore';
import { useRef, useEffect } from 'react';

export function CategorySidebar() {
  const { categories } = useWorldContext();
  const { expandedCategories, selectedElementId, filterText, toggleCategory, selectElement, openCreateModal, setFilterText } = useSidebarStore();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Focus search with "/" key
      if (event.key === '/' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
      // Clear search with Escape key
      if (event.key === 'Escape' && filterText) {
        setFilterText('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filterText, setFilterText]);

  // Filter elements based on search text
  const filteredCategories = new Map();
  
  if (filterText.trim()) {
    const searchTerm = filterText.toLowerCase();
    categories.forEach((elements, category) => {
      const filtered = elements.filter(element => 
        element.name.toLowerCase().includes(searchTerm) ||
        element.description?.toLowerCase().includes(searchTerm) ||
        element.type?.toLowerCase().includes(searchTerm) ||
        element.subtype?.toLowerCase().includes(searchTerm)
      );
      if (filtered.length > 0) {
        filteredCategories.set(category, filtered);
      }
    });
  } else {
    categories.forEach((elements, category) => {
      filteredCategories.set(category, elements);
    });
  }

  return (
    <aside className="w-64 bg-white border-r flex flex-col h-full">
      <div className="p-4 border-b space-y-3">
        <h2 className="text-lg font-semibold">Categories</h2>
        <div className="relative">
          <div className="absolute left-3 top-2.5 text-gray-400">
            <SearchIcon />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search elements... (press / to focus)"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full pl-10 pr-8 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {filterText && (
            <button
              onClick={() => setFilterText('')}
              className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {categories.size === 0 ? (
          <p className="text-sm text-gray-500 p-4">No elements loaded</p>
        ) : filteredCategories.size === 0 ? (
          <p className="text-sm text-gray-500 p-4">No elements found matching "{filterText}"</p>
        ) : (
          <div className="py-2">
            {Array.from(filteredCategories.entries()).map(([category, elements]) => {
              const isExpanded = expandedCategories.has(category);
              const isSearching = filterText.trim().length > 0;
              
              return (
                <div key={category}>
                  <div className="flex items-center">
                    <button
                      onClick={() => toggleCategory(category)}
                      className="flex-1 flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                        <span className="text-sm font-medium capitalize">{category}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {elements.length}
                        {isSearching && (
                          <span className="ml-1 text-blue-600">
                            / {categories.get(category)?.length || 0}
                          </span>
                        )}
                      </span>
                    </button>
                    <button
                      onClick={() => openCreateModal(category)}
                      className="p-2 hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-colors"
                      title={`Create new ${category}`}
                    >
                      <PlusIcon />
                    </button>
                  </div>
                  
                  {(isExpanded || isSearching) && (
                    <div className="ml-4">
                      {elements.map(element => (
                        <button
                          key={element.id}
                          onClick={() => selectElement(element.id)}
                          className={`w-full text-left px-4 py-1.5 text-sm hover:bg-gray-100 transition-colors ${
                            selectedElementId === element.id ? 'bg-blue-50 text-blue-700' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{element.name}</span>
                            {isSearching && element.type && (
                              <span className="text-xs text-gray-500 ml-1">
                                {element.type}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}