export interface WorldMetadata {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  is_public?: boolean;
}

export interface Element {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
  is_public?: boolean;
  category?: string;
  type?: string;
  supertype?: string;
  subtype?: string;
  [key: string]: any;
}

export interface WorldState {
  worldKey: string;
  pin: string;
  metadata: WorldMetadata | null;
  elements: Map<string, Element>;
  categories: Map<string, Element[]>;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ElementField {
  name: string;
  type: 'string' | 'text' | 'number' | 'boolean' | 'enum' | 'link' | 'array' | 'tags' | 'image_url';
  label?: string;
  required?: boolean;
  options?: string[];
  category?: string;
}

export interface ElementSchema {
  type: string;
  fields: ElementField[];
  requiredFields: ElementField[];
}

export interface ValidationError {
  field: string;
  message: string;
}