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
      <div className="flex items-center justify-between p-4 bg-blue-700 text-gray-50 shadow-lg">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-sm font-bold hover:text-blue-300 transition-colors">
            OnlyWorlds Browse Tool
          </Link>
          <span className="text-xs text-gray-400">|</span>
          <span className="text-sm">
            {metadata?.name || `World ${authenticatedWorldKey}`}
          </span>
          <button
            onClick={logout}
            className="text-xs text-gray-400 hover:text-gray-50 transition-colors"
          >
            logout
          </button>
          <div className="flex items-center gap-2 ml-6">
            <span className="text-xs text-gray-400">mode:</span>
            <button
              onClick={toggleMode}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${
                editMode === 'showcase' 
                  ? 'bg-blue-600 text-gray-50' 
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              {editMode === 'showcase' ? 'showcase' : 'edit'}
            </button>
          </div>
        </div>
        
        {hasUnsavedChanges && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-400">unsaved changes</span>
            <button
              onClick={() => clearEdits()}
              className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            >
              discard
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                isSaving 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700'
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
    <div className="p-4 bg-gradient-to-r from-blue-900 to-blue-800 text-gray-50 shadow-lg">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={worldKey}
          onChange={handleWorldKeyChange}
          placeholder="api key"
          className="w-24 px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-blue-500 text-gray-50 placeholder-gray-400"
          disabled={isLoading}
          maxLength={10}
        />
        <input
          type="password"
          value={pin}
          onChange={handlePinChange}
          placeholder="pin"
          className="w-16 px-2 py-1 text-xs bg-gray-800 border border-gray-600 rounded focus:outline-none focus:border-blue-500 text-gray-50 placeholder-gray-400"
          disabled={isLoading}
          maxLength={4}
        />
        <button
          type="submit"
          disabled={isLoading || !worldKey || !pin}
          className={`px-3 py-1 text-xs rounded transition-colors ${
            isLoading || !worldKey || !pin
              ? 'bg-gray-700 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? 'loading...' : 'validate'}
        </button>
        {error && (
          <span className="text-xs text-red-300 ml-2">{error}</span>
        )}
      </form>
    </div>
  );
}