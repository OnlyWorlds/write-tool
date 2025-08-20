import { useState, useRef } from 'react';
import { useWorldContext } from '../../contexts/WorldContext';
import { useEditorStore } from '../../stores/uiStore';
import type { Element } from '../../types/world';
import { EnhancedStoryEditor, type EnhancedStoryEditorRef } from './EnhancedStoryEditor';
import { WritingStats } from './WritingStats';
import { EventPanel } from './EventPanel';
import { ElementQuickRef } from './ElementQuickRef';
import './NarrativeWriter.css';

interface NarrativeWriterProps {
  element: Element;
}

export function NarrativeWriter({ element }: NarrativeWriterProps) {
  const { saveElement, updateElement } = useWorldContext();
  const { setMode } = useEditorStore();
  const [content, setContent] = useState(element.story || '');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showEventPanel, setShowEventPanel] = useState(true);
  const [showQuickRef, setShowQuickRef] = useState(true);
  const [currentElement, setCurrentElement] = useState(element);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const editorRef = useRef<EnhancedStoryEditorRef>(null);

  const handleSave = async (newContent: string) => {
    return await saveElement(currentElement.id, { story: newContent });
  };

  const handleEventsReorder = (eventIds: string[]) => {
    const updated = { ...currentElement, events: eventIds };
    setCurrentElement(updated);
    updateElement(updated);
    saveElement(currentElement.id, { events: eventIds });
  };

  const handleEventAdd = (eventId: string) => {
    const events = [...(currentElement.events || []), eventId];
    const updated = { ...currentElement, events };
    setCurrentElement(updated);
    updateElement(updated);
    saveElement(currentElement.id, { events });
  };

  const handleEventRemove = (eventId: string) => {
    const events = (currentElement.events || []).filter((id: any) => id !== eventId);
    const updated = { ...currentElement, events };
    setCurrentElement(updated);
    updateElement(updated);
    saveElement(currentElement.id, { events });
  };

  const handleElementInsert = (elementId: string, elementName: string, elementType: string) => {
    editorRef.current?.insertLinkAtCursor(elementId, elementName, elementType);
    editorRef.current?.focus();
  };

  const handleManualSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    const currentContent = editorRef.current?.getContent() || content;
    const success = await handleSave(currentContent);
    setIsSaving(false);
    if (success) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const handleExitWriteMode = () => {
    setMode('edit');
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`narrative-editor-wrapper flex flex-col h-full bg-white ${isFullscreen ? 'fixed inset-0 z-50' : 'relative'}`}>
      {/* Header - Fixed at top of container */}
      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50 shadow-sm">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-gray-800">{currentElement.name}</h2>
          <span className="text-sm text-gray-500 bg-green-100 px-2 py-1 rounded">Writing Mode</span>
        </div>
        
        <div className="flex items-center gap-4">
          <WritingStats content={content} />
          
          <div className="flex items-center gap-2">
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
            
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
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
              onClick={handleExitWriteMode}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
            >
              Exit Write Mode
            </button>
          </div>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Editor */}
        <div className="flex-1 overflow-y-auto">
          <EnhancedStoryEditor
            ref={editorRef}
            element={currentElement}
            onSave={handleSave}
            onContentChange={setContent}
            className="h-full"
          />
        </div>

        {/* Sidebars */}
        {showEventPanel && (
          <EventPanel
            narrative={currentElement}
            onEventsReorder={handleEventsReorder}
            onEventAdd={handleEventAdd}
            onEventRemove={handleEventRemove}
          />
        )}
        
        {showQuickRef && (
          <ElementQuickRef
            narrative={currentElement}
            onElementInsert={handleElementInsert}
          />
        )}
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 px-6 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
        <div className="flex items-center justify-between">
          <span>Auto-save every 30 seconds • Last saved content backed up to browser storage</span>
          <span>Press F11 for focus mode • Ctrl+S to save manually</span>
        </div>
      </div>
    </div>
  );
}