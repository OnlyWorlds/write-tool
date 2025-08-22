import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { useDebounce } from 'use-debounce';
import { useWorldContext } from '../../contexts/WorldContext';
import { StoryEditor, type StoryEditorRef } from './StoryEditor';
import { ElementLinker, type ElementMatch } from './ElementLinker';
import { SuggestionPopover } from './SuggestionPopover';
// import { ElementDetectionLayer } from './ElementDetectionLayer'; // Commented out - using direct DOM manipulation instead
import type { Element } from '../../types/world';
import './ElementDetection.css';

interface EnhancedStoryEditorProps {
  element: Element;
  onSave: (content: string) => Promise<boolean>;
  onContentChange?: (content: string) => void;
  onDetectionChange?: (detected: number, linked: number) => void;
  onFieldUpdate?: (fieldName: string, value: any) => void;
  className?: string;
}

export interface EnhancedStoryEditorRef extends StoryEditorRef {
  insertLinkAtCursor: (elementId: string, elementName: string, elementType: string) => void;
  showSuggestions: () => void;
  getSuggestions: () => ElementMatch[];
}

export const EnhancedStoryEditor = forwardRef<EnhancedStoryEditorRef, EnhancedStoryEditorProps>(
  ({ element, onSave, onContentChange, onDetectionChange, onFieldUpdate, className = '' }, ref) => {
    const { elements } = useWorldContext();
    const storyEditorRef = useRef<StoryEditorRef>(null);
    const editorContainerRef = useRef<HTMLDivElement>(null);
    const [content, setContent] = useState(element.story || '');
    const [debouncedContent] = useDebounce(content, 1000); // Debounce for detection
    const [elementLinker, setElementLinker] = useState<ElementLinker | null>(null);
    const [suggestions, setSuggestions] = useState<ElementMatch[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [ignoredMatches, setIgnoredMatches] = useState<Set<string>>(new Set());

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

    // Detect elements in content and apply visual indicators
    useEffect(() => {
      if (!elementLinker || !debouncedContent) return;

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
      
      // Apply visual indicators to detected text spans
      setTimeout(() => applyVisualIndicators(filteredMatches), 100);
    }, [debouncedContent, elementLinker, ignoredMatches, element, onDetectionChange]);

    // Handle clicks on markdown links for navigation
    useEffect(() => {
      if (!editorContainerRef.current) return;

      const handleLinkClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        
        // Check if clicked element is a link with our special format
        if (target.tagName === 'A' && target.getAttribute('href')?.includes(':')) {
          e.preventDefault();
          
          const href = target.getAttribute('href') || '';
          const [category, elementId] = href.split(':');
          
          if ((e.ctrlKey || e.metaKey) && elementId) {
            // Navigate to the element
            const targetElement = elements.get(elementId);
            if (targetElement) {
              // Open element in new tab or navigate
              const elementUrl = `/browse-tool/element/${elementId}`;
              if (e.shiftKey) {
                // Shift+Ctrl+Click opens in new tab
                window.open(elementUrl, '_blank');
              } else {
                // Ctrl+Click navigates in same tab
                window.location.href = elementUrl;
              }
            }
          }
        }
      };

      const container = editorContainerRef.current;
      container.addEventListener('click', handleLinkClick);
      
      return () => {
        container.removeEventListener('click', handleLinkClick);
      };
    }, [elements]);

    const handleContentChange = (newContent: string) => {
      setContent(newContent);
      onContentChange?.(newContent);
    };

    const handleAcceptSuggestion = async (match: ElementMatch) => {
      if (!elementLinker) return;

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

      const link = `[${elementName}](${elementType}:${elementId})`;
      
      // Use MDXEditor's insertMarkdown method to insert at cursor position
      storyEditorRef.current.insertMarkdown(link);
      
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
      showSuggestions: () => setShowSuggestions(true),
      getSuggestions: () => suggestions,
    }));

    // Apply visual indicators to detected elements in the editor
    const applyVisualIndicators = (matches: ElementMatch[]) => {
      if (!editorContainerRef.current) return;
      
      // Remove existing indicators
      const existingIndicators = editorContainerRef.current.querySelectorAll('.element-highlight-wrapper');
      existingIndicators.forEach(el => {
        const textNode = document.createTextNode(el.textContent || '');
        el.parentNode?.replaceChild(textNode, el);
      });
      
      const contentEditable = editorContainerRef.current.querySelector('[contenteditable="true"]');
      if (!contentEditable) return;
      
      // Sort matches by position (reverse order to maintain positions)
      const sortedMatches = [...matches].sort((a, b) => b.startIndex - a.startIndex);
      
      sortedMatches.forEach(match => {
        const walker = document.createTreeWalker(
          contentEditable,
          NodeFilter.SHOW_TEXT,
          null
        );
        
        let currentOffset = 0;
        let node: Node | null;
        
        while (node = walker.nextNode()) {
          const textContent = node.textContent || '';
          const nodeLength = textContent.length;
          
          // Check if this node contains our match
          if (currentOffset <= match.startIndex && currentOffset + nodeLength >= match.endIndex) {
            const startOffset = match.startIndex - currentOffset;
            const endOffset = match.endIndex - currentOffset;
            
            // Skip if this is already inside a link
            const parent = node.parentElement;
            if (parent?.tagName === 'A') break;
            
            try {
              // Split the text node and wrap the matched text
              const textNode = node as Text;
              const beforeText = textContent.substring(0, startOffset);
              const matchedText = textContent.substring(startOffset, endOffset);
              const afterText = textContent.substring(endOffset);
              
              const wrapper = document.createElement('span');
              wrapper.className = `element-highlight-wrapper ${match.isLinked ? 'element-detected-linked' : 'element-detected-unlinked'}`;
              wrapper.textContent = matchedText;
              wrapper.dataset.elementId = match.suggestedElement.id;
              wrapper.dataset.elementType = match.elementType;
              wrapper.style.cursor = 'pointer';
              
              // Add click handler
              wrapper.addEventListener('click', (e) => {
                if ((e.ctrlKey || e.metaKey) && match.isLinked) {
                  e.preventDefault();
                  const elementUrl = `/browse-tool/element/${match.suggestedElement.id}`;
                  if (e.shiftKey) {
                    window.open(elementUrl, '_blank');
                  } else {
                    window.location.href = elementUrl;
                  }
                }
              });
              
              const parent = textNode.parentNode;
              if (parent) {
                const beforeNode = document.createTextNode(beforeText);
                const afterNode = document.createTextNode(afterText);
                
                parent.replaceChild(afterNode, textNode);
                parent.insertBefore(wrapper, afterNode);
                parent.insertBefore(beforeNode, wrapper);
              }
            } catch (e) {
              console.warn('Could not apply visual indicator:', e);
            }
            
            break;
          }
          
          currentOffset += nodeLength;
        }
      });
    };

    const handleElementDetectionClick = (match: ElementMatch, event: React.MouseEvent) => {
      // Handle Ctrl+Click for navigation
      if ((event.ctrlKey || event.metaKey) && match.isLinked) {
        event.preventDefault();
        const elementUrl = `/browse-tool/element/${match.suggestedElement.id}`;
        if (event.shiftKey) {
          // Shift+Ctrl+Click opens in new tab
          window.open(elementUrl, '_blank');
        } else {
          // Ctrl+Click navigates in same tab
          window.location.href = elementUrl;
        }
      } else if (!match.isLinked) {
        // Regular click on unlinked element shows linking option
        handleAcceptSuggestion(match);
      }
    };

    return (
      <div ref={editorContainerRef} className={`relative ${className}`}>
        <StoryEditor
          ref={storyEditorRef}
          element={element}
          onSave={onSave}
          onContentChange={handleContentChange}
        />
        
        {/* Visual indicators overlay - commented out in favor of direct DOM manipulation
        <ElementDetectionLayer
          content={content}
          detectedElements={suggestions}
          onElementClick={handleElementDetectionClick}
          editorRef={editorContainerRef}
        /> */}

        {showSuggestions && suggestions.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
            <div className="pointer-events-auto">
              <SuggestionPopover
                matches={suggestions}
                onAccept={handleAcceptSuggestion}
                onReject={handleRejectSuggestion}
                onClose={() => setShowSuggestions(false)}
                onLinkAll={() => {
                  // Link all unlinked suggestions
                  const unlinkedSuggestions = suggestions.filter(s => !s.isLinked);
                  unlinkedSuggestions.forEach(suggestion => handleAcceptSuggestion(suggestion));
                  setShowSuggestions(false);
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  }
);