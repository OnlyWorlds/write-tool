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

// Showcase API types
export interface ShowcasePublishRequest {
  element_type: string;
  element_id: string;
  element_data: Element;
  showcase_config?: {
    hidden_fields?: string[];
    view_mode?: string;
  };
}

export interface ShowcasePublishResponse {
  showcase_id: string;
  published_at: string;
  public_url: string;
}

export interface ShowcaseRetrieveResponse {
  element_data: Element;
  showcase_config: {
    hidden_fields?: string[];
    view_mode?: string;
  };
  metadata: {
    published_at: string;
    world_name: string;
    element_type: string;
    view_count: number;
  };
}

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
      const url = `${API_BASE_URL}/${elementType}/${element.id}/`;
      console.log('Updating element:', { url, elementType, id: element.id });
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'API-Key': worldKey,
          'API-Pin': pin,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(element)
      });
      
      if (!response.ok) {
        console.error('Update failed:', response.status, response.statusText);
        const text = await response.text();
        console.error('Response body:', text);
      }
      
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

  // Showcase API methods
  static async publishShowcase(
    worldKey: string, 
    pin: string, 
    request: ShowcasePublishRequest
  ): Promise<ShowcasePublishResponse | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/showcase/publish/`, {
        method: 'POST',
        headers: {
          'API-Key': worldKey,
          'API-Pin': pin,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        let errorData = null;
        let errorText = '';
        try {
          errorText = await response.text();
          errorData = JSON.parse(errorText);
        } catch (e) {
          console.error('Failed to parse error response:', errorText);
        }
        console.error('Publish showcase error:', response.status, errorData || errorText);
        console.error('Request was:', request);
        throw new Error(errorData?.detail || errorData?.error || errorText || `Failed to publish: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Showcase publish error:', error);
      throw error;
    }
  }

  static async retrieveShowcase(showcaseId: string): Promise<ShowcaseRetrieveResponse | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/showcase/${showcaseId}/`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Showcase not found');
        } else if (response.status === 410) {
          throw new Error('Showcase has expired');
        }
        throw new Error(`Failed to retrieve showcase: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Showcase retrieve error:', error);
      throw error;
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