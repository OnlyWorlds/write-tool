import { useState, useEffect } from 'react';

interface FieldSection {
  name: string;
  fields: string[];
  order: number;
}

interface ElementSchema {
  sections?: FieldSection[];
  sections_available?: boolean;
}

const sectionCache = new Map<string, FieldSection[]>();

// Mock section data based on OnlyWorlds schema
const mockSections: Record<string, FieldSection[]> = {
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
  ]
};

export function useElementSections(elementType: string | undefined) {
  const [sections, setSections] = useState<FieldSection[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!elementType) {
      setSections(null);
      return;
    }

    const normalizedType = elementType.toLowerCase();
    
    // Check cache first
    if (sectionCache.has(normalizedType)) {
      setSections(sectionCache.get(normalizedType)!);
      return;
    }

    // Fetch from MCP
    const fetchSections = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Simulate async fetch with mock data
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // TODO: Replace with actual MCP call when integrated
        // const response = await mcpClient.readResource('onlyworlds', `schema/element/${normalizedType}`);
        // const schema: ElementSchema = JSON.parse(response.text);
        
        const sections = mockSections[normalizedType] || null;
        
        if (sections) {
          sectionCache.set(normalizedType, sections);
          setSections(sections);
        } else {
          setSections(null);
        }
      } catch (err) {
        console.error('Failed to fetch element sections:', err);
        setError('Failed to load sections');
        setSections(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSections();
  }, [elementType]);

  return { sections, loading, error };
}