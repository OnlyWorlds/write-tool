import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useWorldContext } from '../contexts/WorldContext';
import { ApiService } from '../services/ApiService';
import { detectFieldType } from '../services/FieldTypeDetector';
import { useEditorStore, useSidebarStore } from '../stores/uiStore';
import { CategoryIcon } from '../utils/categoryIcons';
import { exportElementToPdf, isPdfExportSupported } from '../utils/pdfExport';
import { FieldRenderer } from './FieldRenderers';
import { FieldTypeIcon } from './FieldTypeIcon';
import { ReverseLinkSection } from './ReverseLinkSection';

export function ElementViewer() {
  const { elements, worldKey, pin, deleteElement, updateElement } = useWorldContext();
  const { selectedElementId, selectElement } = useSidebarStore();
  const { selectedFieldId, selectField, getEditedValue, hasUnsavedChanges, editMode, getFieldError, isFieldVisible, toggleFieldVisibility, toggleMode } = useEditorStore();
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [showEmptyFields, setShowEmptyFields] = useState(true);
  const [expandAllFields, setExpandAllFields] = useState(false);
  const [showFieldIcons, setShowFieldIcons] = useState(true);
  const [showOptions, setShowOptions] = useState(false);
  
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
        toast.success('Name updated');
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
        className={`bg-gradient-to-br from-white to-secondary rounded-lg shadow-sm border border-border ${editMode === 'showcase' ? 'shadow-lg' : ''}`}
      >
        <div className="p-6 border-b border-border bg-sidebar-dark shadow-md">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <CategoryIcon category={selectedElement.category} className="w-8 h-8 text-accent mt-0.5" />
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
                {/* Options toggle and checkboxes */}
                {editMode === 'edit' && (
                  <div className="mt-2">
                    <button
                      onClick={() => setShowOptions(!showOptions)}
                      className="text-sm text-text-light/60 hover:text-text-light flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showOptions ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} />
                      </svg>
                      Options
                    </button>
                    {showOptions && (
                      <div className="flex flex-col gap-2 mt-2 ml-5">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={showEmptyFields}
                            onChange={(e) => setShowEmptyFields(e.target.checked)}
                            className="w-4 h-4 text-accent rounded border-gray-300 focus:ring-accent"
                          />
                          <span className="text-sm text-text-light/60">Show empty fields</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={expandAllFields}
                            onChange={(e) => setExpandAllFields(e.target.checked)}
                            className="w-4 h-4 text-accent rounded border-gray-300 focus:ring-accent"
                          />
                          <span className="text-sm text-text-light/60">Expand all fields</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={showFieldIcons}
                            onChange={(e) => setShowFieldIcons(e.target.checked)}
                            className="w-4 h-4 text-accent rounded border-gray-300 focus:ring-accent"
                          />
                          <span className="text-sm text-text-light/60">Show field type icons</span>
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>
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
              {/* View mode switcher */}
              <button
                onClick={toggleMode}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-accent hover:bg-accent-hover text-white transition-colors shadow-sm"
              >
                {editMode === 'edit' ? 'View Showcase' : 'Edit Mode'}
              </button>
            </div>
          </div>
        </div>
        
        <div className={`px-4 pb-6 pt-0 ${editMode === 'showcase' ? 'bg-gradient-to-br from-field-primary/20 to-field-secondary/20' : ''}`}>
          {/* Base fields section */}
          <div className="pt-6 pb-4 border-b border-border/50">
            {fields.filter(([fieldName]) => baseFields.includes(fieldName)).map(([fieldName, originalValue]) => {
              const editedValue = selectedElementId ? getEditedValue(selectedElementId, fieldName) : undefined;
              const value = editedValue !== undefined ? editedValue : originalValue;
              const isEdited = editedValue !== undefined;
              const error = selectedElementId ? getFieldError(selectedElementId, fieldName) : null;
              const fieldVisible = isFieldVisible(fieldName);
              
              // Check if field is empty (including empty arrays for link fields)
              const isEmpty = !value || (Array.isArray(value) && value.length === 0);
              
              // In showcase mode, hide fields that are not visible or have no value
              if (editMode === 'showcase' && (!fieldVisible || isEmpty)) {
                return null;
              }
              
              // In edit mode, hide empty fields if showEmptyFields is false
              if (editMode === 'edit' && !showEmptyFields && isEmpty) {
                return null;
              }
              
              const fieldTypeInfo = detectFieldType(fieldName, value, selectedElement.category);
              
              return (
                <div 
                  key={fieldName}
                  onClick={() => editMode === 'edit' && selectField(selectedFieldId === fieldName ? null : fieldName)}
                  className={`mb-3 rounded-lg transition-all relative flex items-start ${
                    editMode === 'showcase' 
                      ? 'bg-gradient-to-r from-field-primary/40 to-field-secondary/40 shadow-sm' 
                      : error
                        ? 'bg-red-50 cursor-pointer'
                        : selectedFieldId === fieldName 
                          ? 'bg-gradient-to-r from-field-highlight/60 to-field-quaternary/60 shadow-md cursor-pointer' 
                          : 'bg-field-secondary/30 hover:bg-field-secondary/50 cursor-pointer'
                  }`}
                >
                  {/* Field type icon */}
                  {showFieldIcons && editMode === 'edit' && !baseFields.includes(fieldName) && (
                    <div className="flex items-center justify-center w-8 py-3 pl-2">
                      <FieldTypeIcon 
                        fieldType={fieldTypeInfo.type} 
                        className="w-4 h-4 text-slate-400"
                      />
                    </div>
                  )}
                  <div className={`flex-1 py-3 ${showFieldIcons && editMode === 'edit' && !baseFields.includes(fieldName) ? 'pr-4' : 'px-4'}`}>
                    <div className="flex items-start">
                      <label className={`block w-40 flex-shrink-0 cursor-pointer font-bold ${
                        editMode === 'showcase' 
                          ? 'text-base text-slate-600' 
                          : 'text-sm text-blue-600'
                      }`}>
                        {fieldName.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </label>
                      <div className={`flex-1 ${editMode === 'showcase' ? 'text-slate-800 font-medium' : 'text-slate-700'}`}>
                        <FieldRenderer
                          fieldName={fieldName}
                          value={value}
                          elementCategory={selectedElement.category}
                          mode="view"
                          className={`${editMode === 'showcase' ? 'text-base leading-relaxed' : ''} ${
                            !expandAllFields && selectedFieldId !== fieldName && value && typeof value === 'string' && value.length > 0
                              ? 'line-clamp-3' 
                              : ''
                          }`}
                        />
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
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
                </div>
              );
            })}
          </div>
          
          {/* Category-specific fields section */}
          <div className="pt-4 space-y-3">
            {fields.filter(([fieldName]) => !baseFields.includes(fieldName)).map(([fieldName, originalValue]) => {
              const editedValue = selectedElementId ? getEditedValue(selectedElementId, fieldName) : undefined;
              const value = editedValue !== undefined ? editedValue : originalValue;
              const isEdited = editedValue !== undefined;
              const error = selectedElementId ? getFieldError(selectedElementId, fieldName) : null;
              const fieldVisible = isFieldVisible(fieldName);
              
              // Check if field is empty (including empty arrays for link fields)
              const isEmpty = !value || (Array.isArray(value) && value.length === 0);
              
              // In showcase mode, hide fields that are not visible or have no value
              if (editMode === 'showcase' && (!fieldVisible || isEmpty)) {
                return null;
              }
              
              // In edit mode, hide empty fields if showEmptyFields is false
              if (editMode === 'edit' && !showEmptyFields && isEmpty) {
                return null;
              }
              
              const fieldTypeInfo = detectFieldType(fieldName, value, selectedElement.category);
              
              return (
                <div 
                  key={fieldName}
                  onClick={() => editMode === 'edit' && selectField(selectedFieldId === fieldName ? null : fieldName)}
                  className={`rounded-lg transition-all relative flex items-start ${
                    editMode === 'showcase' 
                      ? 'bg-gradient-to-r from-field-primary/40 to-field-secondary/40 shadow-sm' 
                      : error
                        ? 'bg-red-50 cursor-pointer'
                        : selectedFieldId === fieldName 
                          ? 'bg-gradient-to-r from-field-highlight/60 to-field-quaternary/60 shadow-md cursor-pointer' 
                          : 'bg-blue-50 hover:bg-blue-100 cursor-pointer'
                  }`}
                >
                  {/* Field type icon */}
                  {showFieldIcons && editMode === 'edit' && (
                    <div className="flex items-center justify-center w-8 py-3 pl-2">
                      <FieldTypeIcon 
                        fieldType={fieldTypeInfo.type} 
                        className="w-4 h-4 text-slate-400"
                      />
                    </div>
                  )}
                  <div className={`flex-1 py-3 ${showFieldIcons && editMode === 'edit' ? 'pr-4' : 'px-4'}`}>
                    <div className="flex items-start">
                      <label className={`block w-40 flex-shrink-0 cursor-pointer font-bold ${
                        editMode === 'showcase' 
                          ? 'text-base text-slate-600' 
                          : 'text-sm text-blue-500'
                      }`}>
                        {fieldName.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                      </label>
                      <div className={`flex-1 ${editMode === 'showcase' ? 'text-slate-800 font-medium' : 'text-slate-700'}`}>
                        <FieldRenderer
                          fieldName={fieldName}
                          value={value}
                          elementCategory={selectedElement.category}
                          mode="view"
                          className={`${editMode === 'showcase' ? 'text-base leading-relaxed' : ''} ${
                            !expandAllFields && selectedFieldId !== fieldName && value && typeof value === 'string' && value.length > 0
                              ? 'line-clamp-3' 
                              : ''
                          }`}
                        />
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-4">
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
                </div>
              );
            })}
          </div>
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