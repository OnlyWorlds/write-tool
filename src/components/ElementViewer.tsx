import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useWorldContext } from '../contexts/WorldContext';
import { useElementSections } from '../hooks/useElementSections';
import { ApiService, type ShowcasePublishRequest } from '../services/ApiService';
import { detectFieldType } from '../services/UnifiedFieldTypeService';
import { useEditorStore, useSidebarStore } from '../stores/uiStore';
import { CategoryIcon } from '../utils/categoryIcons';
import { exportElementToPdf, isPdfExportSupported } from '../utils/pdfExport';
import { EventWriter } from './event/EventWriter';
import { FieldRenderer } from './FieldRenderers';
import { FieldTypeIcon } from './FieldTypeIcon';
import { CollapseAllIcon, ExpandAllIcon } from './icons';
import { NarrativeWriter } from './narrative/NarrativeWriter';
import { NetworkView } from './NetworkView';
import { NetworkView3D } from './NetworkView3D';

export function ElementViewer() {
  const { elements, worldKey, pin, deleteElement, updateElement, saveElement } = useWorldContext();
  const { selectedElementId, toggleCategory } = useSidebarStore();
  const { selectedFieldId, selectField, getEditedValue, editMode, getFieldError, isFieldVisible, toggleFieldVisibility, toggleMode, setMode, resetHiddenFields, hiddenFields, setFieldValue } = useEditorStore();
  const navigate = useNavigate();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
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
  const [hideSections, setHideSections] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [is3DView, setIs3DView] = useState(false);
  
  const selectedElement = selectedElementId ? elements.get(selectedElementId) : null;
  const { sections } = useElementSections(selectedElement?.category);
  
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
  
  // Reset hidden fields and mode when element changes
  useEffect(() => {
    resetHiddenFields();
    setCollapsedSections(new Set());
    // Reset to edit mode when navigating away from a narrative in write mode
    // But only if the element actually changed (not on first mount or mode change)
    setMode('edit');
  }, [selectedElementId]); // Only depend on selectedElementId changing

  // Reset scroll position when entering write or network mode
  useEffect(() => {
    if ((editMode === 'write' || editMode === 'network') && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [editMode]);
  
  const toggleSection = (sectionName: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionName)) {
        newSet.delete(sectionName);
      } else {
        newSet.add(sectionName);
      }
      return newSet;
    });
  };
  
  if (!selectedElement) {
    return (
      <div className="flex-1 flex items-center justify-center text-text-light/60 dark:text-gray-400">
        <p>select an element from the sidebar</p>
      </div>
    );
  }
  
  // Get all fields except system fields and name (name is now editable in header)
  let fields = Object.entries(selectedElement).filter(([key]) => 
    !['id', 'created_at', 'updated_at', 'name', 'category'].includes(key)
  );
  
  // Sort fields alphabetically if enabled
  if (sortAlphabetically) {
    fields = fields.sort(([a], [b]) => a.localeCompare(b));
  }
  
  // Base fields that get different styling
  const baseFields = ['description', 'supertype', 'subtype', 'image_url'];
  
  // Organize fields by sections
  const organizeFieldsBySection = () => {
    const categoryFields = fields.filter(([fieldName]) => !baseFields.includes(fieldName));
    
    if (!sections || hideSections) {
      // Return single section with all fields
      return [{ name: 'Fields', fields: categoryFields, order: 0 }];
    }
    
    const fieldMap = new Map(categoryFields);
    const organizedSections: Array<{ name: string; fields: Array<[string, any]>; order: number }> = [];
    
    // Add fields according to sections
    sections.forEach(section => {
      const sectionFields: Array<[string, any]> = [];
      section.fields.forEach(fieldName => {
        const normalizedFieldName = fieldName.replace(/_/g, '').toLowerCase();
        
        // Find matching field (handle different naming conventions)
        const matchingField = categoryFields.find(([fn]) => {
          const normalizedFn = fn.replace(/_/g, '').toLowerCase();
          return normalizedFn === normalizedFieldName || 
                 normalizedFn === normalizedFieldName + 'ids' ||
                 normalizedFn === normalizedFieldName + 'id';
        });
        
        if (matchingField) {
          sectionFields.push(matchingField);
          fieldMap.delete(matchingField[0]);
        }
      });
      
      if (sectionFields.length > 0) {
        organizedSections.push({ name: section.name, fields: sectionFields, order: section.order });
      }
    });
    
    // Add remaining fields to "Other" section
    const remainingFields = Array.from(fieldMap.entries());
    if (remainingFields.length > 0) {
      organizedSections.push({ name: 'Other', fields: remainingFields, order: 999 });
    }
    
    return organizedSections.sort((a, b) => a.order - b.order);
  };
  
  // Move organizeFieldsBySection here to ensure fields is defined
  const organizedSections = organizeFieldsBySection();
  
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
        const productionUrl = 'https://onlyworlds.github.io/write-tool';
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
        toast.success('all changes saved');
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
    toast.success('al changes discarded');
  };
  
  const handleSaveField = async (fieldName: string) => {
    if (!selectedElementId || !selectedElement) return;
    
    const editedValue = getEditedValue(selectedElementId, fieldName);
    if (editedValue === undefined) return;
    
    try {
      const success = await saveElement(selectedElementId, { [fieldName]: editedValue });
      if (success) {
        setFieldValue(selectedElementId, fieldName, undefined);
        toast.success(`${fieldName.replace(/_/g, ' ')} saved`);
      } else {
        toast.error('Failed to save field');
      }
    } catch (error) {
      console.error('Error saving field:', error);
      toast.error('Error saving field');
    }
  };
  
  const handleDiscardField = (fieldName: string) => {
    if (!selectedElementId) return;
    setFieldValue(selectedElementId, fieldName, undefined);
    toast.success(`${fieldName.replace(/_/g, ' ')} changes discarded`);
  };
  
  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      handleNameCancel();
    }
  };
  
  
  return (
    <div ref={scrollContainerRef} className={`flex-1 h-screen pb-32 ${(editMode === 'network' || editMode === 'write') ? 'overflow-hidden' : 'overflow-y-auto'}`}>
      <div className="p-6 max-w-5xl">
        <div 
          id={editMode === 'showcase' ? `showcase-${selectedElementId}` : undefined}
          className={`bg-gradient-to-br from-slate-50 to-slate-100 dark:from-dark-bg-secondary dark:to-dark-bg-tertiary rounded-lg shadow-md border border-slate-200 dark:border-dark-bg-border ${editMode === 'showcase' ? 'shadow-lg' : ''}`}
        >
          <div className={`${editMode === 'edit' || editMode === 'showcase' ? 'sticky top-6' : ''} z-10 border-b border-border dark:border-dark-bg-border bg-sidebar-dark dark:bg-dark-bg-tertiary shadow-md rounded-t-lg`}>
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
                          className="text-2xl font-semibold text-text-light dark:text-gray-200 bg-input-bg dark:bg-dark-bg-secondary border border-input-border dark:border-dark-bg-border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-blue-400"
                          autoFocus
                        />
                        <button
                          onClick={handleNameSave}
                          className="text-sm text-accent dark:text-blue-400 hover:text-accent-hover dark:hover:text-blue-300 px-2 py-1 rounded transition-colors"
                        >
                          ✓
                        </button>
                        <button
                          onClick={handleNameCancel}
                          className="text-sm text-text-light/60 dark:text-gray-400 hover:text-text-light dark:hover:text-gray-200 px-2 py-1 rounded transition-colors"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <h2 
                        className={`text-2xl font-semibold text-text-light dark:text-gray-200 ${editMode === 'edit' ? 'cursor-pointer hover:text-text-light/80 dark:hover:text-gray-300' : ''}`}
                        onClick={editMode === 'edit' ? handleNameEdit : undefined}
                        title={editMode === 'edit' ? 'click to edit name' : undefined}
                      >
                        {selectedElement.name}
                      </h2>
                    )}
                    <div className="text-sm text-text-light/60 dark:text-gray-400 mt-1 capitalize">{selectedElement.category}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Collapse/Expand all sections button */}
                  {editMode === 'edit' && sections && sections.length > 0 && !hideSections && (
                    <button
                      onClick={() => {
                        const allSectionNames = sections.map(s => s.name);
                        const allCollapsed = allSectionNames.length > 0 && allSectionNames.every(name => collapsedSections.has(name));
                        
                        if (allCollapsed) {
                          // All sections are collapsed, expand all
                          setCollapsedSections(new Set());
                        } else {
                          // Some or none are collapsed, collapse all
                          setCollapsedSections(new Set(allSectionNames));
                        }
                      }}
                      className="p-2 text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200 hover:bg-white/20 dark:hover:bg-dark-bg-hover/20 rounded-lg transition-all"
                      title={collapsedSections.size > 0 ? "Expand all sections" : "Collapse all sections"}
                      data-exclude-from-export
                    >
                      {collapsedSections.size > 0 ? <ExpandAllIcon /> : <CollapseAllIcon />}
                    </button>
                  )}
                  {/* Options toggle button - gear icon only */}
                  {editMode === 'edit' && (
                    <button
                      onClick={() => setShowOptions(!showOptions)}
                      className="p-2 text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200 hover:bg-white/20 dark:hover:bg-dark-bg-hover/20 rounded-lg transition-all"
                      title="Field Options"
                      data-exclude-from-export
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </button>
                  )}
                  {unsavedFieldsForElement.length > 0 && editMode === 'edit' && (
                    <>
                      <span
                        className="text-sm text-accent dark:text-blue-400 bg-info-bg dark:bg-blue-900/20 px-3 py-1 rounded-full cursor-help"
                        data-exclude-from-export
                        title={`unsaved changes in: ${unsavedFieldsForElement.map(f => f.fieldName.replace(/_/g, ' ')).join(', ')}`}
                      >
                        {unsavedFieldsForElement.length} unsaved
                      </span>
                      <button
                        onClick={handleSaveAll}
                        disabled={isSavingAll}
                        className="text-sm text-white bg-green-600 dark:bg-green-700 hover:bg-green-700 dark:hover:bg-green-600 px-3 py-1 rounded-full transition-colors disabled:opacity-50"
                        data-exclude-from-export
                      >
                        {isSavingAll ? 'saving...' : 'save'}
                      </button>
                      <button
                        onClick={handleDiscardAll}
                        disabled={isSavingAll}
                        className="text-sm text-slate-600 dark:text-gray-300 bg-slate-200 dark:bg-dark-bg-tertiary hover:bg-slate-300 dark:hover:bg-dark-bg-hover px-3 py-1 rounded-full transition-colors disabled:opacity-50"
                        data-exclude-from-export
                      >
                        discard
                      </button>
                    </>
                  )}
                  {editMode === 'showcase' && (
                    <>
                      <button
                        onClick={handlePublishShowcase}
                        disabled={isPublishing}
                        className="px-4 py-2 text-sm font-medium rounded-lg transition-all shadow-sm flex items-center gap-2 bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-900/60 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-700/50 disabled:opacity-50"
                        data-exclude-from-export
                        title="Creates a new public shareable URL for this element. Each publish generates a fresh link - you cannot edit existing showcases, but new ones replace the previous version."
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span>{isPublishing ? 'publishing...' : 'publish'}</span>
                      </button>
                      {isPdfExportSupported() && (
                        <button
                          onClick={handleExport}
                          disabled={isExporting}
                          className="px-4 py-2 text-sm font-medium rounded-lg transition-all shadow-sm flex items-center gap-2 bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-900/60 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-700/50 disabled:opacity-50"
                          data-exclude-from-export
                          title="Export element as PDF file"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <span>{isExporting ? 'creating PDF...' : 'PDF'}</span>
                        </button>
                      )}
                    </>
                  )}
                  {/* View mode switcher - always show 2 inactive buttons */}
                  <div className="flex items-center gap-2">
                    {editMode !== 'edit' && (
                      <button
                        onClick={() => setMode('edit')}
                        className="px-4 py-2 text-sm font-medium rounded-lg transition-all shadow-sm flex items-center gap-2 bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-900/60 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-700/50"
                        data-exclude-from-export
                        title="Edit element fields and data"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        <span>edit</span>
                      </button>
                    )}
                    {editMode !== 'showcase' && (
                      <button
                        onClick={() => setMode('showcase')}
                        className="px-4 py-2 text-sm font-medium rounded-lg transition-all shadow-sm flex items-center gap-2 bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-900/60 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-700/50"
                        data-exclude-from-export
                        title="Create a public shareable page for an element with the fields of your choice"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        <span>showcase</span>
                      </button>
                    )}
                    {editMode !== 'network' && (
                      <button
                        onClick={() => setMode('network')}
                        className="px-4 py-2 text-sm font-medium rounded-lg transition-all shadow-sm flex items-center gap-2 bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-900/60 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-700/50"
                        data-exclude-from-export
                        title="View element relationships as a network graph"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="3" strokeWidth={2} />
                          <circle cx="4" cy="8" r="2" strokeWidth={2} />
                          <circle cx="4" cy="16" r="2" strokeWidth={2} />
                          <circle cx="20" cy="8" r="2" strokeWidth={2} />
                          <circle cx="20" cy="16" r="2" strokeWidth={2} />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11L4 8M9 13L4 16M15 11L20 8M15 13L20 16" />
                        </svg>
                        <span>network</span>
                      </button>
                    )}
                    {(selectedElement.category === 'narrative' || selectedElement.category === 'event') && editMode !== 'write' && (
                      <button
                        onClick={() => setMode('write')}
                        className="px-4 py-2 text-sm font-medium rounded-lg transition-all shadow-sm flex items-center gap-2 bg-green-100 dark:bg-green-900/50 hover:bg-green-200 dark:hover:bg-green-900/60 text-green-900 dark:text-green-200 border border-green-200 dark:border-green-700/50"
                        data-exclude-from-export
                        title="Open dedicated writing interface"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        <span>write</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Options row at bottom - always takes up space */}
            <div className="h-10 px-6 flex items-center" data-exclude-from-export>
              <div className={`flex items-center gap-6 justify-end w-full transition-opacity duration-200 ${showOptions && editMode === 'edit' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={hideEmptyFields}
                      onChange={(e) => setHideEmptyFields(e.target.checked)}
                      className="w-4 h-4 text-accent rounded border-gray-300 focus:ring-accent"
                    />
                    <span className="text-text-light/60 dark:text-gray-400">hide empty</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={expandAllFields}
                      onChange={(e) => setExpandAllFields(e.target.checked)}
                      className="w-4 h-4 text-accent rounded border-gray-300 focus:ring-accent"
                    />
                    <span className="text-text-light/60 dark:text-gray-400">always expand</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={hideFieldIcons}
                      onChange={(e) => setHideFieldIcons(e.target.checked)}
                      className="w-4 h-4 text-accent rounded border-gray-300 focus:ring-accent"
                    />
                    <span className="text-text-light/60 dark:text-gray-400">hide icons</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={sortAlphabetically}
                      onChange={(e) => setSortAlphabetically(e.target.checked)}
                      className="w-4 h-4 text-accent rounded border-gray-300 focus:ring-accent"
                    />
                    <span className="text-text-light/60 dark:text-gray-400">sort A-Z</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={hideSections}
                      onChange={(e) => setHideSections(e.target.checked)}
                      className="w-4 h-4 text-accent rounded border-gray-300 focus:ring-accent"
                    />
                    <span className="text-text-light/60 dark:text-gray-400">hide sections</span>
                  </label>
              </div>
            </div>
          </div>
          
          {/* Conditional rendering based on mode */}
          {editMode === 'write' && selectedElement.category === 'narrative' ? (
            <NarrativeWriter element={selectedElement} />
          ) : editMode === 'write' && selectedElement.category === 'event' ? (
            <EventWriter element={selectedElement} />
          ) : editMode === 'network' ? (
            <div className="relative network-view-no-scroll">
              {/* 2D/3D Toggle */}
              <div className="absolute top-4 left-4 z-10 bg-white/95 dark:bg-dark-bg-tertiary/95 backdrop-blur-sm rounded-lg shadow-lg p-1">
                <div className="flex gap-1">
                  <button
                    onClick={() => setIs3DView(false)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      !is3DView 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 dark:bg-dark-bg-tertiary text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-bg-hover'
                    }`}
                  >
                    2D View
                  </button>
                  <button
                    onClick={() => setIs3DView(true)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                      is3DView 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 dark:bg-dark-bg-tertiary text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-dark-bg-hover'
                    }`}
                  >
                    3D View
                  </button>
                </div>
              </div>
              
              {/* Network View */}
              {is3DView ? (
                <NetworkView3D 
                  selectedElement={selectedElement} 
                  className="h-[600px]"
                />
              ) : (
                <NetworkView 
                  selectedElement={selectedElement} 
                  className="h-[600px]"
                />
              )}
            </div>
          ) : (
          <div className={`px-4 pb-6 pt-0 ${editMode === 'showcase' ? 'bg-slate-100 dark:bg-dark-bg-secondary' : 'bg-gradient-to-b from-slate-100 to-slate-50 dark:from-dark-bg-secondary dark:to-dark-bg-tertiary'}`}>
            {/* Base fields section */}
            <div className="pt-6 pb-4 border-b border-border/50 dark:border-dark-bg-border/50 ml-5">
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
                        ? 'bg-gray-200 dark:bg-dark-bg-tertiary border border-slate-200 dark:border-dark-bg-border shadow-sm' 
                        : error
                          ? 'bg-red-50 dark:bg-red-900/20 cursor-pointer'
                          : selectedFieldId === fieldName 
                            ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-500 shadow-md cursor-pointer' 
                            : 'bg-gray-200 dark:bg-dark-bg-tertiary hover:bg-gray-300 dark:hover:bg-dark-bg-hover shadow-sm hover:shadow-md cursor-pointer'
                    }`}
                  >
                    {/* Category icon for link fields */}
                    {!hideFieldIcons && editMode === 'edit' && (fieldTypeInfo.type === 'link' || fieldTypeInfo.type === 'links') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (fieldTypeInfo.linkedCategory) {
                            toggleCategory(fieldTypeInfo.linkedCategory);
                          }
                        }}
                        className="absolute -left-5 top-4 flex items-center justify-center w-3 h-3 cursor-pointer hover:text-slate-600 dark:hover:text-gray-300 transition-colors"
                        title={`Toggle ${fieldTypeInfo.linkedCategory || 'category'} category`}
                      >
                        <CategoryIcon
                          category={fieldTypeInfo.linkedCategory || 'category'}
                          className="text-[12px] text-slate-400/70"
                        />
                      </button>
                    )}
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
                            ? 'text-base text-gray-700 dark:text-gray-300 font-medium'
                            : 'text-sm text-slate-700 dark:text-white'
                        }`}>
                          {fieldName.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </label>
                        <div className={`flex-1 ${editMode === 'showcase' ? 'text-slate-800 dark:text-gray-200 font-medium' : 'text-slate-700 dark:text-gray-300'}`}>
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
                            <span className="inline-flex w-2 h-2 bg-amber-500 rounded-full ml-1" title="unsaved changes"></span>
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
            <div className="pt-4 ml-5">
              {organizedSections.map(section => {
                const isCollapsed = collapsedSections.has(section.name);
                const hasVisibleFields = section.fields.some(([fieldName, value]) => {
                  const isEmpty = !value || (Array.isArray(value) && value.length === 0);
                  const fieldVisible = isFieldVisible(fieldName);
                  
                  if (editMode === 'showcase' && (!fieldVisible || isEmpty)) {
                    return false;
                  }
                  if (editMode === 'edit' && hideEmptyFields && isEmpty) {
                    return false;
                  }
                  return true;
                });
                
                if (!hasVisibleFields) return null;
                
                return (
                  <div key={section.name} className="mb-4">
                    {/* Section header - only show if we have sections and this isn't the fallback "Fields" section */}
                    {(!hideSections && sections && section.name !== 'Fields') && (
                      <button
                        onClick={() => toggleSection(section.name)}
                        className="flex items-center gap-2 w-full text-left mb-3 px-3 py-2 bg-sidebar-dark dark:bg-dark-bg-primary/60 hover:bg-sidebar-dark/80 dark:hover:bg-dark-bg-primary/80 rounded-lg transition-all group"
                        data-exclude-from-export
                      >
                        {isCollapsed ? (
                          <ChevronRightIcon className="w-4 h-4 text-slate-600 dark:text-gray-400 group-hover:text-slate-700 dark:group-hover:text-gray-300" />
                        ) : (
                          <ChevronDownIcon className="w-4 h-4 text-slate-600 dark:text-gray-400 group-hover:text-slate-700 dark:group-hover:text-gray-300" />
                        )}
                        <span className="text-base font-semibold text-slate-800 dark:text-gray-400 flex-1">
                          {section.name}
                        </span>
                        <span className="text-sm text-slate-600 dark:text-gray-400 font-medium">
                          {section.fields.length}
                        </span>
                      </button>
                    )}
                    
                    {/* Section fields */}
                    {!isCollapsed && (
                      <div className={`space-y-3 ${(!hideSections && sections && section.name !== 'Fields') ? 'pl-2' : ''}`}>
                        {section.fields.map(([fieldName, originalValue]) => {
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
                        ? 'bg-gray-200 dark:bg-dark-bg-tertiary border border-slate-200 dark:border-dark-bg-border shadow-sm' 
                        : error
                          ? 'bg-red-50 dark:bg-red-900/20 cursor-pointer'
                          : selectedFieldId === fieldName 
                            ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-500 shadow-md cursor-pointer' 
                            : 'bg-gray-200 dark:bg-dark-bg-tertiary hover:bg-gray-300 dark:hover:bg-dark-bg-hover shadow-sm hover:shadow-md cursor-pointer'
                    }`}
                  >
                    {/* Category icon for link fields */}
                    {!hideFieldIcons && editMode === 'edit' && (fieldTypeInfo.type === 'link' || fieldTypeInfo.type === 'links') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (fieldTypeInfo.linkedCategory) {
                            toggleCategory(fieldTypeInfo.linkedCategory);
                          }
                        }}
                        className="absolute -left-5 top-4 flex items-center justify-center w-3 h-3 cursor-pointer hover:text-slate-600 dark:hover:text-gray-300 transition-colors"
                        title={`Toggle ${fieldTypeInfo.linkedCategory || 'category'} category`}
                      >
                        <CategoryIcon
                          category={fieldTypeInfo.linkedCategory || 'category'}
                          className="text-[12px] text-slate-400/70"
                        />
                      </button>
                    )}
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
                            : 'text-sm text-slate-700 dark:text-white'
                        }`}>
                          {fieldName.replace(/_/g, ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                        </label>
                        <div className={`flex-1 ${editMode === 'showcase' ? 'text-slate-800 dark:text-gray-200 font-medium' : 'text-slate-700 dark:text-gray-300'}`}>
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
                            <span className="inline-flex w-2 h-2 bg-amber-500 rounded-full ml-1" title="unsaved changes"></span>
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
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          )}
          
        </div>
      </div>
    </div>
  );
}