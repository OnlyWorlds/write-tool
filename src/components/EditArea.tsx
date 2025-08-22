import { useState, useEffect } from 'react';
import { useWorldContext } from '../contexts/WorldContext';
import { useSidebarStore, useEditorStore } from '../stores/uiStore';
import { FieldRenderer } from './FieldRenderers';
import { detectFieldType } from '../services/UnifiedFieldTypeService';
import { ReverseRelationsPanel } from './ReverseRelationsPanel';
import { TypeManagementService } from '../services/TypeManagementService';

export function EditArea() {
  const { elements, saveElement } = useWorldContext();
  const { selectedElementId } = useSidebarStore();
  const { selectedFieldId, getEditedValue, setFieldValue, editMode, getFieldError, selectField } = useEditorStore();
  const [isSaving, setIsSaving] = useState(false);
  const [previousCategory, setPreviousCategory] = useState<string | null>(null);
  
  const selectedElement = selectedElementId ? elements.get(selectedElementId) : null;
  const originalValue = selectedElement && selectedFieldId ? selectedElement[selectedFieldId as keyof typeof selectedElement] : null;
  const editedValue = selectedElementId && selectedFieldId ? getEditedValue(selectedElementId, selectedFieldId) : undefined;
  const currentValue = editedValue !== undefined ? editedValue : originalValue;
  const error = selectedElementId && selectedFieldId ? getFieldError(selectedElementId, selectedFieldId) : null;
  
  // Get the edited supertype value if it exists
  const editedSupertype = selectedElementId ? getEditedValue(selectedElementId, 'supertype') : undefined;
  const currentSupertype = editedSupertype !== undefined ? editedSupertype : selectedElement?.supertype;
  
  const handleChange = (value: any) => {
    if (selectedElementId && selectedFieldId) {
      // If the value matches the original, clear the edit (sets to undefined)
      if (value === originalValue) {
        setFieldValue(selectedElementId, selectedFieldId, undefined);
      } else {
        setFieldValue(selectedElementId, selectedFieldId, value);
      }
    }
  };
  
  const handleSaveField = async () => {
    if (!selectedElementId || !selectedFieldId || !selectedElement) return;
    
    setIsSaving(true);
    try {
      const updates = { [selectedFieldId]: currentValue };
      const success = await saveElement(selectedElementId, updates);
      
      if (success) {
        // Clear only this field's edit from local storage
        setFieldValue(selectedElementId, selectedFieldId, undefined);
      }
    } finally {
      setIsSaving(false);
    }
  };
  
  // Close edit area when switching categories
  useEffect(() => {
    if (selectedElement && previousCategory && selectedElement.category !== previousCategory) {
      selectField(null);
    }
    if (selectedElement) {
      setPreviousCategory(selectedElement.category || null);
    }
  }, [selectedElement, previousCategory, selectField]);
  
  // Preload type data when element is selected
  useEffect(() => {
    if (selectedElement?.category) {
      TypeManagementService.preloadTypingData(selectedElement.category)
        .catch(error => console.error('Failed to preload typing data:', error));
    }
  }, [selectedElement?.category]);
  
  // Only show EditArea in edit mode
  if (editMode !== 'edit') {
    return null;
  }
  
  // Case 1: No element selected - show empty state
  if (!selectedElement || !selectedElementId) {
    return (
      <div className="w-96 border-l border-blue-200 dark:border-dark-bg-border flex flex-col bg-white dark:bg-dark-bg-secondary h-full">
        <div className="h-full flex flex-col">
          <div className="bg-sidebar-dark dark:bg-dark-bg-tertiary border-b border-border dark:border-dark-bg-border p-4">
            <h3 className="font-bold text-slate-800 dark:text-gray-200">Element Details</h3>
            <p className="text-xs text-accent dark:text-blue-400 mt-1">Select an element to view details</p>
          </div>
          <div className="flex-1 flex items-center justify-center p-6">
            <p className="text-sm text-slate-500 dark:text-gray-400 text-center">
              Select an element from the sidebar to view its details and relationships
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Case 2: Element selected but no field - show reverse relations
  if (!selectedFieldId) {
    return (
      <div className="w-96 border-l border-blue-200 dark:border-dark-bg-border flex flex-col bg-white dark:bg-dark-bg-secondary h-full">
        <ReverseRelationsPanel elementId={selectedElementId} />
      </div>
    );
  }
  
  // Case 3: Field selected - show field editor
  
  const isEdited = editedValue !== undefined;
  const fieldTypeInfo = detectFieldType(selectedFieldId, currentValue, selectedElement.category);
  
  return (
    <div className="w-96 border-l border-blue-200 dark:border-dark-bg-border flex flex-col bg-white dark:bg-dark-bg-secondary h-full">
      <div className="bg-sidebar-dark dark:bg-dark-bg-tertiary border-b border-border dark:border-dark-bg-border">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h3 className="font-bold text-slate-800 dark:text-gray-200 capitalize">
                {selectedFieldId.replace(/_/g, ' ')}
              </h3>
              <span className="text-xs text-accent dark:text-blue-400">
                ({fieldTypeInfo.type === 'textarea' ? 'text' : fieldTypeInfo.type} field)
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isEdited && (
                <>
                  <button
                    onClick={() => selectedElementId && selectedFieldId && setFieldValue(selectedElementId, selectedFieldId, undefined)}
                    className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 px-1 py-0.5 rounded transition-colors"
                    title={`Discard changes to ${selectedFieldId.replace(/_/g, ' ')}`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <button
                    onClick={handleSaveField}
                    disabled={isSaving}
                    className="text-xs text-white bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600 px-2 py-0.5 rounded transition-colors disabled:opacity-50"
                    title={`Save ${selectedFieldId.replace(/_/g, ' ')}`}
                  >
                    Save
                  </button>
                  <span className="text-xs text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded-full">
                    Modified
                  </span>
                </>
              )}
              <button
                onClick={() => selectField(null)}
                className="text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 p-1 rounded hover:bg-slate-100 dark:hover:bg-dark-bg-hover transition-colors"
                title="Close editor"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 p-4 bg-gradient-to-b from-gray-50 to-blue-50/30 dark:from-dark-bg-secondary dark:to-dark-bg-tertiary overflow-y-auto">
        <div>
          <FieldRenderer
            fieldName={selectedFieldId}
            value={currentValue}
            elementCategory={selectedElement.category}
            mode={editMode === 'edit' ? 'edit' : 'view'}
            onChange={handleChange}
            className="h-auto"
            selectedElement={{
              ...selectedElement,
              supertype: currentSupertype // Use the current (potentially edited) supertype
            }}
          />
          {error && (
            <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}
        </div>
      </div>
      
      {isEdited && editMode === 'edit' && (
        <div className="p-4 border-t border-blue-200 dark:border-dark-bg-border bg-gradient-to-r from-slate-50 to-blue-50 dark:from-dark-bg-tertiary dark:to-dark-bg-secondary">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveField}
              disabled={isSaving}
              className="flex-1 px-4 py-2 text-sm bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => selectedElementId && selectedFieldId && setFieldValue(selectedElementId, selectedFieldId, undefined)}
              disabled={isSaving}
              className="flex-1 px-4 py-2 text-sm bg-slate-200 dark:bg-dark-bg-tertiary text-slate-700 dark:text-gray-300 rounded-lg hover:bg-slate-300 dark:hover:bg-dark-bg-hover transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}