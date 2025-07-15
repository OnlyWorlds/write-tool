import { useState, useEffect } from 'react';
import { useWorldContext } from '../contexts/WorldContext';
import { useSidebarStore, useEditorStore } from '../stores/uiStore';

export function EditArea() {
  const { elements } = useWorldContext();
  const { selectedElementId } = useSidebarStore();
  const { selectedFieldId, getEditedValue, setFieldValue, editMode, toggleMode } = useEditorStore();
  
  const selectedElement = selectedElementId ? elements.get(selectedElementId) : null;
  const originalValue = selectedElement && selectedFieldId ? selectedElement[selectedFieldId as keyof typeof selectedElement] : null;
  const editedValue = selectedElementId && selectedFieldId ? getEditedValue(selectedElementId, selectedFieldId) : undefined;
  const currentValue = editedValue !== undefined ? editedValue : originalValue;
  
  const [localValue, setLocalValue] = useState('');
  
  useEffect(() => {
    if (currentValue !== null && currentValue !== undefined) {
      setLocalValue(typeof currentValue === 'string' ? currentValue : JSON.stringify(currentValue, null, 2));
    } else {
      setLocalValue('');
    }
  }, [currentValue, selectedFieldId, selectedElementId]);
  
  const handleChange = (value: string) => {
    setLocalValue(value);
    if (selectedElementId && selectedFieldId) {
      // Try to parse as JSON if it looks like JSON
      let parsedValue = value;
      if (value.trim().startsWith('{') || value.trim().startsWith('[')) {
        try {
          parsedValue = JSON.parse(value);
        } catch {
          // Keep as string if JSON parse fails
        }
      }
      setFieldValue(selectedElementId, selectedFieldId, parsedValue);
    }
  };
  
  if (!selectedFieldId || !selectedElement) {
    return (
      <div className="w-96 bg-gray-50 border-l p-6 flex items-center justify-center">
        <p className="text-gray-500 text-center">
          Click on a field to edit it here
        </p>
      </div>
    );
  }
  
  const isEdited = editedValue !== undefined;
  
  return (
    <div className="w-96 bg-gray-50 border-l flex flex-col">
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between">
          <h3 className="font-medium capitalize">
            {selectedFieldId.replace(/_/g, ' ')}
          </h3>
          {isEdited && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
              Modified
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {editMode === 'edit' ? 'Edit this field\'s content below' : 'Viewing in showcase mode'}
        </p>
      </div>
      
      <div className="flex-1 p-4">
        <textarea
          className="w-full h-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Enter content..."
          readOnly={editMode === 'showcase'}
        />
      </div>
      
      <div className="p-4 border-t bg-white space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Mode:</span>
            <button
              onClick={toggleMode}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                editMode === 'edit' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {editMode === 'edit' ? 'Edit' : 'Showcase'}
            </button>
          </div>
          {isEdited && editMode === 'edit' && (
            <button
              onClick={() => selectedElementId && selectedFieldId && setFieldValue(selectedElementId, selectedFieldId, originalValue)}
              className="text-xs text-blue-600 hover:text-blue-700"
            >
              Reset to original
            </button>
          )}
        </div>
        <p className="text-xs text-gray-400">
          Press Cmd/Ctrl+E to toggle mode
        </p>
      </div>
    </div>
  );
}