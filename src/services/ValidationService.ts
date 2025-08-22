import type { Element } from '../types/world';
import { analyzeOnlyWorldsField } from './UnifiedFieldTypeService';

export interface ValidationError {
  field: string;
  message: string;
}

export interface FieldSchema {
  name: string;
  required: boolean;
  type: string;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
}

// Required fields for all elements
const BASE_REQUIRED_FIELDS = ['name'];

// Category-specific required fields
const CATEGORY_REQUIRED_FIELDS: Record<string, string[]> = {
  characters: ['name'],
  locations: ['name'],
  items: ['name'],
  factions: ['name'],
  events: ['name'],
  species: ['name'],
  religions: ['name'],
  languages: ['name'],
  technologies: ['name'],
  magics: ['name'],
  general: ['name'],
};

// Field-specific validation rules
const FIELD_RULES: Record<string, Partial<FieldSchema>> = {
  name: {
    minLength: 1,
    maxLength: 200,
  },
  description: {
    maxLength: 5000,
  },
  imageUrl: {
    pattern: /^https?:\/\/.+/,
  },
  image_url: {
    pattern: /^https?:\/\/.+/,
  },
};

export class ValidationService {
  /**
   * Validate an element against OnlyWorlds schema rules
   */
  static validateElement(element: Element): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Check required fields based on category
    const requiredFields = CATEGORY_REQUIRED_FIELDS[element.category || 'general'] || BASE_REQUIRED_FIELDS;
    
    for (const field of requiredFields) {
      if (!element[field] || (typeof element[field] === 'string' && element[field].trim() === '')) {
        errors.push({
          field,
          message: `${field.charAt(0).toUpperCase() + field.slice(1)} is required`,
        });
      }
    }
    
    // Validate each field
    for (const [fieldName, value] of Object.entries(element)) {
      // Skip system fields
      if (['id', 'created_at', 'updated_at'].includes(fieldName)) continue;
      
      // Skip null/undefined values (they're optional)
      if (value === null || value === undefined) continue;
      
      // Skip empty strings - they're allowed for optional fields
      if (value === '') continue;
      
      // Get field info from OnlyWorlds analyzer
      const fieldInfo = analyzeOnlyWorldsField(fieldName, value, element.category);
      
      // Apply field-specific rules
      const rules = FIELD_RULES[fieldName];
      if (rules) {
        // String length validation
        if (typeof value === 'string') {
          if (rules.minLength && value.length < rules.minLength) {
            errors.push({
              field: fieldName,
              message: `${fieldName} must be at least ${rules.minLength} characters`,
            });
          }
          if (rules.maxLength && value.length > rules.maxLength) {
            errors.push({
              field: fieldName,
              message: `${fieldName} must be no more than ${rules.maxLength} characters`,
            });
          }
          if (rules.pattern && value !== '' && !rules.pattern.test(value)) {
            errors.push({
              field: fieldName,
              message: `${fieldName} has an invalid format`,
            });
          }
        }
        
        // Number validation
        if (typeof value === 'number') {
          if (rules.min !== undefined && value < rules.min) {
            errors.push({
              field: fieldName,
              message: `${fieldName} must be at least ${rules.min}`,
            });
          }
          if (rules.max !== undefined && value > rules.max) {
            errors.push({
              field: fieldName,
              message: `${fieldName} must be no more than ${rules.max}`,
            });
          }
        }
      }
      
      // Type-specific validation based on OnlyWorlds field type
      switch (fieldInfo.type) {
        case 'integer':
          if (typeof value !== 'number' || !Number.isInteger(value)) {
            errors.push({
              field: fieldName,
              message: `${fieldName} must be a whole number`,
            });
          }
          break;
          
        case 'single_link':
          if (typeof value !== 'string') {
            errors.push({
              field: fieldName,
              message: `${fieldName} must be a single element reference`,
            });
          }
          break;
          
        case 'multi_link':
          if (!Array.isArray(value)) {
            errors.push({
              field: fieldName,
              message: `${fieldName} must be a list of element references`,
            });
          } else {
            // Validate each item in the array
            for (let i = 0; i < value.length; i++) {
              if (typeof value[i] !== 'string') {
                errors.push({
                  field: fieldName,
                  message: `${fieldName}[${i}] must be a string reference`,
                });
              }
            }
          }
          break;
          
        case 'string':
          if (fieldInfo.format === 'url' && value && value !== '') {
            const urlPattern = /^https?:\/\/.+/;
            if (!urlPattern.test(value as string)) {
              errors.push({
                field: fieldName,
                message: `${fieldName} must be a valid URL starting with http:// or https://`,
              });
            }
          }
          break;
      }
    }
    
    return errors;
  }
  
  /**
   * Validate a single field value
   */
  static validateField(
    fieldName: string,
    value: any,
    elementCategory?: string
  ): ValidationError | null {
    // Create a minimal element to validate
    const testElement: Element = {
      id: 'test',
      name: 'Test',
      category: elementCategory || 'general',
      [fieldName]: value,
    };
    
    const errors = this.validateElement(testElement);
    return errors.find(e => e.field === fieldName) || null;
  }
  
  /**
   * Check if an element has all required fields
   */
  static hasRequiredFields(element: Partial<Element>): boolean {
    const requiredFields = CATEGORY_REQUIRED_FIELDS[element.category || 'general'] || BASE_REQUIRED_FIELDS;
    
    return requiredFields.every(field => {
      const value = element[field];
      return value !== null && 
             value !== undefined && 
             (typeof value !== 'string' || value.trim() !== '');
    });
  }
}