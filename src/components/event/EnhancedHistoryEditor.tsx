import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useDebounce } from 'use-debounce';
import { useWorldContext } from '../../contexts/WorldContext';
import { HistoryEditor, type HistoryEditorRef } from './HistoryEditor';
import { EventLinker, type ElementMatch } from './EventLinker';
import { EventSuggestionPopover } from './EventSuggestionPopover';
import './EventHighlights.css';
import type { Element } from '../../types/world';

interface EnhancedHistoryEditorProps {
  element: Element;
  onSave: (content: string) => Promise<boolean>;
  onContentChange?: (content: string) => void;
  onDetectionChange?: (detected: number, linked: number) => void;
  onFieldUpdate?: (fieldName: string, value: any) => void;
  className?: string;
  popupAnchorRef?: React.RefObject<HTMLElement>;
  autosaveEnabled?: boolean;
}

export interface EnhancedHistoryEditorRef extends HistoryEditorRef {
  insertLinkAtCursor: (elementId: string, elementName: string, elementType: string) => void;
  showSuggestions: () => void;
  getSuggestions: () => ElementMatch[];
  refreshHighlights: () => void;
  clearHighlights: () => void;
  setHighlightsEnabled: (enabled: boolean) => void;
}

export const EnhancedHistoryEditor = forwardRef<EnhancedHistoryEditorRef, EnhancedHistoryEditorProps>(
  ({ element, onSave, onContentChange, onDetectionChange, onFieldUpdate, className = '', popupAnchorRef, autosaveEnabled = true }, ref) => {
    const { elements } = useWorldContext();
    const historyEditorRef = useRef<HistoryEditorRef>(null);
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const [content, setContent] = useState(element.history || '');
    const [debouncedContent] = useDebounce(content, 1000); // Debounce for detection
    const [elementLinker, setElementLinker] = useState<EventLinker | null>(null);
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

    // Initialize EventLinker - re-initialize when element fields change
    useEffect(() => {
      // Collect all linked element IDs from Event's Involves fields
      // Note: API returns fields WITHOUT 'Ids' suffix
      const linkedIds = [
        ...(element.abilities || element.abilitiesIds || []),
        ...(element.characters || element.charactersIds || []),
        ...(element.collectives || element.collectivesIds || []),
        ...(element.constructs || element.constructsIds || []),
        ...(element.creatures || element.creaturesIds || []),
        ...(element.families || element.familiesIds || []),
        ...(element.institutions || element.institutionsIds || []),
        ...(element.languages || element.languagesIds || []),
        ...(element.locations || element.locationsIds || []),
        ...(element.objects || element.objectsIds || []),
        ...(element.phenomena || element.phenomenaIds || []),
        ...(element.relations || element.relationsIds || []),
        ...(element.species || element.speciesIds || []),
        ...(element.titles || element.titlesIds || []),
        ...(element.traits || element.traitsIds || []),
        ...(element.zones || element.zonesIds || []),
      ];
      
      // Initialize EventLinker with collected linked IDs
      const linker = new EventLinker(elements, linkedIds);
      setElementLinker(linker);
    }, [
      elements, 
      element,
      // Track all the multilink fields to re-init when they change
      element.abilities,
      element.characters,
      element.collectives,
      element.constructs,
      element.creatures,
      element.families,
      element.institutions,
      element.languages,
      element.locations,
      element.objects,
      element.phenomena,
      element.relations,
      element.species,
      element.titles,
      element.traits,
      element.zones,
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
    
    // Manual highlight refresh function (forceRefresh bypasses the enabled check)
    const refreshHighlights = (forceRefresh = false) => {
      if (!forceRefresh && !highlightsEnabled) return;
      if (!elementLinker || !content) return;
      
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
          CSS.highlights.set('event-element-unlinked', unlinkedHighlight);
        }
        
        if (linkedRanges.length > 0) {
          const linkedHighlight = new Highlight(...linkedRanges);
          CSS.highlights.set('event-element-linked', linkedHighlight);
        }
      } catch (e) {
        // Silently fail if highlights can't be applied
      }
    };
    
    // Clear all CSS highlights
    const clearCSSHighlights = () => {
      if (CSS.highlights) {
        CSS.highlights.delete('event-element-unlinked');
        CSS.highlights.delete('event-element-linked');
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
        setTimeout(() => refreshHighlights(false), 100);
      }
    };
    
    // Helper to get the field name for a category - Event's Involves fields
    const getCategoryFieldName = (category: string): string | null => {
      const categoryToField: Record<string, string> = {
        'ability': 'abilities',
        'character': 'characters',
        'collective': 'collectives',
        'construct': 'constructs',
        'creature': 'creatures',
        'family': 'families',
        'institution': 'institutions',
        'language': 'languages',
        'location': 'locations',
        'object': 'objects',
        'phenomenon': 'phenomena',
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
      if (!elementLinker || !historyEditorRef.current) return;

      // First ensure the editor is focused
      historyEditorRef.current.focus();
      
      // Get current content and append the element name with a space
      const currentContent = historyEditorRef.current.getContent() || '';
      
      // Add a space before the element name
      const updatedContent = currentContent + ' ' + elementName;
      
      // Set the new content
      historyEditorRef.current.setContent(updatedContent);
      
      // Move cursor to the end after a short delay
      setTimeout(() => {
        historyEditorRef.current?.focus();
        // Try to place cursor at end
        const editorDiv = editorContainerRef.current?.querySelector('[contenteditable="true"]');
        if (editorDiv) {
          const range = document.createRange();
          const selection = window.getSelection();
          range.selectNodeContents(editorDiv);
          range.collapse(false); // false = collapse to end
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }, 100);
      
      // Notify parent of content change
      handleContentChange(updatedContent);
    };

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      getContent: () => historyEditorRef.current?.getContent() || content,
      setContent: (newContent: string) => {
        historyEditorRef.current?.setContent(newContent);
        handleContentChange(newContent);
      },
      focus: () => historyEditorRef.current?.focus(),
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
          // Immediately refresh highlights when enabling (force refresh to bypass enabled check)
          setTimeout(() => refreshHighlights(true), 50);
        } else {
          clearCSSHighlights();
        }
      },
    }));




    return (
      <div ref={editorContainerRef} className={`relative ${className}`} style={{ position: 'relative' }}>
        <HistoryEditor
          ref={historyEditorRef}
          element={element}
          onSave={onSave}
          onContentChange={handleContentChange}
          autosaveEnabled={autosaveEnabled}
        />

        {showSuggestions && suggestions.length > 0 && popupPosition && (
          <div className="fixed inset-0 z-50 pointer-events-none">
            <div className="pointer-events-auto absolute" style={{ top: popupPosition.top, left: popupPosition.left }}>
              <EventSuggestionPopover
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