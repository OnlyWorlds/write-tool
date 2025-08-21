import { useEffect, useState, useRef } from 'react';
import { useWorldContext } from '../../contexts/WorldContext';
import type { ElementMatch } from './ElementLinker';
import './ElementDetection.css';

interface ElementDetectionLayerProps {
  content: string;
  detectedElements: ElementMatch[];
  onElementClick: (element: ElementMatch, event: React.MouseEvent) => void;
  editorRef: React.RefObject<HTMLDivElement>;
}

export function ElementDetectionLayer({ 
  content, 
  detectedElements, 
  onElementClick,
  editorRef 
}: ElementDetectionLayerProps) {
  const [indicators, setIndicators] = useState<Array<{
    element: ElementMatch;
    position: { top: number; left: number; width: number; height: number };
  }>>([]);

  // Calculate positions for detected elements
  useEffect(() => {
    if (!editorRef.current) return;

    const calculatePositions = () => {
      const editorElement = editorRef.current;
      if (!editorElement) return;

      // Get the contenteditable element within the editor
      const contentEditable = editorElement.querySelector('[contenteditable="true"]');
      if (!contentEditable) return;

      const newIndicators: typeof indicators = [];

      detectedElements.forEach(match => {
        // Skip if this is already a markdown link
        if (content.substring(match.startIndex - 1, match.startIndex) === '[' &&
            content.substring(match.endIndex, match.endIndex + 1) === ']') {
          return;
        }

        // Try to find the text node that contains this match
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
          if (currentOffset <= match.startIndex && 
              currentOffset + nodeLength >= match.endIndex) {
            
            // Create a range for the matched text
            const range = document.createRange();
            const startOffset = match.startIndex - currentOffset;
            const endOffset = match.endIndex - currentOffset;

            try {
              range.setStart(node, startOffset);
              range.setEnd(node, endOffset);

              // Get the bounding rect for this range
              const rect = range.getBoundingClientRect();
              const editorRect = editorElement.getBoundingClientRect();

              newIndicators.push({
                element: match,
                position: {
                  top: rect.top - editorRect.top,
                  left: rect.left - editorRect.left,
                  width: rect.width,
                  height: rect.height
                }
              });
            } catch (e) {
              // Range might be invalid if text has changed
              console.warn('Could not create range for match:', match);
            }

            break;
          }

          currentOffset += nodeLength;
        }
      });

      setIndicators(newIndicators);
    };

    // Calculate positions after a short delay to ensure DOM is ready
    const timer = setTimeout(calculatePositions, 100);
    return () => clearTimeout(timer);
  }, [content, detectedElements, editorRef]);

  return (
    <div className="element-detection-overlay">
      {indicators.map((indicator, index) => {
        const { element, position } = indicator;
        const isLinked = element.isLinked;
        
        return (
          <div
            key={`${element.suggestedElement.id}-${index}`}
            className={`element-detection-indicator ${
              isLinked ? 'element-detected-linked' : 'element-detected-unlinked'
            }`}
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              width: `${position.width}px`,
              height: `${position.height}px`,
            }}
            onClick={(e) => onElementClick(element, e)}
            onContextMenu={(e) => {
              e.preventDefault();
              // Handle right-click for context menu
              onElementClick(element, e);
            }}
          >
            <div className="element-detection-tooltip">
              {isLinked ? 'Linked' : 'Click to link'} - {element.suggestedElement.category}
            </div>
          </div>
        );
      })}
    </div>
  );
}