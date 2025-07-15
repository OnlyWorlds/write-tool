import { create } from 'zustand';

interface SidebarState {
  expandedCategories: Set<string>;
  selectedElementId: string | null;
  filterText: string;
  toggleCategory: (category: string) => void;
  selectElement: (id: string | null) => void;
  setFilterText: (text: string) => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  expandedCategories: new Set(),
  selectedElementId: null,
  filterText: '',
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
}));

interface EditorState {
  selectedFieldId: string | null;
  editMode: 'edit' | 'showcase';
  localEdits: Map<string, any>; // elementId:fieldName -> value
  hasUnsavedChanges: boolean;
  selectField: (id: string | null) => void;
  toggleMode: () => void;
  setFieldValue: (elementId: string, fieldName: string, value: any) => void;
  clearEdits: () => void;
  getEditedValue: (elementId: string, fieldName: string) => any | undefined;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  selectedFieldId: null,
  editMode: 'edit',
  localEdits: new Map(),
  hasUnsavedChanges: false,
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
  }
}));