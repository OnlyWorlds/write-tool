import { useEffect } from 'react';
import { useEditorStore } from '../stores/uiStore';

export function useKeyboardShortcuts(onSave?: () => void) {
  const { toggleMode, clearEdits, hasUnsavedChanges } = useEditorStore();
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + S: Save changes
      if ((e.metaKey || e.ctrlKey) && e.key === 's' && hasUnsavedChanges && onSave) {
        e.preventDefault();
        onSave();
      }
      
      // Cmd/Ctrl + E: Toggle edit/showcase mode
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        toggleMode();
      }
      
      // Escape: Clear edits if there are unsaved changes
      if (e.key === 'Escape' && hasUnsavedChanges) {
        e.preventDefault();
        if (confirm('Discard all unsaved changes?')) {
          clearEdits();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleMode, clearEdits, hasUnsavedChanges, onSave]);
}