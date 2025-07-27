import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useWorldContext } from '../contexts/WorldContext';
import { getSimplifiedCategorySchema, type FieldSchema } from '../services/ElementSchemas';
import { ValidationService } from '../services/ValidationService';
import { useSidebarStore } from '../stores/uiStore';
import { FieldRenderer } from './FieldRenderers';

export function CreateElementModal() {
  const { createModalOpen, createModalCategory, closeCreateModal } = useSidebarStore();
  const { createElement, elements } = useWorldContext();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const schema = getSimplifiedCategorySchema(createModalCategory || 'general');

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
    
    // Create element object for validation
    const elementToValidate = {
      ...formData,
      name: formData.name || '', // Ensure name is always present
      category: createModalCategory || 'general',
      id: 'temp-id', // Required for validation
    };
    
    // Validate using our ValidationService
    const validationErrors = ValidationService.validateElement(elementToValidate);
    if (validationErrors.length > 0) {
      // Set field-specific errors
      const newFieldErrors: Record<string, string> = {};
      validationErrors.forEach(error => {
        newFieldErrors[error.field] = error.message;
      });
      setFieldErrors(newFieldErrors);
      setErrors(validationErrors.map(err => err.message));
      toast.error('please fix validation errors before saving');
      return;
    }
    
    setIsSubmitting(true);
    setErrors([]);
    setFieldErrors({});
    
    try {
      const newElement = {
        ...formData,
        category: createModalCategory || 'general'
      };
      
      const createdElement = await createElement(newElement);
      
      // Reset form and close modal
      setFormData({});
      closeCreateModal();
      
      // Navigate to the newly created element
      navigate(`/element/${createdElement.id}`);
      
      // Show success message
      toast.success(`created ${createdElement.name} successfully!`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'failed to create element';
      setErrors([errorMessage]);
      toast.error(errorMessage);
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
    const hasError = fieldErrors[field.name];
    const baseClassName = `w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
      hasError 
        ? 'border-warning focus:ring-warning bg-warning-bg' 
        : 'border-input-border focus:ring-accent'
    }`;
    
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
            className={baseClassName}
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
            className={baseClassName}
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
                className={baseClassName}
                disabled={isSubmitting}
              >
                <option value="">select {field.label.toLowerCase()}</option>
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
                className={baseClassName}
                placeholder={field.placeholder || `enter custom ${field.label.toLowerCase()}`}
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
              className="h-4 w-4 text-accent focus:ring-accent border-input-border rounded"
              disabled={isSubmitting}
            />
            {field.description && (
              <span className="ml-2 text-sm text-text-light/60">{field.description.toLowerCase()}</span>
            )}
            {field.name === 'is_public' && (
              <div className="ml-2 text-xs text-gray-500">
                public elements are visible to all users in the world
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
            className={baseClassName}
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
            className={baseClassName}
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
            className={baseClassName}
            placeholder={field.placeholder || `enter ${field.label.toLowerCase()}`}
            disabled={isSubmitting}
          />
        );
    }
  };

  if (!createModalOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleClose}
    >
      <div 
        className="bg-sidebar rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4">
          Create new {schema.name.toLowerCase()}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {schema.fields.map((field) => (
            <div key={field.name}>
              <label htmlFor={field.name} className="block text-sm font-medium text-text-light mb-1">
                {field.label.toLowerCase()} {field.required && '*'}
              </label>
              {renderField(field)}
              {fieldErrors[field.name] && (
                <div className="mt-1 text-sm text-warning">
                  {fieldErrors[field.name]}
                </div>
              )}
            </div>
          ))}
          
          {errors.length > 0 && (
            <div className="space-y-1">
              {errors.map((error, index) => (
                <div key={index} className="text-warning text-sm">{error}</div>
              ))}
            </div>
          )}
          
          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-text-light/60 hover:text-text-light transition-colors disabled:opacity-50"
            >
              cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-accent text-text-dark rounded-md hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'creating...' : 'create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}