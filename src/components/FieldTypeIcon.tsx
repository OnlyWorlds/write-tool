export function TextIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

export function NumberIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M18 2V10M18 14V22M6 2V10M6 14V22M2 10H10M14 10H22M2 14H10M14 14H22" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function SingleLinkIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

export function MultiLinkIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 17H7A5 5 0 0 1 7 7h2" />
      <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="8" x2="16" y2="8" />
      <line x1="8" y1="16" x2="16" y2="16" />
    </svg>
  );
}

export function TextAreaIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="16" y1="9" x2="8" y2="9" />
    </svg>
  );
}

export function SelectIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 3h18v18H3zM8 12l3 3 5-5" />
    </svg>
  );
}

export function FieldTypeIcon({ 
  fieldType, 
  className = "w-4 h-4" 
}: { 
  fieldType: 'text' | 'textarea' | 'number' | 'link' | 'links' | 'select' | 'boolean' | 'url' | 'json' | 'tags' | 'unknown';
  className?: string;
}) {
  switch (fieldType) {
    case 'text':
    case 'url':
    case 'tags':
    case 'boolean':
      return <TextIcon className={className} />;
    case 'textarea':
    case 'json':
      return <TextAreaIcon className={className} />;
    case 'number':
      return <NumberIcon className={className} />;
    case 'link':
      return <SingleLinkIcon className={className} />;
    case 'links':
      return <MultiLinkIcon className={className} />;
    case 'select':
      return <SelectIcon className={className} />;
    default:
      return <TextIcon className={className} />;
  }
}