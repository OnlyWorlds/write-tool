import { useEffect } from 'react';
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { useWorldContext } from '../contexts/WorldContext';
import { useEditorStore, useSidebarStore } from '../stores/uiStore';
import { AuthBar } from './AuthBar';
import { CategorySidebar } from './CategorySidebar';
import { CreateElementModal } from './CreateElementModal';
import { EditArea } from './EditArea';
import { ElementViewer } from './ElementViewer';
import { ShowcaseViewer } from './ShowcaseViewer';

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

// Showcase route component that loads and displays showcase
function ShowcaseRoute() {
  const { showcaseId } = useParams<{ showcaseId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (showcaseId) {
      // The ShowcaseViewer will handle loading the showcase
      // For now, we just need the route to exist
    }
  }, [showcaseId]);

  return <ShowcaseViewer showcaseId={showcaseId} />;
}

export function App() {
  const { isAuthenticated, isLoading } = useWorldContext();
  const { editMode, selectedFieldId } = useEditorStore();

  return (
    <div className="min-h-screen bg-secondary flex flex-col">
      {/* Routes that handle showcase viewing */}
      <Routes>
        <Route path="/showcase/:showcaseId" element={<ShowcaseRoute />} />
        <Route path="*" element={
          <>
            {/* Auth Bar at top */}
            <AuthBar />
            
            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
              {isAuthenticated && !isLoading ? (
                <>
                  {/* Sidebar */}
                  <CategorySidebar />

                  {/* Working Area - Split View */}
                  <div className="flex-1 flex relative">
                    {/* Element Viewer */}
                    <ElementViewer />
                    
                    {/* Edit Area - Always visible sidebar */}
                    <EditArea />
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
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
                        <h2 className="text-xl font-semibold text-text-light mb-2">
                          loading world..
                        </h2> 
                      </>
                    ) : (
                      <> 
                        <p className="text-text-light mb-2">
                          load a world using the API key and PIN field above
                        </p>
        
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Create Element Modal */}
            <CreateElementModal />
          </>
        } />
      </Routes>
    </div>
  );
}