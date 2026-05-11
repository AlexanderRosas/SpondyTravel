import { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function SearchBar({ onSearch, isLoading }) {
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('All');
  const [maxPrice, setMaxPrice] = useState(200);

  const handleSearch = () => {
    onSearch({
      city: city.trim(),
      category: category === 'All' ? '' : category,
      maxPrice: maxPrice || undefined,
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm p-8 mb-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Smart Search</h2>
          <p className="text-sm text-gray-500">
            Busca por ciudad, categoría y precio máximo para encontrar el servicio ideal.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr_1fr] items-end">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <label className="sr-only" htmlFor="city-search">Ciudad</label>
            <input
              id="city-search"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ciudad (ej. Quito, Tena, Esmeraldas)"
              disabled={isLoading}
              className="w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200"
              aria-label="Ciudad"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="category-select">Categoría</label>
            <select
              id="category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isLoading}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200"
              aria-label="Categoría"
            >
              <option value="All">Todas las categorías</option>
              <option value="Alojamiento">Alojamiento</option>
              <option value="Gastronomía">Gastronomía</option>
              <option value="Actividad">Actividad</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Precio máximo</label>
            <div className="grid gap-3">
              <input
                type="range"
                min="0"
                max="500"
                step="5"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                disabled={isLoading}
                className="w-full accent-indigo-600"
                aria-label="Precio máximo"
              />
              <div className="flex items-center justify-between text-sm text-gray-500">
                <span>0</span>
                <span>${maxPrice}</span>
                <span>500+</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={handleSearch}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 shadow-sm"
            aria-label="Buscar servicios inteligentes"
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
      </div>
    </div>
  );
}
