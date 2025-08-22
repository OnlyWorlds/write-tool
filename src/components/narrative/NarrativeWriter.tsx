import { useState, useRef, useEffect } from 'react';
import { useWorldContext } from '../../contexts/WorldContext';
import type { Element } from '../../types/world';
import { EnhancedStoryEditor, type EnhancedStoryEditorRef } from './EnhancedStoryEditor';
import { WritingStats } from './WritingStats';
import { ElementQuickRef } from './ElementQuickRef';
import './NarrativeWriter.css';

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
  
  const [content, setContent] = useState(getDraftContent());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showQuickRef, setShowQuickRef] = useState(true);
  const [currentElement, setCurrentElement] = useState(element);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [detectedCount, setDetectedCount] = useState(0);
  const [linkedCount, setLinkedCount] = useState(0);
  const [isDirty, setIsDirty] = useState(false);
  const editorRef = useRef<EnhancedStoryEditorRef>(null);

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
    editorRef.current?.focus();
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
    
    // Also remove markdown links from the story text
    const currentContent = editorRef.current?.getContent() || content;
    if (currentContent) {
      // Remove all markdown links pointing to this element
      // Pattern: [anything](elementType:elementId)
      // Escape special regex characters in elementId
      const escapedId = elementId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const linkPattern = new RegExp(`\\[([^\\]]+)\\]\\(${elementType}:${escapedId}\\)`, 'g');
      const newContent = currentContent.replace(linkPattern, '$1'); // Replace with just the link text
      
      // Update the editor content
      editorRef.current?.setContent(newContent);
      setContent(newContent);
      
      // Save draft to localStorage
      localStorage.setItem(`narrative_draft_${currentElement.id}`, newContent);
      
      // Mark as dirty since content changed
      setIsDirty(newContent !== element.story);
      
      // Update current element with new story content
      updated.story = newContent;
      
      // Save both field update and story update
      const success = await saveElement(currentElement.id, { 
        [fieldName]: updatedIds,
        story: newContent 
      });
      
      if (success) {
        // Clear dirty state after successful save
        setIsDirty(false);
        localStorage.removeItem(`narrative_draft_${currentElement.id}`);
      }
    } else {
      // Just save the field update if no content
      await saveElement(currentElement.id, { [fieldName]: updatedIds });
    }
    
    setCurrentElement(updated);
    updateElement(updated);
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
      editorRef.current?.setContent(originalContent);
      localStorage.removeItem(`narrative_draft_${element.id}`);
      setIsDirty(false);
    }
  };


  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  // Check on mount if there's a draft that differs from saved content
  useEffect(() => {
    const draft = localStorage.getItem(`narrative_draft_${element.id}`);
    if (draft && draft !== element.story) {
      setIsDirty(true);
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
    
    // Process each unique element
    let updatedContent = editorRef.current?.getContent() || content;
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
        
        // Replace all mentions with markdown links (process in reverse order to maintain positions)
        const sortedMentions = [...mentions].sort((a, b) => b.startIndex - a.startIndex);
        for (const mention of sortedMentions) {
          const beforeMatch = updatedContent.substring(0, mention.startIndex);
          const afterMatch = updatedContent.substring(mention.endIndex);
          const link = `[${mention.text}](${mention.elementType}:${elementId})`;
          updatedContent = beforeMatch + link + afterMatch;
        }
      }
    }
    
    // Update the editor content with all links
    if (updatedContent !== content) {
      editorRef.current?.setContent(updatedContent);
      setContent(updatedContent);
      localStorage.setItem(`narrative_draft_${currentElement.id}`, updatedContent);
      setIsDirty(true);
    }
    
    // Update all fields and save
    const updates = { ...fieldsToUpdate, story: updatedContent };
    const newElement = { ...currentElement, ...fieldsToUpdate, story: updatedContent };
    setCurrentElement(newElement);
    updateElement(newElement);
    
    const success = await saveElement(currentElement.id, updates);
    if (success) {
      setIsDirty(false);
      localStorage.removeItem(`narrative_draft_${currentElement.id}`);
    }
    
    // Refresh detection
    editorRef.current?.showSuggestions();
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
    console.log('[NarrativeWriter] Field update:', fieldName, value);
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
            <div className="flex items-center gap-2 px-2 py-1 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded">
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 7a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm1 4a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                </svg>
                <span>Unsaved changes</span>
              </div>
              <button
                onClick={handleRevertChanges}
                className="hover:bg-yellow-200 dark:hover:bg-yellow-800/30 p-0.5 rounded transition-colors"
                title="Revert to last saved version"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          
          {/* Element detection widget - only show when unlinked elements are available */}
          {detectedCount - linkedCount > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleShowSuggestions}
                className="px-3 py-1.5 text-sm bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/40 text-green-800 dark:text-green-300 rounded-lg transition-colors flex items-center gap-2"
                title="View available elements to link"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="font-medium">
                  {detectedCount - linkedCount} available
                </span>
              </button>
              
              <button
                onClick={handleLinkAll}
                className="px-3 py-1.5 text-sm bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/40 text-green-800 dark:text-green-300 rounded-lg transition-colors flex items-center gap-1"
                title="Link all available elements"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Link All
              </button>
            </div>
          )}
          
        </div>
        
        <div className="flex items-center gap-2">
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
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
              isSaving 
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                : saveSuccess
                ? 'bg-green-500 text-white'
                : 'text-white bg-green-600 hover:bg-green-700'
            }`}
            title="Save now (Ctrl+S)"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : saveSuccess ? (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Saved!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
                  </svg>
                  Save
                </>
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
        <span>Auto-save every 30 seconds • Last saved content backed up to browser storage</span>
      </div>
    </div>
  );
}