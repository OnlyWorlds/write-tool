import { useState, useEffect } from 'react';
import { SectionRegistry, type FieldSection } from '../services/SectionRegistry';

interface ElementSchema {
  sections?: FieldSection[];
  sections_available?: boolean;
}

const sectionCache = new Map<string, FieldSection[]>();

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
        
        // Use SectionRegistry instead of local mock data
        const sections = await SectionRegistry.fetchSectionsFromMCP(normalizedType);
        
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