import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
import { FormEvent, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useWorldContext } from '../contexts/WorldContext';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { ValidationService } from '../services/ValidationService';
import { useEditorStore, useSidebarStore } from '../stores/uiStore';
import { ThemeToggle } from './ThemeToggle';

export function AuthBar() {
  const { authenticate, isLoading, error, isAuthenticated, logout, metadata, worldKey: authenticatedWorldKey, saveElement, elements } = useWorldContext();
  const { hasUnsavedChanges, clearEdits, localEdits, setValidationErrors, clearValidationErrors } = useEditorStore();
  const { openHelpModal } = useSidebarStore();
  const [worldKey, setWorldKey] = useState('3550908908');
   const [pin, setPin] = useState('1111');
//   const [worldKey, setWorldKey] = useState('');
//   const [pin, setPin] = useState('');
  
  // Set initial values when authenticated
  useEffect(() => {
    if (isAuthenticated && authenticatedWorldKey) {
      setWorldKey(authenticatedWorldKey);
    }
  }, [isAuthenticated, authenticatedWorldKey]);
  
  // Debug logging for metadata
  useEffect(() => {
    if (metadata) {
      console.log('World metadata:', metadata);
      console.log('World name:', metadata.name);
    }
  }, [metadata]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    handleValidate();
  };

  const handleWorldKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setWorldKey(value);
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(value);
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    clearValidationErrors();
    
    try {
      // Group edits by element
      const editsByElement = new Map<string, Map<string, any>>();
      
      localEdits.forEach((value, key) => {
        const [elementId, fieldName] = key.split(':');
        if (!editsByElement.has(elementId)) {
          editsByElement.set(elementId, new Map());
        }
        editsByElement.get(elementId)!.set(fieldName, value);
      });
      
      // Validate all elements before saving
      let hasErrors = false;
      for (const [elementId, fields] of editsByElement) {
        const element = elements.get(elementId);
        if (!element) continue;
        
        // Merge current element with updates
        const updatedElement = { ...element, ...Object.fromEntries(fields) };
        
        // Validate the updated element
        const errors = ValidationService.validateElement(updatedElement);
        if (errors.length > 0) {
          hasErrors = true;
          setValidationErrors(elementId, errors);
        }
      }
      
      if (hasErrors) {
        toast.error('please fix validation errors before saving');
        setIsSaving(false);
        return;
      }
      
      // Save each element
      let allSuccess = true;
      for (const [elementId, fields] of editsByElement) {
        const updates = Object.fromEntries(fields);
        const success = await saveElement(elementId, updates);
        if (!success) {
          allSuccess = false;
          break;
        }
      }
      
      if (allSuccess) {
        clearEdits();
        toast.success('All changes saved');
      } else {
        toast.error('some changes could not be saved. please try again.');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error('failed to save changes. please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  useKeyboardShortcuts(isAuthenticated && hasUnsavedChanges ? handleSave : undefined);

  const handleValidate = async () => {
    if (worldKey.length === 10 && pin.length === 4) {
      await authenticate(worldKey, pin);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-primary dark:bg-dark-bg-primary text-text-dark shadow-lg">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={worldKey}
          onChange={handleWorldKeyChange}
          placeholder="api key"
          className="w-24 px-2 py-1 text-xs bg-primary-dark dark:bg-dark-bg-secondary border border-primary-dark dark:border-dark-bg-border text-text-dark placeholder-text-dark/60 rounded"
          disabled={isLoading}
          maxLength={10}
        />
        <input
          type="password"
          value={pin}
          onChange={handlePinChange}
          placeholder="pin"
          className="w-12 px-2 py-1 text-xs bg-primary-dark dark:bg-dark-bg-secondary border border-primary-dark dark:border-dark-bg-border text-text-dark placeholder-text-dark/60 rounded"
          disabled={isLoading}
          maxLength={4}
        />
        <button
          type="button"
          onClick={handleValidate}
          disabled={isLoading || worldKey.length !== 10 || pin.length !== 4}
          className={`px-4 py-1 text-xs rounded transition-colors border ${
            isLoading
              ? 'bg-primary-dark dark:bg-dark-bg-secondary text-text-dark/60 cursor-not-allowed border-gray-400 dark:border-gray-600'
              : isAuthenticated
              ? 'bg-accent hover:bg-accent-hover text-text-dark cursor-pointer border-accent-hover'
              : worldKey.length === 10 && pin.length === 4
              ? 'bg-primary-dark dark:bg-dark-bg-secondary hover:bg-primary-dark/80 dark:hover:bg-dark-bg-tertiary text-text-dark cursor-pointer border-gray-500 dark:border-gray-600'
              : 'bg-primary-dark dark:bg-dark-bg-secondary text-text-dark/60 cursor-not-allowed border-gray-400 dark:border-gray-600'
          }`}
        >
          {isLoading ? 'loading...' : isAuthenticated ? 'validated' : 'validate'}
        </button>
        {error && (
          <span className="text-xs text-warning ml-2">{error}</span>
        )}
        {isAuthenticated && metadata && (
          <span className="text-sm ml-4 font-bold">
            {metadata.name || 'No name found'}
          </span>
        )}
      </form>
      
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <ThemeToggle />
        
        {/* Help button */}
        <button
          onClick={openHelpModal}
          className="p-2 rounded hover:bg-primary-dark dark:hover:bg-dark-bg-secondary transition-colors"
          title="Help & Guide"
        >
          <QuestionMarkCircleIcon className="h-5 w-5 text-text-dark/70 hover:text-text-dark" />
        </button>
      </div>
    </div>
  );
}