import { useState, FormEvent } from 'react';
import { useWorldContext } from '../contexts/WorldContext';
import { useEditorStore } from '../stores/uiStore';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';

export function AuthBar() {
  const { authenticate, isLoading, error, isAuthenticated, logout, metadata, worldKey: authenticatedWorldKey, saveElement } = useWorldContext();
  const { hasUnsavedChanges, clearEdits, localEdits, editMode, toggleMode } = useEditorStore();
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
        alert('All changes saved successfully!');
      } else {
        alert('Some changes could not be saved. Please try again.');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  useKeyboardShortcuts(isAuthenticated && hasUnsavedChanges ? handleSave : undefined);

  if (isAuthenticated) {
    return (
      <div className="flex items-center justify-between p-4 bg-gray-900 text-white">
        <div className="flex items-center gap-4">
          <span className="text-sm">
            {metadata?.name || `World ${authenticatedWorldKey}`}
          </span>
          <button
            onClick={logout}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            logout
          </button>
          <div className="flex items-center gap-2 ml-6">
            <span className="text-xs text-gray-400">Mode:</span>
            <button
              onClick={toggleMode}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${
                editMode === 'showcase' 
                  ? 'bg-green-600 text-white' 
                  : 'bg-gray-700 text-gray-300'
              }`}
            >
              {editMode === 'showcase' ? 'Showcase' : 'Edit'}
            </button>
          </div>
        </div>
        
        {hasUnsavedChanges && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-400">Unsaved changes</span>
            <button
              onClick={() => clearEdits()}
              className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded transition-colors"
            >
              Discard
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
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-900 text-white">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={worldKey}
          onChange={handleWorldKeyChange}
          placeholder="api key"
          className="w-24 px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
          disabled={isLoading}
          maxLength={10}
        />
        <input
          type="password"
          value={pin}
          onChange={handlePinChange}
          placeholder="pin"
          className="w-16 px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
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
          {isLoading ? 'Loading...' : 'validate'}
        </button>
        {error && (
          <span className="text-xs text-red-400 ml-2">{error}</span>
        )}
      </form>
    </div>
  );
}