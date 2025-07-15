import { ChevronDownIcon, ChevronRightIcon } from './icons';
import { useWorldContext } from '../contexts/WorldContext';
import { useSidebarStore } from '../stores/uiStore';

export function CategorySidebar() {
  const { categories } = useWorldContext();
  const { expandedCategories, selectedElementId, toggleCategory, selectElement } = useSidebarStore();

  return (
    <aside className="w-64 bg-white border-r flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Categories</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {categories.size === 0 ? (
          <p className="text-sm text-gray-500 p-4">No elements loaded</p>
        ) : (
          <div className="py-2">
            {Array.from(categories.entries()).map(([category, elements]) => {
              const isExpanded = expandedCategories.has(category);
              
              return (
                <div key={category}>
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                      <span className="text-sm font-medium capitalize">{category}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {elements.length}
                    </span>
                  </button>
                  
                  {isExpanded && (
                    <div className="ml-4">
                      {elements.map(element => (
                        <button
                          key={element.id}
                          onClick={() => selectElement(element.id)}
                          className={`w-full text-left px-4 py-1.5 text-sm hover:bg-gray-100 transition-colors ${
                            selectedElementId === element.id ? 'bg-blue-50 text-blue-700' : ''
                          }`}
                        >
                          {element.name}
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