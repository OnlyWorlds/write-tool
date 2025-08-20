import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useDebounce } from 'use-debounce';
import { useWorldContext } from '../../contexts/WorldContext';
import { StoryEditor, type StoryEditorRef } from './StoryEditor';
import { ElementLinker, type ElementMatch } from './ElementLinker';
import { SuggestionPopover } from './SuggestionPopover';
import type { Element } from '../../types/world';

interface EnhancedStoryEditorProps {
  element: Element;
  onSave: (content: string) => Promise<boolean>;
  onContentChange?: (content: string) => void;
  onDetectionChange?: (detected: number, linked: number) => void;
  onShowSuggestions?: () => void;
  className?: string;
}

export interface EnhancedStoryEditorRef extends StoryEditorRef {
  insertLinkAtCursor: (elementId: string, elementName: string, elementType: string) => void;
  showSuggestions: () => void;
  getSuggestions: () => ElementMatch[];
}

export const EnhancedStoryEditor = forwardRef<EnhancedStoryEditorRef, EnhancedStoryEditorProps>(
  ({ element, onSave, onContentChange, onDetectionChange, onShowSuggestions, className = '' }, ref) => {
    const { elements } = useWorldContext();
    const storyEditorRef = useRef<StoryEditorRef>(null);
    const [content, setContent] = useState(element.story || '');
    const [debouncedContent] = useDebounce(content, 1000); // Debounce for detection
    const [elementLinker, setElementLinker] = useState<ElementLinker | null>(null);
    const [suggestions, setSuggestions] = useState<ElementMatch[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [ignoredMatches, setIgnoredMatches] = useState<Set<string>>(new Set());
    const [acceptedMatches, setAcceptedMatches] = useState<Set<string>>(new Set());

    // Initialize ElementLinker
    useEffect(() => {
      const linkedIds = [
        ...(element.events || []),
        ...(element.characters || []),
        ...(element.locations || []),
        ...(element.families || []),
        ...(element.collectives || []),
      ];
      const linker = new ElementLinker(elements, linkedIds);
      setElementLinker(linker);
    }, [elements, element]);

    // Detect elements in content
    useEffect(() => {
      if (!elementLinker || !debouncedContent) return;

      const detectedMatches = elementLinker.detectElementMentions(debouncedContent);
      
      // Filter out already accepted or ignored matches
      const filteredMatches = detectedMatches.filter(match => {
        const matchKey = `${match.startIndex}-${match.suggestedElement.id}`;
        return !acceptedMatches.has(matchKey) && !ignoredMatches.has(matchKey);
      });

      setSuggestions(filteredMatches);
      
      // Count linked elements (those that are already linked to the narrative)
      const linkedCount = filteredMatches.filter(match => {
        const linkedIds = [
          ...(element.events || []),
          ...(element.characters || []),
          ...(element.locations || []),
          ...(element.families || []),
          ...(element.collectives || []),
        ];
        return linkedIds.includes(match.suggestedElement.id);
      }).length;
      
      // Notify parent of detection changes
      onDetectionChange?.(filteredMatches.length, linkedCount);
    }, [debouncedContent, elementLinker, acceptedMatches, ignoredMatches, element, onDetectionChange]);

    const handleContentChange = (newContent: string) => {
      setContent(newContent);
      onContentChange?.(newContent);
    };

    const handleAcceptSuggestion = (match: ElementMatch) => {
      if (!elementLinker) return;

      // Mark as accepted
      const matchKey = `${match.startIndex}-${match.suggestedElement.id}`;
      setAcceptedMatches(prev => new Set(prev).add(matchKey));

      // Replace the text with a markdown link
      const currentContent = storyEditorRef.current?.getContent() || content;
      const beforeMatch = currentContent.substring(0, match.startIndex);
      const afterMatch = currentContent.substring(match.endIndex);
      const link = elementLinker.createMarkdownLink(match.suggestedElement, match.elementType);
      
      const newContent = beforeMatch + link + afterMatch;
      storyEditorRef.current?.setContent(newContent);
      handleContentChange(newContent);

      // Remove this suggestion
      setSuggestions(prev => prev.filter(s => s !== match));
      if (suggestions.length <= 1) {
        setShowSuggestions(false);
      }
    };

    const handleRejectSuggestion = (match: ElementMatch) => {
      // Mark as ignored
      const matchKey = `${match.startIndex}-${match.suggestedElement.id}`;
      setIgnoredMatches(prev => new Set(prev).add(matchKey));

      // Remove this suggestion
      setSuggestions(prev => prev.filter(s => s !== match));
      if (suggestions.length <= 1) {
        setShowSuggestions(false);
      }
    };

    const insertLinkAtCursor = (elementId: string, elementName: string, elementType: string) => {
      if (!elementLinker || !storyEditorRef.current) return;

      const currentContent = storyEditorRef.current.getContent();
      const link = `[${elementName}](${elementType}:${elementId})`;
      
      // For now, append at the end (MDXEditor doesn't expose cursor position easily)
      // In a real implementation, you'd need to integrate with MDXEditor's API
      const newContent = currentContent + ' ' + link;
      storyEditorRef.current.setContent(newContent);
      handleContentChange(newContent);
    };

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      getContent: () => storyEditorRef.current?.getContent() || content,
      setContent: (newContent: string) => {
        storyEditorRef.current?.setContent(newContent);
        handleContentChange(newContent);
      },
      focus: () => storyEditorRef.current?.focus(),
      insertLinkAtCursor,
      showSuggestions: () => setShowSuggestions(true),
      getSuggestions: () => suggestions,
    }));

    return (
      <div className={`relative ${className}`}>
        <StoryEditor
          ref={storyEditorRef}
          element={element}
          onSave={onSave}
          onContentChange={handleContentChange}
        />

        {showSuggestions && suggestions.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto">
              <SuggestionPopover
                matches={suggestions}
                onAccept={handleAcceptSuggestion}
                onReject={handleRejectSuggestion}
                onClose={() => setShowSuggestions(false)}
              />
            </div>
          </div>
        )}
      </div>
    );
  }
);