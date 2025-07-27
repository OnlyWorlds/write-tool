import { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useWorldContext } from '../contexts/WorldContext';
import { useEditorStore } from '../stores/uiStore';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { ValidationService } from '../services/ValidationService';

export function AuthBar() {
  const { authenticate, isLoading, error, isAuthenticated, logout, metadata, worldKey: authenticatedWorldKey, saveElement, elements } = useWorldContext();
  const { hasUnsavedChanges, clearEdits, localEdits, editMode, toggleMode, setValidationErrors, clearValidationErrors } = useEditorStore();
  const [worldKey, setWorldKey] = useState('');
  const [pin, setPin] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (worldKey && pin) {
      await authenticate(worldKey, pin);
    }
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
        toast.success('all changes saved successfully!');
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

  if (isAuthenticated) {
    return (
      <div className="flex items-center justify-between p-4 bg-primary text-text-dark shadow-lg">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-sm font-bold hover:text-accent transition-colors">
            OnlyWorlds Browse Tool
          </Link>
          <span className="text-xs text-text-dark/60">|</span>
          <span className="text-sm">
            {metadata?.name || `World ${authenticatedWorldKey}`}
          </span>
          <button
            onClick={logout}
            className="text-xs text-text-dark/60 hover:text-text-dark transition-colors"
          >
            logout
          </button>
          <div className="flex items-center gap-2 ml-6">
            <span className="text-xs text-text-dark/60">mode:</span>
            <button
              onClick={toggleMode}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${
                editMode === 'showcase' 
                  ? 'bg-accent text-text-dark' 
                  : 'bg-primary-dark text-text-dark/80'
              }`}
            >
              {editMode === 'showcase' ? 'showcase' : 'edit'}
            </button>
          </div>
        </div>
        
        {hasUnsavedChanges && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-accent">unsaved changes</span>
            <button
              onClick={() => clearEdits()}
              className="px-3 py-1 text-xs bg-primary-dark hover:bg-primary-dark/80 rounded transition-colors"
            >
              discard
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                isSaving 
                  ? 'bg-primary-dark/60 cursor-not-allowed' 
                  : 'bg-accent hover:bg-accent-hover'
              }`}
            >
              {isSaving ? 'saving...' : 'save'}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 bg-primary text-text-dark shadow-lg">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={worldKey}
          onChange={handleWorldKeyChange}
          placeholder="api key"
          className="w-24 px-2 py-1 text-xs bg-input-bg border border-input-border rounded focus:outline-none focus:border-accent text-text-light placeholder-text-light/60"
          disabled={isLoading}
          maxLength={10}
        />
        <input
          type="password"
          value={pin}
          onChange={handlePinChange}
          placeholder="pin"
          className="w-16 px-2 py-1 text-xs bg-input-bg border border-input-border rounded focus:outline-none focus:border-accent text-text-light placeholder-text-light/60"
          disabled={isLoading}
          maxLength={4}
        />
        <button
          type="submit"
          disabled={isLoading || !worldKey || !pin}
          className={`px-3 py-1 text-xs rounded transition-colors ${
            isLoading || !worldKey || !pin
              ? 'bg-button text-text-light/60 cursor-not-allowed'
              : 'bg-button hover:bg-button-hover text-text-light'
          }`}
        >
          {isLoading ? 'loading...' : 'validate'}
        </button>
        {error && (
          <span className="text-xs text-warning ml-2">{error}</span>
        )}
      </form>
    </div>
  );
}