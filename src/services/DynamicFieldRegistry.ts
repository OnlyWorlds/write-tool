// Dynamic field registry that adapts to schema changes
// Instead of hardcoding, this uses pattern matching and intelligent guessing

export class DynamicFieldRegistry {
  // Pattern-based detection instead of hardcoded lists
  private patterns = {
    singleLink: [
      /^parent_?/i,        // parent_location, parent_narrative, etc
      /^birthplace$/i,
      /^location$/i,
      /^zone$/i,
      /^rival$/i,
      /^partner$/i,
      /^protagonist$/i,
      /^antagonist$/i,
      /^narrator$/i,
      /^conservator$/i,
      /^custodian$/i,
      /^operator$/i,
      /^author$/i,
      /^issuer$/i,
      /^creator$/i,
      /^owner$/i,
      /^leader$/i,
      /^actor$/i,
      /^primary_?power$/i,
      /^governing_?title$/i,
      /^superior_?title$/i,
      /^anti_?trait$/i,
    ],
    multiLink: [
      /s$/,               // Plurals usually indicate multi-link
      /_ids?$/i,          // Explicit ID fields
      /^friends$/i,
      /^family$/i,
      /^abilities$/i,
      /^traits$/i,
      /^languages$/i,
    ]
  };

  // Intelligent category guessing based on field name
  private guessCategory(fieldName: string): string | undefined {
    const normalized = fieldName.toLowerCase()
      .replace(/_ids?$/, '')
      .replace(/ids?$/, '')
      .replace(/s$/, ''); // Remove plural
    
    // Direct matches first
    const directMatches: Record<string, string> = {
      'character': 'character',
      'location': 'location',
      'event': 'event',
      'zone': 'zone',
      'ability': 'ability',
      'trait': 'trait',
      'language': 'language',
      'species': 'species',
      'family': 'family',
      'object': 'object',
      'construct': 'construct',
      'institution': 'institution',
      'collective': 'collective',
      'creature': 'creature',
      'phenomenon': 'phenomenon',
      'narrative': 'narrative',
      'relation': 'relation',
      'title': 'title',
      'law': 'law',
      'map': 'map',
      'marker': 'marker',
      'pin': 'pin',
    };
    
    if (directMatches[normalized]) {
      return directMatches[normalized];
    }
    
    // Pattern-based guessing
    if (normalized.includes('character') || 
        ['protagonist', 'antagonist', 'narrator', 'conservator', 'author', 
         'creator', 'owner', 'leader', 'actor', 'custodian', 'operator',
         'issuer', 'founder', 'fighter', 'inhabitant', 'friend', 'rival',
         'partner'].includes(normalized)) {
      return 'character';
    }
    
    if (normalized.includes('location') || 
        ['birthplace', 'place', 'market'].includes(normalized)) {
      return 'location';
    }
    
    if (normalized.includes('building') || normalized.includes('construct')) {
      return 'construct';
    }
    
    if (normalized.includes('institution') || 
        ['cult', 'secondary_power'].includes(normalized)) {
      return 'institution';
    }
    
    if (normalized.includes('collective') || 
        ['population'].includes(normalized)) {
      return 'collective';
    }
    
    if (normalized.includes('object') || 
        ['material', 'technology', 'effect', 'consume', 'good', 
         'delicacy', 'currency', 'defensive_object'].includes(normalized)) {
      return 'object';
    }
    
    if (normalized.includes('method')) {
      return 'phenomenon';
    }
    
    if (normalized.includes('title')) {
      return 'title';
    }
    
    // If we can't guess, return undefined
    return undefined;
  }

  // Check if a field is a single link field
  isSingleLink(fieldName: string, value: any): boolean {
    // Check value first - most reliable
    if (typeof value === 'string' && this.looksLikeId(value)) {
      return true;
    }
    
    // Check patterns
    return this.patterns.singleLink.some(pattern => pattern.test(fieldName));
  }

  // Check if a field is a multi link field
  isMultiLink(fieldName: string, value: any): boolean {
    // Check value first - most reliable
    if (Array.isArray(value)) {
      // Empty array or array of IDs
      return value.length === 0 || value.every(v => 
        typeof v === 'string' && this.looksLikeId(v)
      );
    }
    
    // Check patterns
    return this.patterns.multiLink.some(pattern => pattern.test(fieldName));
  }

  // Get the linked category for a field
  getLinkedCategory(fieldName: string): string | undefined {
    return this.guessCategory(fieldName);
  }

  // Check if a value looks like an ID
  private looksLikeId(value: string): boolean {
    // UUIDs or similar ID patterns
    return /^[a-f0-9-]{20,}$/i.test(value) || 
           /^[0-9a-z]{20,}$/i.test(value);
  }

  // Analyze a field to determine its type
  analyzeField(fieldName: string, value: any): {
    type: 'single_link' | 'multi_link' | 'other';
    linkedCategory?: string;
  } {
    if (this.isSingleLink(fieldName, value)) {
      return {
        type: 'single_link',
        linkedCategory: this.getLinkedCategory(fieldName)
      };
    }
    
    if (this.isMultiLink(fieldName, value)) {
      return {
        type: 'multi_link',
        linkedCategory: this.getLinkedCategory(fieldName)
      };
    }
    
    return { type: 'other' };
  }
}

// Export singleton instance
export const dynamicFieldRegistry = new DynamicFieldRegistry();