// Base interface for all world elements (Generated from base_properties.yaml)
export interface BaseElement {
  id: string;
  name: string;
  description?: string | null;
  supertype?: string | null;
  subtype?: string | null;
  imageUrl?: string | null;
  world?: string | null;
  // Additional fields used by the write tool
  category?: string;
  is_public?: boolean;
  created_at?: string;
  updated_at?: string;
}
