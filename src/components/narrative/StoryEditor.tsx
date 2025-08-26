import { MDXEditor, headingsPlugin, listsPlugin, quotePlugin, linkPlugin, toolbarPlugin, BoldItalicUnderlineToggles, type MDXEditorMethods } from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import { useDebounce } from 'use-debounce';
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import type { Element } from '../../types/world';
import { useWorldContext } from '../../contexts/WorldContext';

interface StoryEditorProps {
  element: Element;
  onSave: (content: string) => Promise<boolean>;
  onContentChange?: (content: string) => void;
  onElementAutoLink?: (elementId: string, elementName: string, elementType: string) => void;
  className?: string;
  autosaveEnabled?: boolean;
}

export interface StoryEditorRef {
  getContent: () => string;
  setContent: (content: string) => void;
  focus: () => void;
  insertMarkdown: (markdown: string) => void;
  replaceRange: (start: number, end: number, text: string) => void;
}

export const StoryEditor = forwardRef<StoryEditorRef, StoryEditorProps>(
  ({ element, onSave, onContentChange, onElementAutoLink, className = '', autosaveEnabled = true }, ref) => {
    const editorRef = useRef<MDXEditorMethods>(null);
    const [content, setContent] = useState(element.story || '');
    const [debouncedContent] = useDebounce(content, 30000); // 30 seconds
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [lastSavedContent, setLastSavedContent] = useState(element.story || '');
    const { elements } = useWorldContext();
    const lastContentRef = useRef(element.story || '');

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      getContent: () => content,
      setContent: (newContent: string) => {
        setContent(newContent);
        editorRef.current?.setMarkdown(newContent);
      },
      focus: () => editorRef.current?.focus(),
      insertMarkdown: (markdown: string) => editorRef.current?.insertMarkdown(markdown),
      replaceRange: (start: number, end: number, text: string) => {
        // Custom method to replace a range of text
        const currentContent = content;
        const before = currentContent.substring(0, start);
        const after = currentContent.substring(end);
        const newContent = before + text + after;
        setContent(newContent);
        editorRef.current?.setMarkdown(newContent);
        
        // Try to position cursor after the replaced text
        setTimeout(() => {
          editorRef.current?.focus();
          // Use insertMarkdown with empty string to try to move cursor
          editorRef.current?.insertMarkdown('');
        }, 50);
      }
    }));

    // Auto-save effect
    useEffect(() => {
      if (autosaveEnabled && debouncedContent && debouncedContent !== lastSavedContent) {
        setSaveStatus('saving');
        onSave(debouncedContent)
          .then((success) => {
            if (success) {
              setSaveStatus('saved');
              setLastSavedContent(debouncedContent);
              // Clear localStorage backup on successful save
              localStorage.removeItem(`narrative_backup_${element.id}`);
              // Reset status after 3 seconds
              setTimeout(() => setSaveStatus('idle'), 3000);
            } else {
              setSaveStatus('error');
              // Backup to localStorage on failure
              localStorage.setItem(`narrative_backup_${element.id}`, debouncedContent);
            }
          })
          .catch((error) => {
            setSaveStatus('error');
            // Backup to localStorage on failure
            localStorage.setItem(`narrative_backup_${element.id}`, debouncedContent);
            console.error('Auto-save failed:', error);
          });
      }
    }, [debouncedContent, element.id, onSave, lastSavedContent, autosaveEnabled]);

    // Check for localStorage backup on mount
    useEffect(() => {
      const backup = localStorage.getItem(`narrative_backup_${element.id}`);
      if (backup && backup !== element.story) {
        if (confirm('Found unsaved changes from a previous session. Would you like to restore them?')) {
          setContent(backup);
          editorRef.current?.setMarkdown(backup);
        } else {
          localStorage.removeItem(`narrative_backup_${element.id}`);
        }
      }
    }, [element.id, element.story]);

    // Helper function to decode HTML entities
    const decodeHtmlEntities = (text: string): string => {
      return text
        .replace(/&#x20;/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");
    };

    const handleChange = (newContent: string) => {
      // Decode HTML entities that MDXEditor might have added
      newContent = decodeHtmlEntities(newContent);
      
      // Check if we just added a space after text starting with //
      const lines = newContent.split('\n');
      const lastLine = lines[lines.length - 1];
      
      // Pattern: check if line ends with //word(s) followed by space
      const autoLinkPattern = /\/\/([a-zA-Z0-9\s]+?)\s$/;
      const match = lastLine.match(autoLinkPattern);
      
      if (match && onElementAutoLink) {
        const searchTerm = match[1].trim(); // Keep original case
        
        // Search for matching elements - ONLY exact match (case-sensitive)
        let bestMatch: { id: string; name: string; category: string } | null = null;
        
        for (const [id, elem] of elements.entries()) {
          // Exact match required - case-sensitive
          if (elem.name === searchTerm) {
            // Exact match found (case-sensitive)
            bestMatch = { id, name: elem.name, category: elem.category || 'unknown' };
            break;
          }
        }
        
        if (bestMatch) {
          // Replace the pattern in the line
          const updatedLastLine = lastLine.replace(/\/\/[a-zA-Z0-9\s]+?(&#x20;|\s)$/, bestMatch.name + ' ');
          lines[lines.length - 1] = updatedLastLine;
          const newContentWithoutPattern = lines.join('\n');
          
          setContent(newContentWithoutPattern);
          onContentChange?.(newContentWithoutPattern);
          
          // Trigger the auto-link callback
          onElementAutoLink(bestMatch.id, bestMatch.name, bestMatch.category);
          
          // Update editor
          editorRef.current?.setMarkdown(newContentWithoutPattern);
          
          // Move cursor to the end after a short delay
          setTimeout(() => {
            editorRef.current?.focus();
            
            const editorDiv = document.querySelector('.mdxeditor-root-contenteditable') || 
                             document.querySelector('[contenteditable="true"]');
            
            if (editorDiv) {
              // Get all text nodes
              const walker = document.createTreeWalker(
                editorDiv,
                NodeFilter.SHOW_TEXT,
                null
              );
              
              let lastTextNode = null;
              let node;
              while (node = walker.nextNode()) {
                lastTextNode = node;
              }
              
              if (lastTextNode) {
                const range = document.createRange();
                const selection = window.getSelection();
                
                // Set range to end of last text node
                range.setStart(lastTextNode, lastTextNode.textContent?.length || 0);
                range.collapse(true);
                
                selection?.removeAllRanges();
                selection?.addRange(range);
              } else {
                // Fallback: select all and collapse
                const range = document.createRange();
                const selection = window.getSelection();
                range.selectNodeContents(editorDiv);
                range.collapse(false); // false = collapse to end
                selection?.removeAllRanges();
                selection?.addRange(range);
              }
            }
          }, 50);
          
          // Additional fallback approach
          setTimeout(() => {
            const editorDiv = document.querySelector('.mdxeditor-root-contenteditable') || 
                             document.querySelector('[contenteditable="true"]');
            if (editorDiv) {
              editorDiv.focus();
              // Try using execCommand to move to end
              document.execCommand('selectAll', false);
              document.getSelection()?.collapseToEnd();
            }
          }, 200);
          
          lastContentRef.current = newContentWithoutPattern;
          return;
        }
      }
      
      setContent(newContent);
      onContentChange?.(newContent);
      lastContentRef.current = newContent;
    };

    return (
      <div className={`relative h-full ${className}`}>
        {/* Auto-save status indicator */}
        <div className="absolute top-2 right-2 z-10 text-sm">
          {saveStatus === 'saving' && (
            <span className="text-blue-600 flex items-center gap-1">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-green-600 flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saved
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-red-600 flex items-center gap-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Save failed (backed up locally)
            </span>
          )}
        </div>

        <MDXEditor
          ref={editorRef}
          markdown={content}
          onChange={handleChange}
          className="h-full flex flex-col"
          contentEditableClassName="flex-1 min-h-[200px] p-8 focus:outline-none"
          plugins={[
            headingsPlugin(),
            listsPlugin(),
            quotePlugin(),
            linkPlugin(),
            toolbarPlugin({
              toolbarContents: () => (
                <div className="flex items-center gap-2">
                  <BoldItalicUnderlineToggles />
                  <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
                  <button
                    className="px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
                    onClick={() => {
                      const currentContent = editorRef.current?.getMarkdown() || '';
                      const newContent = currentContent ? `${currentContent}\n\n# ` : '# ';
                      editorRef.current?.setMarkdown(newContent);
                      editorRef.current?.focus();
                    }}
                    title="Add Heading 1"
                  >
                    H1
                  </button>
                  <button
                    className="px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
                    onClick={() => {
                      const currentContent = editorRef.current?.getMarkdown() || '';
                      const newContent = currentContent ? `${currentContent}\n\n## ` : '## ';
                      editorRef.current?.setMarkdown(newContent);
                      editorRef.current?.focus();
                    }}
                    title="Add Heading 2"
                  >
                    H2
                  </button>
                  <button
                    className="px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
                    onClick={() => {
                      const currentContent = editorRef.current?.getMarkdown() || '';
                      const newContent = currentContent ? `${currentContent}\n\n### ` : '### ';
                      editorRef.current?.setMarkdown(newContent);
                      editorRef.current?.focus();
                    }}
                    title="Add Heading 3"
                  >
                    H3
                  </button>
                  <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />
                  <button
                    className="px-2 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
                    onClick={() => {
                      const currentContent = editorRef.current?.getMarkdown() || '';
                      const newContent = currentContent ? `${currentContent}\n\n> ` : '> ';
                      editorRef.current?.setMarkdown(newContent);
                      editorRef.current?.focus();
                    }}
                    title="Add Quote"
                  >
                    Quote
                  </button>
                </div>
              )
            })
          ]}
        />
      </div>
    );
  }
);