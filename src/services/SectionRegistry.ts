// Section Registry for OnlyWorlds element types
// This provides section organization for fields until the MCP server provides this data

export interface FieldSection {
  name: string;
  fields: string[];
  order: number;
}

// Section data fetched from OnlyWorlds MCP server
// Last updated: 2025-08-20
const SECTION_DATA: Record<string, FieldSection[]> = {
  character: [
    {
      name: "Constitution",
      fields: ["physicality", "mentality", "height", "weight", "species", "traits", "abilities"],
      order: 1
    },
    {
      name: "Origins",
      fields: ["background", "motivations", "birth_date", "birthplace", "languages"],
      order: 2
    },
    {
      name: "World",
      fields: ["reputation", "location", "objects", "institutions"],
      order: 3
    },
    {
      name: "Personality",
      fields: ["charisma", "coercion", "competence", "compassion", "creativity", "courage"],
      order: 4
    },
    {
      name: "Social",
      fields: ["family", "friends", "rivals"],
      order: 5
    },
    {
      name: "Ttrpg",
      fields: ["level", "hit_points", "STR", "DEX", "CON", "INT", "WIS", "CHA"],
      order: 6
    }
  ],
  
  location: [
    {
      name: "Setting",
      fields: ["form", "function", "founding_date", "parent_location", "populations"],
      order: 1
    },
    {
      name: "Politics",
      fields: ["political_climate", "primary_power", "governing_title", "secondary_powers", "zone", "rival", "partner"],
      order: 2
    },
    {
      name: "World",
      fields: ["customs", "founders", "cults", "delicacies"],
      order: 3
    },
    {
      name: "Production",
      fields: ["extraction_methods", "extraction_goods", "industry_methods", "industry_goods"],
      order: 4
    },
    {
      name: "Commerce",
      fields: ["infrastructure", "extraction_markets", "industry_markets", "currencies"],
      order: 5
    },
    {
      name: "Construction",
      fields: ["architecture", "buildings", "building_methods"],
      order: 6
    },
    {
      name: "Defense",
      fields: ["defensibility", "elevation", "fighters", "defensive_objects"],
      order: 7
    }
  ],
  
  construct: [
    {
      name: "Nature",
      fields: ["rationale", "history", "status", "reach", "start_date", "end_date", "founder", "custodian"],
      order: 1
    },
    {
      name: "Involves",
      fields: ["characters", "objects", "locations", "species", "creatures", "institutions", "traits", "collectives", "zones", "abilities", "phenomena", "languages", "families", "relations", "titles", "constructs", "events", "narratives"],
      order: 2
    }
  ],
  
  event: [
    {
      name: "Nature",
      fields: ["history", "challenges", "consequences", "start_date", "end_date", "triggers"],
      order: 1
    },
    {
      name: "Involves",
      fields: ["characters", "objects", "locations", "species", "creatures", "institutions", "traits", "collectives", "zones", "abilities", "phenomena", "languages", "families", "relations", "titles", "constructs"],
      order: 2
    }
  ],
  
  zone: [
    {
      name: "Scope",
      fields: ["role", "start_date", "end_date", "phenomena", "linked_zones"],
      order: 1
    },
    {
      name: "World",
      fields: ["context", "populations", "titles", "principles"],
      order: 2
    }
  ],
  
  phenomenon: [
    {
      name: "Mechanics",
      fields: ["expression", "effects", "duration", "catalysts", "empowerments"],
      order: 1
    },
    {
      name: "World",
      fields: ["mythology", "system", "triggers", "wielders", "environments"],
      order: 2
    }
  ],
  
  object: [
    {
      name: "Form",
      fields: ["aesthetics", "weight", "amount", "parent_object", "materials", "technology"],
      order: 1
    },
    {
      name: "Function",
      fields: ["utility", "effects", "abilities", "consumes"],
      order: 2
    },
    {
      name: "World",
      fields: ["origins", "location", "language", "affinities"],
      order: 3
    }
  ],
  
  institution: [
    {
      name: "Foundation",
      fields: ["doctrine", "founding_date", "parent_institution"],
      order: 1
    },
    {
      name: "Claims",
      fields: ["zones", "objects", "creatures"],
      order: 2
    },
    {
      name: "World",
      fields: ["status", "allies", "adversaries", "constructs"],
      order: 3
    }
  ],
  
  species: [
    {
      name: "Biology",
      fields: ["appearance", "life_span", "weight", "nourishment", "reproduction", "adaptations"],
      order: 1
    },
    {
      name: "Psychology",
      fields: ["instincts", "sociality", "temperament", "communication", "aggression", "traits"],
      order: 2
    },
    {
      name: "World",
      fields: ["role", "parent_species", "locations", "zones", "affinities"],
      order: 3
    }
  ],
  
  ability: [
    {
      name: "Mechanics",
      fields: ["activation", "duration", "potency", "range", "effects", "challenges", "talents", "requisites"],
      order: 1
    },
    {
      name: "World",
      fields: ["prevalence", "tradition", "source", "locus", "instruments", "systems"],
      order: 2
    }
  ],
  
  trait: [
    {
      name: "Qualitative",
      fields: ["social_effects", "physical_effects", "functional_effects", "personality_effects", "behaviour_effects"],
      order: 1
    },
    {
      name: "Quantitative",
      fields: ["charisma", "coercion", "competence", "compassion", "creativity", "courage"],
      order: 2
    },
    {
      name: "World",
      fields: ["significance", "anti_trait", "empowered_abilities"],
      order: 3
    }
  ],
  
  family: [
    {
      name: "Identity",
      fields: ["spirit", "history", "traditions", "traits", "abilities", "languages", "ancestors"],
      order: 1
    },
    {
      name: "World",
      fields: ["reputation", "estates", "governs", "heirlooms", "creatures"],
      order: 2
    }
  ],
  
  collective: [
    {
      name: "Formation",
      fields: ["composition", "count", "formation_date", "operator", "equipment"],
      order: 1
    },
    {
      name: "Dynamics",
      fields: ["activity", "disposition", "state", "abilities", "symbolism"],
      order: 2
    },
    {
      name: "World",
      fields: ["species", "characters", "creatures", "phenomena"],
      order: 3
    }
  ],
  
  creature: [
    {
      name: "Biology",
      fields: ["appearance", "weight", "height", "species"],
      order: 1
    },
    {
      name: "Behaviour",
      fields: ["habits", "demeanor", "traits", "abilities", "languages"],
      order: 2
    },
    {
      name: "World",
      fields: ["status", "birth_date", "location", "zone"],
      order: 3
    },
    {
      name: "Ttrpg",
      fields: ["challenge_rating", "hit_points", "armor_class", "speed", "actions"],
      order: 4
    }
  ],
  
  language: [
    {
      name: "Structure",
      fields: ["phonology", "grammar", "lexicon", "writing", "classification"],
      order: 1
    },
    {
      name: "World",
      fields: ["status", "spread", "dialects"],
      order: 2
    }
  ],
  
  title: [
    {
      name: "Mandate",
      fields: ["authority", "eligibility", "grant_date", "revoke_date", "issuer", "body", "superior_title", "holders", "symbols"],
      order: 1
    },
    {
      name: "World",
      fields: ["status", "history", "characters", "institutions", "families", "zones", "locations", "objects", "constructs", "laws", "collectives", "creatures", "phenomena", "species", "languages"],
      order: 2
    }
  ],
  
  law: [
    {
      name: "Code",
      fields: ["declaration", "purpose", "date", "parent_law", "penalties"],
      order: 1
    },
    {
      name: "World",
      fields: ["author", "locations", "zones", "prohibitions", "adjudicators", "enforcers"],
      order: 2
    }
  ],
  
  relation: [
    {
      name: "Nature",
      fields: ["background", "start_date", "end_date", "intensity", "actor", "events"],
      order: 1
    },
    {
      name: "Involves",
      fields: ["characters", "objects", "locations", "species", "creatures", "institutions", "traits", "collectives", "zones", "abilities", "phenomena", "languages", "families", "titles", "constructs", "events", "narratives"],
      order: 2
    }
  ],
  
  narrative: [
    {
      name: "Context",
      fields: ["story", "consequences", "start_date", "end_date", "order", "parent_narrative", "protagonist", "antagonist", "narrator", "conservator"],
      order: 1
    },
    {
      name: "Involves",
      fields: ["events", "characters", "objects", "locations", "species", "creatures", "institutions", "traits", "collectives", "zones", "abilities", "phenomena", "languages", "families", "relations", "titles", "constructs", "laws"],
      order: 2
    }
  ],
  
  map: [
    {
      name: "Details",
      fields: ["background_color", "hierarchy", "width", "height", "depth", "parent_map", "location"],
      order: 1
    }
  ],
  
  marker: [
    {
      name: "Details",
      fields: ["map", "zone", "x", "y", "z"],
      order: 1
    }
  ],
  
  pin: [
    {
      name: "Details",
      fields: ["map", "element_type", "element_id", "element", "x", "y", "z"],
      order: 1
    }
  ]
};

export class SectionRegistryClass {
  private sectionCache = new Map<string, FieldSection[]>();
  
  getSections(elementType: string): FieldSection[] | null {
    // Check cache first
    if (this.sectionCache.has(elementType)) {
      return this.sectionCache.get(elementType)!;
    }
    
    // Get from static data (will be replaced with MCP call)
    const sections = SECTION_DATA[elementType.toLowerCase()] || null;
    
    if (sections) {
      this.sectionCache.set(elementType, sections);
    }
    
    return sections;
  }
  
  // Future method when MCP server provides sections
  async fetchSectionsFromMCP(elementType: string): Promise<FieldSection[] | null> {
    // TODO: Implement when MCP server provides this endpoint
    // try {
    //   const response = await mcp__onlyworlds__get_element_sections(elementType);
    //   return response.sections;
    // } catch (error) {
    //   console.error('Failed to fetch sections from MCP:', error);
    //   return this.getSections(elementType); // Fallback to static data
    // }
    return this.getSections(elementType);
  }
}

export const SectionRegistry = new SectionRegistryClass();