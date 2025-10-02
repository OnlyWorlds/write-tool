import { memo, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorldContext } from '../contexts/WorldContext';
import { detectFieldType, type FieldTypeInfo } from '../services/UnifiedFieldTypeService';
import { useSidebarStore } from '../stores/uiStore';
import { ComboBox } from './ComboBox';
import { TypeManagementService } from '../services/TypeManagementService';
import type { LinkedElement } from '../services/ApiService';

interface FieldRendererProps {
  fieldName: string;
  value: any;
  elementCategory?: string;
  mode: 'view' | 'edit';
  onChange?: (value: any) => void;
  className?: string;
  selectedElement?: any; // For accessing supertype when editing subtype
  linkedElements?: Record<string, LinkedElement>; // For showcase mode
}

export const FieldRenderer = memo(function FieldRenderer({ fieldName, value, elementCategory, mode, onChange, className, selectedElement, linkedElements }: FieldRendererProps) {
  const fieldTypeInfo = useMemo(() => 
    detectFieldType(fieldName, value, elementCategory), 
    [fieldName, value, elementCategory]
  );
  
  if (mode === 'view') {
    return <FieldViewer fieldName={fieldName} value={value} fieldTypeInfo={fieldTypeInfo} className={className} linkedElements={linkedElements} />;
  } else {
    return <FieldEditor fieldName={fieldName} value={value} fieldTypeInfo={fieldTypeInfo} onChange={onChange} className={className} elementCategory={elementCategory} selectedElement={selectedElement} />;
  }
});

interface FieldViewerProps {
  fieldName: string;
  value: any;
  fieldTypeInfo: FieldTypeInfo;
  className?: string;
  linkedElements?: Record<string, LinkedElement>;
}

const FieldViewer = memo(function FieldViewer({ fieldName, value, fieldTypeInfo, className, linkedElements }: FieldViewerProps) {
  const { type } = fieldTypeInfo;
  const { elements } = useWorldContext();
  const { selectElement } = useSidebarStore();
  const navigate = useNavigate();
  
  // Determine if we're in showcase mode (no WorldContext access)
  const isShowcaseMode = !elements || elements.size === 0;
  
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
          className={`text-slate-800 font-bold dark:text-white hover:text-slate-600 dark:hover:text-gray-200 hover:underline ${className}`}
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
          <span className={value ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}>
            {value ? 'yes' : 'no'}
          </span>
        </div>
      );
      
    case 'number':
      return (
        <span className={`font-mono ${className}`}>
          {typeof value === 'number' ? value.toString() : value}
        </span>
      );
      
    case 'tags':
      if (Array.isArray(value) && value.length > 0) {
        return (
          <div className={`flex flex-wrap gap-1 ${className}`}>
            {value.map((tag, index) => (
              <span 
                key={index}
                className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs px-2 py-1 rounded-full"
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
        // First try linkedElements (for showcase mode), then fall back to WorldContext
        const linkedElement = linkedElements?.[value] || elements.get(value);
        if (linkedElement) {
          // In showcase mode, display as plain text without link
          if (isShowcaseMode) {
            return <span className={`text-gray-800 ${className}`}>{linkedElement.name}</span>;
          }
          // In normal mode, display as clickable link
          return (
            <button
              onClick={(e) => {
                e.preventDefault();
                navigate(`/element/${value}`);
              }}
              className={`text-slate-800 font-bold dark:text-white hover:text-slate-600 dark:hover:text-gray-200 hover:underline cursor-pointer ${className}`}
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
              // First try linkedElements (for showcase mode), then fall back to WorldContext
              const linkedElement = linkedElements?.[linkId] || elements.get(linkId);
              if (linkedElement) {
                // In showcase mode, display as plain text without link
                if (isShowcaseMode) {
                  return (
                    <span key={index} className="block text-gray-800">
                      {linkedElement.name}
                    </span>
                  );
                }
                // In normal mode, display as clickable link
                return (
                  <button
                    key={index}
                    onClick={() => navigate(`/element/${linkId}`)}
                    className="block text-slate-800 font-bold dark:text-white hover:text-slate-600 dark:hover:text-gray-200 hover:underline text-left"
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
      // Check if the value is an object that shouldn't be stringified
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        console.error(`Unexpected object value for field "${fieldName}":`, value);
        // Try to extract ID if it looks like a link object
        if ('url' in value && typeof value.url === 'string') {
          const match = value.url.match(/\/([a-f0-9-]+)\/?$/);
          const id = match ? match[1] : 'Unknown';
          return <span className={`text-red-500 ${className}`}>[Link: {id}]</span>;
        }
        return <span className={`text-red-500 ${className}`}>[Invalid Object]</span>;
      }
      
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
  elementCategory?: string;
  selectedElement?: any;
}

const FieldEditor = memo(function FieldEditor({ fieldName, value, fieldTypeInfo, onChange, className, elementCategory, selectedElement }: FieldEditorProps) {
  const { type, options, allowCustom, linkedCategory } = fieldTypeInfo;
  const [localValue, setLocalValue] = useState(value);
  const { elements } = useWorldContext();
  const [supertypes, setSupertypes] = useState<string[]>([]);
  const [subtypes, setSubtypes] = useState<string[]>([]);
  const [isLoadingTypes, setIsLoadingTypes] = useState(false);
  const [lastLoadedSupertype, setLastLoadedSupertype] = useState<string | null>(null);
  
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  // Load supertypes when category changes
  useEffect(() => {
    if (fieldName === 'supertype' && elementCategory) {
      setIsLoadingTypes(true);
      TypeManagementService.getSupertypesAsync(elementCategory)
        .then(types => {
          setSupertypes(types);
          setIsLoadingTypes(false);
        })
        .catch(error => {
          console.error('Failed to load supertypes:', error);
          setIsLoadingTypes(false);
        });
    }
  }, [fieldName, elementCategory]);
  
  // Load subtypes when supertype changes
  useEffect(() => {
    const currentSupertype = selectedElement?.supertype;
    
    if (fieldName === 'subtype' && elementCategory && currentSupertype) {
      // Only load if supertype has changed
      if (currentSupertype !== lastLoadedSupertype) {
        setIsLoadingTypes(true);
        setLastLoadedSupertype(currentSupertype);
        
        TypeManagementService.getSubtypesAsync(elementCategory, currentSupertype)
          .then(types => {
            setSubtypes(types);
            setIsLoadingTypes(false);
          })
          .catch(error => {
            console.error('Failed to load subtypes:', error);
            setIsLoadingTypes(false);
          });
      }
    } else if (fieldName === 'subtype' && !currentSupertype) {
      setSubtypes([]);
      setLastLoadedSupertype(null);
    }
  }, [fieldName, elementCategory, selectedElement?.supertype, lastLoadedSupertype]);
  
  const handleChange = (newValue: any) => {
    setLocalValue(newValue);
    onChange?.(newValue);
  };
  
  const baseInputClass = `w-full px-3 py-3 bg-white dark:bg-dark-bg-tertiary border border-blue-200 dark:border-dark-bg-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors hover:border-blue-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 ${className}`;
  
  const baseTextareaClass = `w-full px-3 py-3 box-border leading-normal bg-white dark:bg-dark-bg-tertiary border border-blue-200 dark:border-dark-bg-border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-colors hover:border-blue-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 ${className}`;
  
  // Special handling for supertype and subtype fields
  if (fieldName === 'supertype' && elementCategory) {
    return (
      <ComboBox
        value={localValue}
        onChange={handleChange}
        options={supertypes}
        placeholder={isLoadingTypes ? "Loading..." : "Select or enter supertype"}
        className={baseInputClass}
        disabled={isLoadingTypes}
      />
    );
  }
  
  if (fieldName === 'subtype' && elementCategory) {
    const currentSupertype = selectedElement?.supertype;
    return (
      <ComboBox
        value={localValue}
        onChange={handleChange}
        options={subtypes}
        placeholder={isLoadingTypes ? "Loading..." : (currentSupertype ? "Select or enter subtype" : "Select supertype first")}
        className={baseInputClass}
        disabled={isLoadingTypes || !currentSupertype}
      />
    );
  }
  
  switch (type) {
    case 'boolean':
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!localValue}
            onChange={(e) => handleChange(e.target.checked)}
            className="h-4 w-4 text-blue-600 dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400 border-gray-300 dark:border-gray-600 rounded"
          />
          <label className="text-sm text-gray-700 dark:text-gray-300">
            {localValue ? 'yes' : 'no'}
          </label>
        </div>
      );
      
    case 'number':
      return (
        <input
          type="number"
          value={localValue === null || localValue === undefined ? '' : localValue}
          onChange={(e) => {
            const val = e.target.value;
            if (val === '') {
              handleChange(null);
            } else {
              const num = Number(val);
              handleChange(isNaN(num) ? val : num);
            }
          }}
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
          className={`${baseTextareaClass} resize-y overflow-y-auto`}
          placeholder="enter text..."
          style={{ height: '60vh', maxHeight: '80vh' }}
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
            className={`${baseTextareaClass} min-h-[120px] font-mono text-sm`}
            placeholder="enter json..."
            rows={6}
          />
          <div className="text-xs text-gray-500">
            enter valid json or plain text
          </div>
        </div>
      );
      
    default:
      // Use textarea for all text fields to give more space
      return (
        <textarea
          value={localValue || ''}
          onChange={(e) => handleChange(e.target.value)}
          className={`${baseTextareaClass} resize-y overflow-y-auto`}
          placeholder="enter text..."
          style={{ height: '60vh', maxHeight: '80vh' }}
        />
      );
  }
});