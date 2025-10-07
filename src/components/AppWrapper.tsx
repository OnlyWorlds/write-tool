import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { WorldProvider } from '../contexts/WorldContext';
import { App } from './App';

export function AppWrapper() {
  return (
    <BrowserRouter basename="/write-tool">
      <WorldProvider>
        <App />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10b981',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
          }}
        />
      </WorldProvider>
    </BrowserRouter>
  );
}