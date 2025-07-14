import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, renderHook, act, waitFor } from '@testing-library/react';
import { WorldProvider, useWorldContext } from '../WorldContext';
import type { ReactNode } from 'react';

// Mock the API service
vi.mock('../../services/ApiService', () => ({
  ApiService: {
    validateCredentials: vi.fn(),
    fetchWorldMetadata: vi.fn(),
    fetchAllElements: vi.fn(),
  },
  organizeElementsByCategory: vi.fn((elements) => {
    const map = new Map();
    elements.forEach((el: any) => {
      const category = el.category || 'uncategorized';
      if (!map.has(category)) map.set(category, []);
      map.get(category).push(el);
    });
    return map;
  }),
}));

describe('WorldContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset localStorage mock
    const storage: Record<string, string> = {};
    const mockStorage = {
      getItem: vi.fn((key: string) => storage[key] || null),
      setItem: vi.fn((key: string, value: string) => { storage[key] = value; }),
      removeItem: vi.fn((key: string) => { delete storage[key]; }),
      clear: vi.fn(() => { Object.keys(storage).forEach(key => delete storage[key]); }),
      key: vi.fn(() => null),
      length: 0,
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      writable: true,
    });
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <WorldProvider>{children}</WorldProvider>
  );

  it('should provide initial state', () => {
    const { result } = renderHook(() => useWorldContext(), { wrapper });
    
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.worldKey).toBe('');
    expect(result.current.pin).toBe('');
    expect(result.current.elements.size).toBe(0);
    expect(result.current.categories.size).toBe(0);
  });

  it('should handle successful authentication', async () => {
    const { ApiService } = await import('../../services/ApiService');
    ApiService.validateCredentials = vi.fn().mockResolvedValue(true);
    ApiService.fetchWorldMetadata = vi.fn().mockResolvedValue({ 
      id: '1', 
      name: 'Test World' 
    });
    ApiService.fetchAllElements = vi.fn().mockResolvedValue([
      { id: '1', name: 'Element 1', category: 'characters' }
    ]);
    
    const { result } = renderHook(() => useWorldContext(), { wrapper });
    
    let authResult: boolean = false;
    await act(async () => {
      authResult = await result.current.authenticate('test-world', 'test-pin');
    });
    
    expect(authResult).toBe(true);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.worldKey).toBe('test-world');
    expect(result.current.pin).toBe('test-pin');
    expect(localStorage.getItem('onlyworlds_worldKey')).toBe('test-world');
    expect(localStorage.getItem('onlyworlds_pin')).toBe('test-pin');
  });

  it('should handle failed authentication', async () => {
    const { ApiService } = await import('../../services/ApiService');
    ApiService.validateCredentials = vi.fn().mockResolvedValue(false);
    
    const { result } = renderHook(() => useWorldContext(), { wrapper });
    
    let authResult: boolean = true;
    await act(async () => {
      authResult = await result.current.authenticate('invalid', 'invalid');
    });
    
    expect(authResult).toBe(false);
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBe('Invalid World Key or Pin');
  });

  it('should handle logout', () => {
    const { result } = renderHook(() => useWorldContext(), { wrapper });
    
    // Set some initial data
    localStorage.setItem('onlyworlds_worldKey', 'test');
    localStorage.setItem('onlyworlds_pin', 'test');
    
    act(() => {
      result.current.logout();
    });
    
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.worldKey).toBe('');
    expect(result.current.pin).toBe('');
    expect(localStorage.getItem('onlyworlds_worldKey')).toBeNull();
    expect(localStorage.getItem('onlyworlds_pin')).toBeNull();
  });

  it('should update element and rebuild categories', () => {
    const { result } = renderHook(() => useWorldContext(), { wrapper });
    
    const element = {
      id: '1',
      name: 'Test Element',
      category: 'characters',
    };
    
    act(() => {
      result.current.updateElement(element);
    });
    
    expect(result.current.elements.get('1')).toEqual(element);
    expect(result.current.categories.get('characters')).toHaveLength(1);
    expect(result.current.categories.get('characters')![0]).toEqual(element);
  });

  it('should delete element', () => {
    const { result } = renderHook(() => useWorldContext(), { wrapper });
    
    // First add an element
    act(() => {
      result.current.createElement({
        id: '1',
        name: 'Test Element',
        category: 'characters',
      });
    });
    
    expect(result.current.elements.size).toBe(1);
    
    // Then delete it
    act(() => {
      result.current.deleteElement('1');
    });
    
    expect(result.current.elements.size).toBe(0);
    expect(result.current.categories.get('characters')).toBeUndefined();
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const originalError = console.error;
    console.error = vi.fn();
    
    expect(() => {
      renderHook(() => useWorldContext());
    }).toThrow('useWorldContext must be used within a WorldProvider');
    
    console.error = originalError;
  });
});