import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { WorldState, Element } from '../types/world';

interface WorldContextType extends WorldState {
  authenticate: (worldKey: string, pin: string) => Promise<boolean>;
  logout: () => void;
  updateElement: (element: Element) => void;
  createElement: (element: Element) => void;
  deleteElement: (elementId: string) => void;
}

const WorldContext = createContext<WorldContextType | undefined>(undefined);

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
      // This will be implemented when we create the API service
      // For now, just set the state
      setState(prev => ({
        ...prev,
        worldKey,
        pin,
        isAuthenticated: true,
        isLoading: false,
      }));
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
    localStorage.removeItem('worldKey');
    localStorage.removeItem('pin');
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