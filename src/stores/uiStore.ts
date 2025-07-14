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
  selectField: (id: string | null) => void;
  toggleMode: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  selectedFieldId: null,
  editMode: 'edit',
  selectField: (id) => set({ selectedFieldId: id }),
  toggleMode: () => set((state) => ({ 
    editMode: state.editMode === 'edit' ? 'showcase' : 'edit' 
  })),
}));