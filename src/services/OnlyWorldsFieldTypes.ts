// OnlyWorlds field types according to specification
// https://onlyworlds.github.io/docs/specification/fields.html

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
  
  // Known link fields without Id suffix (API returns these)
  const knownSingleLinkFields = [
    'location', 'birthplace', 'parentLocation', 'parent_location',
    'zone', 'actor', 'leader', 'creator', 'owner', 'rival', 'partner',
    'primaryPower', 'primary_power', 'governingTitle', 'governing_title',
    'parentObject', 'parent_object', 'custodian', 'operator', 'narrator',
    'conservator', 'antagonist', 'protagonist', 'author', 'founder', 'issuer',
    'parent_institution', 'parent_law', 'parent_species', 'parent_narrative',
    'superior_title', 'anti_trait', 'parent_map'
  ];
  
  const knownMultiLinkFields = [
    'species', 'traits', 'abilities', 'languages', 'family', 'friends',
    'rivals', 'inhabitants', 'populations', 'founders', 'buildings',
    'characters', 'objects', 'locations', 'institutions', 'events',
    'collectivities', 'zones', 'cults', 'phenomena', 'families', 'titles',
    'constructs', 'narratives', 'secondaryPowers', 'secondary_powers',
    'extractionMethods', 'extraction_methods', 'industryMethods', 'industry_methods',
    'affinities', 'extractionMarkets', 'extraction_markets', 'industryMarkets', 'industry_markets'
  ];
  
  // Check if it's a known link field without Id suffix
  if (knownSingleLinkFields.includes(fieldName)) {
    // If value is null, undefined, or empty string, it's still a link field
    if (value === null || value === undefined || value === '') {
      return {
        type: 'single_link',
        linkedCategory: guessLinkedCategory(fieldName)
      };
    }
    // If value is a string that looks like UUID, it's a link
    if (typeof value === 'string' && isUuidLike(value)) {
      return {
        type: 'single_link',
        linkedCategory: guessLinkedCategory(fieldName)
      };
    }
    // If value is an object with URL property (API format not yet transformed)
    if (value && typeof value === 'object' && 'url' in value && typeof value.url === 'string') {
      return {
        type: 'single_link',
        linkedCategory: guessLinkedCategory(fieldName)
      };
    }
    // If value is a non-UUID string, it's not a link (e.g., "Some City")
  }
  
  if (knownMultiLinkFields.includes(fieldName) && Array.isArray(value)) {
    // Empty array or array of UUIDs
    if (value.length === 0 || value.every(v => typeof v === 'string' && isUuidLike(v))) {
      return {
        type: 'multi_link',
        linkedCategory: guessLinkedCategory(fieldName)
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
      linkedCategory: guessLinkedCategory(baseFieldName)
    };
  }
  
  // Multi link fields (end with Ids or _ids) - for schema compatibility
  if (fieldName.endsWith('Ids') || fieldName.endsWith('_ids')) {
    const baseFieldName = fieldName.endsWith('Ids')
      ? fieldName.slice(0, -3)
      : fieldName.slice(0, -4);
    
    return {
      type: 'multi_link',
      linkedCategory: guessLinkedCategory(baseFieldName)
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

// Guess the linked category from field name
function guessLinkedCategory(baseFieldName: string): string {
  const categoryMap: Record<string, string> = {
    // Locations
    'location': 'location',
    'birthplace': 'location',
    'parentLocation': 'location',
    'parent_location': 'location',
    'zone': 'zone',
    'extractionMarkets': 'location',
    'extraction_markets': 'location',
    'industryMarkets': 'location',
    'industry_markets': 'location',
    
    // Characters  
    'owner': 'character',
    'creator': 'character',
    'leader': 'character',
    'primaryPower': 'character',
    'primary_power': 'character',
    'fighters': 'character',
    'founders': 'character',
    'inhabitants': 'character',
    
    // Species
    'species': 'species',
    
    // Traits
    'traits': 'trait',
    
    // Abilities
    'abilities': 'ability',
    
    // Languages
    'languages': 'language',
    
    // Family
    'family': 'family',
    'friends': 'character',
    'rivals': 'character',
    
    // Objects
    'materials': 'object',
    'technology': 'object',
    'effects': 'object',
    'consumes': 'object',
    'defensiveObjects': 'object',
    'defensive_objects': 'object',
    'extractionGoods': 'object',
    'extraction_goods': 'object',
    'industryGoods': 'object',
    'industry_goods': 'object',
    'delicacies': 'object',
    'currencies': 'object',
    'objects': 'object',
    
    // Constructs
    'buildings': 'construct',
    'buildingMethods': 'object',
    'building_methods': 'object',
    
    // Institutions
    'institutions': 'institution',
    'secondaryPowers': 'institution',
    'secondary_powers': 'institution',
    'cults': 'institution',
    
    // Other
    'populations': 'collective',
    'governingTitle': 'title',
    'governing_title': 'title',
    'extractionMethods': 'phenomenon',
    'extraction_methods': 'phenomenon',
    'industryMethods': 'phenomenon',
    'industry_methods': 'phenomenon',
    'affinities': 'phenomenon',
    'rival': 'character',
    'partner': 'character',
    'parentObject': 'object',
    'parent_object': 'object',
    'language': 'language',
  };
  
  return categoryMap[baseFieldName] || baseFieldName.toLowerCase();
}