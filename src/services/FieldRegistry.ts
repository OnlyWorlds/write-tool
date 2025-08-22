// Field registry for OnlyWorlds element types
// Dynamically determines field types based on field naming patterns

class FieldRegistryClass {
  private fieldCategoryMap = new Map<string, string>();
  
  constructor() {
    this.initializeFieldMappings();
  }
  
  private initializeFieldMappings() {
    // Map field names to their linked element categories
    // Based on OnlyWorlds schema verified via MCP server
    const categoryMap: Record<string, string> = {
      // Location fields (verified via MCP)
      'location': 'location',
      'birthplace': 'location',  // Character -> Location
      'parent_location': 'location',  // Location -> Location
      'zone': 'zone',
      'zones': 'zone',
      'extraction_markets': 'location',  // Location -> Location
      'industry_markets': 'location',  // Location -> Location
      'locations': 'location',
      'rival': 'location',  // Location -> Location  
      'partner': 'location',  // Location -> Location
      
      // Character fields (verified via MCP)
      'founder': 'character',  // Construct -> Character
      'founders': 'character',  // Location -> Character
      'characters': 'character',
      'friends': 'character',  // Character -> Character
      'rivals': 'character',  // Character -> Character (plural)
      'actor': 'character',  // Relation -> Character
      'protagonist': 'character',  // Narrative -> Character
      'antagonist': 'character',  // Narrative -> Character  
      'narrator': 'character',  // Narrative -> Character
      
      // Institution fields (verified via MCP)
      'primary_power': 'institution',  // Location -> Institution
      'secondary_powers': 'institution',  // Location -> Institution
      'institutions': 'institution',
      'custodian': 'institution',  // Construct -> Institution
      'author': 'institution',  // Law -> Institution
      'issuer': 'institution',  // Title -> Institution
      'operator': 'institution',  // Collective -> Institution
      'conservator': 'institution',  // Narrative -> Institution
      'allies': 'institution',  // Institution -> Institution
      'adversaries': 'institution',  // Institution -> Institution
      'parent_institution': 'institution',  // Institution -> Institution
      
      // Species fields
      'species': 'species',
      'delicacies': 'species',  // Location -> Species
      'parent_species': 'species',  // Species -> Species
      'predators': 'species',  // Species -> Species
      'prey': 'species',  // Species -> Species
      'variants': 'species',  // Species -> Species
      'carriers': 'species',  // Trait -> Species
      'reproduction': 'construct',  // Species -> Construct
      'adaptations': 'ability',  // Species -> Ability
      'nourishment': 'species',  // Species -> Species
      
      // Trait fields
      'traits': 'trait',
      'affinities': 'trait',  // Object -> Trait
      'anti_trait': 'trait',  // Trait -> Trait
      'interactions': 'trait',  // Trait -> Trait
      
      // Ability fields
      'abilities': 'ability',
      'empowered_abilities': 'ability',  // Trait -> Ability
      'empowerments': 'ability',  // Phenomenon -> Ability
      'actions': 'ability',  // Creature -> Ability
      
      // Language fields
      'languages': 'language',
      'language': 'language',
      
      // Family fields
      'family': 'family',  // Character -> Family
      'families': 'family',
      'ancestors': 'character',  // Family -> Character
      'estates': 'location',  // Family -> Location
      'governs': 'institution',  // Family -> Institution
      'heirlooms': 'object',  // Family -> Object
      
      // Object fields
      'defensive_objects': 'object',  // Location -> Object
      'buildings': 'object',  // Location -> Object
      'objects': 'object',
      'parent_object': 'object',  // Object -> Object
      
      // Construct fields
      'materials': 'construct',  // Object -> Construct
      'technology': 'construct',  // Object -> Construct
      'consumes': 'construct',  // Object -> Construct
      'extraction_goods': 'construct',  // Location -> Construct
      'industry_goods': 'construct',  // Location -> Construct
      'currencies': 'construct',  // Location -> Construct
      'constructs': 'construct',
      'building_methods': 'construct',  // Location -> Construct
      'extraction_methods': 'construct',  // Location -> Construct
      'industry_methods': 'construct',  // Location -> Construct
      'cults': 'construct',  // Location -> Construct
      'fighters': 'construct',  // Location -> Construct
      'traditions': 'construct',  // Family -> Construct
      
      // Collective fields
      'populations': 'collective',  // Location -> Collective
      'collectives': 'collective',
      'equipment': 'construct',  // Collective -> Construct
      'symbolism': 'construct',  // Collective -> Construct
      
      // Phenomenon fields
      'effects': 'phenomenon',  // Multiple types -> Phenomenon
      'phenomena': 'phenomenon',
      'catalysts': 'object',  // Phenomenon -> Object
      'wielders': 'character',  // Phenomenon -> Character
      'environments': 'location',  // Phenomenon/Trait -> Location
      'triggers': 'event',  // Event/Phenomenon -> Event
      'prohibitions': 'phenomenon',  // Law -> Phenomenon
      'system': 'phenomenon',  // Phenomenon -> Phenomenon
      
      // Title fields
      'governing_title': 'title',  // Location -> Title
      'titles': 'title',
      'superior_title': 'title',  // Title -> Title
      'holders': 'character',  // Title -> Character
      'adjudicators': 'title',  // Law -> Title
      'enforcers': 'title',  // Law -> Title
      'body': 'institution',  // Title -> Institution (single link)
      
      // Law fields
      'laws': 'law',
      'parent_law': 'law',  // Law -> Law
      'penalties': 'construct',  // Law -> Construct
      'principles': 'law',  // Zone -> Law
      
      // Ability link fields
      'instruments': 'object',  // Ability -> Object
      'talents': 'trait',  // Ability -> Trait
      'requisites': 'construct',  // Ability -> Construct
      'locus': 'location',  // Ability -> Location
      'source': 'phenomenon',  // Ability -> Phenomenon
      'tradition': 'construct',  // Ability -> Construct
      'systems': 'construct',  // Ability -> Construct
      
      // Language link fields
      'dialects': 'language',  // Language -> Language
      'spread': 'location',  // Language/Species -> Location
      'classification': 'construct',  // Language -> Construct
      
      // Map fields
      'parent_map': 'map',  // Map -> Map
      'map_id': 'map',  // Pin -> Map
      'map': 'map',  // Marker -> Map
      'marker_map': 'map',  // Marker -> Map
      'markers': 'marker',  // Map -> Marker
      'routes': 'construct',  // Map -> Construct
      'boundaries': 'construct',  // Map -> Construct
      
      // Other element type fields
      'relations': 'relation',
      'creatures': 'creature',
      'events': 'event',
      'narratives': 'narrative',
      'parent_narrative': 'narrative',  // Narrative -> Narrative
      'maps': 'map',
      'pins': 'pin',
      'linked_zones': 'zone',  // Zone -> Zone
      
      // Common cross-type fields
      'symbols': 'object',  // Title -> Object
      
      // Collective-specific fields (major update needed)
      'members': 'character',  // Collective -> Character
      'collective_characters': 'character',
      'collective_institutions': 'institution',
      'collective_collectives': 'collective',
      'collective_zones': 'zone',
      'resources': 'construct',  // Collective -> Construct
      'collective_locations': 'location',
      'affiliated_creatures': 'creature',
      'collective_objects': 'object',
      'collective_constructs': 'construct',
      'collective_abilities': 'ability',
      'collective_phenomena': 'phenomenon',
      'collective_languages': 'language',
      'collective_families': 'family',
      'collective_relations': 'relation',
      'collective_titles': 'title',
      'collective_events': 'event',
      'collective_narratives': 'narrative',
      'collective_traits': 'trait',
      'allied_collectives': 'collective',
      
      // Pin references
      'element_id': 'any',  // Pin -> Any element type (special case)
      'element_type': 'contenttype'  // Pin -> ContentType
    };
    
    // Set all mappings
    Object.entries(categoryMap).forEach(([field, category]) => {
      this.fieldCategoryMap.set(field, category);
    });
  }
  
  // Convert camelCase to snake_case
  private toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
  
  // Normalize field name for comparison
  private normalizeFieldName(fieldName: string): string {
    // Convert to lowercase
    let normalized = fieldName.toLowerCase();
    
    // Convert camelCase to snake_case if needed
    if (normalized !== fieldName) {
      // If it had uppercase letters, also check snake_case version
      const snakeVersion = this.toSnakeCase(fieldName);
      if (this.fieldCategoryMap.has(snakeVersion)) {
        return snakeVersion;
      }
    }
    
    // Remove _id or _ids suffix for base name
    if (normalized.endsWith('_ids')) {
      normalized = normalized.slice(0, -4);
    } else if (normalized.endsWith('_id')) {
      normalized = normalized.slice(0, -3);
    } else if (normalized.endsWith('ids') && normalized.length > 3) {
      // Handle camelCase like "speciesIds"
      normalized = normalized.slice(0, -3);
    } else if (normalized.endsWith('id') && normalized.length > 2) {
      // Handle camelCase like "locationId"
      normalized = normalized.slice(0, -2);
    }
    
    return normalized;
  }
  
  isSingleLinkField(fieldName: string): boolean {
    // Normalize the field name
    const normalized = this.normalizeFieldName(fieldName);
    
    // Check for exact _id suffix patterns
    const lowerField = fieldName.toLowerCase();
    if (lowerField.endsWith('_id') || 
        (lowerField.endsWith('id') && lowerField.length > 2 && !lowerField.endsWith('_id'))) {
      return true;
    }
    
    // Known single link fields without _id suffix
    const singleLinkFields = new Set([
      'location', 'birthplace', 'parent_location', 'zone',
      'rival', 'partner', 'primary_power', 'governing_title',
      'parent_object', 'custodian', 'founder', 'actor',
      'language', 'protagonist', 'antagonist', 'narrator',
      'author', 'issuer', 'operator', 'conservator',
      'parent_institution', 'parent_species', 'anti_trait',
      'parent_law', 'superior_title', 'parent_map', 'body',
      'element_id', 'element_type', 'map_id', 'marker_map', 'parent_narrative',
      'locus', 'source', 'tradition', 'map', 'system', 'classification'
    ]);
    
    return singleLinkFields.has(normalized);
  }
  
  isMultiLinkField(fieldName: string): boolean {
    // Normalize the field name
    const normalized = this.normalizeFieldName(fieldName);
    const lowerField = fieldName.toLowerCase();
    
    // Check for exact _ids suffix patterns
    if (lowerField.endsWith('_ids') || 
        (lowerField.endsWith('ids') && lowerField.length > 3 && !lowerField.endsWith('_ids'))) {
      return true;
    }
    
    // Known multi-link fields (most are plural, but not all plurals are multi-link)
    const multiLinkFields = new Set([
      'family',  // exception: singular but multi-link
      'friends', 'rivals', 'characters', 'species', 'traits',
      'abilities', 'languages', 'objects', 'families',
      'founders', 'populations', 'collectives', 'institutions',
      'secondary_powers', 'buildings', 'defensive_objects',
      'extraction_goods', 'industry_goods', 'extraction_markets',
      'industry_markets', 'delicacies', 'currencies', 'zones',
      'locations', 'constructs', 'building_methods', 'extraction_methods',
      'industry_methods', 'cults', 'fighters', 'effects', 'phenomena',
      'titles', 'relations', 'creatures', 'events', 'narratives',
      'materials', 'technology', 'consumes', 'affinities',
      // Family additional fields
      'ancestors', 'estates', 'governs', 'heirlooms',
      // Institution additional fields  
      'allies', 'adversaries',
      // Trait additional fields
      'empowered_abilities', 'interactions', 'carriers', 'populations',
      // Title/Law additional fields
      'holders', 'adjudicators', 'enforcers', 'symbols',
      // Law additional fields
      'laws', 'prohibitions', 'penalties', 'principles',
      // Event/Phenomenon triggers
      'triggers',
      // Ability additional fields
      'instruments', 'talents', 'requisites', 'systems',
      // Collective additional fields
      'equipment', 'symbolism',
      // Phenomenon additional fields
      'catalysts', 'empowerments', 'wielders', 'environments',
      // Language additional fields
      'dialects', 'spread',
      // Map additional fields
      'markers', 'pins', 'routes', 'boundaries',
      // Species additional fields
      'predators', 'prey', 'variants', 'reproduction', 'adaptations', 'nourishment',
      // Creature additional field
      'actions',
      // Zone additional field
      'linked_zones',
      // Collective additional fields
      'members', 'collective_characters', 'collective_institutions',
      'collective_collectives', 'collective_zones', 'resources',
      'collective_locations', 'affiliated_creatures', 'collective_objects',
      'collective_constructs', 'collective_abilities', 'collective_phenomena',
      'collective_languages', 'collective_families', 'collective_relations',
      'collective_titles', 'collective_events', 'collective_narratives',
      'collective_traits', 'allied_collectives'
    ]);
    
    // Check if it's a known multi-link field
    if (multiLinkFields.has(normalized)) {
      return true;
    }
    
    // Don't assume all plural fields are multi-link
    // (e.g., "status", "consensus" end in 's' but aren't link fields)
    return false;
  }
  
  getLinkedCategory(fieldName: string): string | undefined {
    // Normalize field name for lookup
    const normalized = this.normalizeFieldName(fieldName);
    
    // Try exact match first
    let category = this.fieldCategoryMap.get(normalized);
    
    // If not found, try snake_case version
    if (!category) {
      const snakeCase = this.toSnakeCase(normalized);
      category = this.fieldCategoryMap.get(snakeCase);
    }
    
    return category;
  }
}

// Export singleton instance
export const FieldRegistry = new FieldRegistryClass();