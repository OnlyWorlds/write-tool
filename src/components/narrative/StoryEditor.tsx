import { MDXEditor, headingsPlugin, listsPlugin, quotePlugin, linkPlugin, toolbarPlugin, BoldItalicUnderlineToggles, type MDXEditorMethods } from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import { useDebounce } from 'use-debounce';
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import type { Element } from '../../types/world';

interface StoryEditorProps {
  element: Element;
  onSave: (content: string) => Promise<boolean>;
  onContentChange?: (content: string) => void;
  className?: string;
}

export interface StoryEditorRef {
  getContent: () => string;
  setContent: (content: string) => void;
  focus: () => void;
}

export const StoryEditor = forwardRef<StoryEditorRef, StoryEditorProps>(
  ({ element, onSave, onContentChange, className = '' }, ref) => {
    const editorRef = useRef<MDXEditorMethods>(null);
    const [content, setContent] = useState(element.story || '');
    const [debouncedContent] = useDebounce(content, 30000); // 30 seconds
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [lastSavedContent, setLastSavedContent] = useState(element.story || '');

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      getContent: () => content,
      setContent: (newContent: string) => {
        setContent(newContent);
        editorRef.current?.setMarkdown(newContent);
      },
      focus: () => editorRef.current?.focus()
    }));

    // Auto-save effect
    useEffect(() => {
      if (debouncedContent && debouncedContent !== lastSavedContent) {
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
    }, [debouncedContent, element.id, onSave, lastSavedContent]);

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

    const handleChange = (newContent: string) => {
      setContent(newContent);
      onContentChange?.(newContent);
    };

    return (
      <div className={`relative ${className}`}>
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
          contentEditableClassName="min-h-[600px] p-8 focus:outline-none"
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