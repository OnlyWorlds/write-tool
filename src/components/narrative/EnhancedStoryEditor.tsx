import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useDebounce } from 'use-debounce';
import { useWorldContext } from '../../contexts/WorldContext';
import { StoryEditor, type StoryEditorRef } from './StoryEditor';
import { ElementLinker, type ElementMatch } from './ElementLinker';
import { SuggestionPopover } from './SuggestionPopover';
import './ElementHighlights.css';
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
  refreshHighlights: () => void;
  clearHighlights: () => void;
  setHighlightsEnabled: (enabled: boolean) => void;
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
    const [highlightsEnabled, setHighlightsEnabled] = useState(false);
    const [currentMatches, setCurrentMatches] = useState<ElementMatch[]>([]);
    
    // Check for CSS Highlights API support on mount
    useEffect(() => {
      if (typeof CSS !== 'undefined' && CSS.highlights) {
        console.log('CSS Custom Highlight API is supported');
      } else {
        console.log('CSS Custom Highlight API is NOT supported');
      }
    }, []);

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

    // Detect elements in content (but don't auto-highlight)
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
      setCurrentMatches(filteredMatches);
      
      // Count unlinked and linked elements
      const unlinkedCount = filteredMatches.filter(match => !match.isLinked).length;
      const linkedCount = filteredMatches.filter(match => match.isLinked).length;
      
      // Notify parent with counts
      onDetectionChange?.(unlinkedCount + linkedCount, linkedCount);
    }, [debouncedContent, elementLinker, ignoredMatches, onDetectionChange]);
    
    // Manual highlight refresh function
    const refreshHighlights = () => {
      if (!highlightsEnabled || !elementLinker || !content) return;
      
      const detectedMatches = elementLinker.detectElementMentions(content);
      const filteredMatches = detectedMatches.filter(match => {
        const matchKey = `${match.startIndex}-${match.suggestedElement.id}`;
        return !ignoredMatches.has(matchKey);
      });
      
      setCurrentMatches(filteredMatches);
      
      // Apply highlights with proper timing
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          applyCSSSHighlights(filteredMatches);
        });
      });
    };


    const handleContentChange = (newContent: string) => {
      setContent(newContent);
      onContentChange?.(newContent);
    };
    
    // Apply CSS Custom Highlights API
    const applyCSSSHighlights = (matches: ElementMatch[]) => {
      
      if (!editorContainerRef.current) return;
      if (!CSS.highlights) return;

      // Clear existing highlights
      clearCSSHighlights();

      if (matches.length === 0) return;

      // Find the contenteditable element - MDXEditor specific selectors
      const contentEditable = 
        editorContainerRef.current.querySelector('.mdxeditor-root-contenteditable') ||
        editorContainerRef.current.querySelector('.mdxeditor') ||
        editorContainerRef.current.querySelector('[contenteditable="true"]') ||
        editorContainerRef.current.querySelector('[role="textbox"]');
      
      if (!contentEditable) return;

      // Group matches by linked status
      const linkedRanges: Range[] = [];
      const unlinkedRanges: Range[] = [];

      // Create a text node walker
      const walker = document.createTreeWalker(
        contentEditable,
        NodeFilter.SHOW_TEXT,
        null
      );

      // Build a map of text content to nodes for faster lookup
      const textNodes: { node: Node; offset: number; text: string }[] = [];
      let currentOffset = 0;
      let node: Node | null;
      
      while (node = walker.nextNode()) {
        const text = node.textContent || '';
        textNodes.push({ node, offset: currentOffset, text });
        currentOffset += text.length;
      }

      // Create ranges for each match
      matches.forEach(match => {
        
        // Try to find the text in the actual DOM
        const fullText = textNodes.map(n => n.text).join('');
        const matchText = match.text.toLowerCase();
        const searchStart = Math.max(0, match.startIndex - 10); // Look a bit before expected position
        const searchEnd = Math.min(fullText.length, match.endIndex + 10); // Look a bit after
        const searchText = fullText.substring(searchStart, searchEnd).toLowerCase();
        
        // Find the actual position of this text
        const actualIndex = searchText.indexOf(matchText);
        if (actualIndex === -1) return;
        
        const actualStart = searchStart + actualIndex;
        const actualEnd = actualStart + match.text.length;
        
        // Find the text nodes that contain this match
        for (const textNode of textNodes) {
          const nodeEnd = textNode.offset + textNode.text.length;
          
          // Check if this node contains part of our match
          if (actualStart < nodeEnd && actualEnd > textNode.offset) {
            // Calculate the portion of the match within this node
            const startInNode = Math.max(0, actualStart - textNode.offset);
            const endInNode = Math.min(textNode.text.length, actualEnd - textNode.offset);
            
            try {
              const range = document.createRange();
              range.setStart(textNode.node, startInNode);
              range.setEnd(textNode.node, endInNode);
              
              if (match.isLinked) {
                linkedRanges.push(range);
              } else {
                unlinkedRanges.push(range);
              }
              break; // Found the match, move to next
            } catch (e) {
              // Silently skip if range creation fails
            }
          }
        }
      });

      // Create and register highlights
      try {
        if (unlinkedRanges.length > 0) {
          const unlinkedHighlight = new Highlight(...unlinkedRanges);
          CSS.highlights.set('element-unlinked', unlinkedHighlight);
        }
        
        if (linkedRanges.length > 0) {
          const linkedHighlight = new Highlight(...linkedRanges);
          CSS.highlights.set('element-linked', linkedHighlight);
        }
      } catch (e) {
        // Silently fail if highlights can't be applied
      }
    };
    
    // Clear all CSS highlights
    const clearCSSHighlights = () => {
      if (CSS.highlights) {
        CSS.highlights.delete('element-unlinked');
        CSS.highlights.delete('element-linked');
      }
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
      
      // Refresh highlights if enabled
      if (highlightsEnabled) {
        setTimeout(() => refreshHighlights(), 100);
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
      refreshHighlights,
      clearHighlights: clearCSSHighlights,
      setHighlightsEnabled: (enabled: boolean) => {
        setHighlightsEnabled(enabled);
        if (enabled) {
          refreshHighlights();
        } else {
          clearCSSHighlights();
        }
      },
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