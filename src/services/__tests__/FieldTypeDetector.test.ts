import { describe, it, expect } from 'vitest';
import { detectFieldType } from '../UnifiedFieldTypeService';

describe('FieldTypeDetector', () => {
  describe('detectFieldType', () => {
    describe('Link Field Detection', () => {
      it('should detect locationId as link field', () => {
        const result = detectFieldType('locationId', 'element-123', 'character');
        expect(result.type).toBe('link');
        expect(result.linkedCategory).toBe('location');
      });

      it('should detect birthplaceId as link field', () => {
        const result = detectFieldType('birthplaceId', 'element-456', 'character');
        expect(result.type).toBe('link');
        expect(result.linkedCategory).toBe('location');
      });

      it('should detect parentLocationId as link field', () => {
        const result = detectFieldType('parentLocationId', 'loc-789', 'location');
        expect(result.type).toBe('link');
        expect(result.linkedCategory).toBe('location');
      });

      it('should NOT detect birthplace as link field when value is text', () => {
        const result = detectFieldType('birthplace', 'Some City', 'character');
        expect(result.type).toBe('text');
        expect(result.linkedCategory).toBeUndefined();
      });
      
      it('should detect location without Id suffix as link field', () => {
        const result = detectFieldType('location', 'element-123', 'character');
        expect(result.type).toBe('link');
        expect(result.linkedCategory).toBe('location');
      });

      it('should detect birthplace without Id suffix as link when value is UUID', () => {
        const result = detectFieldType('birthplace', 'element-456', 'character');
        expect(result.type).toBe('link');
        expect(result.linkedCategory).toBe('location');
      });
    });

    describe('Multi-Link Field Detection', () => {
      it('should detect speciesIds as links field', () => {
        const result = detectFieldType('speciesIds', ['species-1', 'species-2'], 'character');
        expect(result.type).toBe('links');
        expect(result.linkedCategory).toBe('species');
      });

      it('should detect inhabitantsIds as links field', () => {
        const result = detectFieldType('inhabitantsIds', ['char-1'], 'location');
        expect(result.type).toBe('links');
        expect(result.linkedCategory).toBe('character');
      });

      it('should detect traitsIds as links field', () => {
        const result = detectFieldType('traitsIds', [], 'character');
        expect(result.type).toBe('links');
        expect(result.linkedCategory).toBe('trait');
      });

      it('should NOT detect species as links field when value is text', () => {
        const result = detectFieldType('species', 'Human', 'character');
        expect(result.type).toBe('text');
        expect(result.linkedCategory).toBeUndefined();
      });
      
      it('should detect species without Ids suffix as links field', () => {
        const result = detectFieldType('species', ['species-1', 'species-2'], 'character');
        expect(result.type).toBe('links');
        expect(result.linkedCategory).toBe('species');
      });

      it('should detect traits without Ids suffix as links field', () => {
        const result = detectFieldType('traits', ['trait-1'], 'character');
        expect(result.type).toBe('links');
        expect(result.linkedCategory).toBe('trait');
      });
    });

    describe('Number Field Detection', () => {
      it('should detect age as number field', () => {
        const result = detectFieldType('age', 25, 'character');
        expect(result.type).toBe('number');
      });

      it('should detect population as number field', () => {
        const result = detectFieldType('population', 10000, 'location');
        expect(result.type).toBe('number');
      });

      it('should detect level as number field', () => {
        const result = detectFieldType('level', 5, 'character');
        expect(result.type).toBe('number');
      });
    });

    describe('Special String Fields', () => {
      it('should detect imageUrl as url field', () => {
        const result = detectFieldType('imageUrl', 'https://example.com/image.jpg', 'character');
        expect(result.type).toBe('url');
      });

      it('should detect image_url as url field', () => {
        const result = detectFieldType('image_url', 'https://example.com/image.jpg', 'location');
        expect(result.type).toBe('url');
      });

      it('should detect is_public as boolean field for UI', () => {
        const result = detectFieldType('is_public', true, 'character');
        expect(result.type).toBe('boolean');
      });

      it('should detect description as textarea field', () => {
        const result = detectFieldType('description', 'A long description text', 'character');
        expect(result.type).toBe('textarea');
      });

      it('should detect supertype as select field', () => {
        const result = detectFieldType('supertype', 'Hero', 'character');
        expect(result.type).toBe('select');
        expect(result.allowCustom).toBe(true);
      });

      it('should detect subtype as select field', () => {
        const result = detectFieldType('subtype', 'Warrior', 'character');
        expect(result.type).toBe('select');
        expect(result.allowCustom).toBe(true);
      });
    });

    describe('Schema Integration', () => {
      it('should include schema options for select fields', () => {
        const result = detectFieldType('gender', 'Male', 'character');
        expect(result.type).toBe('select');
        expect(result.options).toContain('Male');
        expect(result.options).toContain('Female');
        expect(result.options).toContain('Non-binary');
        expect(result.allowCustom).toBe(true);
      });

      it('should add type options for supertype', () => {
        const result = detectFieldType('supertype', 'Hero', 'character');
        expect(result.type).toBe('select');
        expect(result.options).toBeDefined();
        expect(result.options).toEqual(expect.arrayContaining(['Hero', 'Villain', 'NPC']));
      });
    });

    describe('Edge Cases', () => {
      it('should handle null values', () => {
        const result = detectFieldType('locationId', null, 'character');
        expect(result.type).toBe('link');
        expect(result.linkedCategory).toBe('location');
      });

      it('should handle undefined values', () => {
        const result = detectFieldType('speciesIds', undefined, 'character');
        expect(result.type).toBe('links');
        expect(result.linkedCategory).toBe('species');
      });

      it('should handle unknown fields', () => {
        const result = detectFieldType('customField', 'value', 'character');
        expect(result.type).toBe('text');
      });

      it('should work without elementCategory', () => {
        const result = detectFieldType('locationId', 'loc-123');
        expect(result.type).toBe('link');
        expect(result.linkedCategory).toBe('location');
      });
    });
  });
});