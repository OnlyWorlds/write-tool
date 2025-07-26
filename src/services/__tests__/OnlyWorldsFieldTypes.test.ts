import { describe, it, expect } from 'vitest';
import { analyzeOnlyWorldsField } from '../OnlyWorldsFieldTypes';

describe('OnlyWorldsFieldTypes', () => {
  describe('analyzeOnlyWorldsField', () => {
    describe('Single Link Fields (ending with Id)', () => {
      it('should detect locationId as single link to location', () => {
        const result = analyzeOnlyWorldsField('locationId', 'element-123');
        expect(result.type).toBe('single_link');
        expect(result.linkedCategory).toBe('location');
      });

      it('should detect birthplaceId as single link to location', () => {
        const result = analyzeOnlyWorldsField('birthplaceId', 'element-456');
        expect(result.type).toBe('single_link');
        expect(result.linkedCategory).toBe('location');
      });

      it('should detect parentLocationId as single link to location', () => {
        const result = analyzeOnlyWorldsField('parentLocationId', 'element-789');
        expect(result.type).toBe('single_link');
        expect(result.linkedCategory).toBe('location');
      });

      it('should detect characterId as single link to character', () => {
        const result = analyzeOnlyWorldsField('characterId', 'char-001');
        expect(result.type).toBe('single_link');
        expect(result.linkedCategory).toBe('character');
      });

      it('should detect snake_case location_id as single link', () => {
        const result = analyzeOnlyWorldsField('location_id', 'loc-123');
        expect(result.type).toBe('single_link');
        expect(result.linkedCategory).toBe('location');
      });
      
      it('should detect location without Id suffix as single link', () => {
        const result = analyzeOnlyWorldsField('location', 'element-123');
        expect(result.type).toBe('single_link');
        expect(result.linkedCategory).toBe('location');
      });

      it('should detect birthplace without Id suffix as single link', () => {
        const result = analyzeOnlyWorldsField('birthplace', 'element-456');
        expect(result.type).toBe('single_link');
        expect(result.linkedCategory).toBe('location');
      });
    });

    describe('Multi Link Fields (ending with Ids)', () => {
      it('should detect speciesIds as multi link to species', () => {
        const result = analyzeOnlyWorldsField('speciesIds', ['species-1', 'species-2']);
        expect(result.type).toBe('multi_link');
        expect(result.linkedCategory).toBe('species');
      });

      it('should detect inhabitantsIds as multi link to character', () => {
        const result = analyzeOnlyWorldsField('inhabitantsIds', ['char-1', 'char-2']);
        expect(result.type).toBe('multi_link');
        expect(result.linkedCategory).toBe('character');
      });

      it('should detect traitsIds as multi link to trait', () => {
        const result = analyzeOnlyWorldsField('traitsIds', ['trait-1']);
        expect(result.type).toBe('multi_link');
        expect(result.linkedCategory).toBe('trait');
      });

      it('should detect snake_case species_ids as multi link', () => {
        const result = analyzeOnlyWorldsField('species_ids', ['sp-1']);
        expect(result.type).toBe('multi_link');
        expect(result.linkedCategory).toBe('species');
      });
      
      it('should detect species without Ids suffix as multi link', () => {
        const result = analyzeOnlyWorldsField('species', ['species-1', 'species-2']);
        expect(result.type).toBe('multi_link');
        expect(result.linkedCategory).toBe('species');
      });

      it('should detect traits without Ids suffix as multi link', () => {
        const result = analyzeOnlyWorldsField('traits', ['trait-1']);
        expect(result.type).toBe('multi_link');
        expect(result.linkedCategory).toBe('trait');
      });
    });

    describe('String Fields', () => {
      it('should detect name as string', () => {
        const result = analyzeOnlyWorldsField('name', 'Test Name');
        expect(result.type).toBe('string');
        expect(result.format).toBe('text');
      });

      it('should detect description as string', () => {
        const result = analyzeOnlyWorldsField('description', 'A long description');
        expect(result.type).toBe('string');
        expect(result.format).toBe('text');
      });

      it('should detect imageUrl as string with url format', () => {
        const result = analyzeOnlyWorldsField('imageUrl', 'https://example.com/image.jpg');
        expect(result.type).toBe('string');
        expect(result.format).toBe('url');
      });

      it('should detect image_url as string with url format', () => {
        const result = analyzeOnlyWorldsField('image_url', 'https://example.com/image.jpg');
        expect(result.type).toBe('string');
        expect(result.format).toBe('url');
      });

      it('should detect is_public as string (not boolean)', () => {
        const result = analyzeOnlyWorldsField('is_public', true);
        expect(result.type).toBe('string');
        expect(result.format).toBe('text');
      });

      it('should detect birthplace with text value as string', () => {
        const result = analyzeOnlyWorldsField('birthplace', 'Some City');
        expect(result.type).toBe('string');
        expect(result.format).toBe('text');
      });
    });

    describe('Integer Fields', () => {
      it('should detect age as integer', () => {
        const result = analyzeOnlyWorldsField('age', 25);
        expect(result.type).toBe('integer');
      });

      it('should detect population as integer', () => {
        const result = analyzeOnlyWorldsField('population', 10000);
        expect(result.type).toBe('integer');
      });

      it('should detect level as integer', () => {
        const result = analyzeOnlyWorldsField('level', 5);
        expect(result.type).toBe('integer');
      });

      it('should detect numeric string in integer field as integer', () => {
        const result = analyzeOnlyWorldsField('age', '25');
        expect(result.type).toBe('integer');
      });
    });

    describe('Edge Cases', () => {
      it('should not detect id field as link', () => {
        const result = analyzeOnlyWorldsField('id', 'uuid-123');
        expect(result.type).toBe('string');
        expect(result.format).toBe('uuid');
      });

      it('should handle null values for fields with Id suffix', () => {
        const result = analyzeOnlyWorldsField('locationId', null);
        expect(result.type).toBe('single_link');
        expect(result.linkedCategory).toBe('location');
      });
      
      it('should handle null values for known link fields without Id suffix', () => {
        const result = analyzeOnlyWorldsField('birthplace', null);
        expect(result.type).toBe('single_link');
        expect(result.linkedCategory).toBe('location');
      });
      
      it('should handle empty string values for known link fields', () => {
        const result = analyzeOnlyWorldsField('birthplace', '');
        expect(result.type).toBe('single_link');
        expect(result.linkedCategory).toBe('location');
      });

      it('should handle empty arrays for multi-link fields', () => {
        const result = analyzeOnlyWorldsField('speciesIds', []);
        expect(result.type).toBe('multi_link');
        expect(result.linkedCategory).toBe('species');
      });

      it('should handle unknown fields as strings', () => {
        const result = analyzeOnlyWorldsField('customField', 'some value');
        expect(result.type).toBe('string');
        expect(result.format).toBe('text');
      });
      
      it('should detect UUID values as single link even for unknown fields', () => {
        const result = analyzeOnlyWorldsField('unknownField', '550e8400-e29b-41d4-a716-446655440000');
        expect(result.type).toBe('single_link');
      });
      
      it('should detect array of UUIDs as multi link even for unknown fields', () => {
        const result = analyzeOnlyWorldsField('unknownField', ['element-123', 'element-456']);
        expect(result.type).toBe('multi_link');
      });
    });
  });
});