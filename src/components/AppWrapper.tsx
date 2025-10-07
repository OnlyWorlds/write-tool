import { useEffect } from 'react';
import { BrowserRouter, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { WorldProvider } from '../contexts/WorldContext';
import { App } from './App';

function RedirectHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    const redirect = sessionStorage.redirect;
    if (redirect) {
      delete sessionStorage.redirect;
      // Remove /write-tool prefix before navigating
      const path = redirect.replace('/write-tool', '');
      navigate(path, { replace: true });
    }
  }, [navigate]);

  return null;
}

export function AppWrapper() {
  return (
    <BrowserRouter basename="/write-tool">
      <RedirectHandler />
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