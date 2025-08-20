import { useEffect, useState, useRef } from 'react';
import type { ElementMatch } from './ElementLinker';
import { CategoryIcon } from '../../utils/categoryIcons';

interface SuggestionPopoverProps {
  matches: ElementMatch[];
  onAccept: (match: ElementMatch) => void;
  onReject: (match: ElementMatch) => void;
  onClose: () => void;
  position?: { top: number; left: number };
}

export function SuggestionPopover({ 
  matches, 
  onAccept, 
  onReject, 
  onClose,
  position 
}: SuggestionPopoverProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % matches.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + matches.length) % matches.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (matches[selectedIndex]) {
            onAccept(matches[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'Tab':
          e.preventDefault();
          if (e.shiftKey) {
            setSelectedIndex(prev => (prev - 1 + matches.length) % matches.length);
          } else {
            setSelectedIndex(prev => (prev + 1) % matches.length);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [matches, selectedIndex, onAccept, onClose]);

  useEffect(() => {
    // Click outside to close
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (matches.length === 0) return null;

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      event: 'bg-purple-100 text-purple-800 border-purple-200',
      character: 'bg-blue-100 text-blue-800 border-blue-200',
      location: 'bg-green-100 text-green-800 border-green-200',
      family: 'bg-orange-100 text-orange-800 border-orange-200',
      collective: 'bg-pink-100 text-pink-800 border-pink-200',
      species: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      institution: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div
      ref={popoverRef}
      className="relative z-50 bg-white rounded-lg shadow-xl border border-gray-200 max-w-md overflow-hidden"
      style={position ? { top: position.top, left: position.left } : {}}
    >
      <div className="p-2 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-600">
            Element Suggestions ({matches.length})
          </span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            title="Close (Esc)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="max-h-64 overflow-y-auto">
        {matches.map((match, index) => (
          <div
            key={`${match.suggestedElement.id}-${match.startIndex}`}
            className={`flex items-start gap-3 p-3 cursor-pointer transition-colors ${
              index === selectedIndex 
                ? 'bg-blue-50 border-l-4 border-blue-500' 
                : 'hover:bg-gray-50 border-l-4 border-transparent'
            }`}
            onClick={() => onAccept(match)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <div className="flex-shrink-0 mt-1">
              <CategoryIcon 
                category={match.elementType} 
                className="text-lg text-gray-600"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">
                  {match.suggestedElement.name}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${getCategoryColor(match.elementType)}`}>
                  {match.elementType}
                </span>
              </div>
              
              {match.suggestedElement.description && (
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {match.suggestedElement.description}
                </p>
              )}
              
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xs text-gray-500">
                  Confidence: {Math.round(match.confidence * 100)}%
                </span>
                <span className="text-xs text-gray-400">
                  "{match.text}"
                </span>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onReject(match);
              }}
              className="flex-shrink-0 text-gray-400 hover:text-red-600"
              title="Ignore this suggestion"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="p-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
        <div className="flex items-center justify-between">
          <span>↑↓ Navigate • Enter Accept • Esc Close</span>
          <span className="font-medium">
            {selectedIndex + 1} of {matches.length}
          </span>
        </div>
      </div>
    </div>
  );
}