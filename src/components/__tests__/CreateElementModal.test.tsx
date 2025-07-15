import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateElementModal } from '../CreateElementModal';
import { WorldProvider } from '../../contexts/WorldContext';
import { useSidebarStore } from '../../stores/uiStore';

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

describe('CreateElementModal', () => {
  const mockCloseModal = vi.fn();
  const mockCreateElement = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock the sidebar store
    (useSidebarStore as any).mockReturnValue({
      createModalOpen: true,
      createModalCategory: 'character',
      closeCreateModal: mockCloseModal,
    });
  });

  const MockWorldProvider = ({ children }: { children: React.ReactNode }) => (
    <WorldProvider>
      {children}
    </WorldProvider>
  );

  it('should render modal when open', () => {
    render(
      <MockWorldProvider>
        <CreateElementModal />
      </MockWorldProvider>
    );

    expect(screen.getByText('Create New Character')).toBeInTheDocument();
    expect(screen.getByLabelText('Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
  });

  it('should not render when modal is closed', () => {
    (useSidebarStore as any).mockReturnValue({
      createModalOpen: false,
      createModalCategory: null,
      closeCreateModal: mockCloseModal,
    });

    render(
      <MockWorldProvider>
        <CreateElementModal />
      </MockWorldProvider>
    );

    expect(screen.queryByText('Create New Character')).not.toBeInTheDocument();
  });

  it('should show validation error for empty name', async () => {
    render(
      <MockWorldProvider>
        <CreateElementModal />
      </MockWorldProvider>
    );

    const submitButton = screen.getByText('Create');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
  });

  it('should close modal when cancel is clicked', () => {
    render(
      <MockWorldProvider>
        <CreateElementModal />
      </MockWorldProvider>
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockCloseModal).toHaveBeenCalled();
  });

  it('should render category-specific fields', () => {
    render(
      <MockWorldProvider>
        <CreateElementModal />
      </MockWorldProvider>
    );

    // Character-specific fields should be present
    expect(screen.getByLabelText('Age')).toBeInTheDocument();
    expect(screen.getByLabelText('Gender')).toBeInTheDocument();
    // Species is now a multi-link field (speciesIds) 
    expect(screen.getByText('Species')).toBeInTheDocument();
  });
});