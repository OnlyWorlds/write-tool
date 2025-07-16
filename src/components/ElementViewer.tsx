import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorldContext } from '../contexts/WorldContext';
import { useSidebarStore, useEditorStore } from '../stores/uiStore';
import { FieldRenderer } from './FieldRenderers';
import { FieldTypeIndicator } from './FieldTypeIndicator';
import { ReverseLinkSection } from './ReverseLinkSection';
import { ApiService } from '../services/ApiService';

export function ElementViewer() {
  const { elements, worldKey, pin, deleteElement } = useWorldContext();
  const { selectedElementId, selectElement } = useSidebarStore();
  const { selectedFieldId, selectField, getEditedValue, hasUnsavedChanges, editMode } = useEditorStore();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
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
  
  const handleDelete = async () => {
    if (!selectedElement || !worldKey || !pin) return;
    
    setIsDeleting(true);
    try {
      const success = await ApiService.deleteElement(worldKey, pin, selectedElement.id);
      if (success) {
        // Update local state
        deleteElement(selectedElement.id);
        // Clear selection and navigate home
        selectElement(null);
        navigate('/');
        setShowDeleteConfirm(false);
      } else {
        alert('Failed to delete element. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting element:', error);
      alert('An error occurred while deleting the element.');
    } finally {
      setIsDeleting(false);
    }
  };
  
  
  return (
    <div className={`flex-1 p-6 ${editMode === 'showcase' ? 'max-w-4xl mx-auto' : ''}`}>
      <div className={`bg-white rounded-lg shadow-sm border ${editMode === 'showcase' ? 'shadow-lg' : ''}`}>
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{selectedElement.name}</h2>
              <p className="text-sm text-gray-500 mt-1 capitalize">{selectedElement.category}</p>
            </div>
            <div className="flex items-center gap-2">
              {hasUnsavedChanges && editMode === 'edit' && (
                <span className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                  Unsaved changes
                </span>
              )}
              {editMode === 'edit' && (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-sm text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-full transition-colors"
                >
                  Delete
                </button>
              )}
            </div>
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
                  <div className="flex items-center gap-2">
                    <label className={`block capitalize ${
                      editMode === 'showcase' 
                        ? 'text-base font-semibold text-gray-900' 
                        : 'text-sm font-medium text-gray-700'
                    }`}>
                      {fieldName.replace(/_/g, ' ')}
                    </label>
                    {editMode === 'edit' && (
                      <FieldTypeIndicator fieldName={fieldName} value={value} elementCategory={selectedElement.category} />
                    )}
                  </div>
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
        
        {/* Reverse Links Section */}
        {selectedElementId && (
          <ReverseLinkSection 
            elementId={selectedElementId} 
            className="m-6 mt-0"
          />
        )}
      </div>
      
      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Delete Element
              </h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete "{selectedElement.name}"? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}