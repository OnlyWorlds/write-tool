// Category-specific field schemas for element creation
export interface FieldSchema {
  name: string;
  type: 'text' | 'textarea' | 'select' | 'boolean' | 'number' | 'url';
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  allowCustom?: boolean;
  description?: string;
}

export interface CategorySchema {
  name: string;
  fields: FieldSchema[];
  commonTypes?: string[];
  commonSubtypes?: string[];
}

// Common field definitions used across categories
const commonFields = {
  name: {
    name: 'name',
    type: 'text' as const,
    label: 'Name',
    required: true,
    placeholder: 'Enter element name'
  },
  description: {
    name: 'description',
    type: 'textarea' as const,
    label: 'Description',
    required: false,
    placeholder: 'Optional description'
  },
  type: {
    name: 'type',
    type: 'select' as const,
    label: 'Type',
    required: false,
    allowCustom: true,
    placeholder: 'Select or enter type'
  },
  subtype: {
    name: 'subtype',
    type: 'select' as const,
    label: 'Subtype',
    required: false,
    allowCustom: true,
    placeholder: 'Select or enter subtype'
  },
  imageUrl: {
    name: 'image_url',
    type: 'url' as const,
    label: 'Image URL',
    required: false,
    placeholder: 'https://example.com/image.jpg'
  },
  isPublic: {
    name: 'is_public',
    type: 'boolean' as const,
    label: 'Public',
    required: false,
    description: 'Make this element publicly visible'
  }
};

// Category-specific schemas
export const categorySchemas: Record<string, CategorySchema> = {
  character: {
    name: 'Character',
    fields: [
      commonFields.name,
      commonFields.description,
      commonFields.type,
      commonFields.subtype,
      {
        name: 'age',
        type: 'text',
        label: 'Age',
        required: false,
        placeholder: 'e.g., 25, Ancient, Unknown'
      },
      {
        name: 'gender',
        type: 'select',
        label: 'Gender',
        required: false,
        options: ['Male', 'Female', 'Non-binary', 'Other'],
        allowCustom: true
      },
      {
        name: 'species',
        type: 'text',
        label: 'Species',
        required: false,
        placeholder: 'e.g., Human, Elf, Dragon'
      },
      commonFields.imageUrl,
      commonFields.isPublic
    ],
    commonTypes: ['Hero', 'Villain', 'NPC', 'Companion', 'Antagonist'],
    commonSubtypes: ['Warrior', 'Mage', 'Rogue', 'Noble', 'Merchant', 'Scholar']
  },
  
  location: {
    name: 'Location',
    fields: [
      commonFields.name,
      commonFields.description,
      commonFields.type,
      commonFields.subtype,
      {
        name: 'climate',
        type: 'select',
        label: 'Climate',
        required: false,
        options: ['Temperate', 'Tropical', 'Arctic', 'Desert', 'Mountain', 'Coastal'],
        allowCustom: true
      },
      {
        name: 'population',
        type: 'text',
        label: 'Population',
        required: false,
        placeholder: 'e.g., 10,000, Large, Unknown'
      },
      commonFields.imageUrl,
      commonFields.isPublic
    ],
    commonTypes: ['City', 'Town', 'Village', 'Wilderness', 'Dungeon', 'Landmark'],
    commonSubtypes: ['Capital', 'Port', 'Fortress', 'Temple', 'Market', 'Ruins']
  },
  
  object: {
    name: 'Object',
    fields: [
      commonFields.name,
      commonFields.description,
      commonFields.type,
      commonFields.subtype,
      {
        name: 'material',
        type: 'text',
        label: 'Material',
        required: false,
        placeholder: 'e.g., Steel, Wood, Magic'
      },
      {
        name: 'rarity',
        type: 'select',
        label: 'Rarity',
        required: false,
        options: ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Artifact'],
        allowCustom: true
      },
      commonFields.imageUrl,
      commonFields.isPublic
    ],
    commonTypes: ['Weapon', 'Armor', 'Tool', 'Artifact', 'Consumable', 'Treasure'],
    commonSubtypes: ['Sword', 'Shield', 'Potion', 'Scroll', 'Ring', 'Amulet']
  },
  
  event: {
    name: 'Event',
    fields: [
      commonFields.name,
      commonFields.description,
      commonFields.type,
      commonFields.subtype,
      {
        name: 'date',
        type: 'text',
        label: 'Date',
        required: false,
        placeholder: 'e.g., Year 1205, Ancient Past'
      },
      {
        name: 'duration',
        type: 'text',
        label: 'Duration',
        required: false,
        placeholder: 'e.g., 3 days, Several years'
      },
      commonFields.imageUrl,
      commonFields.isPublic
    ],
    commonTypes: ['Battle', 'Festival', 'Natural Disaster', 'Political Event', 'Discovery'],
    commonSubtypes: ['War', 'Celebration', 'Earthquake', 'Coronation', 'Invention']
  },
  
  institution: {
    name: 'Institution',
    fields: [
      commonFields.name,
      commonFields.description,
      commonFields.type,
      commonFields.subtype,
      {
        name: 'leader',
        type: 'text',
        label: 'Leader',
        required: false,
        placeholder: 'Name of current leader'
      },
      {
        name: 'founded',
        type: 'text',
        label: 'Founded',
        required: false,
        placeholder: 'e.g., Year 1150, Ancient times'
      },
      commonFields.imageUrl,
      commonFields.isPublic
    ],
    commonTypes: ['Government', 'Guild', 'Religion', 'Military', 'Academy'],
    commonSubtypes: ['Kingdom', 'Merchants', 'Temple', 'Order', 'University']
  }
};

// Get schema for a specific category
export function getCategorySchema(category: string): CategorySchema {
  return categorySchemas[category] || {
    name: 'General',
    fields: [
      commonFields.name,
      commonFields.description,
      commonFields.type,
      commonFields.subtype,
      commonFields.imageUrl,
      commonFields.isPublic
    ],
    commonTypes: [],
    commonSubtypes: []
  };
}

// Validate element data against schema
export function validateElementData(data: any, schema: CategorySchema): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  schema.fields.forEach(field => {
    const value = data[field.name];
    
    if (field.required && (!value || (typeof value === 'string' && !value.trim()))) {
      errors.push(`${field.label} is required`);
    }
    
    if (value && field.type === 'url' && !isValidUrl(value)) {
      errors.push(`${field.label} must be a valid URL`);
    }
    
    if (value && field.type === 'number' && isNaN(Number(value))) {
      errors.push(`${field.label} must be a valid number`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Simple URL validation
function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}