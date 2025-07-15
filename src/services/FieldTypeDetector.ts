import { getCategorySchema, type FieldSchema } from './ElementSchemas';
import { analyzeOnlyWorldsField, type OnlyWorldsFieldInfo } from './OnlyWorldsFieldTypes';

// Get type/subtype options for a category
export function getCategoryTypeOptions(category: string): { types: string[], subtypes: string[] } {
  const options: Record<string, { types: string[], subtypes: string[] }> = {
    character: {
      types: ['Hero', 'Villain', 'NPC', 'Companion', 'Antagonist', 'Protagonist', 'Supporting'],
      subtypes: ['Warrior', 'Mage', 'Rogue', 'Noble', 'Merchant', 'Scholar', 'Healer', 'Ranger']
    },
    location: {
      types: ['City', 'Town', 'Village', 'Wilderness', 'Dungeon', 'Landmark', 'Region'],
      subtypes: ['Capital', 'Port', 'Fortress', 'Temple', 'Market', 'Ruins', 'Forest', 'Mountain']
    },
    object: {
      types: ['Weapon', 'Armor', 'Tool', 'Artifact', 'Consumable', 'Treasure', 'Material'],
      subtypes: ['Sword', 'Shield', 'Potion', 'Scroll', 'Ring', 'Amulet', 'Staff', 'Bow']
    },
    event: {
      types: ['Battle', 'Festival', 'Natural Disaster', 'Political Event', 'Discovery', 'Ceremony'],
      subtypes: ['War', 'Celebration', 'Earthquake', 'Coronation', 'Invention', 'Treaty', 'Revolution']
    },
    institution: {
      types: ['Government', 'Guild', 'Religion', 'Military', 'Academy', 'Company'],
      subtypes: ['Kingdom', 'Merchants', 'Temple', 'Order', 'University', 'Bank', 'Council']
    }
  };
  
  return options[category] || { types: [], subtypes: [] };
}

// UI field types (how we render them)
export type FieldType = 'text' | 'textarea' | 'url' | 'boolean' | 'number' | 'select' | 'json' | 'tags' | 'link' | 'links' | 'unknown';

export interface FieldTypeInfo {
  type: FieldType;
  schema?: FieldSchema;
  options?: string[];
  allowCustom?: boolean;
  linkedCategory?: string;
}

// Map OnlyWorlds field types to UI field types
function mapToUIFieldType(fieldInfo: OnlyWorldsFieldInfo, fieldName: string, value: any): FieldTypeInfo {
  switch (fieldInfo.type) {
    case 'single_link':
      return { 
        type: 'link', 
        linkedCategory: fieldInfo.linkedCategory 
      };
      
    case 'multi_link':
      return { 
        type: 'links', 
        linkedCategory: fieldInfo.linkedCategory 
      };
      
    case 'integer':
      return { type: 'number' };
      
    case 'string':
      // Special handling for specific string fields
      if (fieldInfo.format === 'url') {
        return { type: 'url' };
      }
      
      // Boolean-like fields (OnlyWorlds doesn't have boolean type)
      if (fieldName === 'is_public' || fieldName === 'isPublic') {
        return { type: 'boolean' };
      }
      
      // Long text fields
      const longTextFields = [
        'description', 'physicality', 'mentality', 'background', 'motivations',
        'reputation', 'customs', 'infrastructure', 'architecture', 'defensibility',
        'aesthetics', 'utility', 'origins', 'politicalClimate', 'political_climate',
        'story', 'biography', 'bio', 'notes', 'content', 'details', 'summary', 'lore'
      ];
      
      if (longTextFields.includes(fieldName) || 
          (typeof value === 'string' && (value.length > 200 || value.includes('\n')))) {
        return { type: 'textarea' };
      }
      
      // Supertype/subtype are select fields
      if (fieldName === 'supertype' || fieldName === 'subtype') {
        return { type: 'select', allowCustom: true };
      }
      
      return { type: 'text' };
      
    default:
      return { type: 'text' };
  }
}

export function detectFieldType(
  fieldName: string, 
  value: any, 
  elementCategory?: string
): FieldTypeInfo {
  // First analyze using OnlyWorlds specification
  const onlyWorldsInfo = analyzeOnlyWorldsField(fieldName, value, elementCategory);
  const fieldTypeInfo = mapToUIFieldType(onlyWorldsInfo, fieldName, value);
  
  // Check legacy schema for additional metadata (options, etc)
  if (elementCategory) {
    const schema = getCategorySchema(elementCategory);
    const fieldSchema = schema.fields.find(f => f.name === fieldName);
    if (fieldSchema) {
      // For select fields in schema, use schema type
      if (fieldSchema.type === 'select') {
        const result = {
          type: 'select' as const,
          schema: fieldSchema,
          options: fieldSchema.options,
          allowCustom: fieldSchema.allowCustom
        };
        
        // If no options provided, add category-specific options for supertype/subtype
        if (!result.options && elementCategory) {
          const categoryOptions = getCategoryTypeOptions(elementCategory);
          if (fieldName === 'supertype') {
            result.options = categoryOptions.types;
          } else if (fieldName === 'subtype') {
            result.options = categoryOptions.subtypes;
          }
        }
        
        return result;
      }
      // Add schema metadata while preserving detected type
      return {
        ...fieldTypeInfo,
        schema: fieldSchema,
        options: fieldSchema.options || fieldTypeInfo.options,
        allowCustom: fieldSchema.allowCustom ?? fieldTypeInfo.allowCustom
      };
    }
  }
  
  // Add type/subtype options if needed
  if (fieldTypeInfo.type === 'select' && elementCategory) {
    const categoryOptions = getCategoryTypeOptions(elementCategory);
    if (fieldName === 'supertype') {
      return { ...fieldTypeInfo, options: categoryOptions.types };
    } else if (fieldName === 'subtype') {
      return { ...fieldTypeInfo, options: categoryOptions.subtypes };
    }
  }
  
  return fieldTypeInfo;
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
      
    case 'link':
      return typeof value === 'string' ? value : '';
      
    case 'links':
      if (Array.isArray(value)) return value;
      if (typeof value === 'string') {
        return value ? [value] : [];
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
      
    case 'link':
      return String(value);
      
    case 'links':
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