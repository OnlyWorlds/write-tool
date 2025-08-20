// Section Registry for OnlyWorlds element types
// This provides section organization for fields until the MCP server provides this data

export interface FieldSection {
  name: string;
  fields: string[];
  order: number;
}

// TODO: Replace this with MCP server data when available
// This could be fetched from: mcp__onlyworlds__get_element_sections(element_type)
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
      name: "Basics",
      fields: ["history", "rationale", "status", "reach", "founder", "custodian"],
      order: 1
    },
    {
      name: "Timeline",
      fields: ["start_date", "end_date"],
      order: 2
    },
    {
      name: "Inhabitants",
      fields: ["characters", "species", "creatures", "families", "collectives"],
      order: 3
    },
    {
      name: "Components",
      fields: ["objects", "constructs", "abilities", "traits", "phenomena"],
      order: 4
    },
    {
      name: "Context",
      fields: ["locations", "zones", "institutions", "events", "narratives", "titles", "languages", "relations"],
      order: 5
    }
  ],
  
  event: [
    {
      name: "Timeline",
      fields: ["start_date", "end_date", "actor"],
      order: 1
    },
    {
      name: "Details",
      fields: ["narration", "results", "affinities"],
      order: 2
    },
    {
      name: "Participants",
      fields: ["characters", "collectives", "creatures", "families", "species"],
      order: 3
    },
    {
      name: "Context",
      fields: ["locations", "zones", "institutions", "objects", "constructs", "phenomena", "abilities", "traits", "titles", "languages", "events", "narratives", "relations"],
      order: 4
    }
  ],
  
  zone: [
    {
      name: "Basics",
      fields: ["borders", "function", "populations"],
      order: 1
    },
    {
      name: "Inhabitants",
      fields: ["characters", "species", "creatures", "families", "collectives"],
      order: 2
    },
    {
      name: "Components",
      fields: ["locations", "zones", "institutions", "objects", "constructs", "phenomena", "abilities", "traits", "titles", "languages", "events", "narratives", "relations"],
      order: 3
    }
  ],
  
  phenomenon: [
    {
      name: "Properties",
      fields: ["mechanics", "affinities", "scale", "materials", "consumes", "effects"],
      order: 1
    },
    {
      name: "Involved",
      fields: ["characters", "species", "creatures", "families", "collectives"],
      order: 2
    },
    {
      name: "Context",
      fields: ["locations", "zones", "institutions", "objects", "constructs", "phenomena", "abilities", "traits", "titles", "languages", "events", "narratives", "relations"],
      order: 3
    }
  ],
  
  // Add more element types as needed
  object: [
    {
      name: "Properties",
      fields: ["aesthetics", "utility", "technology", "materials", "parent_object"],
      order: 1
    },
    {
      name: "Context",
      fields: ["owner", "creator", "location", "effects", "consumes"],
      order: 2
    }
  ],
  
  institution: [
    {
      name: "Structure",
      fields: ["origins", "operations", "reach", "parent_institution"],
      order: 1
    },
    {
      name: "Leadership",
      fields: ["leader", "founder", "governing_title"],
      order: 2
    },
    {
      name: "Members",
      fields: ["characters", "titles", "species", "families"],
      order: 3
    }
  ],
  
  species: [
    {
      name: "Biology",
      fields: ["physicality", "mentality", "parent_species", "affinities"],
      order: 1
    },
    {
      name: "Society",
      fields: ["customs", "languages", "locations", "institutions"],
      order: 2
    }
  ],
  
  ability: [
    {
      name: "Mechanics",
      fields: ["mechanics", "effects", "affinities", "materials", "consumes"],
      order: 1
    },
    {
      name: "Context",
      fields: ["characters", "species", "creatures", "objects"],
      order: 2
    }
  ],
  
  trait: [
    {
      name: "Details",
      fields: ["positive", "negative", "anti_trait"],
      order: 1
    },
    {
      name: "Bearers",
      fields: ["characters", "species", "creatures", "families"],
      order: 2
    }
  ],
  
  family: [
    {
      name: "Members",
      fields: ["characters", "species"],
      order: 1
    },
    {
      name: "Context",
      fields: ["locations", "titles", "objects", "institutions"],
      order: 2
    }
  ],
  
  collective: [
    {
      name: "Members",
      fields: ["characters", "species", "creatures", "families"],
      order: 1
    },
    {
      name: "Context",
      fields: ["locations", "zones", "institutions", "events"],
      order: 2
    }
  ],
  
  creature: [
    {
      name: "Biology",
      fields: ["physicality", "mentality", "species", "traits", "abilities"],
      order: 1
    },
    {
      name: "Context",
      fields: ["location", "family", "events"],
      order: 2
    }
  ],
  
  language: [
    {
      name: "Details",
      fields: ["script", "speakers"],
      order: 1
    }
  ],
  
  title: [
    {
      name: "Hierarchy",
      fields: ["superior_title", "subordinate_titles"],
      order: 1
    },
    {
      name: "Holders",
      fields: ["characters", "families", "institutions"],
      order: 2
    }
  ],
  
  law: [
    {
      name: "Details",
      fields: ["parent_law", "issuer", "enforcer"],
      order: 1
    },
    {
      name: "Scope",
      fields: ["locations", "institutions", "characters"],
      order: 2
    }
  ],
  
  relation: [
    {
      name: "Participants",
      fields: ["characters", "families", "institutions", "species"],
      order: 1
    }
  ],
  
  narrative: [
    {
      name: "Content",
      fields: ["content", "narrator", "parent_narrative"],
      order: 1
    },
    {
      name: "Elements",
      fields: ["characters", "locations", "events", "objects"],
      order: 2
    }
  ],
  
  map: [
    {
      name: "Content",
      fields: ["parent_map", "locations", "zones", "pins", "markers"],
      order: 1
    }
  ],
  
  marker: [
    {
      name: "Position",
      fields: ["map", "location", "coordinates"],
      order: 1
    }
  ],
  
  pin: [
    {
      name: "Position",
      fields: ["map", "location", "coordinates"],
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