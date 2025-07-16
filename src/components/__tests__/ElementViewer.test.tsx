import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ElementViewer } from '../ElementViewer';
import { ApiService } from '../../services/ApiService';
import type { Element } from '../../types/world';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockSelectElement = vi.fn();
const mockDeleteElement = vi.fn();

// Create mock functions for stores
const mockUseEditorStore = vi.fn(() => ({
  selectedFieldId: null,
  selectField: vi.fn(),
  getEditedValue: vi.fn(),
  hasUnsavedChanges: false,
  editMode: 'edit',
}));

// Mock stores
vi.mock('../../stores/uiStore', () => ({
  useSidebarStore: () => ({
    selectedElementId: 'test-element-1',
    selectElement: mockSelectElement,
  }),
  useEditorStore: () => mockUseEditorStore(),
}));

// Mock context
vi.mock('../../contexts/WorldContext', () => ({
  useWorldContext: () => ({
    worldKey: 'test-world',
    pin: 'test-pin',
    elements: new Map<string, Element>([
      ['test-element-1', {
        id: 'test-element-1',
        name: 'Test Element',
        category: 'characters',
        description: 'A test element',
      }],
    ]),
    deleteElement: mockDeleteElement,
  }),
}));

// Mock API service
vi.mock('../../services/ApiService', () => ({
  ApiService: {
    deleteElement: vi.fn(),
  },
}));

describe('ElementViewer - Delete Functionality', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to edit mode by default
    mockUseEditorStore.mockReturnValue({
      selectedFieldId: null,
      selectField: vi.fn(),
      getEditedValue: vi.fn(),
      hasUnsavedChanges: false,
      editMode: 'edit',
    });
  });
  
  it('renders delete button in edit mode', () => {
    render(
      <BrowserRouter>
        <ElementViewer />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });
  
  it('does not render delete button in showcase mode', () => {
    mockUseEditorStore.mockReturnValue({
      selectedFieldId: null,
      selectField: vi.fn(),
      getEditedValue: vi.fn(),
      hasUnsavedChanges: false,
      editMode: 'showcase',
    });
    
    render(
      <BrowserRouter>
        <ElementViewer />
      </BrowserRouter>
    );
    
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });
  
  it('shows confirmation dialog when delete button is clicked', () => {
    render(
      <BrowserRouter>
        <ElementViewer />
      </BrowserRouter>
    );
    
    fireEvent.click(screen.getByText('Delete'));
    
    expect(screen.getByText('Delete Element')).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to delete "Test Element"/)).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });
  
  it('cancels deletion when cancel button is clicked', () => {
    render(
      <BrowserRouter>
        <ElementViewer />
      </BrowserRouter>
    );
    
    fireEvent.click(screen.getByText('Delete'));
    expect(screen.getByText('Delete Element')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Delete Element')).not.toBeInTheDocument();
  });
  
  it('deletes element when confirmed', async () => {
    vi.mocked(ApiService.deleteElement).mockResolvedValue(true);
    
    render(
      <BrowserRouter>
        <ElementViewer />
      </BrowserRouter>
    );
    
    fireEvent.click(screen.getByText('Delete'));
    
    const deleteButton = screen.getAllByText('Delete')[1]; // Second Delete button in dialog
    fireEvent.click(deleteButton);
    
    await waitFor(() => {
      expect(ApiService.deleteElement).toHaveBeenCalledWith('test-world', 'test-pin', 'test-element-1');
      expect(mockDeleteElement).toHaveBeenCalledWith('test-element-1');
      expect(mockSelectElement).toHaveBeenCalledWith(null);
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
  
  it('shows error when deletion fails', async () => {
    vi.mocked(ApiService.deleteElement).mockResolvedValue(false);
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(
      <BrowserRouter>
        <ElementViewer />
      </BrowserRouter>
    );
    
    fireEvent.click(screen.getByText('Delete'));
    
    const deleteButton = screen.getAllByText('Delete')[1];
    fireEvent.click(deleteButton);
    
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('Failed to delete element. Please try again.');
    });
    
    alertSpy.mockRestore();
  });
});