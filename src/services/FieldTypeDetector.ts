import { getCategorySchema, type FieldSchema } from './ElementSchemas';

export type FieldType = 'text' | 'textarea' | 'url' | 'boolean' | 'number' | 'select' | 'json' | 'tags' | 'unknown';

export interface FieldTypeInfo {
  type: FieldType;
  schema?: FieldSchema;
  options?: string[];
  allowCustom?: boolean;
}

// Common field name patterns
const FIELD_PATTERNS = {
  url: /^(image_?url|url|link|website|avatar|picture|photo)$/i,
  boolean: /^(is_|has_|can_|should_|enabled|disabled|public|private|active|visible)$/i,
  number: /^(age|level|count|amount|quantity|price|cost|value|rating|score|population|size|width|height|length|weight)$/i,
  textarea: /^(description|story|biography|bio|notes|content|details|summary|background|lore)$/i,
  tags: /^(tags|keywords|categories|labels)$/i,
};

// URL validation regex
const URL_REGEX = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

export function detectFieldType(
  fieldName: string, 
  value: any, 
  elementCategory?: string
): FieldTypeInfo {
  // First check if field is defined in the schema
  if (elementCategory) {
    const schema = getCategorySchema(elementCategory);
    const fieldSchema = schema.fields.find(f => f.name === fieldName);
    if (fieldSchema) {
      let options = fieldSchema.options || [];
      
      // Get category-specific options for type/subtype
      if (fieldName === 'type' && schema.commonTypes) {
        options = schema.commonTypes;
      } else if (fieldName === 'subtype' && schema.commonSubtypes) {
        options = schema.commonSubtypes;
      }
      
      return {
        type: fieldSchema.type,
        schema: fieldSchema,
        options,
        allowCustom: fieldSchema.allowCustom
      };
    }
  }
  
  // Fallback to pattern-based detection
  if (typeof value === 'boolean') {
    return { type: 'boolean' };
  }
  
  if (typeof value === 'number') {
    return { type: 'number' };
  }
  
  if (Array.isArray(value)) {
    // If array of strings, treat as tags
    if (value.every(item => typeof item === 'string')) {
      return { type: 'tags' };
    }
    return { type: 'json' };
  }
  
  if (typeof value === 'object' && value !== null) {
    return { type: 'json' };
  }
  
  if (typeof value === 'string') {
    // Check if it's a URL
    if (URL_REGEX.test(value) || FIELD_PATTERNS.url.test(fieldName)) {
      return { type: 'url' };
    }
    
    // Check for specific field patterns
    if (FIELD_PATTERNS.boolean.test(fieldName)) {
      return { type: 'boolean' };
    }
    
    if (FIELD_PATTERNS.number.test(fieldName)) {
      return { type: 'number' };
    }
    
    if (FIELD_PATTERNS.textarea.test(fieldName)) {
      return { type: 'textarea' };
    }
    
    if (FIELD_PATTERNS.tags.test(fieldName)) {
      return { type: 'tags' };
    }
    
    // Check length to determine if it should be textarea
    if (value.length > 100 || value.includes('\n')) {
      return { type: 'textarea' };
    }
    
    return { type: 'text' };
  }
  
  return { type: 'unknown' };
}

// Convert value to appropriate type based on field type
export function convertFieldValue(value: any, fieldType: FieldType): any {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  
  switch (fieldType) {
    case 'boolean':
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true' || value === '1' || value === 'yes';
      }
      return Boolean(value);
      
    case 'number':
      if (typeof value === 'number') return value;
      const num = Number(value);
      return isNaN(num) ? value : num;
      
    case 'tags':
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') {
        return value.split(',').map(tag => tag.trim()).filter(Boolean);
      }
      return [];
      
    case 'json':
      if (typeof value === 'object') return value;
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
      
    default:
      return typeof value === 'string' ? value : String(value);
  }
}

// Format value for display
export function formatFieldValue(value: any, fieldType: FieldType): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  switch (fieldType) {
    case 'boolean':
      return value ? 'Yes' : 'No';
      
    case 'tags':
      if (Array.isArray(value)) {
        return value.join(', ');
      }
      return String(value);
      
    case 'json':
      return typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
      
    default:
      return String(value);
  }
}