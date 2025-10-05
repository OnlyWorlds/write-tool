import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useWorldContext } from '../contexts/WorldContext';
import { getSimplifiedCategorySchema, type FieldSchema } from '../services/ElementSchemas';
import { ValidationService } from '../services/ValidationService';
import { useSidebarStore } from '../stores/uiStore';
import { FieldRenderer } from './FieldRenderers';

export function CreateElementModal() {
  const { createModalOpen, createModalCategory, createModalAutoSelect, closeCreateModal } = useSidebarStore();
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

      // Only navigate to the element if autoSelect is true
      if (createModalAutoSelect) {
        navigate(`/element/${createdElement.id}`);
      }

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
        : 'border-slate-300 dark:border-dark-bg-border focus:ring-accent bg-white dark:bg-dark-bg-tertiary text-slate-700 dark:text-gray-200 placeholder-slate-400 dark:placeholder-gray-500'
    }`;
    
    // For link/links/select fields, use FieldRenderer which has proper filtering and ComboBox for types
    if (field.type === 'link' || field.type === 'links' || (field.type === 'select' && (field.name === 'supertype' || field.name === 'subtype'))) {
      return (
        <FieldRenderer
          fieldName={field.name}
          value={value}
          elementCategory={createModalCategory || undefined}
          mode="edit"
          onChange={(newValue) => handleFieldChange(field.name, newValue)}
          selectedElement={formData}
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
              className="h-4 w-4 text-accent focus:ring-accent border-input-border dark:border-dark-bg-border rounded"
              disabled={isSubmitting}
            />
            {field.description && (
              <span className="ml-2 text-sm text-text-light/60 dark:text-gray-400">{field.description.toLowerCase()}</span>
            )}
            {field.name === 'is_public' && (
              <div className="ml-2 text-xs text-gray-500 dark:text-gray-400">
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
        className="bg-sidebar dark:bg-dark-bg-secondary rounded-lg p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto border border-sidebar-dark dark:border-dark-bg-border shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold mb-4 text-slate-800 dark:text-gray-200">
          create new {schema.name.toLowerCase()}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {schema.fields.map((field) => (
            <div key={field.name}>
              <label htmlFor={field.name} className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
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
              className="px-4 py-2 text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
            >
              cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent-hover shadow-md transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'creating...' : 'create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}