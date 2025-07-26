import { createContext, useContext, useState, useCallback, useEffect, useMemo, type ReactNode } from 'react';
import type { WorldState, Element } from '../types/world';
import { ApiService, organizeElementsByCategory } from '../services/ApiService';

interface WorldContextType extends WorldState {
  authenticate: (worldKey: string, pin: string) => Promise<boolean>;
  logout: () => void;
  updateElement: (element: Element) => void;
  createElement: (elementData: Partial<Element>) => Promise<Element>;
  deleteElement: (elementId: string) => void;
  saveElement: (elementId: string, updates: Partial<Element>) => Promise<boolean>;
}

const WorldContext = createContext<WorldContextType | undefined>(undefined);

const STORAGE_KEYS = {
  WORLD_KEY: 'onlyworlds_worldKey',
  PIN: 'onlyworlds_pin',
};

export function WorldProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WorldState>({
    worldKey: '',
    pin: '',
    metadata: null,
    elements: new Map(),
    categories: new Map(),
    isAuthenticated: false,
    isLoading: false,
    error: null,
  });

  const authenticate = useCallback(async (worldKey: string, pin: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Validate credentials
      const isValid = await ApiService.validateCredentials(worldKey, pin);
      
      if (!isValid) {
        setState(prev => ({
          ...prev,
          error: 'Invalid World Key or Pin',
          isLoading: false,
        }));
        return false;
      }
      
      // Fetch world data
      const [metadata, elementsArray] = await Promise.all([
        ApiService.fetchWorldMetadata(worldKey, pin),
        ApiService.fetchAllElements(worldKey, pin),
      ]);
      
      // Convert elements array to Map
      const elementsMap = new Map<string, Element>();
      elementsArray.forEach(element => {
        elementsMap.set(element.id, element);
      });
      
      // Organize by categories
      const categories = organizeElementsByCategory(elementsArray);
      
      // Store credentials - world key in localStorage, PIN in sessionStorage
      localStorage.setItem(STORAGE_KEYS.WORLD_KEY, worldKey);
      sessionStorage.setItem(STORAGE_KEYS.PIN, pin);
      
      setState({
        worldKey,
        pin,
        metadata,
        elements: elementsMap,
        categories,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      
      return true;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Authentication failed',
        isLoading: false,
      }));
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setState({
      worldKey: '',
      pin: '',
      metadata: null,
      elements: new Map(),
      categories: new Map(),
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    localStorage.removeItem(STORAGE_KEYS.WORLD_KEY);
    sessionStorage.removeItem(STORAGE_KEYS.PIN);
  }, []);

  const updateElement = useCallback((element: Element) => {
    setState(prev => {
      const newElements = new Map(prev.elements);
      newElements.set(element.id, element);
      
      // Rebuild categories
      const newCategories = new Map<string, Element[]>();
      newElements.forEach(el => {
        const category = el.category || 'uncategorized';
        if (!newCategories.has(category)) {
          newCategories.set(category, []);
        }
        newCategories.get(category)!.push(el);
      });
      
      // Sort elements within categories
      newCategories.forEach((elements, category) => {
        newCategories.set(category, elements.sort((a, b) => a.name.localeCompare(b.name)));
      });
      
      return {
        ...prev,
        elements: newElements,
        categories: newCategories,
      };
    });
  }, []);

  const createElement = useCallback(async (elementData: Partial<Element>): Promise<Element> => {
    try {
      // Generate a proper UUIDv7
      const generateUuid = () => {
        const timestamp = Date.now();
        const randomBytes = crypto.getRandomValues(new Uint8Array(10));
        
        // Convert timestamp to hex and pad to 12 characters (48 bits)
        const timestampHex = timestamp.toString(16).padStart(12, '0');
        
        // Convert random bytes to hex
        const randomHex = Array.from(randomBytes, byte => 
          byte.toString(16).padStart(2, '0')
        ).join('');
        
        // Format as UUIDv7: xxxxxxxx-xxxx-7xxx-yxxx-xxxxxxxxxxxx
        // Where first 48 bits are timestamp, version is 7
        return [
          timestampHex.slice(0, 8),                    // 32 bits timestamp
          timestampHex.slice(8, 12),                   // 16 bits timestamp  
          '7' + randomHex.slice(0, 3),                 // version 7 + 12 bits random
          ((parseInt(randomHex.slice(3, 4), 16) & 0x3) | 0x8).toString(16) + randomHex.slice(4, 7), // variant + 12 bits random
          randomHex.slice(7, 19)                       // 48 bits random
        ].join('-');
      };
      
      const newElement: Element = {
        id: generateUuid(),
        name: elementData.name || 'Untitled',
        description: elementData.description,
        category: elementData.category || 'general',
        type: elementData.type,
        subtype: elementData.subtype,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_public: elementData.is_public || false,
        ...elementData,
      };
      
      // Call API to create element
      const createdElement = await ApiService.createElement(state.worldKey, state.pin, newElement);
      
      // Ensure the created element has the correct category
      const elementWithCategory = {
        ...createdElement,
        category: createdElement.category || elementData.category || 'general'
      };
      
      // Update local state with the server-returned element
      updateElement(elementWithCategory);
      
      return elementWithCategory;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to create element');
    }
  }, [state.worldKey, state.pin, updateElement]);

  const deleteElement = useCallback((elementId: string) => {
    setState(prev => {
      const newElements = new Map(prev.elements);
      const element = prev.elements.get(elementId);
      if (!element) return prev;
      
      newElements.delete(elementId);
      
      // Rebuild categories
      const newCategories = new Map<string, Element[]>();
      newElements.forEach(el => {
        const category = el.category || 'uncategorized';
        if (!newCategories.has(category)) {
          newCategories.set(category, []);
        }
        newCategories.get(category)!.push(el);
      });
      
      // Sort elements within categories
      newCategories.forEach((elements, category) => {
        newCategories.set(category, elements.sort((a, b) => a.name.localeCompare(b.name)));
      });
      
      return {
        ...prev,
        elements: newElements,
        categories: newCategories,
      };
    });
  }, []);

  const saveElement = useCallback(async (elementId: string, updates: Partial<Element>): Promise<boolean> => {
    const element = state.elements.get(elementId);
    if (!element) return false;
    
    const updatedElement = { ...element, ...updates };
    
    try {
      const success = await ApiService.updateElement(state.worldKey, state.pin, updatedElement);
      if (success) {
        // Update local state
        updateElement(updatedElement);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to save element:', error);
      return false;
    }
  }, [state.elements, state.worldKey, state.pin, updateElement]);

  // Check for stored credentials on mount
  useEffect(() => {
    const checkStoredCredentials = async () => {
      const storedWorldKey = localStorage.getItem(STORAGE_KEYS.WORLD_KEY);
      const storedPin = sessionStorage.getItem(STORAGE_KEYS.PIN);
      
      if (storedWorldKey && storedPin) {
        setState(prev => ({ ...prev, isLoading: true }));
        await authenticate(storedWorldKey, storedPin);
      }
    };
    
    checkStoredCredentials();
  }, [authenticate]);

  // Memoized categories to avoid recomputation
  const memoizedCategories = useMemo(() => {
    return state.categories;
  }, [state.elements]); // Recompute when elements change

  const value: WorldContextType = {
    ...state,
    categories: memoizedCategories,
    authenticate,
    logout,
    updateElement,
    createElement,
    deleteElement,
    saveElement,
  };

  return <WorldContext.Provider value={value}>{children}</WorldContext.Provider>;
}

export function useWorldContext() {
  const context = useContext(WorldContext);
  if (context === undefined) {
    throw new Error('useWorldContext must be used within a WorldProvider');
  }
  return context;
}