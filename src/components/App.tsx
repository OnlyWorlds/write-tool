import { useWorldContext } from '../contexts/WorldContext';
import { AuthBar } from './AuthBar';

export function App() {
  const { isAuthenticated, isLoading, elements, categories } = useWorldContext();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Auth Bar at top */}
      <AuthBar />
      
      {/* Main Content */}
      <div className="flex-1 flex">
        {isAuthenticated ? (
          <>
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r p-4">
              <h2 className="text-lg font-semibold mb-4">Categories</h2>
              <div className="space-y-2">
                {Array.from(categories.keys()).map(category => (
                  <div key={category} className="p-2 hover:bg-gray-50 rounded cursor-pointer">
                    <span className="text-sm capitalize">{category}</span>
                    <span className="text-xs text-gray-500 ml-2">
                      ({categories.get(category)?.length || 0})
                    </span>
                  </div>
                ))}
              </div>
              {categories.size === 0 && (
                <p className="text-sm text-gray-500">No elements loaded</p>
              )}
            </aside>

            {/* Main Area */}
            <main className="flex-1 p-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-semibold mb-4">Welcome to Your World</h2>
                <p className="text-gray-600">
                  Select a category from the sidebar to start browsing your world elements.
                </p>
              </div>
            </main>
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