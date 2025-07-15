import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { WorldState, Element } from '../types/world';
import { ApiService, organizeElementsByCategory } from '../services/ApiService';

interface WorldContextType extends WorldState {
  authenticate: (worldKey: string, pin: string) => Promise<boolean>;
  logout: () => void;
  updateElement: (element: Element) => void;
  createElement: (element: Element) => void;
  deleteElement: (elementId: string) => void;
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
      
      // Store credentials in localStorage
      localStorage.setItem(STORAGE_KEYS.WORLD_KEY, worldKey);
      localStorage.setItem(STORAGE_KEYS.PIN, pin);
      
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
    localStorage.removeItem(STORAGE_KEYS.PIN);
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

  const createElement = useCallback((element: Element) => {
    updateElement(element);
  }, [updateElement]);

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

  // Check for stored credentials on mount
  useEffect(() => {
    const checkStoredCredentials = async () => {
      const storedWorldKey = localStorage.getItem(STORAGE_KEYS.WORLD_KEY);
      const storedPin = localStorage.getItem(STORAGE_KEYS.PIN);
      
      if (storedWorldKey && storedPin) {
        await authenticate(storedWorldKey, storedPin);
      }
    };
    
    checkStoredCredentials();
  }, [authenticate]);

  const value: WorldContextType = {
    ...state,
    authenticate,
    logout,
    updateElement,
    createElement,
    deleteElement,
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