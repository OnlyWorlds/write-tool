import Fuse from 'fuse.js';
import type { Element } from '../../types/world';

export interface ElementMatch {
  text: string;
  startIndex: number;
  endIndex: number;
  confidence: number;
  suggestedElement: Element;
  elementType: string;
  isLinked: boolean; // true if element is in any Involves field
}

export interface LinkSuggestion {
  match: ElementMatch;
  markdownLink: string;
}

export class EventLinker {
  private fuseInstances: Map<string, Fuse<Element>>;
  private elements: Map<string, Element>;
  private linkedElements: Set<string>;

  constructor(elements: Map<string, Element>, linkedElementIds: string[] = []) {
    this.elements = elements;
    this.linkedElements = new Set(linkedElementIds);
    this.fuseInstances = new Map();
    
  //  console.log('[EventLinker] Initialized with linkedElementIds:', linkedElementIds);
  //  console.log('[EventLinker] LinkedElements Set size:', this.linkedElements.size);
    
    this.initializeFuseInstances();
  }

  private initializeFuseInstances() {
    // Group elements by category - include ALL OnlyWorlds element types
    const categories = [
      'ability', 'character', 'collective', 'construct', 'creature', 
      'event', 'family', 'institution', 'language', 'law', 
      'location', 'map', 'marker', 'narrative', 'object', 
      'phenomenon', 'pin', 'relation', 'species', 'title', 
      'trait', 'zone'
    ];
    
    categories.forEach(category => {
      const categoryElements = Array.from(this.elements.values())
        .filter(el => el.category === category);
      
      if (categoryElements.length > 0) {
        const fuse = new Fuse(categoryElements, {
          keys: ['name'],
          includeScore: true,
          threshold: 0.3, // Lower is more strict (0.0 = exact match, 1.0 = match anything)
          ignoreLocation: true,
          minMatchCharLength: 3,
          isCaseSensitive: false, // Case-insensitive matching
        });
        
        this.fuseInstances.set(category, fuse);
      }
    });
  }

  detectElementMentions(text: string): ElementMatch[] {
    const matches: ElementMatch[] = [];
    
    // Get all potential element names from the text
    const words = this.extractPotentialNames(text);
    
    words.forEach(({ word, startIndex }) => {
      // Skip very short words
      if (word.length < 3) return;
      
      // Skip if this text is already part of a markdown link
      if (this.isInsideMarkdownLink(text, startIndex, startIndex + word.length)) {
        return;
      }
      
      // Search in each category
      this.fuseInstances.forEach((fuse, category) => {
        const results = fuse.search(word);
        
        results.forEach(result => {
          if (result.score !== undefined) {
            const confidence = 1 - result.score; // Convert score to confidence (0-1)
            
            // Different thresholds for different categories
            const threshold = category === 'event' ? 0.8 : 0.7;
            
            // Boost confidence if element is already linked to narrative
            const boostedConfidence = this.linkedElements.has(result.item.id) 
              ? Math.min(confidence + 0.1, 1) 
              : confidence;
            
            if (boostedConfidence >= threshold) {
              // Simple check: is this element in any of the narrative's Involves fields?
              const isLinked = this.linkedElements.has(result.item.id);
              
              matches.push({
                text: word,
                startIndex,
                endIndex: startIndex + word.length,
                confidence: boostedConfidence,
                suggestedElement: result.item,
                elementType: category,
                isLinked: isLinked,
              });
            }
          }
        });
      });
    });
    
    // Remove duplicate matches (keep highest confidence for each position)
    return this.deduplicateMatches(matches);
  }

  private extractPotentialNames(text: string): Array<{ word: string; startIndex: number }> {
    const potentialNames: Array<{ word: string; startIndex: number }> = [];
    
    // Match capitalized words and phrases (proper nouns)
    // Use stricter boundaries - not preceded or followed by letters/numbers
    const capitalizedRegex = /(?<![a-zA-Z0-9])[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?![a-zA-Z0-9])/g;
    let match;
    
    while ((match = capitalizedRegex.exec(text)) !== null) {
      potentialNames.push({
        word: match[0],
        startIndex: match.index,
      });
    }
    
    // Also check for known element names regardless of capitalization
    // This helps catch references that might not be properly capitalized
    this.elements.forEach(element => {
      // Use stricter matching - must be surrounded by non-letter/number characters
      const nameRegex = new RegExp(`(?<![a-zA-Z0-9])${this.escapeRegex(element.name)}(?![a-zA-Z0-9])`, 'gi');
      let match: RegExpExecArray | null;
      
      while ((match = nameRegex.exec(text)) !== null) {
        // Don't add if we already have this match from capitalized search
        const exists = potentialNames.some(
          p => p.startIndex === match!.index && p.word.toLowerCase() === match![0].toLowerCase()
        );
        
        if (!exists && match.index !== undefined) {
          potentialNames.push({
            word: match[0],
            startIndex: match.index,
          });
        }
      }
    });
    
    return potentialNames;
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private deduplicateMatches(matches: ElementMatch[]): ElementMatch[] {
    // Sort by confidence (highest first)
    matches.sort((a, b) => b.confidence - a.confidence);
    
    const deduplicated: ElementMatch[] = [];
    const usedRanges: Array<{ start: number; end: number }> = [];
    
    for (const match of matches) {
      // Check if this match overlaps with any already selected match
      const overlaps = usedRanges.some(range => 
        (match.startIndex >= range.start && match.startIndex < range.end) ||
        (match.endIndex > range.start && match.endIndex <= range.end) ||
        (match.startIndex <= range.start && match.endIndex >= range.end)
      );
      
      if (!overlaps) {
        deduplicated.push(match);
        usedRanges.push({ start: match.startIndex, end: match.endIndex });
      }
    }
    
    // Sort by position for display
    return deduplicated.sort((a, b) => a.startIndex - b.startIndex);
  }

  suggestElementLinks(matches: ElementMatch[]): LinkSuggestion[] {
    return matches.map(match => ({
      match,
      markdownLink: this.createMarkdownLink(match.suggestedElement, match.elementType),
    }));
  }

  createMarkdownLink(element: Element, elementType: string): string {
    return `[${element.name}](${elementType}:${element.id})`;
  }

  insertElementReference(
    text: string,
    position: number,
    elementId: string,
    elementName: string,
    elementType: string
  ): string {
    const link = `[${elementName}](${elementType}:${elementId})`;
    return text.slice(0, position) + link + text.slice(position);
  }

  // Update linked elements when narrative changes
  updateLinkedElements(linkedElementIds: string[]) {
    this.linkedElements = new Set(linkedElementIds);
  }

  // Search for elements by name (for manual insertion)
  searchElements(query: string, category?: string): Array<{ element: Element; score: number }> {
    const results: Array<{ element: Element; score: number }> = [];
    
    if (category && this.fuseInstances.has(category)) {
      const fuse = this.fuseInstances.get(category)!;
      const searchResults = fuse.search(query);
      
      searchResults.forEach(result => {
        if (result.score !== undefined) {
          results.push({
            element: result.item,
            score: 1 - result.score,
          });
        }
      });
    } else {
      // Search all categories
      this.fuseInstances.forEach(fuse => {
        const searchResults = fuse.search(query);
        
        searchResults.forEach(result => {
          if (result.score !== undefined) {
            results.push({
              element: result.item,
              score: 1 - result.score,
            });
          }
        });
      });
    }
    
    // Sort by score (highest first) and deduplicate
    const seen = new Set<string>();
    return results
      .sort((a, b) => b.score - a.score)
      .filter(result => {
        if (seen.has(result.element.id)) return false;
        seen.add(result.element.id);
        return true;
      });
  }
  
  private extractLinkedElements(text: string): Set<string> {
    const linkedIds = new Set<string>();
    
    // Match markdown links with element references like [Name](type:id)
    const linkRegex = /\[([^\]]+)\]\(([^):]+):([^)]+)\)/g;
    let match;
    
    while ((match = linkRegex.exec(text)) !== null) {
      const elementId = match[3];
      linkedIds.add(elementId);
    }
    
    return linkedIds;
  }
  
  private isInsideMarkdownLink(text: string, startIndex: number, endIndex: number): boolean {
    // Check if the given range is inside a markdown link
    const linkRegex = /\[([^\]]+)\]\([^)]+\)/g;
    let match;
    
    while ((match = linkRegex.exec(text)) !== null) {
      const linkStart = match.index;
      const linkEnd = match.index + match[0].length;
      
      // Check if our range overlaps with this link
      if ((startIndex >= linkStart && startIndex < linkEnd) ||
          (endIndex > linkStart && endIndex <= linkEnd) ||
          (startIndex <= linkStart && endIndex >= linkEnd)) {
        return true;
      }
    }
    
    return false;
  }
}