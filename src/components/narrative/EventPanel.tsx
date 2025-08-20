import { useState, useMemo } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useWorldContext } from '../../contexts/WorldContext';
import type { Element } from '../../types/world';

interface EventPanelProps {
  narrative: Element;
  onEventsReorder: (eventIds: string[]) => void;
  onEventAdd: (eventId: string) => void;
  onEventRemove: (eventId: string) => void;
}

interface EventCardProps {
  event: Element;
  onRemove: () => void;
}

function SortableEventCard({ event, onRemove }: EventCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: event.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-dark-bg-tertiary rounded-lg border ${isDragging ? 'border-blue-400 shadow-lg' : 'border-gray-200 dark:border-dark-bg-border'} p-3 mb-2`}
    >
      <div className="flex items-start gap-2">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="mt-1 cursor-move text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </div>

        {/* Event content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900 dark:text-gray-200 truncate pr-2">{event.name}</h4>
            <button
              onClick={onRemove}
              className="text-red-500 hover:text-red-700 p-1"
              title="Remove event"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Date range if available */}
          {(event.start_date || event.end_date) && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {event.start_date && <span>{event.start_date}</span>}
              {event.start_date && event.end_date && <span> - </span>}
              {event.end_date && !event.start_date && <span>Until </span>}
              {event.end_date && <span>{event.end_date}</span>}
            </div>
          )}

          {/* Expandable description */}
          {event.description && (
            <div className="mt-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {isExpanded ? 'Hide' : 'Show'} description
              </button>
              {isExpanded && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-3">
                  {event.description}
                </p>
              )}
            </div>
          )}

          {/* Consequences if any */}
          {event.consequences && (
            <div className="mt-2 text-xs text-amber-600 bg-amber-50 rounded px-2 py-1">
              <span className="font-medium">Consequences:</span> {event.consequences}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function EventPanel({ narrative, onEventsReorder, onEventAdd, onEventRemove }: EventPanelProps) {
  const { elements } = useWorldContext();
  const [isAddingEvent, setIsAddingEvent] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(true); // Start collapsed by default

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get linked events
  const linkedEvents = useMemo(() => {
    if (!narrative.eventsIds || !Array.isArray(narrative.eventsIds)) return [];
    return narrative.eventsIds
      .map(eventId => elements.get(eventId))
      .filter((event): event is Element => event !== undefined && event.category === 'event');
  }, [narrative.eventsIds, elements]);

  // Get available events for adding (not already linked)
  const availableEvents = useMemo(() => {
    const linkedIds = new Set(narrative.eventsIds || []);
    return Array.from(elements.values())
      .filter(el => el.category === 'event' && !linkedIds.has(el.id))
      .filter(el => 
        searchTerm === '' || 
        el.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        el.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [elements, narrative.eventsIds, searchTerm]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && narrative.eventsIds) {
      const events = narrative.eventsIds as string[];
      const oldIndex = events.indexOf(active.id as string);
      const newIndex = events.indexOf(over?.id as string);
      
      const newOrder = arrayMove(events, oldIndex, newIndex);
      onEventsReorder(newOrder);
    }
  };

  if (isCollapsed) {
    return (
      <div className="w-12 bg-gray-50 dark:bg-dark-bg-secondary border-l border-gray-200 dark:border-dark-bg-border flex flex-col items-center py-4">
        <button
          onClick={() => setIsCollapsed(false)}
          className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
          title="Expand event panel"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 writing-mode-vertical-rl">
          Events ({linkedEvents.length})
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-gray-50 dark:bg-dark-bg-secondary border-l border-gray-200 dark:border-dark-bg-border flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-dark-bg-border bg-white dark:bg-dark-bg-tertiary">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200">Events</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400">{linkedEvents.length}</span>
            <button
              onClick={() => setIsCollapsed(true)}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400"
              title="Collapse panel"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Event list */}
      <div className="flex-1 overflow-y-auto p-4">
        {linkedEvents.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
            No events linked to this narrative yet.
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={linkedEvents.map(e => e.id)}
              strategy={verticalListSortingStrategy}
            >
              {linkedEvents.map(event => (
                <SortableEventCard
                  key={event.id}
                  event={event}
                  onRemove={() => onEventRemove(event.id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Add event section */}
      <div className="border-t border-gray-200 dark:border-dark-bg-border bg-white dark:bg-dark-bg-tertiary p-4">
        {!isAddingEvent ? (
          <button
            onClick={() => setIsAddingEvent(true)}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Event
          </button>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-dark-bg-secondary border border-gray-300 dark:border-dark-bg-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-200"
              autoFocus
            />
            <div className="max-h-48 overflow-y-auto space-y-1">
              {availableEvents.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No events found
                </p>
              ) : (
                availableEvents.slice(0, 10).map(event => (
                  <button
                    key={event.id}
                    onClick={() => {
                      onEventAdd(event.id);
                      setIsAddingEvent(false);
                      setSearchTerm('');
                    }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-dark-bg-hover rounded transition-colors"
                  >
                    <div className="font-medium text-gray-900 dark:text-gray-200">{event.name}</div>
                    {event.description && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{event.description}</div>
                    )}
                  </button>
                ))
              )}
            </div>
            <button
              onClick={() => {
                setIsAddingEvent(false);
                setSearchTerm('');
              }}
              className="w-full py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}