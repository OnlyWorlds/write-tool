import { useEffect } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { useWorldContext } from '../contexts/WorldContext';
import { useEditorStore, useSidebarStore } from '../stores/uiStore';
import { AuthBar } from './AuthBar';
import { CategorySidebar } from './CategorySidebar';
import { ElementViewer } from './ElementViewer';
import { EditArea } from './EditArea';
import { CreateElementModal } from './CreateElementModal';

// Element route component that handles URL params
function ElementRoute() {
  const { elementId } = useParams<{ elementId: string }>();
  const { selectElement } = useSidebarStore();
  const { elements } = useWorldContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (elementId) {
      // Check if element exists
      if (elements.has(elementId)) {
        selectElement(elementId);
      } else {
        // If element doesn't exist, redirect to home
        navigate('/', { replace: true });
      }
    }
  }, [elementId, elements, selectElement, navigate]);

  return null;
}

// Home route component that clears selection
function HomeRoute() {
  const { selectElement } = useSidebarStore();

  useEffect(() => {
    selectElement(null);
  }, [selectElement]);

  return null;
}

export function App() {
  const { isAuthenticated, isLoading } = useWorldContext();
  const { editMode } = useEditorStore();

  return (
    <div className="min-h-screen bg-paper-50 flex flex-col">
      {/* Auth Bar at top */}
      <AuthBar />
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {isAuthenticated ? (
          <>
            {/* Sidebar */}
            <CategorySidebar />

            {/* Working Area - Split View */}
            <div className="flex-1 flex">
              {/* Element Viewer */}
              <ElementViewer />
              
              {/* Edit Area - Only show in edit mode */}
              {editMode === 'edit' && <EditArea />}
            </div>

            {/* Routes for element navigation */}
            <Routes>
              <Route path="/" element={<HomeRoute />} />
              <Route path="/element/:elementId" element={<ElementRoute />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Loading your world...
                  </h2>
                  <p className="text-gray-600">
                    Fetching elements and metadata
                  </p>
                </>
              ) : (
                <>
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    Welcome to the OnlyWorlds Browse Tool!
                  </h1>
                  <p className="text-gray-600 mb-2">
                    Please authenticate using the form above to access your world.
                  </p>
                  <p className="text-gray-600">
                    For more information, visit{' '}
                    <a
                      href="https://docs.onlyworlds.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      the OnlyWorlds documentation
                    </a>.
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Create Element Modal */}
      <CreateElementModal />
    </div>
  );
}