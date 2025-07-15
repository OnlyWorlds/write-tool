import { useWorldContext } from '../contexts/WorldContext';
import { useSidebarStore, useEditorStore } from '../stores/uiStore';
import { FieldRenderer } from './FieldRenderers';

export function ElementViewer() {
  const { elements } = useWorldContext();
  const { selectedElementId } = useSidebarStore();
  const { selectedFieldId, selectField, getEditedValue, hasUnsavedChanges, editMode } = useEditorStore();
  
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
    <div className={`flex-1 p-6 ${editMode === 'showcase' ? 'max-w-4xl mx-auto' : ''}`}>
      <div className={`bg-white rounded-lg shadow-sm border ${editMode === 'showcase' ? 'shadow-lg' : ''}`}>
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{selectedElement.name}</h2>
              <p className="text-sm text-gray-500 mt-1 capitalize">{selectedElement.category}</p>
            </div>
            {hasUnsavedChanges && editMode === 'edit' && (
              <span className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                Unsaved changes
              </span>
            )}
          </div>
        </div>
        
        <div className={`p-6 ${editMode === 'showcase' ? 'space-y-6 bg-gray-50' : 'space-y-4'}`}>
          {fields.map(([fieldName, originalValue]) => {
            const editedValue = selectedElementId ? getEditedValue(selectedElementId, fieldName) : undefined;
            const value = editedValue !== undefined ? editedValue : originalValue;
            const isEdited = editedValue !== undefined;
            
            return (
              <div 
                key={fieldName}
                onClick={() => editMode === 'edit' && selectField(fieldName)}
                className={`p-4 rounded-lg border transition-all relative ${
                  editMode === 'showcase' 
                    ? 'border-transparent bg-white' 
                    : selectedFieldId === fieldName 
                      ? 'border-blue-500 bg-blue-50 cursor-pointer' 
                      : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <label className={`block capitalize ${
                    editMode === 'showcase' 
                      ? 'text-base font-semibold text-gray-900' 
                      : 'text-sm font-medium text-gray-700'
                  }`}>
                    {fieldName.replace(/_/g, ' ')}
                  </label>
                  {isEdited && editMode === 'edit' && (
                    <span className="text-xs text-amber-600">edited</span>
                  )}
                </div>
                <div className={editMode === 'showcase' ? 'text-gray-800' : 'text-gray-900'}>
                  <FieldRenderer
                    fieldName={fieldName}
                    value={value}
                    elementCategory={selectedElement.category}
                    mode="view"
                    className={editMode === 'showcase' ? 'text-base leading-relaxed' : ''}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}