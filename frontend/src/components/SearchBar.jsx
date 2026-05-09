import { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function SearchBar({ onSearch, isLoading }) {
  const [destination, setDestination] = useState('');

  const handleSearch = () => {
    if (destination.trim()) {
      onSearch(destination);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm p-8 mb-12">
      <div className="max-w-2xl mx-auto">
        {/* Title */}
        <h2 className="text-3xl font-bold text-gray-900 mb-2 text-center">
          Encuentra tu destino perfecto
        </h2>
        <p className="text-center text-gray-500 text-sm mb-8">
          Busca servicios y tours disponibles en tu ciudad de interés
        </p>

        {/* Search Input Group */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ej: Quito, Tena, Esmeraldas..."
              disabled={isLoading}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                disabled:bg-gray-100 disabled:cursor-not-allowed
                text-gray-900 placeholder-gray-400
                transition-all duration-200"
              aria-label="Destino de búsqueda"
            />
          </div>
          
          <button
            onClick={handleSearch}
            disabled={isLoading || !destination.trim()}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed
              text-white font-medium rounded-xl transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
              active:scale-95 shadow-sm hover:shadow-md"
            aria-label="Buscar servicios"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Buscando...
              </span>
            ) : (
              'Buscar'
            )}
          </button>
        </div>

        {/* Helpful hint */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Presiona Enter o haz clic en Buscar para explorar
        </p>
      </div>
    </div>
  );
}
