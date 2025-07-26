import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorldContext } from '../contexts/WorldContext';
import { useSidebarStore } from '../stores/uiStore';
import { CategoryIcon } from '../utils/categoryIcons';
import { ChevronDownIcon, ChevronRightIcon, PlusIcon, SearchIcon } from './icons';

export function CategorySidebar() {
  const { categories } = useWorldContext();
  const { expandedCategories, selectedElementId, filterText, toggleCategory, selectElement, openCreateModal, setFilterText, expandAllCategories } = useSidebarStore();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

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

  // Expand all categories when categories are loaded
  useEffect(() => {
    if (categories.size > 0) {
      const categoryNames = Array.from(categories.keys());
      expandAllCategories(categoryNames);
    }
  }, [categories, expandAllCategories]);

  // Filter elements based on search text (memoized for performance)
  const filteredCategories = useMemo(() => {
    const filtered = new Map();
    
    if (filterText.trim()) {
      const searchTerm = filterText.toLowerCase();
      categories.forEach((elements, category) => {
        const filteredElements = elements.filter(element => 
          element.name.toLowerCase().includes(searchTerm) ||
          element.description?.toLowerCase().includes(searchTerm) ||
          element.type?.toLowerCase().includes(searchTerm) ||
          element.subtype?.toLowerCase().includes(searchTerm)
        );
        if (filteredElements.length > 0) {
          filtered.set(category, filteredElements);
        }
      });
    } else {
      categories.forEach((elements, category) => {
        filtered.set(category, elements);
      });
    }
    
    return filtered;
  }, [categories, filterText]);

  return (
    <aside className="w-64 bg-sand-50 border-r border-sand-200 flex flex-col h-full">
      <div className="p-4 border-b border-sand-200 space-y-3 bg-sand-200 shadow-md">
        <h2 className="text-lg font-semibold text-sand-800">categories</h2>
        <div className="relative">
          <div className="absolute left-3 top-2.5 text-gray-500">
            <SearchIcon />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="filter..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full pl-10 pr-8 py-2 text-sm border border-sand-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-sand-50 text-gray-800 placeholder-gray-500"
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
          <p className="text-sm text-gray-500 p-4">no elements loaded</p>
        ) : filteredCategories.size === 0 ? (
          <p className="text-sm text-gray-500 p-4">no elements found matching "{filterText}"</p>
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
                      className="flex-1 flex items-center justify-between px-4 py-2 hover:bg-sand-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                        <CategoryIcon category={category} className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-800">{category.toLowerCase()}</span>
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
                      className="p-2 hover:bg-sand-100 text-gray-500 hover:text-blue-700 transition-colors"
                      title={`create new ${category}`}
                    >
                      <PlusIcon />
                    </button>
                  </div>
                  
                  {(isExpanded || isSearching) && (
                    <div className="ml-4">
                      {elements.map((element: any) => (
                        <button
                          key={element.id}
                          onClick={() => navigate(`/element/${element.id}`)}
                          className={`w-full text-left px-4 py-1.5 text-sm hover:bg-sand-100 transition-colors ${
                            selectedElementId === element.id ? 'bg-blue-200 text-blue-800' : 'text-gray-800'
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