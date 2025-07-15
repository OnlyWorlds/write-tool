import { useState, useEffect } from 'react';
import { useSidebarStore } from '../stores/uiStore';
import { useWorldContext } from '../contexts/WorldContext';
import { getCategorySchema, validateElementData, type FieldSchema } from '../services/ElementSchemas';
import { detectFieldType } from '../services/FieldTypeDetector';
import { FieldRenderer } from './FieldRenderers';

export function CreateElementModal() {
  const { createModalOpen, createModalCategory, closeCreateModal } = useSidebarStore();
  const { createElement, elements } = useWorldContext();
  
  const [formData, setFormData] = useState<Record<string, any>>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const schema = getCategorySchema(createModalCategory || 'general');

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && createModalOpen) {
        handleClose();
      }
    };
    
    if (createModalOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [createModalOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate using schema
    const validation = validateElementData(formData, schema);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }
    
    setIsSubmitting(true);
    setErrors([]);
    
    try {
      const newElement = {
        ...formData,
        category: createModalCategory || 'general'
      };
      
      await createElement(newElement);
      
      // Reset form and close modal
      setFormData({});
      closeCreateModal();
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Failed to create element']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({});
      setErrors([]);
      closeCreateModal();
    }
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const renderField = (field: FieldSchema) => {
    const value = formData[field.name];
    
    // For link/links fields, use FieldRenderer which has proper filtering
    if (field.type === 'link' || field.type === 'links') {
      return (
        <FieldRenderer
          fieldName={field.name}
          value={value}
          elementCategory={createModalCategory || undefined}
          mode="edit"
          onChange={(newValue) => handleFieldChange(field.name, newValue)}
        />
      );
    }
    
    // For other field types, render directly
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            id={field.name}
            value={value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={field.placeholder}
            disabled={isSubmitting}
          />
        );
      
      case 'textarea':
        return (
          <textarea
            id={field.name}
            value={value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder={field.placeholder}
            disabled={isSubmitting}
          />
        );
      
      case 'select':
        // Get schema-specific options for type/subtype fields
        let options = field.options || [];
        if (field.name === 'type' && schema.commonTypes) {
          options = schema.commonTypes;
        } else if (field.name === 'subtype' && schema.commonSubtypes) {
          options = schema.commonSubtypes;
        }
        
        return (
          <div className="space-y-2">
            {options.length > 0 && (
              <select
                id={field.name}
                value={value || ''}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSubmitting}
              >
                <option value="">Select {field.label}</option>
                {options.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            )}
            {field.allowCustom && (
              <input
                type="text"
                value={value || ''}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={field.placeholder || `Enter custom ${field.label.toLowerCase()}`}
                disabled={isSubmitting}
              />
            )}
          </div>
        );
      
      case 'boolean':
        return (
          <div className="flex items-center">
            <input
              type="checkbox"
              id={field.name}
              checked={!!value}
              onChange={(e) => handleFieldChange(field.name, e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={isSubmitting}
            />
            {field.description && (
              <span className="ml-2 text-sm text-gray-600">{field.description}</span>
            )}
            {field.name === 'is_public' && (
              <div className="ml-2 text-xs text-gray-500">
                Public elements are visible to all users in the world
              </div>
            )}
          </div>
        );
      
      case 'url':
        return (
          <input
            type="url"
            id={field.name}
            value={value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={field.placeholder}
            disabled={isSubmitting}
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            id={field.name}
            value={value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={field.placeholder}
            disabled={isSubmitting}
          />
        );
      
      default:
        return (
          <input
            type="text"
            id={field.name}
            value={value || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            disabled={isSubmitting}
          />
        );
    }
  };

  if (!createModalOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleClose}
    >
      <div 
        className="bg-white rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">
          Create New {schema.name}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {schema.fields.map((field) => (
            <div key={field.name}>
              <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
                {field.label} {field.required && '*'}
              </label>
              {renderField(field)}
            </div>
          ))}
          
          {errors.length > 0 && (
            <div className="space-y-1">
              {errors.map((error, index) => (
                <div key={index} className="text-red-600 text-sm">{error}</div>
              ))}
            </div>
          )}
          
          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}