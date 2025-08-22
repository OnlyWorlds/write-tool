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
  onFieldUpdate?: (fieldName: string, value: any) => void;
  className?: string;
  popupAnchorRef?: React.RefObject<HTMLElement>;
  autosaveEnabled?: boolean;
}

export interface EnhancedStoryEditorRef extends StoryEditorRef {
  insertLinkAtCursor: (elementId: string, elementName: string, elementType: string) => void;
  showSuggestions: () => void;
  getSuggestions: () => ElementMatch[];
}

export const EnhancedStoryEditor = forwardRef<EnhancedStoryEditorRef, EnhancedStoryEditorProps>(
  ({ element, onSave, onContentChange, onDetectionChange, onFieldUpdate, className = '', popupAnchorRef, autosaveEnabled = true }, ref) => {
    const { elements } = useWorldContext();
    const storyEditorRef = useRef<StoryEditorRef>(null);
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const [content, setContent] = useState(element.story || '');
    const [debouncedContent] = useDebounce(content, 1000); // Debounce for detection
    const [elementLinker, setElementLinker] = useState<ElementLinker | null>(null);
    const [suggestions, setSuggestions] = useState<ElementMatch[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [ignoredMatches, setIgnoredMatches] = useState<Set<string>>(new Set());
    const [popupPosition, setPopupPosition] = useState<{ top: number; left: number } | null>(null);

    // Initialize ElementLinker - re-initialize when element fields change
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
        ...(element.maps || element.mapsIds || []),
        ...(element.markers || element.markersIds || []),
        ...(element.narratives || element.narrativesIds || []),
        ...(element.pins || element.pinsIds || []),
        // Also include single reference fields (these don't have 'Id' suffix in API)
        ...(element.protagonist || element.protagonistId ? [element.protagonist || element.protagonistId] : []),
        ...(element.antagonist || element.antagonistId ? [element.antagonist || element.antagonistId] : []),
        ...(element.narrator || element.narratorId ? [element.narrator || element.narratorId] : []),
        ...(element.conservator || element.conservatorId ? [element.conservator || element.conservatorId] : []),
        ...(element.parent_narrative || element.parentNarrativeId ? [element.parent_narrative || element.parentNarrativeId] : []),
      ];
      
      // Initialize ElementLinker with collected linked IDs
      
      const linker = new ElementLinker(elements, linkedIds);
      setElementLinker(linker);
    }, [
      elements, 
      element,
      // Track all the multilink fields to re-init when they change
      element.events,
      element.characters,
      element.locations,
      element.families,
      element.collectives,
      element.objects,
      element.species,
      element.creatures,
      element.institutions,
      element.traits,
      element.zones,
      element.abilities,
      element.phenomena,
      element.languages,
      element.relations,
      element.titles,
      element.constructs,
      element.laws,
      element.maps,
      element.markers,
      element.narratives,
      element.pins,
    ]);

    // Detect elements in content
    useEffect(() => {
      if (!elementLinker || !debouncedContent) {
        return;
      }

      const detectedMatches = elementLinker.detectElementMentions(debouncedContent);
      
      // Filter out ignored matches
      const filteredMatches = detectedMatches.filter(match => {
        const matchKey = `${match.startIndex}-${match.suggestedElement.id}`;
        return !ignoredMatches.has(matchKey);
      });

      setSuggestions(filteredMatches);
      
      // Count unlinked and linked elements
      const unlinkedCount = filteredMatches.filter(match => !match.isLinked).length;
      const linkedCount = filteredMatches.filter(match => match.isLinked).length;
      
      // Notify parent with counts
      onDetectionChange?.(unlinkedCount + linkedCount, linkedCount);
    }, [debouncedContent, elementLinker, ignoredMatches, onDetectionChange]);


    const handleContentChange = (newContent: string) => {
      setContent(newContent);
      onContentChange?.(newContent);
    };

    const handleAcceptSuggestion = async (match: ElementMatch) => {
      if (!elementLinker) return;

      // Only link if the element is not already linked
      if (!match.isLinked) {
        // Don't modify the text content - just add to the appropriate multilink field
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
      // Map categories to their multilink field names (plural form)
      const categoryToField: Record<string, string> = {
        'ability': 'abilities',
        'character': 'characters',
        'collective': 'collectives',
        'construct': 'constructs',
        'creature': 'creatures',
        'event': 'events',
        'family': 'families',
        'institution': 'institutions',
        'language': 'languages',
        'law': 'laws',
        'location': 'locations',
        'map': 'maps',
        'marker': 'markers',
        'narrative': 'narratives',
        'object': 'objects',
        'phenomenon': 'phenomena',
        'pin': 'pins',
        'relation': 'relations',
        'species': 'species', // same singular and plural
        'title': 'titles',
        'trait': 'traits',
        'zone': 'zones',
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

      // Insert just the element name as plain text instead of markdown link
      storyEditorRef.current.insertMarkdown(elementName);
      
      // Place cursor at end of document as a fallback since precise positioning is complex
      setTimeout(() => {
        if (editorContainerRef.current) {
          const contentEditable = editorContainerRef.current.querySelector('[contenteditable="true"]');
          if (contentEditable) {
            contentEditable.focus();
            
            // Move cursor to end of content
            const selection = window.getSelection();
            if (selection) {
              const range = document.createRange();
              range.selectNodeContents(contentEditable);
              range.collapse(false); // Collapse to end
              selection.removeAllRanges();
              selection.addRange(range);
            }
          }
        }
      }, 10);
      
      // Get the updated content and notify parent
      const newContent = storyEditorRef.current.getContent();
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
      showSuggestions: () => {
        setShowSuggestions(true);
        // Calculate position when showing
        if (popupAnchorRef?.current) {
          const rect = popupAnchorRef.current.getBoundingClientRect();
          setPopupPosition({
            top: rect.bottom + 8,
            left: rect.left
          });
        }
      },
      getSuggestions: () => suggestions,
    }));




    return (
      <div ref={editorContainerRef} className={`relative ${className}`} style={{ position: 'relative' }}>
        <StoryEditor
          ref={storyEditorRef}
          element={element}
          onSave={onSave}
          onContentChange={handleContentChange}
          autosaveEnabled={autosaveEnabled}
        />

        {showSuggestions && suggestions.length > 0 && popupPosition && (
          <div className="fixed inset-0 z-50 pointer-events-none">
            <div className="pointer-events-auto absolute" style={{ top: popupPosition.top, left: popupPosition.left }}>
              <SuggestionPopover
                matches={suggestions}
                onAccept={handleAcceptSuggestion}
                onReject={handleRejectSuggestion}
                onClose={() => {
                  setShowSuggestions(false);
                  setPopupPosition(null);
                }}
                onLinkAll={() => {
                  // Link all unlinked suggestions
                  const unlinkedSuggestions = suggestions.filter(s => !s.isLinked);
                  unlinkedSuggestions.forEach(suggestion => handleAcceptSuggestion(suggestion));
                  setShowSuggestions(false);
                  setPopupPosition(null);
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }
);