import { create } from 'zustand';
import type { ValidationError } from '../services/ValidationService';

// Theme management
type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  initializeTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'light',
  toggleTheme: () => set((state) => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { theme: newTheme };
  }),
  setTheme: (theme) => set(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    return { theme };
  }),
  initializeTheme: () => set(() => {
    // Check localStorage first, then system preference
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
    
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    return { theme };
  }),
}));

interface SidebarState {
  expandedCategories: Set<string>;
  selectedElementId: string | null;
  filterText: string;
  createModalOpen: boolean;
  createModalCategory: string | null;
  helpModalOpen: boolean;
  showEmptyCategories: boolean;
  sortAlphabetically: boolean;
  toggleCategory: (category: string) => void;
  selectElement: (id: string | null) => void;
  setFilterText: (text: string) => void;
  openCreateModal: (category: string) => void;
  closeCreateModal: () => void;
  openHelpModal: () => void;
  closeHelpModal: () => void;
  expandAllCategories: (categories: string[]) => void;
  toggleAllCategories: (categories: string[]) => void;
  toggleShowEmptyCategories: () => void;
  toggleSortMode: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  expandedCategories: new Set(),
  selectedElementId: null,
  filterText: '',
  createModalOpen: false,
  createModalCategory: null,
  helpModalOpen: false,
  showEmptyCategories: true,
  sortAlphabetically: false,
  toggleCategory: (category) => set((state) => {
    const newExpanded = new Set(state.expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    return { expandedCategories: newExpanded };
  }),
  selectElement: (id) => set({ selectedElementId: id }),
  setFilterText: (text) => set({ filterText: text }),
  openCreateModal: (category) => set({ createModalOpen: true, createModalCategory: category }),
  closeCreateModal: () => set({ createModalOpen: false, createModalCategory: null }),
  openHelpModal: () => set({ helpModalOpen: true }),
  closeHelpModal: () => set({ helpModalOpen: false }),
  expandAllCategories: (categories) => set({ expandedCategories: new Set(categories) }),
  toggleAllCategories: (categories) => set((state) => {
    // If any categories are expanded, collapse all. Otherwise, expand all.
    const anyExpanded = categories.some(cat => state.expandedCategories.has(cat));
    if (anyExpanded) {
      return { expandedCategories: new Set() };
    } else {
      return { expandedCategories: new Set(categories) };
    }
  }),
  toggleShowEmptyCategories: () => set((state) => ({ showEmptyCategories: !state.showEmptyCategories })),
  toggleSortMode: () => set((state) => ({ sortAlphabetically: !state.sortAlphabetically })),
}));

interface EditorState {
  selectedFieldId: string | null;
  editMode: 'edit' | 'showcase' | 'network' | 'write';
  localEdits: Map<string, any>; // elementId:fieldName -> value
  hasUnsavedChanges: boolean;
  validationErrors: Map<string, ValidationError[]>; // elementId -> errors
  hiddenFields: Set<string>; // fieldNames to hide in showcase mode
  selectField: (id: string | null) => void;
  toggleMode: () => void;
  setMode: (mode: 'edit' | 'showcase' | 'network' | 'write') => void;
  setFieldValue: (elementId: string, fieldName: string, value: any) => void;
  clearEdits: () => void;
  getEditedValue: (elementId: string, fieldName: string) => any | undefined;
  setValidationErrors: (elementId: string, errors: ValidationError[]) => void;
  clearValidationErrors: () => void;
  getFieldError: (elementId: string, fieldName: string) => string | null;
  toggleFieldVisibility: (fieldName: string) => void;
  isFieldVisible: (fieldName: string) => boolean;
  resetHiddenFields: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  selectedFieldId: null,
  editMode: 'edit',
  localEdits: new Map(),
  hasUnsavedChanges: false,
  validationErrors: new Map(),
  hiddenFields: new Set(),
  selectField: (id) => set({ selectedFieldId: id }),
  toggleMode: () => set((state) => {
    // Cycle through modes: edit -> showcase -> network -> write -> edit
    // Note: write mode is only available for narrative elements, handled in UI
    const modes: Array<'edit' | 'showcase' | 'network' | 'write'> = ['edit', 'showcase', 'network', 'write'];
    const currentIndex = modes.indexOf(state.editMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    return {
      editMode: modes[nextIndex],
      hiddenFields: new Set() // Reset hidden fields when toggling mode
    };
  }),
  setMode: (mode) => set({ 
    editMode: mode,
    hiddenFields: new Set() // Reset hidden fields when changing mode
  }),
  setFieldValue: (elementId, fieldName, value) => set((state) => {
    const newEdits = new Map(state.localEdits);
    const key = `${elementId}:${fieldName}`;
    newEdits.set(key, value);
    return { 
      localEdits: newEdits,
      hasUnsavedChanges: true
    };
  }),
  clearEdits: () => set({ 
    localEdits: new Map(), 
    hasUnsavedChanges: false 
  }),
  getEditedValue: (elementId, fieldName) => {
    const key = `${elementId}:${fieldName}`;
    return get().localEdits.get(key);
  },
  setValidationErrors: (elementId, errors) => set((state) => {
    const newErrors = new Map(state.validationErrors);
    if (errors.length > 0) {
      newErrors.set(elementId, errors);
    } else {
      newErrors.delete(elementId);
    }
    return { validationErrors: newErrors };
  }),
  clearValidationErrors: () => set({ validationErrors: new Map() }),
  getFieldError: (elementId, fieldName) => {
    const errors = get().validationErrors.get(elementId);
    if (!errors) return null;
    const fieldError = errors.find(e => e.field === fieldName);
    return fieldError ? fieldError.message : null;
  },
  toggleFieldVisibility: (fieldName) => set((state) => {
    const newHiddenFields = new Set(state.hiddenFields);
    if (newHiddenFields.has(fieldName)) {
      newHiddenFields.delete(fieldName);
    } else {
      newHiddenFields.add(fieldName);
    }
    return { hiddenFields: newHiddenFields };
  }),
  isFieldVisible: (fieldName) => {
    return !get().hiddenFields.has(fieldName);
  },
  resetHiddenFields: () => set({ hiddenFields: new Set() })
}));