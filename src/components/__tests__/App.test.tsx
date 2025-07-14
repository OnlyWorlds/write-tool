import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from '../App';
import { WorldProvider } from '../../contexts/WorldContext';

// Mock child components
vi.mock('../AuthBar', () => ({
  AuthBar: () => <div>Auth Bar</div>,
}));

describe('App', () => {
  it('should render auth bar', () => {
    render(
      <WorldProvider>
        <App />
      </WorldProvider>
    );
    
    expect(screen.getByText('Auth Bar')).toBeInTheDocument();
  });

  it('should show welcome message when not authenticated', () => {
    render(
      <WorldProvider>
        <App />
      </WorldProvider>
    );
    
    expect(screen.getByText('Welcome to the OnlyWorlds Parse Tool!')).toBeInTheDocument();
  });
});