import type { Element, WorldMetadata } from '../types/world';

const API_BASE_URL = 'https://www.onlyworlds.com/api';

export class ApiService {
  static async validateCredentials(worldKey: string, pin: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ worldKey, pin })
      });
      return response.ok;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  }

  static async fetchWorldMetadata(worldKey: string, pin: string): Promise<WorldMetadata> {
    const response = await fetch(`${API_BASE_URL}/world/${worldKey}`, {
      headers: { 'Authorization': `Pin ${pin}` }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch world metadata: ${response.statusText}`);
    }
    
    return await response.json();
  }

  static async fetchAllElements(worldKey: string, pin: string): Promise<Element[]> {
    const response = await fetch(`${API_BASE_URL}/world/${worldKey}/elements`, {
      headers: { 'Authorization': `Pin ${pin}` }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch elements: ${response.statusText}`);
    }
    
    return await response.json();
  }

  static async updateElement(worldKey: string, pin: string, element: Element): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/world/${worldKey}/element/${element.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Pin ${pin}`
        },
        body: JSON.stringify(element)
      });
      return response.ok;
    } catch (error) {
      console.error('Update error:', error);
      return false;
    }
  }

  static async createElement(worldKey: string, pin: string, element: Element): Promise<Element | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/world/${worldKey}/element`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Pin ${pin}`
        },
        body: JSON.stringify(element)
      });
      
      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Create error:', error);
      return null;
    }
  }

  static async deleteElement(worldKey: string, pin: string, elementId: string): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/world/${worldKey}/element/${elementId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Pin ${pin}`
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