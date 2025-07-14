import { useState, FormEvent } from 'react';
import { useWorldContext } from '../contexts/WorldContext';

export function AuthBar() {
  const { authenticate, isLoading, error, isAuthenticated, logout, metadata } = useWorldContext();
  const [worldKey, setWorldKey] = useState('');
  const [pin, setPin] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (worldKey && pin) {
      await authenticate(worldKey, pin);
    }
  };

  const handleWorldKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setWorldKey(value);
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(value);
  };

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-4 p-4 bg-gray-900 text-white">
        <span className="text-sm">
          {metadata?.name || `World ${worldKey}`}
        </span>
        <button
          onClick={logout}
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          logout
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-900 text-white">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={worldKey}
          onChange={handleWorldKeyChange}
          placeholder="api key"
          className="w-24 px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
          disabled={isLoading}
          maxLength={10}
        />
        <input
          type="password"
          value={pin}
          onChange={handlePinChange}
          placeholder="pin"
          className="w-16 px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded focus:outline-none focus:border-blue-500"
          disabled={isLoading}
          maxLength={4}
        />
        <button
          type="submit"
          disabled={isLoading || !worldKey || !pin}
          className={`px-3 py-1 text-xs rounded transition-colors ${
            isLoading || !worldKey || !pin
              ? 'bg-gray-700 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isLoading ? '...' : 'validate'}
        </button>
        {error && (
          <span className="text-xs text-red-400 ml-2">{error}</span>
        )}
      </form>
    </div>
  );
}