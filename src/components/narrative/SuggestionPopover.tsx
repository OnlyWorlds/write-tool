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
  
  // Filter to only show unlinked elements
  const unlinkedMatches = matches.filter(m => !m.isLinked);
  
  // Group matches by element ID to avoid duplicates
  const groupedMatches = unlinkedMatches.reduce((acc, match) => {
    const elementId = match.suggestedElement.id;
    if (!acc[elementId]) {
      acc[elementId] = {
        element: match.suggestedElement,
        elementType: match.elementType,
        confidence: match.confidence,
        mentions: []
      };
    }
    acc[elementId].mentions.push(match);
    // Keep the highest confidence
    if (match.confidence > acc[elementId].confidence) {
      acc[elementId].confidence = match.confidence;
    }
    return acc;
  }, {} as Record<string, {
    element: typeof unlinkedMatches[0]['suggestedElement'];
    elementType: string;
    confidence: number;
    mentions: ElementMatch[];
  }>);
  
  // Convert to array for display
  const uniqueElements = Object.values(groupedMatches);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % uniqueElements.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + uniqueElements.length) % uniqueElements.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (uniqueElements[selectedIndex]) {
            // Accept all mentions of this element
            uniqueElements[selectedIndex].mentions.forEach(match => onAccept(match));
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'Tab':
          e.preventDefault();
          if (e.shiftKey) {
            setSelectedIndex(prev => (prev - 1 + uniqueElements.length) % uniqueElements.length);
          } else {
            setSelectedIndex(prev => (prev + 1) % uniqueElements.length);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [uniqueElements, selectedIndex, onAccept, onClose]);

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

  // Don't show if no unlinked elements
  if (uniqueElements.length === 0) {
    onClose();
    return null;
  }

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      event: 'bg-purple-100 text-purple-800 border-purple-200',
      character: 'bg-blue-100 text-blue-800 border-blue-200',
      location: 'bg-green-100 text-green-800 border-green-200',
      family: 'bg-orange-100 text-orange-800 border-orange-200',
      collective: 'bg-pink-100 text-pink-800 border-pink-200',
      species: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      institution: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      object: 'bg-red-100 text-red-800 border-red-200',
      creature: 'bg-amber-100 text-amber-800 border-amber-200',
      trait: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      zone: 'bg-teal-100 text-teal-800 border-teal-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const handleElementClick = (group: typeof uniqueElements[0]) => {
    // When clicked, link all mentions of this element
    group.mentions.forEach(match => onAccept(match));
  };

  return (
    <div
      ref={popoverRef}
      className="relative z-50 bg-white rounded-lg shadow-xl border border-gray-200 max-w-md overflow-hidden"
      style={position ? { top: position.top, left: position.left } : {}}
    >
      <div className="p-3 border-b border-gray-200 bg-gradient-to-r from-green-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium text-gray-700">
              Available Elements to Link
            </span>
            <div className="text-xs text-gray-500 mt-0.5">
              {uniqueElements.length} unique element{uniqueElements.length !== 1 ? 's' : ''} detected ({unlinkedMatches.length} total mention{unlinkedMatches.length !== 1 ? 's' : ''})
            </div>
          </div>
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

      <div className="max-h-96 overflow-y-auto">
        {uniqueElements.map((group, index) => (
          <div
            key={group.element.id}
            className={`flex items-start gap-3 p-3 transition-colors cursor-pointer border-l-4 ${
              index === selectedIndex 
                ? 'bg-green-50 border-green-500 hover:bg-green-100' 
                : 'hover:bg-gray-50 border-transparent hover:border-gray-300'
            }`}
            onClick={() => handleElementClick(group)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <div className="flex-shrink-0 mt-1">
              <CategoryIcon 
                category={group.elementType} 
                className="text-lg text-green-600"
              />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">
                  {group.element.name}
                </span>
                {group.mentions.length > 1 && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                    {group.mentions.length} mentions
                  </span>
                )}
                <span className={`text-xs px-2 py-0.5 rounded-full border ${getCategoryColor(group.elementType)}`}>
                  {group.elementType}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                  {Math.round(group.confidence * 100)}% match
                </span>
              </div>
              
              {group.element.description && (
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                  {group.element.description}
                </p>
              )}
              
              <div className="text-xs text-gray-400 mt-2">
                Found: {group.mentions.map(m => `"${m.text}"`).join(', ')}
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                // Reject all mentions of this element
                group.mentions.forEach(match => onReject(match));
              }}
              className="flex-shrink-0 text-gray-400 hover:text-red-600"
              title="Ignore all mentions"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
        <div className="flex items-center justify-between">
          <span>
            <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Click to link element • Esc to close
          </span>
        </div>
      </div>
    </div>
  );
}