import { useEffect, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useWorldContext } from '../contexts/WorldContext';
import { ApiService } from '../services/ApiService';
import { useSidebarStore } from '../stores/uiStore';
import { CategoryIcon } from '../utils/categoryIcons';
import { PlusIcon, SearchIcon, TrashIcon } from './icons';

export function CategorySidebar() {
  const { categories, worldKey, pin, deleteElement } = useWorldContext();
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
    <aside className="w-64 bg-sidebar border-r border-border flex flex-col h-full">
      <div className="p-4 border-b border-border bg-tab-bg shadow-md">
        <div className="relative">
          <div className="absolute left-3 top-2.5 text-text-light/60">
            <SearchIcon />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="filter.."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full pl-10 pr-8 py-2 text-sm border border-input-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-input-bg text-text-light placeholder-text-light/60"
          />
          {filterText && (
            <button
              onClick={() => setFilterText('')}
              className="absolute right-2 top-2 text-text-light/60 hover:text-text-light"
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {categories.size === 0 ? (
          <p className="text-sm text-text-light/60 p-4">no elements loaded</p>
        ) : filteredCategories.size === 0 ? (
          <p className="text-sm text-text-light/60 p-4">no elements found matching "{filterText}"</p>
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
                      className="flex-1 flex items-center justify-between px-4 py-2 hover:bg-icon-hover transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <CategoryIcon category={category} className={`w-4 h-4 ${isExpanded ? 'text-accent' : 'text-text-light/60'}`} />
                        <span className="text-sm font-medium text-text-light">{category.toLowerCase()}</span>
                      </div>
                      <span className="text-xs text-text-light/60">
                        {elements.length}
                        {isSearching && (
                          <span className="ml-1 text-accent">
                            / {categories.get(category)?.length || 0}
                          </span>
                        )}
                      </span>
                    </button>
                    <button
                      onClick={() => openCreateModal(category)}
                      className="p-2 hover:bg-icon-hover text-text-light/60 hover:text-accent transition-colors"
                      title={`create new ${category}`}
                    >
                      <PlusIcon />
                    </button>
                  </div>
                  
                  {(isExpanded || isSearching) && (
                    <div className="ml-4">
                      {elements.map((element: any) => (
                        <div key={element.id} className="group flex items-center">
                          <button
                            onClick={() => navigate(`/element/${element.id}`)}
                            className={`flex-1 text-left px-4 py-1.5 text-sm hover:bg-icon-hover transition-colors ${
                              selectedElementId === element.id ? 'bg-selected text-accent' : 'text-text-light'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{element.name}</span>
                              {isSearching && element.type && (
                                <span className="text-xs text-text-light/60 ml-1">
                                  {element.type}
                                </span>
                              )}
                            </div>
                          </button>
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (window.confirm(`Are you sure you want to delete "${element.name}"?`)) {
                                try {
                                  const success = await ApiService.deleteElement(worldKey, pin, element.id, category);
                                  if (success) {
                                    deleteElement(element.id);
                                    if (selectedElementId === element.id) {
                                      selectElement(null);
                                      navigate('/');
                                    }
                                    toast.success('Element deleted');
                                  } else {
                                    toast.error('Failed to delete element');
                                  }
                                } catch (error) {
                                  console.error('Failed to delete element:', error);
                                  toast.error('Failed to delete element');
                                }
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1.5 mr-2 hover:bg-red-500/10 text-red-500 hover:text-red-600 transition-all rounded"
                            title={`Delete ${element.name}`}
                          >
                            <TrashIcon />
                          </button>
                        </div>
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