import { memo, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorldContext } from '../contexts/WorldContext';
import { detectFieldType, type FieldTypeInfo } from '../services/FieldTypeDetector';
import { useSidebarStore } from '../stores/uiStore';

interface FieldRendererProps {
  fieldName: string;
  value: any;
  elementCategory?: string;
  mode: 'view' | 'edit';
  onChange?: (value: any) => void;
  className?: string;
}

export const FieldRenderer = memo(function FieldRenderer({ fieldName, value, elementCategory, mode, onChange, className }: FieldRendererProps) {
  const fieldTypeInfo = useMemo(() => 
    detectFieldType(fieldName, value, elementCategory), 
    [fieldName, value, elementCategory]
  );
  
  if (mode === 'view') {
    return <FieldViewer fieldName={fieldName} value={value} fieldTypeInfo={fieldTypeInfo} className={className} />;
  } else {
    return <FieldEditor fieldName={fieldName} value={value} fieldTypeInfo={fieldTypeInfo} onChange={onChange} className={className} />;
  }
});

interface FieldViewerProps {
  fieldName: string;
  value: any;
  fieldTypeInfo: FieldTypeInfo;
  className?: string;
}

const FieldViewer = memo(function FieldViewer({ fieldName, value, fieldTypeInfo, className }: FieldViewerProps) {
  const { type } = fieldTypeInfo;
  const { elements } = useWorldContext();
  const { selectElement } = useSidebarStore();
  const navigate = useNavigate();
  
  if (value === null || value === undefined || value === '') {
    return <span className={className}></span>;
  }
  
  switch (type) {
    case 'url':
      return (
        <a 
          href={value} 
          target="_blank" 
          rel="noopener noreferrer"
          className={`text-blue-600 hover:text-blue-800 hover:underline ${className}`}
        >
          {value}
        </a>
      );
      
    case 'boolean':
      return (
        <div className={`flex items-center gap-2 ${className}`}>
          <div className={`w-4 h-4 rounded-full border-2 ${
            value ? 'bg-field-quaternary border-field-quaternary' : 'bg-field-primary/40 border-field-primary/40'
          }`}>
            {value && (
              <div className="w-full h-full rounded-full bg-white scale-50"></div>
            )}
          </div>
          <span className={value ? 'text-green-700' : 'text-gray-600'}>
            {value ? 'yes' : 'no'}
          </span>
        </div>
      );
      
    case 'number':
      return (
        <span className={`font-mono ${className}`}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
      );
      
    case 'tags':
      if (Array.isArray(value) && value.length > 0) {
        return (
          <div className={`flex flex-wrap gap-1 ${className}`}>
            {value.map((tag, index) => (
              <span 
                key={index}
                className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        );
      }
      return <span className={className}></span>;
      
    case 'link':
      if (typeof value === 'string' && value) {
        const linkedElement = elements.get(value);
        if (linkedElement) {
          return (
            <button
              onClick={(e) => {
                e.preventDefault();
                navigate(`/element/${value}`);
              }}
              className={`text-blue-600 hover:text-blue-800 hover:underline cursor-pointer ${className}`}
            >
              {linkedElement.name}
            </button>
          );
        }
        return <span className={`text-gray-500 ${className}`}>Unknown element ({value})</span>;
      }
      return <span className={className}></span>;
      
    case 'links':
      if (Array.isArray(value) && value.length > 0) {
        return (
          <div className={`space-y-1 ${className}`}>
            {value.map((linkId, index) => {
              const linkedElement = elements.get(linkId);
              if (linkedElement) {
                return (
                  <button
                    key={index}
                    onClick={() => navigate(`/element/${linkId}`)}
                    className="block text-blue-600 hover:text-blue-800 hover:underline text-left"
                  >
                    {linkedElement.name}
                  </button>
                );
              }
              return (
                <span key={index} className="block text-gray-500">
                  Unknown element ({linkId})
                </span>
              );
            })}
          </div>
        );
      }
      return <span className={className}></span>;
      
    case 'json':
      return (
        <pre className={`text-sm bg-field-primary/20 p-2 rounded-lg border border-field-primary/30 overflow-auto ${className}`}>
          {JSON.stringify(value, null, 2)}
        </pre>
      );
      
    case 'textarea':
      return (
        <div className={`whitespace-pre-wrap ${className}`}>
          {String(value)}
        </div>
      );
      
    default:
      return (
        <span className={className}>
          {String(value)}
        </span>
      );
  }
});

interface FieldEditorProps {
  fieldName: string;
  value: any;
  fieldTypeInfo: FieldTypeInfo;
  onChange?: (value: any) => void;
  className?: string;
}

const FieldEditor = memo(function FieldEditor({ fieldName, value, fieldTypeInfo, onChange, className }: FieldEditorProps) {
  const { type, options, allowCustom, linkedCategory } = fieldTypeInfo;
  const [localValue, setLocalValue] = useState(value);
  const { elements } = useWorldContext();
  
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  const handleChange = (newValue: any) => {
    setLocalValue(newValue);
    onChange?.(newValue);
  };
  
  const baseInputClass = `w-full px-3 py-2 bg-white border border-blue-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors hover:border-blue-300 ${className}`;
  
  switch (type) {
    case 'boolean':
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!localValue}
            onChange={(e) => handleChange(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label className="text-sm text-gray-700">
            {localValue ? 'yes' : 'no'}
          </label>
        </div>
      );
      
    case 'number':
      return (
        <input
          type="number"
          value={localValue || ''}
          onChange={(e) => handleChange(e.target.value ? Number(e.target.value) : '')}
          className={baseInputClass}
          placeholder="enter number"
        />
      );
      
    case 'url':
      return (
        <input
          type="url"
          value={localValue || ''}
          onChange={(e) => handleChange(e.target.value)}
          className={baseInputClass}
          placeholder="https://example.com"
        />
      );
      
    case 'select':
      if (allowCustom && options && options.length > 0) {
        // Use datalist for combobox behavior when custom values are allowed
        const inputId = `${fieldName}-input`;
        const listId = `${fieldName}-list`;
        
        return (
          <div>
            <input
              id={inputId}
              list={listId}
              type="text"
              value={localValue || ''}
              onChange={(e) => handleChange(e.target.value)}
              className={baseInputClass}
              placeholder={`select or enter ${fieldName}`}
              role="combobox"
              aria-expanded="false"
              aria-autocomplete="list"
            />
            <datalist id={listId}>
              {options.map(option => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </div>
        );
      } else if (options && options.length > 0) {
        // Use select for strict selection
        return (
          <select
            value={localValue || ''}
            onChange={(e) => handleChange(e.target.value)}
            className={baseInputClass}
          >
            <option value="">select {fieldName}</option>
            {options.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );
      } else {
        // Fallback to text input if no options
        return (
          <input
            type="text"
            value={localValue || ''}
            onChange={(e) => handleChange(e.target.value)}
            className={baseInputClass}
            placeholder={`enter ${fieldName}`}
          />
        );
      }
      
    case 'tags':
      return (
        <div className="space-y-2">
          <input
            type="text"
            value={Array.isArray(localValue) ? localValue.join(', ') : localValue || ''}
            onChange={(e) => {
              const tags = e.target.value.split(',').map(tag => tag.trim()).filter(Boolean);
              handleChange(tags);
            }}
            className={baseInputClass}
            placeholder="enter tags separated by commas"
          />
          <div className="text-xs text-gray-500">
            separate multiple tags with commas
          </div>
        </div>
      );
      
    case 'link':
      const allElements = Array.from(elements.values());
      
      // Filter elements by category if specified in field type info
      let filteredElements = allElements;
      if (linkedCategory) {
        filteredElements = allElements.filter(el => el.category === linkedCategory);
      }
      
      return (
        <div className="space-y-2">
          <select
            value={localValue || ''}
            onChange={(e) => handleChange(e.target.value)}
            className={baseInputClass}
          >
            <option value="">select element...</option>
            {filteredElements.map(element => (
              <option key={element.id} value={element.id}>
                {element.name} ({element.category})
              </option>
            ))}
          </select>
          <div className="text-xs text-gray-500">
            choose an element to link to
          </div>
        </div>
      );
      
    case 'links':
      const allElementsForLinks = Array.from(elements.values());
      
      // Filter elements by category if specified in field type info
      let filteredElementsForLinks = allElementsForLinks;
      if (linkedCategory) {
        filteredElementsForLinks = allElementsForLinks.filter(el => el.category === linkedCategory);
      }
      
      const currentLinks = Array.isArray(localValue) ? localValue : [];
      
      return (
        <div className="space-y-3">
          <div className="space-y-2">
            {currentLinks.map((linkId, index) => {
              const linkedElement = elements.get(linkId);
              return (
                <div key={index} className="flex items-center gap-2 p-2 bg-field-secondary/30 rounded-lg">
                  <span className="flex-1">
                    {linkedElement ? `${linkedElement.name} (${linkedElement.category})` : `Unknown: ${linkId}`}
                  </span>
                  <button
                    onClick={() => {
                      const newLinks = currentLinks.filter((_, i) => i !== index);
                      handleChange(newLinks);
                    }}
                    className="text-red-600 hover:text-red-800 px-2 py-1 text-sm"
                  >
                    remove
                  </button>
                </div>
              );
            })}
          </div>
          
          <select
            value=""
            onChange={(e) => {
              if (e.target.value && !currentLinks.includes(e.target.value)) {
                handleChange([...currentLinks, e.target.value]);
              }
            }}
            className={baseInputClass}
          >
            <option value="">Choose element...</option>
            {filteredElementsForLinks
              .filter(element => !currentLinks.includes(element.id))
              .map(element => (
                <option key={element.id} value={element.id}>
                  {element.name} ({element.category})
                </option>
              ))}
          </select>
        </div>
      );
      
    case 'textarea':
      return (
        <textarea
          value={localValue || ''}
          onChange={(e) => handleChange(e.target.value)}
          className={`${baseInputClass} min-h-[100px] resize-y overflow-y-auto`}
          placeholder="enter text..."
          rows={5}
          style={{ maxHeight: '400px' }}
        />
      );
      
    case 'json':
      return (
        <div className="space-y-2">
          <textarea
            value={typeof localValue === 'object' ? JSON.stringify(localValue, null, 2) : localValue || ''}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleChange(parsed);
              } catch {
                handleChange(e.target.value);
              }
            }}
            className={`${baseInputClass} min-h-[120px] font-mono text-sm`}
            placeholder="enter json..."
            rows={6}
          />
          <div className="text-xs text-gray-500">
            enter valid json or plain text
          </div>
        </div>
      );
      
    default:
      // For longer text values, use a textarea instead of input
      if (localValue && typeof localValue === 'string' && localValue.length > 100) {
        return (
          <textarea
            value={localValue || ''}
            onChange={(e) => handleChange(e.target.value)}
            className={`${baseInputClass} min-h-[100px] resize-y overflow-y-auto`}
            placeholder="enter text..."
            rows={5}
            style={{ maxHeight: '400px' }}
          />
        );
      }
      return (
        <input
          type="text"
          value={localValue || ''}
          onChange={(e) => handleChange(e.target.value)}
          className={baseInputClass}
          placeholder="enter text..."
        />
      );
  }
});