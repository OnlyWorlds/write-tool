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

### Development Standards
- Follow existing code patterns and component structure
- Use TypeScript interfaces from `/src/types/world.ts`
- Implement comprehensive testing for each feature
- Follow the PRD specifications for UI/UX requirements
