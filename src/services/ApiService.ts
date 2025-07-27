import type { Element, WorldMetadata } from '../types/world';

const API_BASE_URL = 'https://www.onlyworlds.com/api/worldapi';

// Element types that have their own endpoints
const ELEMENT_TYPES = [
  'character',
  'location', 
  'object',
  'trait',
  'ability',
  'institution',
  'event',
  'collective',
  'construct',
  'creature',
  'family',
  'language',
  'law',
  'narrative',
  'phenomenon'
];

export class ApiService {
  static async validateCredentials(worldKey: string, pin: string): Promise<boolean> {
    try {
      // Try to fetch from any endpoint to validate credentials
      const response = await fetch(`${API_BASE_URL}/character/`, {
        headers: { 
          'API-Key': worldKey,
          'API-Pin': pin,
          'Accept': 'application/json'
        }
      });
      return response.ok;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  }

  static async fetchWorldMetadata(worldKey: string, pin: string): Promise<WorldMetadata> {
    try {
      // Try to fetch world metadata from the world endpoint
      const response = await fetch(`${API_BASE_URL}/world/`, {
        headers: { 
          'API-Key': worldKey,
          'API-Pin': pin,
          'Accept': 'application/json'
        }
      });
      
      if (response.ok) {
        const worldData = await response.json();
        console.log('World API response:', worldData);
        
        // If it's an array, get the first world element
        const world = Array.isArray(worldData) ? worldData[0] : worldData;
        
        if (world) {
          return {
            id: world.id || worldKey,
            name: world.name || 'Unnamed World',
            description: world.description || '',
            created_at: world.created_at || new Date().toISOString(),
            updated_at: world.updated_at || new Date().toISOString()
          };
        }
      }
    } catch (error) {
      console.warn('Failed to fetch world metadata:', error);
    }
    
    // Fallback if world endpoint doesn't exist or fails
    return {
      id: worldKey,
      name: 'World',
      description: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  static async fetchAllElements(worldKey: string, pin: string): Promise<Element[]> {
    const allElements: Element[] = [];
    
    // Fetch elements from each endpoint
    for (const elementType of ELEMENT_TYPES) {
      try {
        const response = await fetch(`${API_BASE_URL}/${elementType}/`, {
          headers: { 
            'API-Key': worldKey,
            'API-Pin': pin,
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          const elements = await response.json();
          // Add category to each element based on the endpoint
          const categorizedElements = elements.map((el: any) => ({
            ...el,
            category: elementType
          }));
          allElements.push(...categorizedElements);
        }
        // Continue even if one endpoint fails
      } catch (error) {
        console.warn(`Failed to fetch ${elementType} elements:`, error);
      }
    }
    
    return allElements;
  }

  static async updateElement(worldKey: string, pin: string, element: Element): Promise<boolean> {
    try {
      const elementType = element.category || 'object';
      const response = await fetch(`${API_BASE_URL}/${elementType}/${element.id}/`, {
        method: 'PUT',
        headers: {
          'API-Key': worldKey,
          'API-Pin': pin,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(element)
      });
      return response.ok;
    } catch (error) {
      console.error('Update error:', error);
      return false;
    }
  }

  static async createElement(worldKey: string, pin: string, element: Element): Promise<Element> {
    try {
      const elementType = element.category || 'object';
      const response = await fetch(`${API_BASE_URL}/${elementType}/`, {
        method: 'POST',
        headers: {
          'API-Key': worldKey,
          'API-Pin': pin,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(element)
      });
      
      if (response.ok) {
        return await response.json();
      }
      
      const errorText = await response.text();
      throw new Error(`Failed to create element: ${response.status} ${errorText}`);
    } catch (error) {
      console.error('Create error:', error);
      throw error instanceof Error ? error : new Error('Failed to create element');
    }
  }

  static async deleteElement(worldKey: string, pin: string, elementId: string, elementType: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/${elementType}/${elementId}/`, {
        method: 'DELETE',
        headers: {
          'API-Key': worldKey,
          'API-Pin': pin,
          'Accept': 'application/json'
        }
      });
      return response.ok;
    } catch (error) {
      console.error('Delete error:', error);
      return false;
    }
  }
}

// Utility function to organize elements by category
export function organizeElementsByCategory(elements: Element[]): Map<string, Element[]> {
  const categories = new Map<string, Element[]>();
  
  elements.forEach(element => {
    const category = element.category || 'uncategorized';
    if (!categories.has(category)) {
      categories.set(category, []);
    }
    categories.get(category)!.push(element);
  });
  
  // Sort elements alphabetically within each category
  categories.forEach((elements, category) => {
    categories.set(category, elements.sort((a, b) => a.name.localeCompare(b.name)));
  });
  
  return categories;
}