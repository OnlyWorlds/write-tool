import { useState, useEffect } from 'react';
import { detectFieldType, convertFieldValue, formatFieldValue, type FieldTypeInfo } from '../services/FieldTypeDetector';

interface FieldRendererProps {
  fieldName: string;
  value: any;
  elementCategory?: string;
  mode: 'view' | 'edit';
  onChange?: (value: any) => void;
  className?: string;
}

export function FieldRenderer({ fieldName, value, elementCategory, mode, onChange, className }: FieldRendererProps) {
  const fieldTypeInfo = detectFieldType(fieldName, value, elementCategory);
  
  if (mode === 'view') {
    return <FieldViewer fieldName={fieldName} value={value} fieldTypeInfo={fieldTypeInfo} className={className} />;
  } else {
    return <FieldEditor fieldName={fieldName} value={value} fieldTypeInfo={fieldTypeInfo} onChange={onChange} className={className} />;
  }
}

interface FieldViewerProps {
  fieldName: string;
  value: any;
  fieldTypeInfo: FieldTypeInfo;
  className?: string;
}

function FieldViewer({ fieldName, value, fieldTypeInfo, className }: FieldViewerProps) {
  const { type } = fieldTypeInfo;
  
  if (value === null || value === undefined || value === '') {
    return <span className={`text-gray-400 italic ${className}`}>No value</span>;
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
            value ? 'bg-green-500 border-green-500' : 'bg-gray-300 border-gray-300'
          }`}>
            {value && (
              <div className="w-full h-full rounded-full bg-white scale-50"></div>
            )}
          </div>
          <span className={value ? 'text-green-700' : 'text-gray-600'}>
            {value ? 'Yes' : 'No'}
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
      return <span className={`text-gray-400 italic ${className}`}>No tags</span>;
      
    case 'json':
      return (
        <pre className={`text-sm bg-gray-50 p-2 rounded border overflow-auto ${className}`}>
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
}

interface FieldEditorProps {
  fieldName: string;
  value: any;
  fieldTypeInfo: FieldTypeInfo;
  onChange?: (value: any) => void;
  className?: string;
}

function FieldEditor({ fieldName, value, fieldTypeInfo, onChange, className }: FieldEditorProps) {
  const { type, options, allowCustom } = fieldTypeInfo;
  const [localValue, setLocalValue] = useState(value);
  
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  const handleChange = (newValue: any) => {
    setLocalValue(newValue);
    onChange?.(newValue);
  };
  
  const baseInputClass = `w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`;
  
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
            {localValue ? 'Yes' : 'No'}
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
          placeholder="Enter number"
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
      return (
        <div className="space-y-2">
          {options && options.length > 0 && (
            <select
              value={localValue || ''}
              onChange={(e) => handleChange(e.target.value)}
              className={baseInputClass}
            >
              <option value="">Select {fieldName}</option>
              {options.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          )}
          {allowCustom && (
            <input
              type="text"
              value={localValue || ''}
              onChange={(e) => handleChange(e.target.value)}
              className={baseInputClass}
              placeholder={`Enter custom ${fieldName}`}
            />
          )}
        </div>
      );
      
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
            placeholder="Enter tags separated by commas"
          />
          <div className="text-xs text-gray-500">
            Separate multiple tags with commas
          </div>
        </div>
      );
      
    case 'textarea':
      return (
        <textarea
          value={localValue || ''}
          onChange={(e) => handleChange(e.target.value)}
          className={`${baseInputClass} min-h-[100px] resize-y`}
          placeholder="Enter text..."
          rows={4}
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
            placeholder="Enter JSON..."
            rows={6}
          />
          <div className="text-xs text-gray-500">
            Enter valid JSON or plain text
          </div>
        </div>
      );
      
    default:
      return (
        <input
          type="text"
          value={localValue || ''}
          onChange={(e) => handleChange(e.target.value)}
          className={baseInputClass}
          placeholder="Enter text..."
        />
      );
  }
}