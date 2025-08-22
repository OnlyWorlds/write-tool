import { useEffect, useRef, useState } from 'react';
import { useWorldContext } from '../../contexts/WorldContext';
import type { Element } from '../../types/world';
import { ElementQuickRef } from './ElementQuickRef';
import { EnhancedStoryEditor, type EnhancedStoryEditorRef } from './EnhancedStoryEditor';
import './NarrativeWriter.css';
import { WritingStats } from './WritingStats';

interface NarrativeWriterProps {
  element: Element;
}

export function NarrativeWriter({ element }: NarrativeWriterProps) {
  const { saveElement, updateElement } = useWorldContext();
  
  // Check for draft content in localStorage
  const getDraftContent = () => {
    const draft = localStorage.getItem(`narrative_draft_${element.id}`);
    if (draft && draft !== element.story) {
      return draft;
    }
    return element.story || '';
  };
  
  const draftContent = getDraftContent();
  const [content, setContent] = useState(draftContent);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showQuickRef, setShowQuickRef] = useState(true);
  const [currentElement, setCurrentElement] = useState({ ...element, story: draftContent });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [detectedCount, setDetectedCount] = useState(0);
  const [linkedCount, setLinkedCount] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  const [autosaveEnabled, setAutosaveEnabled] = useState(true);
  const [highlightsEnabled, setHighlightsEnabled] = useState(false);
  const editorRef = useRef<EnhancedStoryEditorRef>(null);
  const detectionWidgetRef = useRef<HTMLButtonElement>(null);

  const handleSave = async (newContent: string) => {
    const success = await saveElement(currentElement.id, { story: newContent });
    if (success) {
      // Clear draft on successful save
      localStorage.removeItem(`narrative_draft_${currentElement.id}`);
      setIsDirty(false);
    }
    return success;
  };


  const handleElementInsert = (elementId: string, elementName: string, elementType: string) => {
    editorRef.current?.insertLinkAtCursor(elementId, elementName, elementType);
    // Refresh highlights after inserting an element
    if (highlightsEnabled) {
      setTimeout(() => editorRef.current?.refreshHighlights(), 100);
    }
  };
  
  const handleElementUnlink = async (elementId: string, elementType: string) => {
    // Get the field name for this element type
    const fieldName = getCategoryFieldName(elementType);
    if (!fieldName) return;
    
    // Get current IDs for this field
    const currentIds = currentElement[fieldName] || [];
    
    // Remove the element if it's linked
    const updatedIds = currentIds.filter((id: string) => id !== elementId);
    const updated = { ...currentElement, [fieldName]: updatedIds };
    
    // Save the field update (no need to modify story content since we're using visual indicators only)
    await saveElement(currentElement.id, { [fieldName]: updatedIds });
    
    setCurrentElement(updated);
    updateElement(updated);
    
    // Refresh highlights after unlinking
    if (highlightsEnabled) {
      setTimeout(() => editorRef.current?.refreshHighlights(), 100);
    }
  };

  const handleManualSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    const currentContent = editorRef.current?.getContent() || content;
    const success = await handleSave(currentContent);
    setIsSaving(false);
    if (success) {
      setSaveSuccess(true);
      setIsDirty(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };
  
  const handleRevertChanges = () => {
    if (confirm('Are you sure you want to revert to the last saved version? All unsaved changes will be lost.')) {
      const originalContent = element.story || '';
      setContent(originalContent);
      setCurrentElement(prev => ({ ...prev, story: originalContent }));
      if (editorRef.current) {
        editorRef.current.setContent(originalContent);
      }
      localStorage.removeItem(`narrative_draft_${element.id}`);
      setIsDirty(false);
    }
  };


  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  // Check on mount and when element changes if there's a draft
  useEffect(() => {
    const draft = localStorage.getItem(`narrative_draft_${element.id}`);
    if (draft && draft !== element.story) {
      setIsDirty(true);
      // Update the current element with draft content
      setCurrentElement(prev => ({ ...prev, story: draft }));
      setContent(draft);
      // Update the editor if it exists
      if (editorRef.current) {
        editorRef.current.setContent(draft);
      }
    } else {
      // No draft, use element's story
      setCurrentElement(prev => ({ ...prev, story: element.story || '' }));
      setContent(element.story || '');
      if (editorRef.current) {
        editorRef.current.setContent(element.story || '');
      }
    }
  }, [element.id, element.story]);
  
  const handleDetectionChange = (detected: number, linked: number) => {
    setDetectedCount(detected);
    setLinkedCount(linked);
  };
  
  const handleShowSuggestions = () => {
    editorRef.current?.showSuggestions();
  };
  
  const handleLinkAll = async () => {
    // Get all unlinked suggestions from the editor
    const suggestions = editorRef.current?.getSuggestions() || [];
    const unlinkedSuggestions = suggestions.filter(s => !s.isLinked);
    
    // Group by element ID to handle multiple mentions
    const elementGroups = new Map<string, typeof unlinkedSuggestions>();
    unlinkedSuggestions.forEach(suggestion => {
      const id = suggestion.suggestedElement.id;
      if (!elementGroups.has(id)) {
        elementGroups.set(id, []);
      }
      elementGroups.get(id)!.push(suggestion);
    });
    
    // Process each unique element - just add to fields, don't modify text
    const fieldsToUpdate: Record<string, string[]> = {};
    
    for (const [elementId, mentions] of elementGroups) {
      const firstMention = mentions[0];
      const fieldName = getCategoryFieldName(firstMention.elementType);
      
      if (fieldName) {
        // Add to field if not already there
        const currentIds = currentElement[fieldName] || [];
        if (!currentIds.includes(elementId)) {
          if (!fieldsToUpdate[fieldName]) {
            fieldsToUpdate[fieldName] = [...currentIds];
          }
          fieldsToUpdate[fieldName].push(elementId);
        }
      }
    }
    
    // Update all fields and save
    const newElement = { ...currentElement, ...fieldsToUpdate };
    setCurrentElement(newElement);
    updateElement(newElement);
    
    const success = await saveElement(currentElement.id, fieldsToUpdate);
    if (success) {
      // Don't modify story content or dirty state since we're only updating fields
    }
    
    // Refresh highlights after unlinking
    if (highlightsEnabled) {
      setTimeout(() => editorRef.current?.refreshHighlights(), 100);
    }
  };
  
  // Helper to get the field name for a category
  const getCategoryFieldName = (category: string): string | null => {
    const categoryToField: Record<string, string> = {
      'ability': 'abilities',
      'character': 'characters',
      'collective': 'collectives',
      'construct': 'constructs',
      'creature': 'creatures',
      'event': 'events',
      'family': 'families',
      'institution': 'institutions',
      'language': 'languages',
      'law': 'laws',
      'location': 'locations',
      'map': 'maps',
      'marker': 'markers',
      'narrative': 'narratives',
      'object': 'objects',
      'phenomenon': 'phenomena',
      'pin': 'pins',
      'relation': 'relations',
      'species': 'species',
      'title': 'titles',
      'trait': 'traits',
      'zone': 'zones',
    };
    return categoryToField[category] || null;
  };
  
  const handleFieldUpdate = async (fieldName: string, value: any) => {
    const updated = { ...currentElement, [fieldName]: value };
    setCurrentElement(updated);
    updateElement(updated);
    await saveElement(currentElement.id, { [fieldName]: value });
  };

  return (
    <div className={`narrative-editor-wrapper h-full bg-white dark:bg-dark-bg-primary ${isFullscreen ? 'fixed inset-0 z-50' : 'relative overflow-y-auto'}`}>
      {/* Header - Compact toolbar (sticky in write mode) */}
      <div className="sticky top-0 z-40 flex-shrink-0 flex items-center justify-between px-6 py-2 border-b border-gray-200 dark:border-dark-bg-border bg-gradient-to-r from-green-50 to-blue-50 dark:from-dark-bg-secondary dark:to-dark-bg-tertiary shadow-sm">
        <div className="flex items-center gap-4">
          <WritingStats content={content} />
          
          {/* Dirty state indicator with revert button */}
          {isDirty && (
            <div className="flex items-center gap-2 px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 rounded">
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 7a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm1 4a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                </svg>
                <span>unsaved changes</span>
              </div>
              <button
                onClick={handleRevertChanges}
                className="hover:bg-orange-200 dark:hover:bg-orange-800/30 p-0.5 rounded transition-colors"
                title="Revert to last saved version"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          
          {/* Element detection widget - Enhanced with inline badges */}
          <div className="flex items-center gap-1">
            {/* Show linked elements */}
            {linkedCount > 0 && (
              <div className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>{linkedCount} linked</span>
              </div>
            )}
            
            {/* Show unlinked elements with action */}
            {detectedCount - linkedCount > 0 && (
              <button
                ref={detectionWidgetRef}
                onClick={handleShowSuggestions}
                className="px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 dark:hover:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 rounded transition-colors flex items-center gap-1"
                title="View available elements to link"
              >
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span className="font-medium">
                  {detectedCount - linkedCount} unlinked
                </span>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </button>
            )}
            
            {/* Quick link all button */}
            {detectedCount - linkedCount > 0 && (
              <button
                onClick={handleLinkAll}
                className="p-1 text-yellow-600 hover:text-yellow-700 dark:text-yellow-400 dark:hover:text-yellow-300 rounded transition-colors"
                title="Link all detected elements"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </button>
            )}
            
          </div>
          
        </div>
        
        <div className="flex items-center gap-2">
          {/* Highlight controls - moved to left of auto-save */}
          {highlightsEnabled && (
            <button
              onClick={() => {
                editorRef.current?.refreshHighlights();
              }}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
              title="Refresh highlights"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
          
          <button
            onClick={() => {
              const newState = !highlightsEnabled;
              setHighlightsEnabled(newState);
              editorRef.current?.setHighlightsEnabled(newState);
            }}
            className={`p-1 rounded transition-colors ${
              highlightsEnabled 
                ? 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30' 
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
            }`}
            title={highlightsEnabled ? "Hide element highlights" : "Show element highlights"}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d={highlightsEnabled 
                  ? "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  : "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                } 
              />
            </svg>
          </button>
          
          <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
          
          {/* Autosave toggle */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={autosaveEnabled}
                onChange={(e) => setAutosaveEnabled(e.target.checked)}
                className="w-3 h-3 text-green-600 bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-600 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2"
              />
              <span>auto-save</span>
            </label>
          </div>
          
          <button
            onClick={toggleFullscreen}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title={isFullscreen ? "Exit fullscreen (F11)" : "Enter fullscreen (F11)"}
          >
            {isFullscreen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>
          
          <button
            onClick={handleManualSave}
            disabled={isSaving}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              isSaving 
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                : saveSuccess
                ? 'bg-green-500 text-white'
                : 'text-white bg-green-600 hover:bg-green-700'
            }`}
            title="Save now (Ctrl+S)"
          >
            {isSaving ? (
'Saving...'
            ) : saveSuccess ? (
'Saved!'
            ) : (
'Save'
            )}
          </button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex relative">
        {/* Editor */}
        <div className="flex-1">
          <EnhancedStoryEditor
            ref={editorRef}
            element={currentElement}
            onSave={handleSave}
            onContentChange={(newContent) => {
              setContent(newContent);
              // Save draft to localStorage
              localStorage.setItem(`narrative_draft_${currentElement.id}`, newContent);
              // Check if content is different from saved version
              setIsDirty(newContent !== element.story);
              // Also update currentElement's story so ElementQuickRef sees the changes
              setCurrentElement(prev => ({ ...prev, story: newContent }));
            }}
            onDetectionChange={handleDetectionChange}
            onFieldUpdate={handleFieldUpdate}
            className="h-full"
            popupAnchorRef={detectionWidgetRef}
            autosaveEnabled={autosaveEnabled}
          />
        </div>

        {/* Sidebars */}
        {showQuickRef && (
          <ElementQuickRef
            narrative={currentElement}
            onElementInsert={handleElementInsert}
            onElementUnlink={handleElementUnlink}
          />
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-6 py-2 border-t border-gray-200 dark:border-dark-bg-border bg-gray-50 dark:bg-dark-bg-secondary text-xs text-gray-500 dark:text-gray-400">
        <span>
          {autosaveEnabled 
            ? "Auto-save every 30 seconds • Last saved content backed up to browser storage"
            : "Auto-save disabled • Content backed up to browser storage • Use Save button to save changes"
          }
        </span>
      </div>
    </div>
  );
}