import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useWorldContext } from '../contexts/WorldContext';
import { ApiService, type ShowcasePublishRequest } from '../services/ApiService';
import { detectFieldType } from '../services/FieldTypeDetector';
import { useEditorStore, useSidebarStore } from '../stores/uiStore';
import { CategoryIcon } from '../utils/categoryIcons';
import { exportElementToPdf, isPdfExportSupported } from '../utils/pdfExport';
import { FieldRenderer } from './FieldRenderers';
import { FieldTypeIcon } from './FieldTypeIcon';
import { ReverseLinkSection } from './ReverseLinkSection';

export function ElementViewer() {
  const { elements, worldKey, pin, deleteElement, updateElement, saveElement } = useWorldContext();
  const { selectedElementId } = useSidebarStore();
  const { selectedFieldId, selectField, getEditedValue, editMode, getFieldError, isFieldVisible, toggleFieldVisibility, toggleMode, resetHiddenFields, hiddenFields, setFieldValue } = useEditorStore();
  const navigate = useNavigate();
  const [isExporting, setIsExporting] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [hideEmptyFields, setHideEmptyFields] = useState(false);
  const [expandAllFields, setExpandAllFields] = useState(false);
  const [hideFieldIcons, setHideFieldIcons] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [sortAlphabetically, setSortAlphabetically] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  
  const selectedElement = selectedElementId ? elements.get(selectedElementId) : null;
  
  // Get all unsaved edits for current element by checking each field
  const unsavedFieldsForElement: Array<{ fieldName: string; value: any }> = [];
  if (selectedElementId && selectedElement) {
    Object.keys(selectedElement).forEach(fieldName => {
      const editedValue = getEditedValue(selectedElementId, fieldName);
      if (editedValue !== undefined) {
        unsavedFieldsForElement.push({ fieldName, value: editedValue });
      }
    });
  }
  
  // Reset hidden fields when element changes
  useEffect(() => {
    resetHiddenFields();
  }, [selectedElementId, resetHiddenFields]);
  
  if (!selectedElement) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-light/60">
        <p>select an element from the sidebar to view its details</p>
      </div>
    );
  }
  
  // Get all fields except system fields and name (name is now editable in header)
  let fields = Object.entries(selectedElement).filter(([key]) => 
    !['id', 'created_at', 'updated_at', 'name'].includes(key)
  );
  
  // Sort fields alphabetically if enabled
  if (sortAlphabetically) {
    fields = fields.sort(([a], [b]) => a.localeCompare(b));
  }
  
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

  const handlePublishShowcase = async () => {
    if (!selectedElement || !worldKey || !pin) return;
    
    setIsPublishing(true);
    try {
      // Clean up element data - remove null/undefined values
      const cleanElementData = Object.entries(selectedElement).reduce((acc, [key, value]) => {
        if (value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {} as any);

      const request: ShowcasePublishRequest = {
        element_type: selectedElement.category || '',
        element_id: selectedElement.id,
        element_data: cleanElementData,
        showcase_config: {
          hidden_fields: Array.from(hiddenFields),
          view_mode: 'showcase'
        }
      };

      console.log('Publishing showcase with request:', JSON.stringify(request, null, 2));
      const response = await ApiService.publishShowcase(worldKey, pin, request);
      
      if (response) {
        // Generate the shareable URL - always use production URL
        // This ensures the showcase link works regardless of where it's published from
        const productionUrl = 'https://onlyworlds.github.io/browse-tool';
        const shareableUrl = `${productionUrl}/showcase/${response.showcase_id}`;
        
        // Copy to clipboard
        await navigator.clipboard.writeText(shareableUrl);
        
        toast.success(
          <div>
            <p>Showcase published!</p>
            <p className="text-sm">URL copied to clipboard</p>
          </div>
        );
      }
    } catch (error) {
      console.error('Publish error:', error);
      toast.error('Failed to publish showcase');
    } finally {
      setIsPublishing(false);
    }
  };
  
  const handleNameCancel = () => {
    setIsEditingName(false);
    setEditedName('');
  };
  
  const handleSaveAll = async () => {
    if (!selectedElementId || !selectedElement || unsavedFieldsForElement.length === 0) return;
    
    setIsSavingAll(true);
    try {
      // Collect all unsaved changes into a single update object
      const updates: any = {};
      unsavedFieldsForElement.forEach(({ fieldName, value }) => {
        updates[fieldName] = value;
      });
      
      const success = await saveElement(selectedElementId, updates);
      if (success) {
        // Clear all edits for this element
        unsavedFieldsForElement.forEach(({ fieldName }) => {
          setFieldValue(selectedElementId, fieldName, undefined);
        });
        toast.success('All changes saved');
      } else {
        toast.error('Failed to save changes');
      }
    } catch (error) {
      console.error('Error saving all changes:', error);
      toast.error('Error saving changes');
    } finally {
      setIsSavingAll(false);
    }
  };
  
  const handleDiscardAll = () => {
    if (!selectedElementId || unsavedFieldsForElement.length === 0) return;
    
    // Clear all edits for this element
    unsavedFieldsForElement.forEach(({ fieldName }) => {
      setFieldValue(selectedElementId, fieldName, undefined);
    });
    toast.success('All changes discarded');
  };
  
  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      handleNameCancel();
    }
  };
  
  
  return (
    <div className={`flex-1 overflow-y-auto h-screen ${editMode === 'showcase' ? 'max-w-4xl mx-auto' : ''}`}>
      <div className="p-6 max-w-5xl">
        <div 
          id={editMode === 'showcase' ? `showcase-${selectedElementId}` : undefined}
          className={`bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg shadow-md border border-slate-200 ${editMode === 'showcase' ? 'shadow-lg' : ''}`}
        >
          <div className="sticky top-0 z-10 border-b border-border bg-sidebar-dark shadow-md rounded-t-lg">
            <div className="p-6 pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 overflow-hidden rounded-xl bg-white/10 flex items-center justify-center">
                    {selectedElement.image_url ? (
                      <img 
                        src={selectedElement.image_url} 
                        alt={selectedElement.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <CategoryIcon 
                      category={selectedElement.category || ''} 
                      className={`text-[48px] text-accent ${selectedElement.image_url ? 'hidden' : ''}`} 
                    />
                  </div>
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
                    <div className="text-sm text-text-light/60 mt-1 capitalize">{selectedElement.category}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Options toggle button - gear icon only */}
                  {editMode === 'edit' && (
                    <button
                      onClick={() => setShowOptions(!showOptions)}
                      className="p-2 text-slate-500 hover:text-slate-700 hover:bg-white/20 rounded-lg transition-all"
                      title="Field Options"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  )}
                  {unsavedFieldsForElement.length > 0 && editMode === 'edit' && (
                    <>
                      <span className="text-sm text-accent bg-info-bg px-3 py-1 rounded-full">
                        {unsavedFieldsForElement.length} unsaved {unsavedFieldsForElement.length === 1 ? 'change' : 'changes'}
                      </span>
                      <button
                        onClick={handleSaveAll}
                        disabled={isSavingAll}
                        className="text-sm text-white bg-green-600 hover:bg-green-700 px-3 py-1 rounded-full transition-colors disabled:opacity-50"
                      >
                        {isSavingAll ? 'Saving...' : 'Save All'}
                      </button>
                      <button
                        onClick={handleDiscardAll}
                        disabled={isSavingAll}
                        className="text-sm text-slate-600 bg-slate-200 hover:bg-slate-300 px-3 py-1 rounded-full transition-colors disabled:opacity-50"
                      >
                        Discard All
                      </button>
                    </>
                  )}
                  {editMode === 'showcase' && (
                    <>
                      <button
                        onClick={handlePublishShowcase}
                        disabled={isPublishing}
                        className="text-sm text-white bg-accent hover:bg-accent-hover px-3 py-1 rounded-full transition-colors disabled:opacity-50"
                      >
                        {isPublishing ? 'publishing...' : 'publish'}
                      </button>
                      {isPdfExportSupported() && (
                        <button
                          onClick={handleExport}
                          disabled={isExporting}
                          className="text-sm text-accent hover:text-accent-hover bg-info-bg hover:bg-info-bg/80 px-3 py-1 rounded-full transition-colors disabled:opacity-50"
                        >
                          {isExporting ? 'exporting...' : 'export pdf'}
                        </button>
                      )}
                    </>
                  )}
                  {/* View mode switcher */}
                  <button
                    onClick={toggleMode}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all shadow-sm flex items-center gap-2 ${
                      editMode === 'edit' 
                        ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {editMode === 'edit' ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>Showcase</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>Edit Mode</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
            {/* Options row at bottom - always takes up space */}
            <div className="h-10 px-6 flex items-center">
              <div className={`flex items-center gap-6 justify-end w-full transition-opacity duration-200 ${showOptions && editMode === 'edit' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={hideEmptyFields}
                      onChange={(e) => setHideEmptyFields(e.target.checked)}
                      className="w-4 h-4 text-accent rounded border-gray-300 focus:ring-accent"
                    />
                    <span className="text-text-light/60">Hide empty</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={expandAllFields}
                      onChange={(e) => setExpandAllFields(e.target.checked)}
                      className="w-4 h-4 text-accent rounded border-gray-300 focus:ring-accent"
                    />
                    <span className="text-text-light/60">Always expand</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={hideFieldIcons}
                      onChange={(e) => setHideFieldIcons(e.target.checked)}
                      className="w-4 h-4 text-accent rounded border-gray-300 focus:ring-accent"
                    />
                    <span className="text-text-light/60">Hide icons</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={sortAlphabetically}
                      onChange={(e) => setSortAlphabetically(e.target.checked)}
                      className="w-4 h-4 text-accent rounded border-gray-300 focus:ring-accent"
                    />
                    <span className="text-text-light/60">Sort A-Z</span>
                  </label>
              </div>
            </div>
          </div>
          
          <div className={`px-4 pb-6 pt-0 ${editMode === 'showcase' ? 'bg-slate-100' : 'bg-gradient-to-b from-slate-100 to-slate-50'}`}>
            {/* Base fields section */}
            <div className="pt-6 pb-4 border-b border-border/50">
              {fields.filter(([fieldName]) => baseFields.includes(fieldName)).map(([fieldName, originalValue]) => {
                const editedValue = selectedElementId ? getEditedValue(selectedElementId, fieldName) : undefined;
                const value = editedValue !== undefined ? editedValue : originalValue;
                const isEdited = editedValue !== undefined;
                const error = selectedElementId ? getFieldError(selectedElementId, fieldName) : null;
                const fieldVisible = isFieldVisible(fieldName);
                const hasUnsavedEdit = unsavedFieldsForElement.some(({ fieldName: fn }) => fn === fieldName);
                
                // Check if field is empty (including empty arrays for link fields)
                const isEmpty = !value || (Array.isArray(value) && value.length === 0);
                
                // In showcase mode, hide fields that are not visible or have no value
                if (editMode === 'showcase' && (!fieldVisible || isEmpty)) {
                  return null;
                }
                
                // In edit mode, hide empty fields if hideEmptyFields is true
                if (editMode === 'edit' && hideEmptyFields && isEmpty) {
                  return null;
                }
                
                const fieldTypeInfo = detectFieldType(fieldName, value, selectedElement.category);
                
                return (
                  <div 
                    key={fieldName}
                    onClick={() => editMode === 'edit' && selectField(selectedFieldId === fieldName ? null : fieldName)}
                    className={`mb-3 rounded-lg transition-all relative flex items-start ${
                      editMode === 'showcase' 
                        ? 'bg-zinc-50 border border-slate-200 shadow-sm' 
                        : error
                          ? 'bg-red-50 cursor-pointer'
                          : selectedFieldId === fieldName 
                            ? 'bg-blue-100 border-blue-300 shadow-md cursor-pointer' 
                            : 'bg-zinc-50 hover:bg-zinc-100 shadow-sm hover:shadow-md cursor-pointer'
                    }`}
                  >
                    {/* Field type icon */}
                    {!hideFieldIcons && editMode === 'edit' && !baseFields.includes(fieldName) && (
                      <div className="flex items-start justify-center w-8 pt-4 pl-2">
                        <FieldTypeIcon 
                          fieldType={fieldTypeInfo.type} 
                          className="w-3.5 h-3.5 text-slate-400"
                        />
                      </div>
                    )}
                    <div className={`flex-1 py-3 ${!hideFieldIcons && editMode === 'edit' && !baseFields.includes(fieldName) ? 'pr-4' : 'px-4'}`}>
                      <div className="flex items-start">
                        <label className={`block w-32 flex-shrink-0 cursor-pointer font-bold ${
                          editMode === 'showcase' 
                            ? 'text-base text-gray-700 font-medium' 
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
                          {hasUnsavedEdit && editMode === 'edit' && (
                            <span className="inline-flex w-2 h-2 bg-amber-500 rounded-full ml-1" title="Unsaved changes"></span>
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
                const hasUnsavedEdit = unsavedFieldsForElement.some(({ fieldName: fn }) => fn === fieldName);
                
                // Check if field is empty (including empty arrays for link fields)
                const isEmpty = !value || (Array.isArray(value) && value.length === 0);
                
                // In showcase mode, hide fields that are not visible or have no value
                if (editMode === 'showcase' && (!fieldVisible || isEmpty)) {
                  return null;
                }
                
                // In edit mode, hide empty fields if hideEmptyFields is true
                if (editMode === 'edit' && hideEmptyFields && isEmpty) {
                  return null;
                }
                
                const fieldTypeInfo = detectFieldType(fieldName, value, selectedElement.category);
                
                return (
                  <div 
                    key={fieldName}
                    onClick={() => editMode === 'edit' && selectField(selectedFieldId === fieldName ? null : fieldName)}
                    className={`rounded-lg transition-all relative flex items-start ${
                      editMode === 'showcase' 
                        ? 'bg-zinc-50 border border-slate-200 shadow-sm' 
                        : error
                          ? 'bg-red-50 cursor-pointer'
                          : selectedFieldId === fieldName 
                            ? 'bg-blue-100 border-blue-300 shadow-md cursor-pointer' 
                            : 'bg-zinc-50 hover:bg-zinc-100 shadow-sm hover:shadow-md cursor-pointer'
                    }`}
                  >
                    {/* Field type icon */}
                    {!hideFieldIcons && editMode === 'edit' && (
                      <div className="flex items-start justify-center w-8 pt-4 pl-2">
                        <FieldTypeIcon 
                          fieldType={fieldTypeInfo.type} 
                          className="w-3.5 h-3.5 text-slate-400"
                        />
                      </div>
                    )}
                    <div className={`flex-1 py-3 ${!hideFieldIcons && editMode === 'edit' ? 'pr-4' : 'px-4'}`}>
                      <div className="flex items-start">
                        <label className={`block w-32 flex-shrink-0 cursor-pointer font-bold ${
                          editMode === 'showcase' 
                            ? 'text-base text-gray-700 font-medium' 
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
                          {hasUnsavedEdit && editMode === 'edit' && (
                            <span className="inline-flex w-2 h-2 bg-amber-500 rounded-full ml-1" title="Unsaved changes"></span>
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
    </div>
  );
}