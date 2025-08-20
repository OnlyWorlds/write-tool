import { useEffect, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useWorldContext } from '../contexts/WorldContext';
import { ApiService } from '../services/ApiService';
import { useSidebarStore } from '../stores/uiStore';
import { CategoryIcon } from '../utils/categoryIcons';
import { PlusIcon, SearchIcon, TrashIcon, ExpandAllIcon, CollapseAllIcon } from './icons';
import { ONLYWORLDS_CATEGORIES } from '../constants/categories';

export function CategorySidebar() {
  const { categories, worldKey, pin, deleteElement } = useWorldContext();
  const { expandedCategories, selectedElementId, filterText, toggleCategory, selectElement, openCreateModal, setFilterText, expandAllCategories, toggleAllCategories, showEmptyCategories, toggleShowEmptyCategories, sortAlphabetically, toggleSortMode } = useSidebarStore();
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


  // Filter and sort elements based on search text and empty category setting (memoized for performance)
  const filteredCategories = useMemo(() => {
    const filtered = new Map();
    
    // Get all categories to show based on showEmptyCategories setting
    const categoriesToShow = showEmptyCategories 
      ? ONLYWORLDS_CATEGORIES 
      : Array.from(categories.keys());
    
    if (filterText.trim()) {
      const searchTerm = filterText.toLowerCase();
      categoriesToShow.forEach(category => {
        const elements = categories.get(category) || [];
        const filteredElements = elements.filter(element => 
          element.name.toLowerCase().includes(searchTerm) ||
          element.description?.toLowerCase().includes(searchTerm) ||
          element.type?.toLowerCase().includes(searchTerm) ||
          element.subtype?.toLowerCase().includes(searchTerm)
        );
        if (filteredElements.length > 0 || (showEmptyCategories && elements.length === 0)) {
          filtered.set(category, filteredElements);
        }
      });
    } else {
      categoriesToShow.forEach(category => {
        const elements = categories.get(category) || [];
        filtered.set(category, elements);
      });
    }
    
    return filtered;
  }, [categories, filterText, showEmptyCategories]);
  
  // Sort categories based on sort mode
  const sortedCategories = useMemo(() => {
    const entries = Array.from(filteredCategories.entries());
    
    if (sortAlphabetically) {
      // Sort alphabetically
      return entries.sort((a, b) => a[0].localeCompare(b[0]));
    } else {
      // Default sort with narrative first
      return entries.sort((a, b) => {
        // Narrative always comes first
        if (a[0] === 'narrative') return -1;
        if (b[0] === 'narrative') return 1;
        // Then use the default ONLYWORLDS_CATEGORIES order
        const aIndex = ONLYWORLDS_CATEGORIES.indexOf(a[0]);
        const bIndex = ONLYWORLDS_CATEGORIES.indexOf(b[0]);
        return aIndex - bIndex;
      });
    }
  }, [filteredCategories, sortAlphabetically]);

  return (
    <aside className="w-64 bg-sidebar dark:bg-dark-bg-secondary border-r border-sidebar-dark dark:border-dark-bg-border flex flex-col h-full">
      <div className="p-4 border-b border-sidebar-dark dark:border-dark-bg-border bg-sidebar-dark dark:bg-dark-bg-tertiary">
        <div className="relative">
          <div className="absolute left-3 top-2 text-slate-500 dark:text-gray-400">
            <SearchIcon />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="filter.."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full pl-10 pr-8 py-1.5 text-sm border border-slate-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-dark-bg-secondary text-slate-700 dark:text-gray-200 placeholder-slate-400 dark:placeholder-gray-500"
          />
          {filterText && (
            <button
              onClick={() => setFilterText('')}
              className="absolute right-2 top-1.5 text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200"
              title="Clear search"
            >
              ×
            </button>
          )}
        </div>
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => {
              const categoryNames = Array.from(categories.keys());
              toggleAllCategories(categoryNames);
            }}
            className="p-2 border border-slate-300 dark:border-gray-500 rounded-md hover:bg-slate-100 dark:hover:bg-dark-bg-hover text-slate-600 dark:text-gray-300 hover:text-slate-800 dark:hover:text-gray-100 transition-colors"
            title={expandedCategories.size > 0 ? "Collapse all categories" : "Expand all categories"}
          >
            {expandedCategories.size > 0 ? <CollapseAllIcon /> : <ExpandAllIcon />}
          </button>
          <button
            onClick={toggleShowEmptyCategories}
            className="p-2 border border-slate-300 dark:border-gray-500 rounded-md hover:bg-slate-100 dark:hover:bg-dark-bg-hover text-slate-600 dark:text-gray-300 hover:text-slate-800 dark:hover:text-gray-100 transition-colors"
            title={showEmptyCategories ? "Hide empty categories" : "Show empty categories"}
          >
            {showEmptyCategories ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464m1.414 1.414l-1.414-1.414m4.242 4.242l1.414 1.414m-1.414-1.414l1.414-1.414m-1.414-1.414L8.464 8.464m4.243 4.243a3.001 3.001 0 01-4.243-4.243" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
          <button
            onClick={toggleSortMode}
            className="p-2 border border-slate-300 dark:border-gray-500 rounded-md hover:bg-slate-100 dark:hover:bg-dark-bg-hover text-slate-600 dark:text-gray-300 hover:text-slate-800 dark:hover:text-gray-100 transition-colors"
            title={sortAlphabetically ? "Sort by default order (narrative first)" : "Sort alphabetically"}
          >
            {sortAlphabetically ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0h4m-4 4h4m-4 4h4" />
              </svg>
            )}
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {categories.size === 0 ? (
          <p className="text-sm text-slate-500 dark:text-gray-400 p-4">no elements loaded</p>
        ) : filteredCategories.size === 0 ? (
          <p className="text-sm text-slate-500 dark:text-gray-400 p-4">no elements found matching "{filterText}"</p>
        ) : (
          <div className="py-2">
            {sortedCategories.map(([category, elements]) => {
              const isExpanded = expandedCategories.has(category);
              const isSearching = filterText.trim().length > 0;
              
              return (
                <div key={category}>
                  <div className="flex items-center">
                    <button
                      onClick={() => toggleCategory(category)}
                      className="flex-1 flex items-center justify-between px-4 py-2 hover:bg-sidebar-light/20 dark:hover:bg-dark-bg-hover/20 transition-colors rounded-l-md"
                    >
                      <div className="flex items-center gap-2">
                        <CategoryIcon category={category} className={`text-base ${isExpanded ? 'text-accent dark:text-blue-400' : 'text-slate-500 dark:text-gray-400'}`} />
                        <span className="text-sm font-bold text-slate-700 dark:text-gray-200 capitalize" style={{ fontSize: '0.95rem' }}>{category.toLowerCase()}</span>
                      </div>
                      <span className="text-xs text-slate-500 dark:text-gray-400">
                        {elements.length}
                        {isSearching && (
                          <span className="ml-1 text-field-highlight">
                            / {categories.get(category)?.length || 0}
                          </span>
                        )}
                      </span>
                    </button>
                    <button
                      onClick={() => openCreateModal(category)}
                      className="p-2 hover:bg-sidebar-dark/20 dark:hover:bg-dark-bg-hover/20 text-slate-500 dark:text-gray-400 hover:text-accent dark:hover:text-blue-400 transition-colors rounded-r-md"
                      title={`create new ${category}`}
                    >
                      <PlusIcon />
                    </button>
                  </div>
                  
                  {(isExpanded || isSearching) && (
                    <div className="ml-4 pl-2">
                      {elements.map((element: any) => (
                        <div key={element.id} className="group flex items-center">
                          <button
                            onClick={() => navigate(`/element/${element.id}`)}
                            className={`flex-1 text-left px-4 py-1.5 text-sm hover:bg-sidebar-light/20 dark:hover:bg-dark-bg-hover/20 transition-colors rounded-md ${
                              selectedElementId === element.id ? 'bg-accent/10 dark:bg-blue-400/10 text-accent dark:text-blue-400 font-medium' : 'text-slate-600 dark:text-gray-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{element.name}</span>
                              {isSearching && element.type && (
                                <span className="text-xs text-slate-400 dark:text-gray-500 ml-1">
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
                            className="opacity-0 group-hover:opacity-100 p-1.5 mr-2 hover:bg-red-500/10 dark:hover:bg-red-500/20 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-all rounded"
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