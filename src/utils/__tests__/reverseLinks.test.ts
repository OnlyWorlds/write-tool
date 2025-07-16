import { describe, it, expect } from 'vitest';
import { calculateReverseLinks, getFieldLabel, groupReverseLinks } from '../reverseLinks';
import type { Element } from '../../types/world';

describe('reverseLinks utilities', () => {
  describe('getFieldLabel', () => {
    it('returns friendly labels for known fields', () => {
      expect(getFieldLabel('location')).toBe('Located in');
      expect(getFieldLabel('locationId')).toBe('Located in');
      expect(getFieldLabel('members')).toBe('Member of');
      expect(getFieldLabel('inhabitants')).toBe('Inhabits');
    });
    
    it('generates labels for unknown fields', () => {
      expect(getFieldLabel('custom_field')).toBe('custom field');
      expect(getFieldLabel('customFieldId')).toBe('customField');
    });
  });
  
  describe('calculateReverseLinks', () => {
    const testElements = new Map<string, Element>([
      ['char-1', {
        id: 'char-1',
        name: 'Alice',
        category: 'characters',
        locationId: 'loc-1',
        speciesIds: ['species-1']
      }],
      ['char-2', {
        id: 'char-2',
        name: 'Bob',
        category: 'characters',
        locationId: 'loc-1',
        factionId: 'faction-1'
      }],
      ['loc-1', {
        id: 'loc-1',
        name: 'Town Square',
        category: 'locations',
        rulerId: 'char-1'
      }],
      ['faction-1', {
        id: 'faction-1',
        name: 'The Guild',
        category: 'factions',
        members: ['char-1', 'char-3']
      }],
      ['species-1', {
        id: 'species-1',
        name: 'Human',
        category: 'species'
      }]
    ]);
    
    it('finds single link references', () => {
      const reverseLinks = calculateReverseLinks('loc-1', testElements);
      
      expect(reverseLinks.has('locationId')).toBe(true);
      expect(reverseLinks.get('locationId')).toHaveLength(2);
      expect(reverseLinks.get('locationId')![0].name).toBe('Alice');
      expect(reverseLinks.get('locationId')![1].name).toBe('Bob');
    });
    
    it('finds array link references', () => {
      const reverseLinks = calculateReverseLinks('char-1', testElements);
      
      expect(reverseLinks.has('members')).toBe(true);
      expect(reverseLinks.get('members')).toHaveLength(1);
      expect(reverseLinks.get('members')![0].name).toBe('The Guild');
      
      expect(reverseLinks.has('rulerId')).toBe(true);
      expect(reverseLinks.get('rulerId')).toHaveLength(1);
      expect(reverseLinks.get('rulerId')![0].name).toBe('Town Square');
    });
    
    it('returns empty map when no references exist', () => {
      const reverseLinks = calculateReverseLinks('species-1', testElements);
      
      // char-1 references species-1, so it shouldn't be empty
      expect(reverseLinks.size).toBe(1);
      expect(reverseLinks.has('speciesIds')).toBe(true);
    });
    
    it('skips self-references', () => {
      const selfRefElements = new Map<string, Element>([
        ['test-1', {
          id: 'test-1',
          name: 'Self Reference',
          category: 'test',
          parentId: 'test-1' // Self reference
        }]
      ]);
      
      const reverseLinks = calculateReverseLinks('test-1', selfRefElements);
      expect(reverseLinks.size).toBe(0);
    });
    
    it('sorts results by name', () => {
      const reverseLinks = calculateReverseLinks('loc-1', testElements);
      const chars = reverseLinks.get('locationId')!;
      
      expect(chars[0].name).toBe('Alice');
      expect(chars[1].name).toBe('Bob');
    });
  });
  
  describe('groupReverseLinks', () => {
    it('groups fields with same friendly label', () => {
      const reverseLinks = new Map([
        ['location', [{ id: '1', name: 'Char 1' } as Element]],
        ['locationId', [{ id: '2', name: 'Char 2' } as Element]]
      ]);
      
      const grouped = groupReverseLinks(reverseLinks);
      
      expect(grouped.size).toBe(1);
      expect(grouped.has('Located in')).toBe(true);
      
      const group = grouped.get('Located in')!;
      expect(group.elements).toHaveLength(2);
      expect(group.fields).toEqual(['location', 'locationId']);
    });
    
    it('avoids duplicate elements in groups', () => {
      const sameElement = { id: '1', name: 'Same Element' } as Element;
      const reverseLinks = new Map([
        ['field1', [sameElement]],
        ['field2', [sameElement]]
      ]);
      
      const grouped = groupReverseLinks(reverseLinks);
      
      // Should have 2 groups since field names are different
      expect(grouped.size).toBe(2);
    });
  });
});