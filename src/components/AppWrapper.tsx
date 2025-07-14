import { WorldProvider } from '../contexts/WorldContext';
import { App } from './App';

export function AppWrapper() {
  return (
    <WorldProvider>
      <App />
    </WorldProvider>
  );
}