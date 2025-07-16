import { create } from 'zustand';
import type { ValidationError } from '../services/ValidationService';

interface SidebarState {
  expandedCategories: Set<string>;
  selectedElementId: string | null;
  filterText: string;
  createModalOpen: boolean;
  createModalCategory: string | null;
  toggleCategory: (category: string) => void;
  selectElement: (id: string | null) => void;
  setFilterText: (text: string) => void;
  openCreateModal: (category: string) => void;
  closeCreateModal: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  expandedCategories: new Set(),
  selectedElementId: null,
  filterText: '',
  createModalOpen: false,
  createModalCategory: null,
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
}));

interface EditorState {
  selectedFieldId: string | null;
  editMode: 'edit' | 'showcase';
  localEdits: Map<string, any>; // elementId:fieldName -> value
  hasUnsavedChanges: boolean;
  validationErrors: Map<string, ValidationError[]>; // elementId -> errors
  selectField: (id: string | null) => void;
  toggleMode: () => void;
  setFieldValue: (elementId: string, fieldName: string, value: any) => void;
  clearEdits: () => void;
  getEditedValue: (elementId: string, fieldName: string) => any | undefined;
  setValidationErrors: (elementId: string, errors: ValidationError[]) => void;
  clearValidationErrors: () => void;
  getFieldError: (elementId: string, fieldName: string) => string | null;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  selectedFieldId: null,
  editMode: 'edit',
  localEdits: new Map(),
  hasUnsavedChanges: false,
  validationErrors: new Map(),
  selectField: (id) => set({ selectedFieldId: id }),
  toggleMode: () => set((state) => ({ 
    editMode: state.editMode === 'edit' ? 'showcase' : 'edit' 
  })),
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
  }
}));