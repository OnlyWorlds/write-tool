import { useWorldContext } from '../contexts/WorldContext';
import { useEditorStore } from '../stores/uiStore';
import { AuthBar } from './AuthBar';
import { CategorySidebar } from './CategorySidebar';
import { ElementViewer } from './ElementViewer';
import { EditArea } from './EditArea';

export function App() {
  const { isAuthenticated } = useWorldContext();
  const { editMode } = useEditorStore();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
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
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to the OnlyWorlds Parse Tool!
              </h1>
              <p className="text-gray-600 mb-2">
                Your world 'OnlyWorld' was validated and loaded.
              </p>
              <p className="text-gray-600">
                Type 'info' for more information or{' '}
                <a
                  href="https://docs.onlyworlds.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  click here
                </a>{' '}
                for a user guide.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}