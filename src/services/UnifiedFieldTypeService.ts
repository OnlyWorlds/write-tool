// Unified field type service - consolidates all field type detection logic
// Replaces: FieldRegistry.ts, OnlyWorldsFieldTypes.ts, FieldTypeDetector.ts

// ===== TYPES =====

export type FieldType = 'text' | 'textarea' | 'url' | 'boolean' | 'number' | 'select' | 'json' | 'tags' | 'link' | 'links' | 'unknown';

export interface FieldTypeInfo {
  type: FieldType;
  schema?: any;
  options?: string[];
  allowCustom?: boolean;
  linkedCategory?: string;
}

type OnlyWorldsFieldType = 'string' | 'integer' | 'single_link' | 'multi_link';

export interface OnlyWorldsFieldInfo {
  type: OnlyWorldsFieldType;
  format?: 'uuid' | 'url' | 'text';
  linkedCategory?: string;
}

// ===== FIELD DEFINITIONS =====

class FieldDefinitions {
  // All number fields (consolidated from OnlyWorldsFieldTypes.ts)
  static readonly numberFields = new Set([
    'age', 'level', 'height', 'weight', 'population', 'elevation',
    'charisma', 'coercion', 'competence', 'compassion', 'creativity', 'courage',
    'hitPoints', 'hit_points', 'STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA',
    'birthDate', 'birth_date', 'foundingDate', 'founding_date', 'amount',
    // Date fields
    'start_date', 'startDate', 'end_date', 'endDate', 'formation_date', 'formationDate',
    'grant_date', 'grantDate', 'revoke_date', 'revokeDate', 'date',
    // Ability number fields
    'potency', 'range', 'duration',
    // Collective number fields
    'count',
    // Map number fields  
    'hierarchy', 'width', 'height', 'depth',
    // Coordinate fields
    'x', 'y', 'z',
    // Other number fields
    'intensity', 'life_span', 'lifeSpan', 'order',
    // Gaming stats
    'challenge_rating', 'challengeRating', 'armor_class', 'armorClass', 'speed'
  ]);

  // Single link field mappings (consolidated from FieldRegistry.ts)
  static readonly singleLinkFields: Record<string, string> = {
    // Location fields
    'location': 'location',
    'birthplace': 'location',
    'parent_location': 'location',
    'zone': 'zone',
    'rival': 'location',
    'partner': 'location',
    
    // Character fields
    'founder': 'character',
    'actor': 'character',
    'protagonist': 'character',
    'antagonist': 'character',
    'narrator': 'character',
    
    // Institution fields
    'primary_power': 'institution',
    'custodian': 'institution',
    'author': 'institution',
    'issuer': 'institution',
    'operator': 'institution',
    'conservator': 'institution',
    'parent_institution': 'institution',
    'body': 'institution',
    
    // Species fields
    'parent_species': 'species',
    
    // Other single links
    'governing_title': 'title',
    'parent_object': 'object',
    'language': 'language',
    'parent_law': 'law',
    'superior_title': 'title',
    'parent_map': 'map',
    'parent_narrative': 'narrative',
    'anti_trait': 'trait',
    
    // Ability fields
    'locus': 'location',
    'source': 'phenomenon',
    'tradition': 'construct',
    
    // Language fields
    'classification': 'construct',
    
    // Map/Marker fields
    'map': 'map',
    
    // Phenomenon fields
    'system': 'phenomenon',
    
    // Pin fields
    'element_id': 'any',
    'element_type': 'contenttype'
  };

  // Multi link field mappings (consolidated from FieldRegistry.ts)
  static readonly multiLinkFields: Record<string, string> = {
    // Common multi-links
    'characters': 'character',
    'friends': 'character',
    'rivals': 'character',
    'founders': 'character',
    'ancestors': 'character',
    'wielders': 'character',
    'holders': 'character',
    
    'locations': 'location',
    'extraction_markets': 'location',
    'industry_markets': 'location',
    'estates': 'location',
    'environments': 'location',
    'spread': 'location',
    
    'institutions': 'institution',
    'secondary_powers': 'institution',
    'allies': 'institution',
    'adversaries': 'institution',
    'governs': 'institution',
    
    'species': 'species',
    'delicacies': 'species',
    'predators': 'species',
    'prey': 'species',
    'variants': 'species',
    'carriers': 'species',
    'nourishment': 'species',
    
    'traits': 'trait',
    'affinities': 'trait',
    'interactions': 'trait',
    
    'abilities': 'ability',
    'empowered_abilities': 'ability',
    'empowerments': 'ability',
    'actions': 'ability',
    'adaptations': 'ability',
    
    'languages': 'language',
    'dialects': 'language',
    
    'family': 'family',
    'families': 'family',
    
    'objects': 'object',
    'defensive_objects': 'object',
    'buildings': 'object',
    'heirlooms': 'object',
    'symbols': 'object',
    'catalysts': 'object',
    
    'constructs': 'construct',
    'materials': 'construct',
    'technology': 'construct',
    'consumes': 'construct',
    'extraction_goods': 'construct',
    'industry_goods': 'construct',
    'currencies': 'construct',
    'building_methods': 'construct',
    'extraction_methods': 'construct',
    'industry_methods': 'construct',
    'cults': 'construct',
    'fighters': 'construct',
    'traditions': 'construct',
    'reproduction': 'construct',
    'penalties': 'construct',
    'equipment': 'construct',
    'symbolism': 'construct',
    'routes': 'construct',
    'boundaries': 'construct',
    
    'populations': 'collective',
    'collectives': 'collective',
    
    'effects': 'phenomenon',
    'phenomena': 'phenomenon',
    'prohibitions': 'phenomenon',
    
    'titles': 'title',
    'adjudicators': 'title',
    'enforcers': 'title',
    
    'laws': 'law',
    'principles': 'law',
    
    'zones': 'zone',
    'linked_zones': 'zone',
    
    'relations': 'relation',
    'creatures': 'creature',
    'events': 'event',
    'narratives': 'narrative',
    'triggers': 'event',
    'markers': 'marker',
    'pins': 'pin',
    'maps': 'map'
  };

  // Base fields with known types
  static readonly baseFieldTypes: Record<string, OnlyWorldsFieldInfo> = {
    'id': { type: 'string', format: 'uuid' },
    'name': { type: 'string', format: 'text' },
    'description': { type: 'string', format: 'text' },
    'supertype': { type: 'string', format: 'text' },
    'subtype': { type: 'string', format: 'text' },
    'imageUrl': { type: 'string', format: 'url' },
    'image_url': { type: 'string', format: 'url' },
    'world': { type: 'string', format: 'text' },
    'is_public': { type: 'string', format: 'text' },
    'created_at': { type: 'string', format: 'text' },
    'updated_at': { type: 'string', format: 'text' },
  };
}

// ===== HELPER FUNCTIONS =====

// Check if a string looks like a UUID or element ID
function isUuidLike(value: string): boolean {
  return /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value) ||
         /^[a-zA-Z0-9]{8,}[-_][a-zA-Z0-9]{4,}/.test(value) ||
         /^element-[a-zA-Z0-9]+$/.test(value) ||
         /^[a-z]+-[0-9]+$/.test(value);
}

// Convert camelCase to snake_case
function toSnakeCase(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

// Normalize field name for comparison
function normalizeFieldName(fieldName: string): string {
  let normalized = fieldName.toLowerCase();
  
  // Convert camelCase to snake_case if needed
  if (normalized !== fieldName) {
    const snakeVersion = toSnakeCase(fieldName);
    if (FieldDefinitions.singleLinkFields[snakeVersion] || FieldDefinitions.multiLinkFields[snakeVersion]) {
      return snakeVersion;
    }
  }
  
  // Remove _id or _ids suffix for base name
  if (normalized.endsWith('_ids')) {
    normalized = normalized.slice(0, -4);
  } else if (normalized.endsWith('_id')) {
    normalized = normalized.slice(0, -3);
  } else if (normalized.endsWith('ids') && normalized.length > 3) {
    normalized = normalized.slice(0, -3);
  } else if (normalized.endsWith('id') && normalized.length > 2) {
    normalized = normalized.slice(0, -2);
  }
  
  return normalized;
}

// ===== FIELD REGISTRY COMPATIBILITY =====

class FieldRegistryCompat {
  static isSingleLinkField(fieldName: string): boolean {
    const normalized = normalizeFieldName(fieldName);
    
    // Check for exact _id suffix patterns
    const lowerField = fieldName.toLowerCase();
    if (lowerField.endsWith('_id') || 
        (lowerField.endsWith('id') && lowerField.length > 2 && !lowerField.endsWith('_id'))) {
      return true;
    }
    
    // Check known single link fields
    return !!FieldDefinitions.singleLinkFields[normalized];
  }

  static isMultiLinkField(fieldName: string): boolean {
    const normalized = normalizeFieldName(fieldName);
    const lowerField = fieldName.toLowerCase();
    
    // Check for exact _ids suffix patterns
    if (lowerField.endsWith('_ids') || 
        (lowerField.endsWith('ids') && lowerField.length > 3 && !lowerField.endsWith('_ids'))) {
      return true;
    }
    
    // Check known multi-link fields
    return !!FieldDefinitions.multiLinkFields[normalized];
  }

  static getLinkedCategory(fieldName: string): string | undefined {
    const normalized = normalizeFieldName(fieldName);
    
    // Try single link first
    let category = FieldDefinitions.singleLinkFields[normalized];
    if (category) return category;
    
    // Try multi link
    category = FieldDefinitions.multiLinkFields[normalized];
    if (category) return category;
    
    // Try snake_case version
    const snakeCase = toSnakeCase(normalized);
    category = FieldDefinitions.singleLinkFields[snakeCase] || FieldDefinitions.multiLinkFields[snakeCase];
    
    return category;
  }
}

// ===== CORE FIELD TYPE ANALYSIS =====

export function analyzeOnlyWorldsField(
  fieldName: string,
  value: any,
  elementCategory?: string
): OnlyWorldsFieldInfo {
  // Check base fields first
  if (FieldDefinitions.baseFieldTypes[fieldName]) {
    return FieldDefinitions.baseFieldTypes[fieldName];
  }

  // Check if it's a known single link field
  if (FieldRegistryCompat.isSingleLinkField(fieldName)) {
    return {
      type: 'single_link',
      linkedCategory: FieldRegistryCompat.getLinkedCategory(fieldName)
    };
  }
  
  // Check if it's a known multi link field
  if (FieldRegistryCompat.isMultiLinkField(fieldName)) {
    return {
      type: 'multi_link',
      linkedCategory: FieldRegistryCompat.getLinkedCategory(fieldName)
    };
  }

  // Single link fields (end with Id or _id) - for schema compatibility
  if (fieldName.endsWith('Id') || fieldName.endsWith('_id')) {
    const baseFieldName = fieldName.endsWith('Id') 
      ? fieldName.slice(0, -2) 
      : fieldName.slice(0, -3);
    
    return {
      type: 'single_link',
      linkedCategory: FieldRegistryCompat.getLinkedCategory(baseFieldName)
    };
  }
  
  // Multi link fields (end with Ids or _ids) - for schema compatibility
  if (fieldName.endsWith('Ids') || fieldName.endsWith('_ids')) {
    const baseFieldName = fieldName.endsWith('Ids')
      ? fieldName.slice(0, -3)
      : fieldName.slice(0, -4);
    
    return {
      type: 'multi_link',
      linkedCategory: FieldRegistryCompat.getLinkedCategory(baseFieldName)
    };
  }
  
  // Check if value looks like a UUID (single link)
  if (typeof value === 'string' && isUuidLike(value)) {
    return {
      type: 'single_link',
      linkedCategory: FieldRegistryCompat.getLinkedCategory(fieldName)
    };
  }
  
  // Check if value is array of UUIDs (multi link)
  if (Array.isArray(value) && value.length > 0 && value.every(v => typeof v === 'string' && isUuidLike(v))) {
    return {
      type: 'multi_link',
      linkedCategory: FieldRegistryCompat.getLinkedCategory(fieldName)
    };
  }
  
  // Check if it's a number field
  if (FieldDefinitions.numberFields.has(fieldName) || 
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

// ===== PUBLIC API =====

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

// Main field type detection function
export function detectFieldType(
  fieldName: string, 
  value: any, 
  elementCategory?: string
): FieldTypeInfo {
  // First analyze using OnlyWorlds specification
  const onlyWorldsInfo = analyzeOnlyWorldsField(fieldName, value, elementCategory);
  const fieldTypeInfo = mapToUIFieldType(onlyWorldsInfo, fieldName, value);
  
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