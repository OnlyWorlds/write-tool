import type { Element, WorldMetadata } from '../types/world';
import { analyzeOnlyWorldsField } from './OnlyWorldsFieldTypes';

const API_BASE_URL = 'https://www.onlyworlds.com/api/worldapi';

// Element types that have their own endpoints
// Based on the complete list from src/constants/categories.ts
// TODO: Consider fetching available categories dynamically from API if such endpoint exists
const ELEMENT_TYPES = [
  'character',
  'object',
  'location',
  'family',
  'creature',
  'institution',
  'trait',
  'species',
  'zone',
  'ability',
  'collective',
  'title',
  'language',
  'phenomenon',
  'law',
  'relation',
  'event',
  'construct',
  'marker',
  'pin',
  'narrative',
  'map',
  'world'
];

// Helper function to extract ID from URL
function extractIdFromUrl(url: string): string {
  const match = url.match(/\/([a-f0-9-]+)\/?$/);
  return match ? match[1] : url;
}

// Transform link fields from API format (objects with URLs or full element objects) to simple IDs
function transformElementFromApi(element: any): any {
  const transformed = { ...element };
  
  // Process each field
  for (const [key, value] of Object.entries(element)) {
    // Skip null/undefined values
    if (value === null || value === undefined) {
      continue;
    }
    
    // Handle single link fields (objects with url property OR full element objects with id)
    // Make sure it's a plain object, not a Date, Array, etc.
    if (value && 
        typeof value === 'object' && 
        !Array.isArray(value) && 
        !(value instanceof Date) &&
        value.constructor === Object) {
      
      // Check if it's a URL object
      if ('url' in value && typeof value.url === 'string') {
        transformed[key] = extractIdFromUrl(value.url);
      }
      // Check if it's a full element object (has id, name, etc.)
      else if ('id' in value && typeof value.id === 'string') {
        // This is a nested element object, just extract the ID
        transformed[key] = value.id;
      }
    }
    // Handle multi-link fields (arrays of objects)
    else if (Array.isArray(value)) {
      transformed[key] = value.map(item => {
        if (item && 
            typeof item === 'object' && 
            !Array.isArray(item) &&
            !(item instanceof Date) &&
            item.constructor === Object) {
          
          // Check if it's a URL object
          if ('url' in item && typeof item.url === 'string') {
            return extractIdFromUrl(item.url);
          }
          // Check if it's a full element object
          else if ('id' in item && typeof item.id === 'string') {
            return item.id;
          }
        }
        return item;
      });
    }
  }
  
  return transformed;
}

// Transform link fields to API format with proper field naming
function transformElementForApi(element: any, allElements?: Map<string, Element>): any {
  const transformed = { ...element };
  
  // Process fields to ensure proper format for API
  for (const [key, value] of Object.entries(element)) {
    // Skip null/undefined values
    if (value == null) continue;
    
    // Analyze field to determine if it's a link
    const fieldInfo = analyzeOnlyWorldsField(key, value, element.category);
    
    // Handle single link fields
    if (fieldInfo.type === 'single_link' && typeof value === 'string' && value) {
      // For single link fields, keep the field name as-is
      // The API will handle the field naming convention
      transformed[key] = value;
    }
    // Handle multi-link fields
    else if (fieldInfo.type === 'multi_link' && Array.isArray(value)) {
      // For multi-link fields, the API expects the field name WITHOUT _ids suffix
      // Only filter to ensure we have valid string IDs
      transformed[key] = value.filter(id => typeof id === 'string' && id);
    }
  }
  
  return transformed;
}

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
  shareable_url: string;
}

export interface LinkedElement {
  name: string;
  category: string;
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
  linked_elements?: Record<string, LinkedElement>;
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
    console.time('fetchAllElements');
    
    // Create all fetch promises in parallel
    const fetchPromises = ELEMENT_TYPES.map(async (elementType) => {
      try {
        const response = await fetch(`${API_BASE_URL}/${elementType}/`, {
          headers: { 
            'API-Key': worldKey,
            'API-Pin': pin,
            'Accept': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          // Handle both paginated and non-paginated responses
          const elements = Array.isArray(data) ? data : (data.results || []);
          // Add category to each element based on the endpoint
          return elements.map((el: any) => {
            const transformed = transformElementFromApi(el);
            // Log if we see any object values that might display as [object Object]
            for (const [key, value] of Object.entries(transformed)) {
              if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
                console.warn(`Found object value in field ${key} after transformation:`, value, 'in element:', el.name || el.id);
              }
            }
            return {
              ...transformed,
              category: elementType
            };
          });
        }
        return [];
      } catch (error) {
        console.warn(`Failed to fetch ${elementType} elements:`, error);
        return [];
      }
    });
    
    // Wait for all fetches to complete
    const results = await Promise.all(fetchPromises);
    
    // Flatten the results
    const allElements = results.flat();
    
    console.timeEnd('fetchAllElements');
    console.log(`Fetched ${allElements.length} elements across ${ELEMENT_TYPES.length} categories`);
    
    return allElements;
  }

  static async updateElement(worldKey: string, pin: string, element: Element, allElements?: Map<string, Element>): Promise<Element | null> {
    try {
      const elementType = element.category || 'object';
      const url = `${API_BASE_URL}/${elementType}/${element.id}/`;
      
      // Transform the element for API
      const transformedElement = transformElementForApi(element, allElements);
      
      console.log('Updating element:', { url, elementType, id: element.id });
      console.log('Original element:', element);
      console.log('Transformed for API:', transformedElement);
      
      const requestBody = JSON.stringify(transformedElement);
      console.log('Request body being sent:', requestBody);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'API-Key': worldKey,
          'API-Pin': pin,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: requestBody
      });
      
      if (!response.ok) {
        console.error('Update failed:', response.status, response.statusText);
        const text = await response.text();
        console.error('Response body:', text);
        return null;
      }
      
      // Return the updated element from the API, properly transformed
      const updatedElement = await response.json();
      console.log('API response:', updatedElement);
      const transformed = transformElementFromApi(updatedElement);
      console.log('Transformed response:', transformed);
      return transformed;
    } catch (error) {
      console.error('Update error:', error);
      return null;
    }
  }

  static async createElement(worldKey: string, pin: string, element: Element, allElements?: Map<string, Element>): Promise<Element> {
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
        body: JSON.stringify(transformElementForApi(element, allElements))
      });
      
      if (response.ok) {
        const createdElement = await response.json();
        // Transform the API response to our internal format
        return transformElementFromApi(createdElement);
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