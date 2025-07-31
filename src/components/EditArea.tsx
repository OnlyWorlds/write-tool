import { useState, useEffect } from 'react';
import { useWorldContext } from '../contexts/WorldContext';
import { useSidebarStore, useEditorStore } from '../stores/uiStore';
import { FieldRenderer } from './FieldRenderers';
import { detectFieldType } from '../services/FieldTypeDetector';
import { ReverseRelationsPanel } from './ReverseRelationsPanel';

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
  
  const handleChange = (value: any) => {
    if (selectedElementId && selectedFieldId) {
      setFieldValue(selectedElementId, selectedFieldId, value);
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
  
  // Always show the sidebar
  // Case 1: No element selected - show empty state
  if (!selectedElement || !selectedElementId) {
    return (
      <div className="w-96 border-l border-blue-200 flex flex-col absolute right-0 top-0 z-10 h-full bg-white">
        <div className="h-full flex flex-col">
          <div className="bg-sidebar-dark border-b border-border p-4">
            <h3 className="font-bold text-slate-800">Element Details</h3>
            <p className="text-xs text-accent mt-1">Select an element to view details</p>
          </div>
          <div className="flex-1 flex items-center justify-center p-6">
            <p className="text-sm text-slate-500 text-center">
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
      <div className="w-96 border-l border-blue-200 flex flex-col absolute right-0 top-0 z-10 h-full bg-white">
        <ReverseRelationsPanel elementId={selectedElementId} />
      </div>
    );
  }
  
  // Case 3: Field selected - show field editor
  
  const isEdited = editedValue !== undefined;
  const fieldTypeInfo = detectFieldType(selectedFieldId, currentValue, selectedElement.category);
  
  return (
    <div className="w-96 border-l border-blue-200 flex flex-col absolute right-0 top-0 z-10 h-full bg-white">
      <div className="bg-sidebar-dark border-b border-border">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h3 className="font-bold text-slate-800 capitalize">
                {selectedFieldId.replace(/_/g, ' ')}
              </h3>
              <span className="text-xs text-accent">
                ({fieldTypeInfo.type === 'textarea' ? 'text' : fieldTypeInfo.type} field)
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isEdited && (
                <span className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                  Modified
                </span>
              )}
              <button
                onClick={() => selectField(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition-colors"
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
      
      <div className="flex-1 p-4 bg-gradient-to-b from-gray-50 to-blue-50/30 overflow-y-auto">
        <div>
          <FieldRenderer
            fieldName={selectedFieldId}
            value={currentValue}
            elementCategory={selectedElement.category}
            mode={editMode === 'edit' ? 'edit' : 'view'}
            onChange={handleChange}
            className="h-auto"
          />
          {error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>
      
      {isEdited && editMode === 'edit' && (
        <div className="p-4 border-t border-blue-200 bg-gradient-to-r from-slate-50 to-blue-50">
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveField}
              disabled={isSaving}
              className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={() => selectedElementId && selectedFieldId && setFieldValue(selectedElementId, selectedFieldId, originalValue)}
              disabled={isSaving}
              className="flex-1 px-4 py-2 text-sm bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}