import { useWorldContext } from '../contexts/WorldContext';
import { useSidebarStore, useEditorStore } from '../stores/uiStore';

export function ElementViewer() {
  const { elements } = useWorldContext();
  const { selectedElementId } = useSidebarStore();
  const { selectedFieldId, selectField, getEditedValue, hasUnsavedChanges } = useEditorStore();
  
  const selectedElement = selectedElementId ? elements.get(selectedElementId) : null;
  
  if (!selectedElement) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <p>Select an element from the sidebar to view its details</p>
      </div>
    );
  }
  
  // Get all fields except system fields
  const fields = Object.entries(selectedElement).filter(([key]) => 
    !['id', 'created_at', 'updated_at'].includes(key)
  );
  
  return (
    <div className="flex-1 p-6">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{selectedElement.name}</h2>
              <p className="text-sm text-gray-500 mt-1 capitalize">{selectedElement.category}</p>
            </div>
            {hasUnsavedChanges && (
              <span className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                Unsaved changes
              </span>
            )}
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          {fields.map(([fieldName, originalValue]) => {
            const editedValue = selectedElementId ? getEditedValue(selectedElementId, fieldName) : undefined;
            const value = editedValue !== undefined ? editedValue : originalValue;
            const isEdited = editedValue !== undefined;
            
            return (
              <div 
                key={fieldName}
                onClick={() => selectField(fieldName)}
                className={`p-4 rounded-lg border cursor-pointer transition-all relative ${
                  selectedFieldId === fieldName 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700 capitalize">
                    {fieldName.replace(/_/g, ' ')}
                  </label>
                  {isEdited && (
                    <span className="text-xs text-amber-600">edited</span>
                  )}
                </div>
                <div className="text-gray-900">
                  {typeof value === 'string' && value ? (
                    <p className="whitespace-pre-wrap">{value}</p>
                  ) : typeof value === 'object' && value ? (
                    <pre className="text-sm bg-gray-50 p-2 rounded">
                      {JSON.stringify(value, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-gray-400 italic">No value</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}