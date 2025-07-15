import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FieldRenderer } from '../FieldRenderers';

describe('FieldRenderer', () => {
  describe('View Mode', () => {
    it('should render URL as clickable link', () => {
      render(
        <FieldRenderer
          fieldName="website"
          value="https://example.com"
          mode="view"
        />
      );
      
      const link = screen.getByRole('link');
      expect(link).toHaveAttribute('href', 'https://example.com');
      expect(link).toHaveAttribute('target', '_blank');
    });

    it('should render boolean as Yes/No with indicator', () => {
      render(
        <FieldRenderer
          fieldName="is_public"
          value={true}
          mode="view"
        />
      );
      
      expect(screen.getByText('Yes')).toBeInTheDocument();
    });

    it('should render tags as chips', () => {
      render(
        <FieldRenderer
          fieldName="tags"
          value={['fantasy', 'adventure', 'magic']}
          mode="view"
        />
      );
      
      expect(screen.getByText('fantasy')).toBeInTheDocument();
      expect(screen.getByText('adventure')).toBeInTheDocument();
      expect(screen.getByText('magic')).toBeInTheDocument();
    });

    it('should render number with formatting', () => {
      render(
        <FieldRenderer
          fieldName="population"
          value={1000000}
          mode="view"
        />
      );
      
      expect(screen.getByText('1,000,000')).toBeInTheDocument();
    });

    it('should render empty values as "No value"', () => {
      render(
        <FieldRenderer
          fieldName="description"
          value=""
          mode="view"
        />
      );
      
      expect(screen.getByText('No value')).toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    it('should render boolean as checkbox', () => {
      const onChange = vi.fn();
      render(
        <FieldRenderer
          fieldName="is_public"
          value={true}
          mode="edit"
          onChange={onChange}
        />
      );
      
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
      
      fireEvent.click(checkbox);
      expect(onChange).toHaveBeenCalledWith(false);
    });

    it('should render number as number input', () => {
      const onChange = vi.fn();
      render(
        <FieldRenderer
          fieldName="age"
          value={25}
          mode="edit"
          onChange={onChange}
        />
      );
      
      const input = screen.getByDisplayValue('25');
      expect(input).toHaveAttribute('type', 'number');
      
      fireEvent.change(input, { target: { value: '30' } });
      expect(onChange).toHaveBeenCalledWith(30);
    });

    it('should render URL as URL input', () => {
      const onChange = vi.fn();
      render(
        <FieldRenderer
          fieldName="website"
          value="https://example.com"
          mode="edit"
          onChange={onChange}
        />
      );
      
      const input = screen.getByDisplayValue('https://example.com');
      expect(input).toHaveAttribute('type', 'url');
      expect(input).toHaveAttribute('placeholder', 'https://example.com');
    });

    it('should render tags as comma-separated input', () => {
      const onChange = vi.fn();
      render(
        <FieldRenderer
          fieldName="tags"
          value={['fantasy', 'adventure']}
          mode="edit"
          onChange={onChange}
        />
      );
      
      const input = screen.getByDisplayValue('fantasy, adventure');
      
      fireEvent.change(input, { target: { value: 'fantasy, adventure, magic' } });
      expect(onChange).toHaveBeenCalledWith(['fantasy', 'adventure', 'magic']);
    });

    it('should render textarea for description fields', () => {
      const onChange = vi.fn();
      render(
        <FieldRenderer
          fieldName="description"
          value="A long description"
          mode="edit"
          onChange={onChange}
        />
      );
      
      const textarea = screen.getByDisplayValue('A long description');
      expect(textarea.tagName).toBe('TEXTAREA');
    });

    it('should render select with options from schema', () => {
      const onChange = vi.fn();
      render(
        <FieldRenderer
          fieldName="type"
          value="Hero"
          elementCategory="character"
          mode="edit"
          onChange={onChange}
        />
      );
      
      // Should have dropdown with character types
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      expect(screen.getByText('Hero')).toBeInTheDocument();
    });
  });

  describe('Type Detection', () => {
    it('should detect URL fields by name pattern', () => {
      render(
        <FieldRenderer
          fieldName="image_url"
          value="not-a-url"
          mode="view"
        />
      );
      
      // Should still try to render as URL even if value is not valid URL
      expect(screen.getByText('not-a-url')).toBeInTheDocument();
    });

    it('should detect boolean fields by name pattern', () => {
      render(
        <FieldRenderer
          fieldName="is_active"
          value={true}
          mode="view"
        />
      );
      
      expect(screen.getByText('Yes')).toBeInTheDocument();
    });

    it('should detect number fields by name pattern', () => {
      render(
        <FieldRenderer
          fieldName="age"
          value="25"
          mode="view"
        />
      );
      
      expect(screen.getByText('25')).toBeInTheDocument();
    });
  });
});