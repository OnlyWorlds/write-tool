import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiService, organizeElementsByCategory } from '../ApiService';
import type { Element } from '../../types/world';

describe('ApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateCredentials', () => {
    it('should return true for valid credentials', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '1', name: 'Test World' }),
      } as Response);

      const result = await ApiService.validateCredentials('test-world', 'test-pin');
      
      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://www.onlyworlds.com/api/worldapi/world/test-world',
        expect.objectContaining({
          headers: { 'Authorization': 'Pin test-pin' }
        })
      );
    });

    it('should return false for invalid credentials', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 401,
      } as Response);

      const result = await ApiService.validateCredentials('invalid', 'invalid');
      
      expect(result).toBe(false);
    });

    it('should handle network errors', async () => {
      // Mock console.error to suppress expected error output
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'));

      const result = await ApiService.validateCredentials('test', 'test');
      
      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Authentication error:', expect.any(Error));
      
      // Restore console.error
      consoleSpy.mockRestore();
    });
  });

  describe('fetchAllElements', () => {
    it('should return elements array on success', async () => {
      const mockElements: Element[] = [
        { id: '1', name: 'Element 1', category: 'characters' },
        { id: '2', name: 'Element 2', category: 'locations' },
      ];

      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => mockElements,
      } as Response);

      const result = await ApiService.fetchAllElements('test-world', 'test-pin');
      
      expect(result).toEqual(mockElements);
      expect(global.fetch).toHaveBeenCalledWith(
        'https://www.onlyworlds.com/api/worldapi/world/test-world/elements',
        expect.objectContaining({
          headers: { 'Authorization': 'Pin test-pin' },
        })
      );
    });

    it('should throw error on failed response', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        statusText: 'Unauthorized',
      } as Response);

      await expect(
        ApiService.fetchAllElements('test-world', 'invalid-pin')
      ).rejects.toThrow('Failed to fetch elements: Unauthorized');
    });
  });
});

describe('organizeElementsByCategory', () => {
  it('should organize elements by category', () => {
    const elements: Element[] = [
      { id: '1', name: 'Character B', category: 'characters' },
      { id: '2', name: 'Character A', category: 'characters' },
      { id: '3', name: 'Location 1', category: 'locations' },
      { id: '4', name: 'No Category', description: 'test' },
    ];

    const result = organizeElementsByCategory(elements);
    
    expect(result.size).toBe(3);
    expect(result.has('characters')).toBe(true);
    expect(result.has('locations')).toBe(true);
    expect(result.has('uncategorized')).toBe(true);
    
    // Check sorting
    const characters = result.get('characters')!;
    expect(characters[0].name).toBe('Character A');
    expect(characters[1].name).toBe('Character B');
  });

  it('should handle empty array', () => {
    const result = organizeElementsByCategory([]);
    expect(result.size).toBe(0);
  });
});