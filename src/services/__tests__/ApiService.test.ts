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
        'https://www.onlyworlds.com/api/worldapi/character/',
        expect.objectContaining({
          headers: {
            'API-Key': 'test-world',
            'API-Pin': 'test-pin',
            'Accept': 'application/json'
          }
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
      const mockCharacters = [
        { id: '1', name: 'Element 1' },
        { id: '2', name: 'Element 2' },
      ];

      // Mock fetch to return data for character endpoint and empty for others
      global.fetch = vi.fn().mockImplementation((url: string) => {
        if (url.includes('/character/')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockCharacters,
          } as Response);
        }
        return Promise.resolve({
          ok: true,
          json: async () => [],
        } as Response);
      });

      const result = await ApiService.fetchAllElements('test-world', 'test-pin');
      
      // Should have the characters with category added
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ ...mockCharacters[0], category: 'character' });
      expect(result[1]).toEqual({ ...mockCharacters[1], category: 'character' });
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should return empty array when all endpoints fail', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        statusText: 'Unauthorized',
      } as Response);

      const result = await ApiService.fetchAllElements('test-world', 'invalid-pin');
      
      expect(result).toEqual([]);
    });
    
    it('should handle network errors gracefully', async () => {
      // Mock console.warn to suppress expected warnings
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const result = await ApiService.fetchAllElements('test-world', 'test-pin');
      
      expect(result).toEqual([]);
      expect(consoleWarnSpy).toHaveBeenCalled();
      
      // Restore console.warn
      consoleWarnSpy.mockRestore();
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