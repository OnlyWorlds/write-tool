// OnlyWorlds field types according to specification
// https://onlyworlds.github.io/docs/specification/fields.html

import { FieldRegistry } from './FieldRegistry';

export type OnlyWorldsFieldType = 'string' | 'integer' | 'single_link' | 'multi_link';

export interface OnlyWorldsFieldInfo {
  type: OnlyWorldsFieldType;
  format?: 'uuid' | 'url' | 'text';  // For string fields
  linkedCategory?: string;            // For link fields
}

// Check if a string looks like a UUID or element ID
function isUuidLike(value: string): boolean {
  // Check for UUID v4 pattern or similar ID patterns
  // Matches: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx or similar ID formats
  return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value) ||
         /^[a-zA-Z0-9]{8,}[-_][a-zA-Z0-9]{4,}/.test(value) || // Other ID patterns
         /^element-[a-zA-Z0-9]+$/.test(value) || // element-123 pattern
         /^[a-z]+-[0-9]+$/.test(value); // category-number pattern
}

// Guess linked category from field name
function guessLinkedCategory(fieldName: string): string | undefined {
  const normalized = fieldName.toLowerCase();
  
  // Try to guess based on common patterns
  if (normalized.includes('character') || normalized.includes('person')) return 'character';
  if (normalized.includes('location') || normalized.includes('place')) return 'location';
  if (normalized.includes('ability') || normalized.includes('talent')) return 'ability';
  if (normalized.includes('trait')) return 'trait';
  if (normalized.includes('object') || normalized.includes('item')) return 'object';
  if (normalized.includes('construct')) return 'construct';
  if (normalized.includes('creature')) return 'creature';
  if (normalized.includes('event')) return 'event';
  if (normalized.includes('narrative') || normalized.includes('story')) return 'narrative';
  
  return undefined;
}

// Analyze field based on OnlyWorlds specification
export function analyzeOnlyWorldsField(
  fieldName: string,
  value: any,
  elementCategory?: string
): OnlyWorldsFieldInfo {
  // Base fields with known types
  const baseFieldTypes: Record<string, OnlyWorldsFieldInfo> = {
    'id': { type: 'string', format: 'uuid' },
    'name': { type: 'string', format: 'text' },
    'description': { type: 'string', format: 'text' },
    'supertype': { type: 'string', format: 'text' },
    'subtype': { type: 'string', format: 'text' },
    'imageUrl': { type: 'string', format: 'url' },
    'image_url': { type: 'string', format: 'url' },
    'world': { type: 'string', format: 'text' },
    'is_public': { type: 'string', format: 'text' }, // Booleans are strings in OnlyWorlds
    'created_at': { type: 'string', format: 'text' },
    'updated_at': { type: 'string', format: 'text' },
  };
  
  // Check base fields first
  if (baseFieldTypes[fieldName]) {
    return baseFieldTypes[fieldName];
  }
  
  // Use the dynamic field registry instead of hardcoded lists
  
  // Check if it's a known single link field
  if (FieldRegistry.isSingleLinkField(fieldName)) {
    // If value is null, undefined, or empty string, it's still a link field
    if (value === null || value === undefined || value === '') {
      return {
        type: 'single_link',
        linkedCategory: FieldRegistry.getLinkedCategory(fieldName)
      };
    }
    // If value is a string that looks like UUID, it's a link
    if (typeof value === 'string' && isUuidLike(value)) {
      return {
        type: 'single_link',
        linkedCategory: FieldRegistry.getLinkedCategory(fieldName)
      };
    }
    // If value is an object with URL property (API format not yet transformed)
    if (value && typeof value === 'object' && 'url' in value && typeof value.url === 'string') {
      return {
        type: 'single_link',
        linkedCategory: FieldRegistry.getLinkedCategory(fieldName)
      };
    }
    // If value is a non-UUID string, it's not a link (e.g., "Some City")
  }
  
  if (FieldRegistry.isMultiLinkField(fieldName) && Array.isArray(value)) {
    // Empty array or array of UUIDs
    if (value.length === 0 || value.every(v => typeof v === 'string' && isUuidLike(v))) {
      return {
        type: 'multi_link',
        linkedCategory: FieldRegistry.getLinkedCategory(fieldName)
      };
    }
  }
  
  // Single link fields (end with Id or _id) - for schema compatibility
  if (fieldName.endsWith('Id') || fieldName.endsWith('_id')) {
    const baseFieldName = fieldName.endsWith('Id') 
      ? fieldName.slice(0, -2) 
      : fieldName.slice(0, -3);
    
    return {
      type: 'single_link',
      linkedCategory: FieldRegistry.getLinkedCategory(baseFieldName)
    };
  }
  
  // Multi link fields (end with Ids or _ids) - for schema compatibility
  if (fieldName.endsWith('Ids') || fieldName.endsWith('_ids')) {
    const baseFieldName = fieldName.endsWith('Ids')
      ? fieldName.slice(0, -3)
      : fieldName.slice(0, -4);
    
    return {
      type: 'multi_link',
      linkedCategory: FieldRegistry.getLinkedCategory(baseFieldName)
    };
  }
  
  // Check if value looks like a UUID (single link)
  if (typeof value === 'string' && isUuidLike(value)) {
    // Try to guess category from field name
    return {
      type: 'single_link',
      linkedCategory: guessLinkedCategory(fieldName)
    };
  }
  
  // Check if value is an object with URL property (API format not yet transformed)
  if (value && typeof value === 'object' && !Array.isArray(value) && 'url' in value && typeof value.url === 'string') {
    return {
      type: 'single_link',
      linkedCategory: guessLinkedCategory(fieldName)
    };
  }
  
  // Check if value is array of UUIDs (multi link)
  if (Array.isArray(value) && value.length > 0 && value.every(v => typeof v === 'string' && isUuidLike(v))) {
    return {
      type: 'multi_link',
      linkedCategory: guessLinkedCategory(fieldName)
    };
  }
  
  // Check if value is array of objects with URL property (API format not yet transformed)
  if (Array.isArray(value) && value.length > 0 && value.every(v => v && typeof v === 'object' && 'url' in v && typeof v.url === 'string')) {
    return {
      type: 'multi_link',
      linkedCategory: guessLinkedCategory(fieldName)
    };
  }
  
  // Integer fields based on known patterns
  const integerFields = [
    'age', 'level', 'height', 'weight', 'population', 'elevation',
    'charisma', 'coercion', 'competence', 'compassion', 'creativity', 'courage',
    'hitPoints', 'hit_points', 'STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA',
    'birthDate', 'birth_date', 'foundingDate', 'founding_date', 'amount'
  ];
  
  if (integerFields.includes(fieldName) || 
      (typeof value === 'number' && Number.isInteger(value))) {
    return { type: 'integer' };
  }
  
  // URL detection for string fields
  if (fieldName.toLowerCase().includes('url') || 
      (typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://')))) {
    return { type: 'string', format: 'url' };
  }
  
  // Default to string
  return { type: 'string', format: 'text' };
}

