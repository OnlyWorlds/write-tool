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
  const { expandedCategories, selectedElementId, filterText, toggleCategory, selectElement, openCreateModal, setFilterText, expandAllCategories, toggleAllCategories, showEmptyCategories, toggleShowEmptyCategories } = useSidebarStore();
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

  // Filter elements based on search text and empty category setting (memoized for performance)
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

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-dark flex flex-col h-full">
      <div className="p-4 border-b border-sidebar-dark bg-sidebar-dark">
        <div className="relative">
          <div className="absolute left-3 top-2 text-slate-500">
            <SearchIcon />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="filter.."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full pl-10 pr-8 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent bg-white text-slate-700 placeholder-slate-400"
          />
          {filterText && (
            <button
              onClick={() => setFilterText('')}
              className="absolute right-2 top-1.5 text-slate-500 hover:text-slate-700"
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
            className="p-2 border border-slate-300 rounded-md hover:bg-slate-100 text-slate-600 hover:text-slate-800 transition-colors"
            title={expandedCategories.size > 0 ? "Collapse all categories" : "Expand all categories"}
          >
            {expandedCategories.size > 0 ? <CollapseAllIcon /> : <ExpandAllIcon />}
          </button>
          <button
            onClick={toggleShowEmptyCategories}
            className="p-2 border border-slate-300 rounded-md hover:bg-slate-100 text-slate-600 hover:text-slate-800 transition-colors"
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
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {categories.size === 0 ? (
          <p className="text-sm text-slate-500 p-4">no elements loaded</p>
        ) : filteredCategories.size === 0 ? (
          <p className="text-sm text-slate-500 p-4">no elements found matching "{filterText}"</p>
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
                      className="flex-1 flex items-center justify-between px-4 py-2 hover:bg-sidebar-light/20 transition-colors rounded-l-md"
                    >
                      <div className="flex items-center gap-2">
                        <CategoryIcon category={category} className={`text-base ${isExpanded ? 'text-accent' : 'text-slate-500'}`} />
                        <span className="text-sm font-bold text-slate-700 capitalize" style={{ fontSize: '0.95rem' }}>{category.toLowerCase()}</span>
                      </div>
                      <span className="text-xs text-slate-500">
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
                      className="p-2 hover:bg-sidebar-dark/20 text-slate-500 hover:text-accent transition-colors rounded-r-md"
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
                            className={`flex-1 text-left px-4 py-1.5 text-sm hover:bg-sidebar-light/20 transition-colors rounded-md ${
                              selectedElementId === element.id ? 'bg-accent/10 text-accent font-medium' : 'text-slate-600'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span>{element.name}</span>
                              {isSearching && element.type && (
                                <span className="text-xs text-slate-400 ml-1">
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