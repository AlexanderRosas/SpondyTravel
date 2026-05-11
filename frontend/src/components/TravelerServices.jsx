import { useEffect, useState } from 'react';
import SearchBar from './SearchBar';

export default function TravelerServices({ user, onLogout }) {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchSummary, setSearchSummary] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/services')
      .then(res => res.json())
      .then(data => {
        setServices(data);
        setFilteredServices(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const handleSearch = ({ city, category, maxPrice }) => {
    setSearchSummary({ city, category, maxPrice });
    setSearchLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (city) params.append('city', city);
    if (category) params.append('category', category);
    if (maxPrice !== undefined) params.append('max_price', String(maxPrice));

    fetch(`http://localhost:8000/api/services/search?${params.toString()}`)
      .then(res => res.json())
      .then(data => {
        setFilteredServices(data);
        setSearchLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setSearchLoading(false);
      });
  };

  const handleClearSearch = () => {
    setSearchSummary(null);
    setFilteredServices(services);
  };

  const userName = user.full_name || user.name || user.email;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-indigo-600 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-gray-600">Cargando servicios...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-sm max-w-md">
          <p className="text-red-600 font-medium mb-2">Error</p>
          <p className="text-gray-600 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-indigo-600">Spondy Travel</h1>
            <p className="text-sm text-gray-500">Bienvenido, {userName}</p>
          </div>
          <div className="flex items-center gap-6">
            <button 
              onClick={onLogout} 
              className="text-sm bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 
                px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
              aria-label="Cerrar sesión"
            >
              Salir
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <SearchBar onSearch={handleSearch} isLoading={searchLoading} />

        {searchSummary && (
          <div className="mb-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Resultados de búsqueda</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {searchSummary.city ? `Ciudad: ${searchSummary.city}` : 'Todas las ciudades'} • 
                  {searchSummary.category ? `Categoría: ${searchSummary.category}` : 'Todas las categorías'} • 
                  Precio hasta ${searchSummary.maxPrice}
                </p>
              </div>
              <button
                onClick={handleClearSearch}
                className="text-sm px-4 py-2 rounded-lg border border-slate-200 hover:border-slate-300 text-gray-700 hover:text-gray-900 transition-colors duration-200"
                aria-label="Limpiar búsqueda"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        )}

        {searchLoading ? (
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <svg className="animate-spin h-10 w-10 text-indigo-600 mx-auto mb-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-gray-600 mt-2">Buscando servicios...</p>
            </div>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-100">
            <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-gray-600 font-medium">No se encontraron servicios</p>
            <p className="text-gray-400 text-sm mt-1">
              {searchSummary ? 'Prueba otra ciudad, categoría o precio.' : 'Usa el buscador inteligente para empezar.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((servicio) => (
              <div 
                key={servicio.id} 
                className="group bg-white rounded-2xl overflow-hidden border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all duration-300"
              >
                <div className="h-48 bg-gradient-to-br from-slate-200 to-slate-100 w-full overflow-hidden relative">
                  {servicio.image_url ? (
                    <img 
                      src={servicio.image_url} 
                      alt={servicio.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/400x200?text=Spondy+Travel';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {servicio.category && (
                      <span className="inline-block text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
                        {servicio.category}
                      </span>
                    )}
                    {servicio.city && (
                      <span className="inline-block text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                        {servicio.city}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 leading-snug mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                    {servicio.name}
                  </h3>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{servicio.description}</p>

                  <div className="text-sm text-gray-500 mb-4">Proveedor: {servicio.provider_full_name}</div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Precio</p>
                      <p className="text-2xl font-bold text-indigo-600">${parseFloat(servicio.price).toFixed(2)}</p>
                    </div>
                    <button 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md active:scale-95"
                      aria-label={`Reservar ${servicio.name}`}
                    >
                      Reservar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
