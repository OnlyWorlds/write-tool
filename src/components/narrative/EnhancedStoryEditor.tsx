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
  onFieldUpdate?: (fieldName: string, value: any) => void;
  className?: string;
}

export interface EnhancedStoryEditorRef extends StoryEditorRef {
  insertLinkAtCursor: (elementId: string, elementName: string, elementType: string) => void;
  showSuggestions: () => void;
  getSuggestions: () => ElementMatch[];
}

export const EnhancedStoryEditor = forwardRef<EnhancedStoryEditorRef, EnhancedStoryEditorProps>(
  ({ element, onSave, onContentChange, onDetectionChange, onShowSuggestions, onFieldUpdate, className = '' }, ref) => {
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
      // Collect all linked element IDs from narrative fields
      // Note: API returns fields WITHOUT 'Ids' suffix (e.g., events, characters)
      const linkedIds = [
        ...(element.events || element.eventsIds || []),
        ...(element.characters || element.charactersIds || []),
        ...(element.locations || element.locationsIds || []),
        ...(element.families || element.familiesIds || []),
        ...(element.collectives || element.collectivesIds || []),
        ...(element.objects || element.objectsIds || []),
        ...(element.species || element.speciesIds || []),
        ...(element.creatures || element.creaturesIds || []),
        ...(element.institutions || element.institutionsIds || []),
        ...(element.traits || element.traitsIds || []),
        ...(element.zones || element.zonesIds || []),
        ...(element.abilities || element.abilitiesIds || []),
        ...(element.phenomena || element.phenomenaIds || []),
        ...(element.languages || element.languagesIds || []),
        ...(element.relations || element.relationsIds || []),
        ...(element.titles || element.titlesIds || []),
        ...(element.constructs || element.constructsIds || []),
        ...(element.laws || element.lawsIds || []),
        // Also include single reference fields (these don't have 'Id' suffix in API)
        ...(element.protagonist || element.protagonistId ? [element.protagonist || element.protagonistId] : []),
        ...(element.antagonist || element.antagonistId ? [element.antagonist || element.antagonistId] : []),
        ...(element.narrator || element.narratorId ? [element.narrator || element.narratorId] : []),
        ...(element.conservator || element.conservatorId ? [element.conservator || element.conservatorId] : []),
        ...(element.parent_narrative || element.parentNarrativeId ? [element.parent_narrative || element.parentNarrativeId] : []),
      ];
      
      console.log('[DEBUG] Narrative element fields:', {
        events: element.events,
        characters: element.characters,
        locations: element.locations,
        allFields: Object.keys(element),
      });
      console.log('[DEBUG] Collected linkedIds:', linkedIds);
      console.log('[DEBUG] LinkedIds count:', linkedIds.length);
      
      const linker = new ElementLinker(elements, linkedIds);
      setElementLinker(linker);
    }, [elements, element]);

    // Detect elements in content
    useEffect(() => {
      if (!elementLinker || !debouncedContent) return;

      const detectedMatches = elementLinker.detectElementMentions(debouncedContent);
      
      console.log('[DEBUG] Detected matches:', detectedMatches.map(m => ({
        text: m.text,
        id: m.suggestedElement.id,
        name: m.suggestedElement.name,
        isLinked: m.isLinked,
      })));
      
      // Count linked elements BEFORE filtering (from all detected matches)
      const linkedCount = detectedMatches.filter(match => match.isLinked).length;
      console.log('[DEBUG] Linked count from detected matches:', linkedCount);
      
      // Filter out already accepted or ignored matches
      const filteredMatches = detectedMatches.filter(match => {
        const matchKey = `${match.startIndex}-${match.suggestedElement.id}`;
        return !acceptedMatches.has(matchKey) && !ignoredMatches.has(matchKey);
      });

      setSuggestions(filteredMatches);
      
      // Count new (unlinked) elements from filtered matches
      const newCount = filteredMatches.filter(match => !match.isLinked).length;
      
      console.log('[DEBUG] Detection results:', { newCount, linkedCount, totalDetected: newCount + linkedCount });
      
      // Notify parent with total detected count and linked count
      // Total detected = new unlinked + already linked
      onDetectionChange?.(newCount + linkedCount, linkedCount);
    }, [debouncedContent, elementLinker, acceptedMatches, ignoredMatches, element, onDetectionChange]);

    const handleContentChange = (newContent: string) => {
      setContent(newContent);
      onContentChange?.(newContent);
    };

    const handleAcceptSuggestion = async (match: ElementMatch) => {
      if (!elementLinker) return;

      // Mark as accepted
      const matchKey = `${match.startIndex}-${match.suggestedElement.id}`;
      setAcceptedMatches(prev => new Set(prev).add(matchKey));

      // Only insert a link if the element is not already linked
      if (!match.isLinked) {
        // Replace the text with a markdown link
        const currentContent = storyEditorRef.current?.getContent() || content;
        const beforeMatch = currentContent.substring(0, match.startIndex);
        const afterMatch = currentContent.substring(match.endIndex);
        const link = elementLinker.createMarkdownLink(match.suggestedElement, match.elementType);
        
        const newContent = beforeMatch + link + afterMatch;
        storyEditorRef.current?.setContent(newContent);
        handleContentChange(newContent);
        
        // Also add to the appropriate multilink field
        const fieldName = getCategoryFieldName(match.elementType);
        if (fieldName && onFieldUpdate) {
          const currentIds = element[fieldName] || [];
          if (!currentIds.includes(match.suggestedElement.id)) {
            const updatedIds = [...currentIds, match.suggestedElement.id];
            // Update the parent with the new field value
            onFieldUpdate(fieldName, updatedIds);
          }
        }
      }

      // Remove this suggestion
      setSuggestions(prev => prev.filter(s => s !== match));
      if (suggestions.length <= 1) {
        setShowSuggestions(false);
      }
    };
    
    // Helper to get the field name for a category
    const getCategoryFieldName = (category: string): string | null => {
      // Map categories to their multilink field names
      const categoryToField: Record<string, string> = {
        'event': 'events',
        'character': 'characters',
        'location': 'locations',
        'family': 'families',
        'collective': 'collectives',
        'object': 'objects',
        'species': 'species',
        'creature': 'creatures',
        'institution': 'institutions',
        'trait': 'traits',
        'zone': 'zones',
        'ability': 'abilities',
        'phenomenon': 'phenomena',
        'language': 'languages',
        'relation': 'relations',
        'title': 'titles',
        'construct': 'constructs',
        'law': 'laws',
      };
      return categoryToField[category] || null;
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