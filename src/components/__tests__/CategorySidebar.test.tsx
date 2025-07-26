import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategorySidebar } from '../CategorySidebar';
import { WorldProvider } from '../../contexts/WorldContext';
import { useSidebarStore } from '../../stores/uiStore';
import { BrowserRouter } from 'react-router-dom';

// Mock the API service
vi.mock('../../services/ApiService', () => ({
  ApiService: {
    validateCredentials: vi.fn(),
    fetchWorldMetadata: vi.fn(),
    fetchAllElements: vi.fn(),
    createElement: vi.fn(),
    updateElement: vi.fn(),
    deleteElement: vi.fn(),
  },
  organizeElementsByCategory: vi.fn(() => new Map()),
}));

// Mock the stores
vi.mock('../../stores/uiStore', () => ({
  useSidebarStore: vi.fn(),
}));

// Mock the context
vi.mock('../../contexts/WorldContext', () => ({
  WorldProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useWorldContext: () => ({
    categories: new Map([
      ['characters', [
        { id: '1', name: 'Hero Bob', type: 'Hero', description: 'A brave warrior' },
        { id: '2', name: 'Villain Joe', type: 'Villain', description: 'Evil mastermind' }
      ]],
      ['locations', [
        { id: '3', name: 'Castle Town', type: 'City', description: 'Main city' },
        { id: '4', name: 'Dark Forest', type: 'Wilderness', description: 'Spooky woods' }
      ]]
    ])
  })
}));

// Test wrapper with Router
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('CategorySidebar', () => {
  const mockSetFilterText = vi.fn();
  const mockToggleCategory = vi.fn();
  const mockSelectElement = vi.fn();
  const mockOpenCreateModal = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the sidebar store
    (useSidebarStore as any).mockReturnValue({
      expandedCategories: new Set(['characters']),
      selectedElementId: null,
      filterText: '',
      toggleCategory: mockToggleCategory,
      selectElement: mockSelectElement,
      openCreateModal: mockOpenCreateModal,
      setFilterText: mockSetFilterText,
    });
  });

  it('should render search input', () => {
    render(<TestWrapper><CategorySidebar /></TestWrapper>);
    
    expect(screen.getByPlaceholderText('Search elements... (press / to focus)')).toBeInTheDocument();
  });

  it('should show all categories when no filter', () => {
    render(<TestWrapper><CategorySidebar /></TestWrapper>);
    
    expect(screen.getByText('characters')).toBeInTheDocument();
    expect(screen.getByText('locations')).toBeInTheDocument();
  });

  it('should filter elements based on search text', () => {
    // Mock with search text
    (useSidebarStore as any).mockReturnValue({
      expandedCategories: new Set(['characters']),
      selectedElementId: null,
      filterText: 'Hero',
      toggleCategory: mockToggleCategory,
      selectElement: mockSelectElement,
      openCreateModal: mockOpenCreateModal,
      setFilterText: mockSetFilterText,
    });

    render(<TestWrapper><CategorySidebar /></TestWrapper>);
    
    // Should show characters category with Hero Bob
    expect(screen.getByText('characters')).toBeInTheDocument();
    expect(screen.getByText('Hero Bob')).toBeInTheDocument();
    
    // Should not show locations category (no matches)
    expect(screen.queryByText('locations')).not.toBeInTheDocument();
  });

  it('should show element counts with search results', () => {
    // Mock with search text
    (useSidebarStore as any).mockReturnValue({
      expandedCategories: new Set(['characters']),
      selectedElementId: null,
      filterText: 'Hero',
      toggleCategory: mockToggleCategory,
      selectElement: mockSelectElement,
      openCreateModal: mockOpenCreateModal,
      setFilterText: mockSetFilterText,
    });

    render(<TestWrapper><CategorySidebar /></TestWrapper>);
    
    // Should show "1 / 2" indicating 1 match out of 2 total
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('/ 2')).toBeInTheDocument();
  });

  it('should clear search when X button is clicked', () => {
    // Mock with search text
    (useSidebarStore as any).mockReturnValue({
      expandedCategories: new Set(['characters']),
      selectedElementId: null,
      filterText: 'Hero',
      toggleCategory: mockToggleCategory,
      selectElement: mockSelectElement,
      openCreateModal: mockOpenCreateModal,
      setFilterText: mockSetFilterText,
    });

    render(<TestWrapper><CategorySidebar /></TestWrapper>);
    
    const clearButton = screen.getByTitle('Clear search');
    fireEvent.click(clearButton);
    
    expect(mockSetFilterText).toHaveBeenCalledWith('');
  });

  it('should show no results message when no matches', () => {
    // Mock with search text that matches nothing
    (useSidebarStore as any).mockReturnValue({
      expandedCategories: new Set(['characters']),
      selectedElementId: null,
      filterText: 'nonexistent',
      toggleCategory: mockToggleCategory,
      selectElement: mockSelectElement,
      openCreateModal: mockOpenCreateModal,
      setFilterText: mockSetFilterText,
    });

    render(<TestWrapper><CategorySidebar /></TestWrapper>);
    
    expect(screen.getByText('No elements found matching "nonexistent"')).toBeInTheDocument();
  });

  it('should expand categories when searching', () => {
    // Mock with search text and collapsed categories
    (useSidebarStore as any).mockReturnValue({
      expandedCategories: new Set(), // No expanded categories
      selectedElementId: null,
      filterText: 'Hero',
      toggleCategory: mockToggleCategory,
      selectElement: mockSelectElement,
      openCreateModal: mockOpenCreateModal,
      setFilterText: mockSetFilterText,
    });

    render(<TestWrapper><CategorySidebar /></TestWrapper>);
    
    // Should show Hero Bob even though category is not expanded
    expect(screen.getByText('Hero Bob')).toBeInTheDocument();
  });
});