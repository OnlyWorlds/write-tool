import { BrowserRouter } from 'react-router-dom';
import { WorldProvider } from '../contexts/WorldContext';
import { App } from './App';

export function AppWrapper() {
  return (
    <BrowserRouter>
      <WorldProvider>
        <App />
      </WorldProvider>
    </BrowserRouter>
  );
}