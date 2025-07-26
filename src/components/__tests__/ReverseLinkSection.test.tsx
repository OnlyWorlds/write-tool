import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ReverseLinkSection } from '../ReverseLinkSection';
import type { Element } from '../../types/world';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

let mockElements = new Map<string, Element>();

// Mock the useWorldContext hook
vi.mock('../../contexts/WorldContext', () => ({
  useWorldContext: () => ({
    worldKey: 'test',
    pin: 'test',
    metadata: null,
    elements: mockElements,
    categories: new Map(),
    isAuthenticated: true,
    isLoading: false,
    error: null,
    authenticate: vi.fn(),
    logout: vi.fn(),
    updateElement: vi.fn(),
    createElement: vi.fn(),
    deleteElement: vi.fn(),
    saveElement: vi.fn(),
  }),
}));

describe('ReverseLinkSection', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    
    // Reset mock elements for each test
    mockElements = new Map<string, Element>([
      ['char-1', {
        id: 'char-1',
        name: 'Alice',
        category: 'characters',
        locationId: 'loc-1',
      }],
      ['char-2', {
        id: 'char-2',
        name: 'Bob',
        category: 'characters',
        locationId: 'loc-1',
      }],
      ['loc-1', {
        id: 'loc-1',
        name: 'Town Square',
        category: 'locations',
        inhabitants: ['char-1', 'char-2'],
      }],
      ['faction-1', {
        id: 'faction-1',
        name: 'The Guild',
        category: 'factions',
        members: ['char-1'],
      }],
    ]);
  });
  
  it('renders reverse links for an element', () => {
    render(
      <BrowserRouter>
        <ReverseLinkSection elementId="loc-1" />
      </BrowserRouter>
    );
    
    expect(screen.getByText('References')).toBeInTheDocument();
    expect(screen.getByText('Located in (2)')).toBeInTheDocument();
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });
  
  it('renders multiple relationship groups', () => {
    render(
      <BrowserRouter>
        <ReverseLinkSection elementId="char-1" />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Inhabits (1)')).toBeInTheDocument();
    expect(screen.getByText('Member of (1)')).toBeInTheDocument();
    expect(screen.getByText('Town Square')).toBeInTheDocument();
    expect(screen.getByText('The Guild')).toBeInTheDocument();
  });
  
  it('renders nothing when no reverse links exist', () => {
    // Update mockElements for this specific test
    mockElements.clear();
    mockElements.set('isolated-1', {
      id: 'isolated-1',
      name: 'Isolated',
      category: 'test',
    });
    
    const { container } = render(
      <BrowserRouter>
        <ReverseLinkSection elementId="isolated-1" />
      </BrowserRouter>
    );
    
    expect(container.firstChild).toBeNull();
  });
  
  it('navigates to element when clicked', () => {
    render(
      <BrowserRouter>
        <ReverseLinkSection elementId="loc-1" />
      </BrowserRouter>
    );
    
    fireEvent.click(screen.getByText('Alice'));
    
    expect(mockNavigate).toHaveBeenCalledWith('/element/char-1');
  });
  
  it('shows category initial in element buttons', () => {
    render(
      <BrowserRouter>
        <ReverseLinkSection elementId="loc-1" />
      </BrowserRouter>
    );
    
    const aliceButton = screen.getByRole('button', { name: /Alice/i });
    expect(aliceButton).toHaveTextContent('C'); // Characters category
  });
});