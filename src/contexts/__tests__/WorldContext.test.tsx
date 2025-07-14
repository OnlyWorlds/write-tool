import { describe, it, expect } from 'vitest';
import { render, screen, renderHook, act } from '@testing-library/react';
import { WorldProvider, useWorldContext } from '../WorldContext';
import type { ReactNode } from 'react';

describe('WorldContext', () => {
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

  it('should handle authentication', async () => {
    const { result } = renderHook(() => useWorldContext(), { wrapper });
    
    let authResult: boolean = false;
    await act(async () => {
      authResult = await result.current.authenticate('test-world', 'test-pin');
    });
    
    expect(authResult).toBe(true);
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.worldKey).toBe('test-world');
    expect(result.current.pin).toBe('test-pin');
  });

  it('should handle logout', () => {
    const { result } = renderHook(() => useWorldContext(), { wrapper });
    
    act(() => {
      result.current.logout();
    });
    
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.worldKey).toBe('');
    expect(result.current.pin).toBe('');
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