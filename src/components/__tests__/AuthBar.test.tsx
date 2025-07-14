import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthBar } from '../AuthBar';
import { WorldProvider } from '../../contexts/WorldContext';

// Mock the API service
vi.mock('../../services/ApiService', () => ({
  ApiService: {
    validateCredentials: vi.fn(),
    fetchWorldMetadata: vi.fn(),
    fetchAllElements: vi.fn(),
  },
  organizeElementsByCategory: vi.fn(() => new Map()),
}));

describe('AuthBar', () => {
  const renderWithProvider = () => {
    return render(
      <WorldProvider>
        <AuthBar />
      </WorldProvider>
    );
  };

  it('should render auth inputs', () => {
    renderWithProvider();
    
    expect(screen.getByPlaceholderText('api key')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('pin')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'validate' })).toBeInTheDocument();
  });

  it('should only allow numeric input', () => {
    renderWithProvider();
    
    const apiKeyInput = screen.getByPlaceholderText('api key') as HTMLInputElement;
    const pinInput = screen.getByPlaceholderText('pin') as HTMLInputElement;
    
    fireEvent.change(apiKeyInput, { target: { value: 'abc123def' } });
    expect(apiKeyInput.value).toBe('123');
    
    fireEvent.change(pinInput, { target: { value: 'x9y8z' } });
    expect(pinInput.value).toBe('98');
  });

  it('should enforce max lengths', () => {
    renderWithProvider();
    
    const apiKeyInput = screen.getByPlaceholderText('api key') as HTMLInputElement;
    const pinInput = screen.getByPlaceholderText('pin') as HTMLInputElement;
    
    fireEvent.change(apiKeyInput, { target: { value: '12345678901234' } });
    expect(apiKeyInput.value).toBe('1234567890');
    
    fireEvent.change(pinInput, { target: { value: '98765' } });
    expect(pinInput.value).toBe('9876');
  });

  it('should disable submit when fields are empty', () => {
    renderWithProvider();
    
    const submitButton = screen.getByRole('button', { name: 'validate' });
    expect(submitButton).toBeDisabled();
  });

  it('should submit when both fields are filled', async () => {
    const { ApiService } = await import('../../services/ApiService');
    ApiService.validateCredentials = vi.fn().mockResolvedValue(true);
    ApiService.fetchWorldMetadata = vi.fn().mockResolvedValue({ id: '1', name: 'Test World' });
    ApiService.fetchAllElements = vi.fn().mockResolvedValue([]);
    
    renderWithProvider();
    
    const apiKeyInput = screen.getByPlaceholderText('api key');
    const pinInput = screen.getByPlaceholderText('pin');
    
    fireEvent.change(apiKeyInput, { target: { value: '1234567890' } });
    fireEvent.change(pinInput, { target: { value: '1234' } });
    
    const submitButton = screen.getByRole('button', { name: 'validate' });
    expect(submitButton).not.toBeDisabled();
    
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(ApiService.validateCredentials).toHaveBeenCalledWith('1234567890', '1234');
    });
  });
});