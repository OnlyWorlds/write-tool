# Project Instructions

## Import Core Rules
@../../claude-core/CLAUDE.md
@../../claude-core/rules/

## Project-Specific Instructions

### Task Management System
**CRITICAL**: This project uses Claude Task Master for structured task management.

**Task Location**: `.taskmaster/tasks/`
- Tasks are stored in `task_001.txt` through `task_010.txt`
- Each task has: Title, Description, Details, Test Strategy, Priority, Status, Dependencies
- Tasks include subtasks marked with `[ ]` for completion tracking

**Task Management Rules**:
1. **ALWAYS** check `.taskmaster/tasks/` for current task status before starting work
2. **NEVER** use TodoWrite tool - use the actual taskmaster task files instead
3. **ALWAYS** update task status in the actual task files when completing work
4. **REFERENCE** tasks by their number (e.g., "Task 007: Reverse Link Display System")
5. **FOLLOW** the exact specifications in each task file


### Task Update Process
When completing work:
1. Update the task status from "pending" to "completed"
2. Mark subtasks as `[x]` when finished
3. Add implementation notes if needed
4. Move to next pending task

### Core Project Context
- **OnlyWorlds Browse Tool** - Web app for viewing/editing structured world data
- **Tech Stack**: Astro + React, Tailwind CSS, Zustand, OnlyWorlds API
- **Current Phase**: Phase 2 (Advanced Editing) - 90% complete
- **Key Features**: Authentication, Element CRUD, Field Type Rendering, Link Fields, Search/Filter

### OnlyWorlds Framework Essentials
**OnlyWorlds** is an open-source standard for portable world-building data (v0.20.10)

**Core Concepts**:
- **Elements**: All world content consists of "elements" with standardized properties
- **Categories**: 24 element types (see complete list below)
- **Typing Hierarchy**: Category → Type → Subtype (e.g., Character → Human → Noble)
- **Schema-Based**: JSON with strict validation via YAML schemas

**Element Structure**:
- **Base Properties**: id, name, description, image_url, tags, timestamps, is_public
- **Category-Specific Fields**: Each category adds specialized properties
- **Relationships**: Elements connect via ID references (location_id, faction_ids, etc.)

**Complete Element Categories**: 
- **Character**: Individual actors (people, NPCs, protagonists) with species, age, status, personality, skills, relationships
- **Creature**: Non-human entities (animals, monsters, mythical beings)
- **Object**: Physical items (weapons, tools, artifacts) with type, subtype, rarity, properties
- **Location**: Places and geographical features with coordinates, terrain, climate, population 
- **Institution**: Organizations, governments, companies with type, structure, members
- **Collective**: Groups, tribes, armies, crews
- **Family**: Bloodlines, houses, dynasties
- **Title**: Ranks, positions, noble titles 
- **Trait**: Characteristics, personality aspects, qualities
- **Ability**: Powers, skills, magical abilities
- **Language**: Communication systems, dialects
- **Law**: Rules, regulations, customs 
- **Species**: Races, ethnicities, biological classifications
- **Phenomenon**: Natural or supernatural occurrences
- **Event**: Historical moments, battles, ceremonies with time, participants, outcomes
- **Construct**: Complex concepts, situations, abstract ideas 
- **Zone**: Defined spaces, districts, magical areas
- **Relation**: Connections between elements
- **Marker**: Points of interest, waypoints
- **Pin**: Map markers and annotations 
- **Narrative**: Stories, lore, written accounts
- **Map**: Cartographic representations
- **World**: The container for all elements with metadata

**Data Philosophy**:
- "Build anywhere, use any way" - data portability is core
- Open-source and community-driven development
- Creator owns their data, tools just interpret it
- Designed for interoperability between different applications

### Development Standards
- Follow existing code patterns and component structure
- Use TypeScript interfaces from `/src/types/world.ts`
- Implement comprehensive testing for each feature
- Follow the PRD specifications for UI/UX requirements
