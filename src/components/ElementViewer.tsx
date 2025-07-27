import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useWorldContext } from '../contexts/WorldContext';
import { useSidebarStore, useEditorStore } from '../stores/uiStore';
import { FieldRenderer } from './FieldRenderers';
import { FieldTypeIndicator } from './FieldTypeIndicator';
import { ReverseLinkSection } from './ReverseLinkSection';
import { ApiService } from '../services/ApiService';
import { exportElementToPdf, isPdfExportSupported } from '../utils/pdfExport';

export function ElementViewer() {
  const { elements, worldKey, pin, deleteElement, updateElement } = useWorldContext();
  const { selectedElementId, selectElement } = useSidebarStore();
  const { selectedFieldId, selectField, getEditedValue, hasUnsavedChanges, editMode, getFieldError, isFieldVisible, toggleFieldVisibility } = useEditorStore();
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [showEmptyFields, setShowEmptyFields] = useState(true);
  
  const selectedElement = selectedElementId ? elements.get(selectedElementId) : null;
  
  if (!selectedElement) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-light/60">
        <p>select an element from the sidebar to view its details</p>
      </div>
    );
  }
  
  // Get all fields except system fields and name (name is now editable in header)
  const fields = Object.entries(selectedElement).filter(([key]) => 
    !['id', 'created_at', 'updated_at', 'name'].includes(key)
  );
  
  // Base fields that get different styling
  const baseFields = ['description', 'supertype', 'subtype', 'image_url'];
  
  
  const handleExport = async () => {
    if (!selectedElement || !selectedElementId) return;
    
    setIsExporting(true);
    try {
      await exportElementToPdf(selectedElementId, {
        elementName: selectedElement.name,
        includeImages: true,
        quality: 2
      });
      toast.success('pdf exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('failed to export pdf. please try again.');
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleNameEdit = () => {
    setIsEditingName(true);
    setEditedName(selectedElement.name);
  };
  
  const handleNameSave = async () => {
    if (!selectedElement || !worldKey || !pin || !editedName.trim()) return;
    
    try {
      const success = await ApiService.updateElement(worldKey, pin, {
        ...selectedElement,
        name: editedName.trim()
      });
      
      if (success) {
        // Update local state
        updateElement({ ...selectedElement, name: editedName.trim() });
        setIsEditingName(false);
        toast.success('name updated successfully');
      } else {
        toast.error('failed to update name');
      }
    } catch (error) {
      console.error('Error updating name:', error);
      toast.error('error updating name');
    }
  };
  
  const handleNameCancel = () => {
    setIsEditingName(false);
    setEditedName('');
  };
  
  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      handleNameCancel();
    }
  };
  
  
  return (
    <div className={`flex-1 p-6 ${editMode === 'showcase' ? 'max-w-4xl mx-auto' : ''}`}>
      <div 
        id={editMode === 'showcase' ? `showcase-${selectedElementId}` : undefined}
        className={`bg-sidebar rounded-lg shadow-sm border border-border ${editMode === 'showcase' ? 'shadow-lg' : ''}`}
      >
        <div className="p-6 border-b border-border bg-tab-bg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              {isEditingName && editMode === 'edit' ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyDown={handleNameKeyDown}
                    className="text-2xl font-semibold text-text-light bg-input-bg border border-input-border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-accent"
                    autoFocus
                  />
                  <button
                    onClick={handleNameSave}
                    className="text-sm text-accent hover:text-accent-hover px-2 py-1 rounded transition-colors"
                  >
                    ✓
                  </button>
                  <button
                    onClick={handleNameCancel}
                    className="text-sm text-text-light/60 hover:text-text-light px-2 py-1 rounded transition-colors"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <h2 
                  className={`text-2xl font-semibold text-text-light ${editMode === 'edit' ? 'cursor-pointer hover:text-text-light/80' : ''}`}
                  onClick={editMode === 'edit' ? handleNameEdit : undefined}
                  title={editMode === 'edit' ? 'click to edit name' : undefined}
                >
                  {selectedElement.name}
                </h2>
              )}
              <p className="text-sm text-text-light/60 mt-1">{selectedElement.category.toLowerCase()}</p>
            </div>
            <div className="flex items-center gap-2">
              {hasUnsavedChanges && editMode === 'edit' && (
                <span className="text-sm text-accent bg-info-bg px-3 py-1 rounded-full">
                  unsaved changes
                </span>
              )}
              {editMode === 'showcase' && isPdfExportSupported() && (
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="text-sm text-accent hover:text-accent-hover bg-info-bg hover:bg-info-bg/80 px-3 py-1 rounded-full transition-colors disabled:opacity-50"
                >
                  {isExporting ? 'exporting...' : 'export pdf'}
                </button>
              )}
            </div>
          </div>
          {editMode === 'edit' && (
            <div className="mt-4">
              <button
                onClick={() => setShowEmptyFields(!showEmptyFields)}
                className="text-sm text-text-light/60 hover:text-text-light transition-colors"
              >
                {showEmptyFields ? 'hide' : 'show'} empty fields
              </button>
            </div>
          )}
        </div>
        
        <div className={`p-6 ${editMode === 'showcase' ? 'space-y-6 bg-sand-50' : 'space-y-4'}`}>
          {fields.map(([fieldName, originalValue]) => {
            const editedValue = selectedElementId ? getEditedValue(selectedElementId, fieldName) : undefined;
            const value = editedValue !== undefined ? editedValue : originalValue;
            const isEdited = editedValue !== undefined;
            const error = selectedElementId ? getFieldError(selectedElementId, fieldName) : null;
            const fieldVisible = isFieldVisible(fieldName);
            const isBaseField = baseFields.includes(fieldName);
            
            // In showcase mode, hide fields that are not visible or have no value
            if (editMode === 'showcase' && (!fieldVisible || !value)) {
              return null;
            }
            
            // In edit mode, hide empty fields if showEmptyFields is false
            if (editMode === 'edit' && !showEmptyFields && !value) {
              return null;
            }
            
            return (
              <div 
                key={fieldName}
                onClick={() => editMode === 'edit' && selectField(fieldName)}
                className={`py-2 px-3 rounded transition-all relative ${
                  editMode === 'showcase' 
                    ? 'bg-sand-100' 
                    : error
                      ? 'bg-red-50 cursor-pointer'
                      : selectedFieldId === fieldName 
                        ? 'bg-sand-200 cursor-pointer' 
                        : isBaseField
                          ? 'hover:bg-sand-200 cursor-pointer'
                          : 'hover:bg-sand-100 cursor-pointer'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    {editMode === 'edit' && (
                      <FieldTypeIndicator fieldName={fieldName} value={value} elementCategory={selectedElement.category} />
                    )}
                    <label className={`whitespace-nowrap ${
                      editMode === 'showcase' 
                        ? 'text-base font-semibold text-gray-900' 
                        : isBaseField
                          ? 'text-sm font-medium text-sand-700'
                          : 'text-sm font-medium text-gray-800'
                    }`}>
                      {fieldName.replace(/_/g, ' ').toLowerCase()}
                    </label>
                    <div className={`flex-1 min-w-0 ${editMode === 'showcase' ? 'text-gray-800' : 'text-gray-900'}`}>
                      <FieldRenderer
                        fieldName={fieldName}
                        value={value}
                        elementCategory={selectedElement.category}
                        mode="view"
                        className={editMode === 'showcase' ? 'text-base leading-relaxed' : 'truncate'}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {editMode === 'showcase' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFieldVisibility(fieldName);
                        }}
                        className="text-xs text-gray-400 hover:text-gray-600 px-1"
                        data-exclude-from-export
                        title="hide field from showcase"
                      >
                        ×
                      </button>
                    )}
                    {isEdited && editMode === 'edit' && (
                      <span className="text-xs text-blue-600">edited</span>
                    )}
                  </div>
                </div>
                {error && editMode === 'edit' && (
                  <div className="mt-1 text-sm text-red-600">
                    {error}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Reverse Links Section */}
        {selectedElementId && (
          <ReverseLinkSection 
            elementId={selectedElementId} 
            className="m-6 mt-0"
          />
        )}
      </div>
      
    </div>
  );
}