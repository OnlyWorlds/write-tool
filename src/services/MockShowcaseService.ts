// Temporary mock service for showcase functionality until API is deployed
import type { ShowcasePublishRequest, ShowcasePublishResponse, ShowcaseRetrieveResponse } from './ApiService';

// In-memory storage for mock showcases
const mockShowcases = new Map<string, any>();

export class MockShowcaseService {
  static async publishShowcase(
    worldKey: string,
    pin: string,
    request: ShowcasePublishRequest
  ): Promise<ShowcasePublishResponse> {
    // Generate a mock showcase ID
    const showcaseId = `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Store the showcase data
    mockShowcases.set(showcaseId, {
      element_data: request.element_data,
      showcase_config: request.showcase_config,
      metadata: {
        published_at: new Date().toISOString(),
        world_name: 'Mock World',
        element_type: request.element_type,
        view_count: 0
      }
    });
    
    console.log('Mock showcase published:', showcaseId);
    
    return {
      showcase_id: showcaseId,
      published_at: new Date().toISOString(),
      public_url: `https://browse.onlyworlds.com/showcase/${showcaseId}`,
      shareable_url: `/showcase/${showcaseId}`
    };
  }
  
  static async retrieveShowcase(showcaseId: string): Promise<ShowcaseRetrieveResponse> {
    const showcase = mockShowcases.get(showcaseId);
    
    if (!showcase) {
      throw new Error('Showcase not found');
    }
    
    // Increment view count
    showcase.metadata.view_count++;
    
    return showcase;
  }
}