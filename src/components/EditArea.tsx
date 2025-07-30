import { useState, useEffect } from 'react';
import { useWorldContext } from '../contexts/WorldContext';
import { useSidebarStore, useEditorStore } from '../stores/uiStore';
import { FieldRenderer } from './FieldRenderers';
import { FieldTypeIndicator } from './FieldTypeIndicator';

export function EditArea() {
  const { elements } = useWorldContext();
  const { selectedElementId } = useSidebarStore();
  const { selectedFieldId, getEditedValue, setFieldValue, editMode, toggleMode, getFieldError } = useEditorStore();
  
  const selectedElement = selectedElementId ? elements.get(selectedElementId) : null;
  const originalValue = selectedElement && selectedFieldId ? selectedElement[selectedFieldId as keyof typeof selectedElement] : null;
  const editedValue = selectedElementId && selectedFieldId ? getEditedValue(selectedElementId, selectedFieldId) : undefined;
  const currentValue = editedValue !== undefined ? editedValue : originalValue;
  const error = selectedElementId && selectedFieldId ? getFieldError(selectedElementId, selectedFieldId) : null;
  
  const handleChange = (value: any) => {
    if (selectedElementId && selectedFieldId) {
      setFieldValue(selectedElementId, selectedFieldId, value);
    }
  };
  
  if (!selectedFieldId || !selectedElement) {
    return (
      <div className="w-96 bg-secondary border-l border-border p-6 flex items-center justify-center">
        <p className="text-text-light/60 text-center">
          Click on a field to edit it here
        </p>
      </div>
    );
  }
  
  const isEdited = editedValue !== undefined;
  
  return (
    <div className="w-96 bg-secondary border-l border-border flex flex-col">
      <div className="p-4 border-b border-border bg-input-bg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-medium capitalize">
              {selectedFieldId.replace(/_/g, ' ')}
            </h3>
          </div>
          {isEdited && (
            <span className="text-xs text-warning bg-warning-bg px-2 py-1 rounded">
              Modified
            </span>
          )}
        </div>
      </div>
      
      <div className="flex-1 p-4">
        <div className="h-full">
          <FieldRenderer
            fieldName={selectedFieldId}
            value={currentValue}
            elementCategory={selectedElement.category}
            mode={editMode === 'edit' ? 'edit' : 'view'}
            onChange={handleChange}
            className="h-full"
          />
          {error && (
            <div className="mt-2 p-2 bg-warning-bg border border-warning rounded text-sm text-warning">
              {error}
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4 border-t border-border bg-input-bg space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-light/60">Mode:</span>
            <button
              onClick={toggleMode}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                editMode === 'edit' 
                  ? 'bg-accent text-text-dark' 
                  : 'bg-secondary-dark text-text-light'
              }`}
            >
              {editMode === 'edit' ? 'Edit' : 'Showcase'}
            </button>
          </div>
          {isEdited && editMode === 'edit' && (
            <button
              onClick={() => selectedElementId && selectedFieldId && setFieldValue(selectedElementId, selectedFieldId, originalValue)}
              className="text-xs text-accent hover:text-accent-hover"
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