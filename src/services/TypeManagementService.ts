// Service for managing available supertypes and subtypes for categories

export interface TypeHierarchy {
  supertypes: Record<string, string[]>;
}

// Cache for API data to avoid frequent requests
const apiCache: Record<string, { data: TypeHierarchy; timestamp: number }> = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// API response format matches our needs
interface ApiTypingResponse {
  supertypes: Record<string, string[]>;
}

export class TypeManagementService {
  /**
   * Fetch typing data from the API
   */
  private static async fetchTypingData(category: string): Promise<TypeHierarchy | null> {
    // Check cache first
    const cached = apiCache[category.toLowerCase()];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data;
    }

    try {
      // Format category name to be capitalized (API requirement)
      const formattedCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
      const response = await fetch(`https://www.onlyworlds.com/api/worldapi/typing/${formattedCategory}/`);
      
      if (!response.ok) {
        console.warn(`Failed to fetch typing data for ${formattedCategory}: ${response.status}`);
        return null;
      }

      const data: ApiTypingResponse = await response.json();
      
      // Cache the data
      apiCache[category.toLowerCase()] = {
        data: { supertypes: data.supertypes || {} },
        timestamp: Date.now()
      };

      return { supertypes: data.supertypes || {} };
    } catch (error) {
      console.error(`Error fetching typing data for ${category}:`, error);
      return null;
    }
  }

  /**
   * Get available supertypes for a category (async version)
   */
  static async getSupertypesAsync(category: string): Promise<string[]> {
    const hierarchy = await this.fetchTypingData(category);
    if (!hierarchy) return [];
    
    return Object.keys(hierarchy.supertypes);
  }
  
  /**
   * Get available supertypes for a category (sync version - returns cached data only)
   */
  static getSupertypes(category: string): string[] {
    const cached = apiCache[category.toLowerCase()];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return Object.keys(cached.data.supertypes);
    }
    return [];
  }
  
  /**
   * Get available subtypes for a given supertype in a category (async version)
   */
  static async getSubtypesAsync(category: string, supertype: string | null | undefined): Promise<string[]> {
    if (!supertype) return [];
    
    const hierarchy = await this.fetchTypingData(category);
    if (!hierarchy) return [];
    
    return hierarchy.supertypes[supertype] || [];
  }
  
  /**
   * Get available subtypes for a given supertype in a category (sync version - returns cached data only)
   */
  static getSubtypes(category: string, supertype: string | null | undefined): string[] {
    if (!supertype) return [];
    
    const cached = apiCache[category.toLowerCase()];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.data.supertypes[supertype] || [];
    }
    return [];
  }
  
  /**
   * Check if a category has type support
   */
  static async hasTypeSupportAsync(category: string): Promise<boolean> {
    const hierarchy = await this.fetchTypingData(category);
    return hierarchy ? Object.keys(hierarchy.supertypes).length > 0 : false;
  }
  
  /**
   * Check if a category has type support (sync version)
   */
  static hasTypeSupport(category: string): boolean {
    const cached = apiCache[category.toLowerCase()];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return Object.keys(cached.data.supertypes).length > 0;
    }
    return false;
  }
  
  /**
   * Get all subtypes across all supertypes for a category
   */
  static async getAllSubtypesAsync(category: string): Promise<string[]> {
    const hierarchy = await this.fetchTypingData(category);
    if (!hierarchy) return [];
    
    const allSubtypes = new Set<string>();
    Object.values(hierarchy.supertypes).forEach(subtypes => {
      if (Array.isArray(subtypes)) {
        subtypes.forEach(subtype => allSubtypes.add(subtype));
      }
    });
    
    return Array.from(allSubtypes);
  }
  
  /**
   * Get all subtypes across all supertypes for a category (sync version)
   */
  static getAllSubtypes(category: string): string[] {
    const cached = apiCache[category.toLowerCase()];
    if (!cached || Date.now() - cached.timestamp >= CACHE_DURATION) {
      return [];
    }
    
    const allSubtypes = new Set<string>();
    Object.values(cached.data.supertypes).forEach(subtypes => {
      if (Array.isArray(subtypes)) {
        subtypes.forEach(subtype => allSubtypes.add(subtype));
      }
    });
    
    return Array.from(allSubtypes);
  }
  
  /**
   * Preload typing data for a category
   */
  static async preloadTypingData(category: string): Promise<void> {
    await this.fetchTypingData(category);
  }
}