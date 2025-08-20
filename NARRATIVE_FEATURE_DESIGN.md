# OnlyWorlds Browse Tool: Narrative Writing Features Design Document

## Executive Summary

This document outlines a comprehensive design for adding narrative writing capabilities to the OnlyWorlds Browse Tool. The design leverages OnlyWorlds' unique data model where Narratives and Events are first-class elements, enabling sophisticated story management that goes beyond traditional linear text editors.

## Core Concepts

### OnlyWorlds Narrative Structure
- **Narrative Elements**: Represent stories, books, campaigns, or any narrative container
- **Event Elements**: Represent scenes, chapters, or specific story moments
- **Hierarchical Organization**: Narratives can have parent/child relationships
- **Rich Relationships**: Stories connect to Characters, Locations, and all other element types
- **Timeline Integration**: Built-in temporal ordering via start/end dates

### Key Differentiators
Unlike traditional writing tools that treat stories as documents with metadata, OnlyWorlds treats every story component as a interconnected element in the world, enabling:
- True non-linear storytelling
- Character journey tracking across multiple narratives
- Location-based story views
- Relationship evolution visualization
- Timeline-aware narrative construction

## Proposed Workflows

### 1. Story Planning Workflow
**Purpose**: Help writers structure their narrative before writing

**Steps**:
1. Create main Narrative element (book/campaign)
2. Define key Events (major plot points)
3. Create chapter Narratives (with parent linkage)
4. Link Characters and Locations
5. Set timeline markers
6. Visualize story structure

**Features Needed**:
- Story structure visualizer (tree view)
- Bulk Event creation
- Drag-and-drop timeline ordering
- Template system for common structures (3-act, Hero's Journey)

### 2. Scene Writing Workflow
**Purpose**: Streamlined scene/chapter creation while writing

**Steps**:
1. Quick-create Event from within Narrative view
2. Auto-inherit context (characters present, location)
3. Write scene content (history field)
4. Set temporal markers
5. Link consequences/triggers to other Events

**Features Needed**:
- Inline Event creation
- Context awareness (current narrative, location, characters)
- Rich text editor for story/history fields
- Quick-link panels for world elements

### 3. Character Arc Workflow
**Purpose**: Track character development across the narrative

**Steps**:
1. Select character in Story Mode
2. View all Events/Narratives involving character
3. Track relationship changes
4. Monitor location journey
5. Note character growth/changes

**Features Needed**:
- Character timeline view
- Relationship evolution tracker
- Character presence heat map
- Arc notation system

### 4. World-Story Integration Workflow
**Purpose**: Seamlessly reference and incorporate world elements

**Steps**:
1. While writing, search for world elements
2. Drag elements into story context
3. Auto-create relationships
4. Track element usage
5. Ensure consistency

**Features Needed**:
- Element search panel
- Drag-and-drop element insertion
- Usage tracking dashboard
- Consistency checker

## UI/UX Design

### New Mode: Story Mode
Add "Story Mode" to the existing edit/showcase/network modes:
- Optimized layout for narrative work
- Story-specific tools and panels
- Writing-focused interface

### Layout Structure

```
+------------------+------------------+------------------+
|                  |                  |                  |
|  Story Sidebar   |   Main Editor    | Context Panel    |
|                  |                  |                  |
|  - Narrative     |  Rich Text       | - Characters     |
|    Tree          |  Editor for      |   Present        |
|  - Scene List    |  story/history   | - Location       |
|  - Quick Add     |                  | - Timeline       |
|                  |                  | - Elements       |
+------------------+------------------+------------------+
|                Timeline/Outline View (Collapsible)     |
+--------------------------------------------------------+
```

### Component Specifications

#### 1. Story Sidebar (Left)
- **Narrative Tree**: Hierarchical view of Narratives and Events
- **Scene List**: Flat list of Events in current Narrative
- **Quick Add**: Buttons for new Event, Character appearance, Location change
- **Filter/Search**: Find specific scenes or story elements

#### 2. Main Editor (Center)
- **Rich Text Editor**: For editing story/history fields
- **Metadata Bar**: Name, dates, order
- **Relationship Pills**: Visual indicators of linked elements
- **Writing Statistics**: Word count, reading time

#### 3. Context Panel (Right)
- **Character Tracker**: Characters currently in scene
- **Location Display**: Current location with quick-switch
- **Element Browser**: Searchable list of world elements
- **Relationship Manager**: Add/remove element connections

#### 4. Timeline View (Bottom)
- **Visual Timeline**: Horizontal timeline of Events
- **Zoom Controls**: Year/Month/Day granularity
- **Drag-and-Drop**: Reorder Events temporally
- **Parallel Tracks**: Show multiple narrative threads

### New Components to Build

1. **RichTextEditor**: Enhanced text editor for story/history fields
2. **StoryModeLayout**: New layout component for story mode
3. **NarrativeTreeView**: Hierarchical narrative browser
4. **TimelineComponent**: Visual timeline for Events
5. **CharacterTracker**: Track character presence and arcs
6. **QuickEventCreator**: Streamlined Event creation
7. **StoryStats**: Writing statistics component
8. **ElementInserter**: Drag-and-drop world elements

### Integration with Existing Features

1. **Extend Mode Selector**: Add 'story' to edit/showcase/network modes
2. **Enhance ElementViewer**: Story-aware rendering in story mode
3. **Extend Create Modal**: Story-specific creation flows
4. **Network View Integration**: Show narrative connections
5. **API Service**: Add story-specific endpoints if needed

## Technical Implementation Approach

### Phase 1: Core Story Mode (1-2 weeks)
- Add story mode to UI store
- Create StoryModeLayout component
- Implement RichTextEditor
- Basic narrative tree view

### Phase 2: Writing Tools (1-2 weeks)
- Quick Event creation
- Character tracker
- Element insertion
- Writing statistics

### Phase 3: Advanced Features (2-3 weeks)
- Timeline visualization
- Character arc tracking
- Story templates
- Consistency checking

### Phase 4: Polish & Integration (1 week)
- Performance optimization
- Export capabilities
- Keyboard shortcuts
- Help documentation

## Questions for Consideration

### Functional Questions
1. **Rich Text Editing**: Should the story/history fields support rich text (bold, italic, etc.) or remain plain text? What about markdown support?

2. **Version Control**: Should we track versions/drafts of Narratives and Events? How would this integrate with OnlyWorlds' data model?

3. **Collaboration**: How should simultaneous editing work? Should we show live cursors or lock sections being edited?

4. **Templates**: What story structure templates would be most valuable? Should users be able to create custom templates?

5. **Export Formats**: What export formats are needed? (Word, PDF, ePub, plain text, screenplay format?)

### Technical Questions
1. **Performance**: How many Events can we reasonably display in timeline view? Should we implement virtualization?

2. **Storage**: Should story drafts be stored locally before committing to the API? This could enable offline writing.

3. **Real-time Sync**: Should we implement WebSocket connections for real-time collaboration?

### Design Questions
1. **Mobile Considerations**: How should story mode work on mobile devices? Should we build a separate mobile writing experience?

2. **Keyboard Navigation**: What keyboard shortcuts would writers expect? Should we follow conventions from Scrivener/Word?

3. **Theme**: Should story mode have a distinct visual theme? Perhaps a more paper-like aesthetic?

### Strategic Questions
1. **Scope**: Should this be part of Browse Tool or a separate "Write Tool"?

2. **Integration**: How deeply should this integrate with the upcoming Timeline Tool mentioned in the comprehensive guide?

3. **Target Audience**: Are we primarily targeting novelists, game masters, or both? This affects feature prioritization.

4. **AI Integration**: Should we integrate AI writing assistance? How would this work with the Parse Tool's token system?

5. **Publishing**: Should we support direct publishing to platforms? Or focus on export capabilities?

## Unique Value Propositions

### For Writers
- **Never lose track of characters**: Every character's journey is tracked automatically
- **Location continuity**: Ensure characters are where they should be
- **Relationship evolution**: See how relationships change throughout the story
- **Timeline integrity**: Automatic timeline conflict detection
- **World consistency**: All story elements remain consistent with your world

### For Game Masters
- **Campaign management**: Track multiple story threads
- **Player character integration**: Players can see their character's story
- **Session planning**: Organize Events by game session
- **NPC tracking**: Monitor all character interactions
- **Location-based storytelling**: Plan adventures by location

### For World Builders
- **Story validates world**: Writing stories helps identify world-building gaps
- **Element usage tracking**: See which world elements are underutilized
- **Organic world growth**: Add world elements as needed during writing
- **Cross-narrative connections**: See how different stories interconnect

## Conclusion

Adding narrative writing features to the OnlyWorlds Browse Tool would create a unique story creation environment that leverages the power of interconnected world elements. Unlike traditional writing tools that treat stories as isolated documents, this approach treats narratives as living parts of the world, creating opportunities for deeper storytelling and world consistency.

The phased implementation approach allows for iterative development and user feedback, ensuring we build the most valuable features first. The design maintains the familiar Browse Tool interface while adding story-specific functionality that enhances rather than replaces the existing experience.

## Next Steps
1. Review and prioritize features based on user needs
2. Create detailed wireframes for Story Mode
3. Build prototype of core story editing experience
4. Gather feedback from target users (writers and GMs)
5. Iterate based on feedback
6. Implement in phases as outlined above