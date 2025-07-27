import { detectFieldType } from '../services/FieldTypeDetector';

interface FieldTypeIndicatorProps {
  fieldName: string;
  value: any;
  elementCategory?: string;
}

export function FieldTypeIndicator({ fieldName, value, elementCategory }: FieldTypeIndicatorProps) {
  const fieldTypeInfo = detectFieldType(fieldName, value, elementCategory);
  
  // Get icon and color based on field type - more subtle warm colors
  const getTypeDisplay = () => {
    switch (fieldTypeInfo.type) {
      case 'text':
        return { icon: 'S', color: 'bg-field-primary/40 text-purple-700', label: 'String' };
      case 'textarea':
        return { icon: 'S⋮', color: 'bg-field-primary/40 text-purple-700', label: 'String (Long)' };
      case 'number':
        return { icon: '1', color: 'bg-field-secondary/40 text-blue-700', label: 'Integer' };
      case 'boolean':
        return { icon: '✓', color: 'bg-field-quaternary/40 text-green-700', label: 'String (Boolean)' };
      case 'link':
        return { icon: '→', color: 'bg-field-tertiary/40 text-red-700', label: `Single Link (${fieldTypeInfo.linkedCategory || 'element'})` };
      case 'links':
        return { icon: '⇉', color: 'bg-field-tertiary/40 text-red-700', label: `Multi Link (${fieldTypeInfo.linkedCategory || 'elements'})` };
      case 'url':
        return { icon: '🔗', color: 'bg-field-highlight/40 text-yellow-700', label: 'String (URL)' };
      case 'select':
        return { icon: '▼', color: 'bg-field-secondary/40 text-blue-700', label: 'String (Select)' };
      default:
        return { icon: 'S', color: 'bg-field-primary/40 text-purple-700', label: 'String' };
    }
  };
  
  const { icon, color, label } = getTypeDisplay();
  
  // Debug info
  const debugInfo = `Field: ${fieldName}\nType: ${fieldTypeInfo.type}\nLinked Category: ${fieldTypeInfo.linkedCategory || 'none'}\nValue: ${JSON.stringify(value)}\nElement Category: ${elementCategory}`;
  
  return (
    <span 
      className={`inline-flex items-center justify-center w-4 h-4 rounded text-xs font-mono ${color} opacity-60`}
      title={`${label}\n\n${debugInfo}`}
    >
      {icon}
    </span>
  );
}