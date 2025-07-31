import { useState, useEffect } from 'react';
import { useWorldContext } from '../contexts/WorldContext';
import { useSidebarStore, useEditorStore } from '../stores/uiStore';
import { FieldRenderer } from './FieldRenderers';
import { detectFieldType } from '../services/FieldTypeDetector';

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
  
  if (!selectedFieldId || !selectedElement) {
    return null; // Don't show anything when no field is selected
  }
  
  const isEdited = editedValue !== undefined;
  const fieldTypeInfo = detectFieldType(selectedFieldId, currentValue, selectedElement.category);
  
  return (
    <div className="w-96 border-l border-blue-200 flex flex-col fixed right-0 top-0 h-screen z-10">
      <div className="bg-gradient-to-r from-blue-50 to-slate-50 border-b border-blue-200">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <h3 className="font-bold text-slate-800 capitalize">
                {selectedFieldId.replace(/_/g, ' ')}
              </h3>
              <span className="text-xs text-blue-600">
                ({fieldTypeInfo.type} field)
              </span>
            </div>
            {isEdited && (
              <span className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
                Modified
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex-1 p-4 bg-gradient-to-b from-gray-50 to-blue-50/30 overflow-y-auto">
        <div className="h-full">
          <FieldRenderer
            fieldName={selectedFieldId}
            value={currentValue}
            elementCategory={selectedElement.category}
            mode={editMode === 'edit' ? 'edit' : 'view'}
            onChange={handleChange}
            className={fieldTypeInfo.type === 'number' ? 'h-auto' : 'h-full'}
          />
          {error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4 border-t border-blue-200 bg-gradient-to-r from-slate-50 to-blue-50">
        {isEdited && editMode === 'edit' ? (
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
        ) : (
          <p className="text-xs text-slate-500 text-center">
            Edit the field above to see save options
          </p>
        )}
      </div>
    </div>
  );
}