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
        return { icon: 'S', color: 'bg-gray-100 text-gray-500', label: 'String' };
      case 'textarea':
        return { icon: 'S⋮', color: 'bg-gray-100 text-gray-500', label: 'String (Long)' };
      case 'number':
        return { icon: '1', color: 'bg-blue-100 text-blue-600', label: 'Integer' };
      case 'boolean':
        return { icon: '✓', color: 'bg-blue-100 text-blue-600', label: 'String (Boolean)' };
      case 'link':
        return { icon: '→', color: 'bg-slate-200 text-gray-600', label: `Single Link (${fieldTypeInfo.linkedCategory || 'element'})` };
      case 'links':
        return { icon: '⇉', color: 'bg-slate-200 text-gray-600', label: `Multi Link (${fieldTypeInfo.linkedCategory || 'elements'})` };
      case 'url':
        return { icon: '🔗', color: 'bg-gray-100 text-gray-500', label: 'String (URL)' };
      case 'select':
        return { icon: '▼', color: 'bg-gray-100 text-gray-500', label: 'String (Select)' };
      default:
        return { icon: 'S', color: 'bg-gray-100 text-gray-500', label: 'String' };
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