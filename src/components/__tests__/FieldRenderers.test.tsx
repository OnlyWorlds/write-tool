import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FieldRenderer } from '../FieldRenderers';
import { WorldProvider } from '../../contexts/WorldContext';
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
  useSidebarStore: vi.fn(() => ({
    selectElement: vi.fn(),
    expandedCategories: new Set(),
    selectedElementId: null,
    filterText: '',
    toggleCategory: vi.fn(),
    openCreateModal: vi.fn(),
    setFilterText: vi.fn(),
  })),
  useEditorStore: vi.fn(() => ({
    selectedFieldId: null,
    editMode: 'edit',
    localEdits: new Map(),
    hasUnsavedChanges: false,
    selectField: vi.fn(),
    toggleMode: vi.fn(),
    setFieldValue: vi.fn(),
    clearEdits: vi.fn(),
    getEditedValue: vi.fn(),
  })),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <WorldProvider>
      {children}
    </WorldProvider>
  </BrowserRouter>
);

describe('FieldRenderer', () => {
  describe('View Mode', () => {
    it('should render URL as clickable link', () => {
      render(
        <TestWrapper>
          <FieldRenderer
            fieldName="website"
            value="https://example.com"
            mode="view"
          />
        </TestWrapper>
      );
      
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://example.com');
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('should render boolean as Yes/No with indicator', () => {
      render(
        <TestWrapper>
          <FieldRenderer
            fieldName="is_public"
            value={true}
            mode="view"
          />
        </TestWrapper>
      );
      
      // is_public is still rendered as boolean even though OnlyWorlds doesn't have boolean type
      expect(screen.getByText('Yes')).toBeInTheDocument();
    });

    // Tags aren't part of OnlyWorlds spec - removed test

    it('should render number with formatting', () => {
      render(
        <TestWrapper>
          <FieldRenderer
            fieldName="population"
            value={1000000}
            mode="view"
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('1,000,000')).toBeInTheDocument();
    });

    it('should render empty values as "No value"', () => {
      render(
        <TestWrapper>
          <FieldRenderer
            fieldName="description"
            value=""
            mode="view"
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('No value')).toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    it('should render boolean as checkbox', () => {
      const onChange = vi.fn();
      render(
        <TestWrapper>
          <FieldRenderer
            fieldName="is_public"
            value={true}
            mode="edit"
            onChange={onChange}
          />
        </TestWrapper>
      );
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
      
      fireEvent.click(checkbox);
      expect(onChange).toHaveBeenCalledWith(false);
    });

    it('should render number as number input', () => {
      const onChange = vi.fn();
      render(
        <TestWrapper>
          <FieldRenderer
            fieldName="age"
            value={25}
            mode="edit"
            onChange={onChange}
          />
        </TestWrapper>
      );
      
      const input = screen.getByDisplayValue('25');
      expect(input).toHaveAttribute('type', 'number');
      
      fireEvent.change(input, { target: { value: '30' } });
      expect(onChange).toHaveBeenCalledWith(30);
    });

    it('should render URL as URL input', () => {
      const onChange = vi.fn();
      render(
        <TestWrapper>
          <FieldRenderer
            fieldName="website"
            value="https://example.com"
            mode="edit"
            onChange={onChange}
          />
        </TestWrapper>
      );
      
      const input = screen.getByDisplayValue('https://example.com');
      expect(input).toHaveAttribute('type', 'url');
      expect(input).toHaveAttribute('placeholder', 'https://example.com');
    });

    // Tags aren't part of OnlyWorlds spec - removed test

    it('should render textarea for description fields', () => {
      const onChange = vi.fn();
      render(
        <TestWrapper>
          <FieldRenderer
            fieldName="description"
            value="A long description"
            mode="edit"
            onChange={onChange}
          />
        </TestWrapper>
      );
      
      const textarea = screen.getByDisplayValue('A long description');
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    it('should render select with options from schema', () => {
      const onChange = vi.fn();
      render(
        <TestWrapper>
          <FieldRenderer
            fieldName="supertype"
            value="Hero"
            elementCategory="character"
            mode="edit"
            onChange={onChange}
          />
        </TestWrapper>
      );
      
      // Supertype is a combobox field with custom input and datalist options
      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeInTheDocument();
      expect(combobox).toHaveValue('Hero');
      expect(combobox).toHaveAttribute('list', 'supertype-list');
      
      // Check that the datalist exists with Hero option
      const datalist = document.getElementById('supertype-list');
      expect(datalist).toBeInTheDocument();
      expect(datalist?.querySelector('option[value="Hero"]')).toBeInTheDocument();
    });
  });

  describe('Type Detection', () => {
    it('should detect URL fields by name pattern', () => {
      render(
        <TestWrapper>
          <FieldRenderer
            fieldName="image_url"
            value="not-a-url"
            mode="view"
          />
        </TestWrapper>
      );
      
      // Should still try to render as URL even if value is not valid URL
      expect(screen.getByText('not-a-url')).toBeInTheDocument();
    });

    it('should detect boolean fields by name pattern', () => {
      render(
        <TestWrapper>
          <FieldRenderer
            fieldName="is_public"
            value={false}
            mode="view"
          />
        </TestWrapper>
      );
      
      // is_public is explicitly handled as boolean type for UI purposes
      expect(screen.getByText('No')).toBeInTheDocument();
    });

    it('should detect number fields by name pattern', () => {
      render(
        <TestWrapper>
          <FieldRenderer
            fieldName="age"
            value="25"
            mode="view"
          />
        </TestWrapper>
      );
      
      expect(screen.getByText('25')).toBeInTheDocument();
    });

    it('should detect link fields by name pattern', () => {
      render(
        <TestWrapper>
          <FieldRenderer
            fieldName="locationId"
            value="element-id-123"
            mode="view"
          />
        </TestWrapper>
      );
      
      // Should show unknown element since we don't have mock data
      expect(screen.getByText('Unknown element (element-id-123)')).toBeInTheDocument();
    });

    it('should detect links fields by name pattern', () => {
      render(
        <TestWrapper>
          <FieldRenderer
            fieldName="inhabitantsIds"
            value={['id1', 'id2']}
            mode="view"
          />
        </TestWrapper>
      );
      
      // Should show unknown elements since we don't have mock data
      expect(screen.getByText('Unknown element (id1)')).toBeInTheDocument();
      expect(screen.getByText('Unknown element (id2)')).toBeInTheDocument();
    });
  });

  describe('Link Field Editing', () => {
    it('should render link field as dropdown in edit mode', () => {
      const onChange = vi.fn();
      render(
        <TestWrapper>
          <FieldRenderer
            fieldName="locationId"
            value=""
            elementCategory="character"
            mode="edit"
            onChange={onChange}
          />
        </TestWrapper>
      );
      
      // Should render a select dropdown for link field
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(screen.getByText('Select element...')).toBeInTheDocument();
      expect(screen.getByText('Choose an element to link to')).toBeInTheDocument();
    });

    it('should render multi-link field as multi-select in edit mode', () => {
      const onChange = vi.fn();
      render(
        <TestWrapper>
          <FieldRenderer
            fieldName="speciesIds"
            value={[]}
            elementCategory="character"
            mode="edit"
            onChange={onChange}
          />
        </TestWrapper>
      );
      
      // Should render a select for adding elements
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(screen.getByText('Add element...')).toBeInTheDocument();
      expect(screen.getByText('Add multiple elements to create relationships')).toBeInTheDocument();
    });

    it('should NOT render birthplace as link field when value is text', () => {
      const onChange = vi.fn();
      render(
        <TestWrapper>
          <FieldRenderer
            fieldName="birthplace"
            value="Some City"
            elementCategory="character"
            mode="edit"
            onChange={onChange}
          />
        </TestWrapper>
      );
      
      // Should render as text input, not dropdown
      const input = screen.getByDisplayValue('Some City');
      expect(input).toHaveAttribute('type', 'text');
      expect(input).toHaveAttribute('placeholder', 'Enter text...');
    });
    
    it('should render birthplace as link field when value is UUID', () => {
      const onChange = vi.fn();
      render(
        <TestWrapper>
          <FieldRenderer
            fieldName="birthplace"
            value="element-456"
            elementCategory="character"
            mode="edit"
            onChange={onChange}
          />
        </TestWrapper>
      );
      
      // Should render a select dropdown for link field
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });
  });
});