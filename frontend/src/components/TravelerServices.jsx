import { useEffect, useState } from 'react';
import SearchBar from './SearchBar';

export default function TravelerServices({ user, onLogout }) {
  const [services, setServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState(null);

  // Load all verified services on component mount
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

  // Handle search
  const handleSearch = (destination) => {
    setSearchQuery(destination);
    setSearchLoading(true);
    
    fetch(`http://localhost:8000/api/services/search?city=${encodeURIComponent(destination)}`)
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

  // Clear search and show all services
  const handleClearSearch = () => {
    setSearchQuery(null);
    setFilteredServices(services);
  };

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
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-indigo-600">Spondy Travel</h1>
            <p className="text-xs text-gray-500">Descubre experiencias únicamente</p>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-sm text-gray-600">
              <span className="font-medium">{user.email}</span>
            </span>
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Search Bar */}
        <SearchBar onSearch={handleSearch} isLoading={searchLoading} />

        {/* Search Results Header */}
        {searchQuery && (
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Resultados para "<span className="text-indigo-600">{searchQuery}</span>"
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {filteredServices.length} {filteredServices.length === 1 ? 'servicio encontrado' : 'servicios encontrados'}
              </p>
            </div>
            <button
              onClick={handleClearSearch}
              className="text-sm px-4 py-2 rounded-lg border border-slate-200 hover:border-slate-300
                text-gray-700 hover:text-gray-900 transition-colors duration-200"
              aria-label="Limpiar búsqueda"
            >
              Ver todos
            </button>
          </div>
        )}

        {/* Services Grid */}
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
              {searchQuery 
                ? `Intenta buscar con otra ciudad o palabra clave`
                : 'Usa la barra de búsqueda para explorar destinos'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((servicio) => (
              <div 
                key={servicio.id} 
                className="group bg-white rounded-2xl overflow-hidden border border-slate-100
                  hover:border-slate-200 hover:shadow-lg transition-all duration-300 cursor-pointer"
              >
                {/* Image Container */}
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

                {/* Content */}
                <div className="p-5">
                  {/* Category Badge */}
                  {servicio.category && (
                    <span className="inline-block text-xs font-medium text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full mb-3">
                      {servicio.category}
                    </span>
                  )}

                  {/* Title */}
                  <h3 className="text-lg font-bold text-gray-900 leading-snug mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                    {servicio.name}
                  </h3>

                  {/* City & Business */}
                  <div className="mb-3 space-y-1">
                    <p className="text-sm text-gray-600">{servicio.business_name}</p>
                    {servicio.city && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {servicio.city}
                      </p>
                    )}
                  </div>

                  {/* Description (truncated) */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {servicio.description}
                  </p>

                  {/* Footer: Price and Button */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <div>
                      <p className="text-xs text-gray-500">Desde</p>
                      <p className="text-2xl font-bold text-indigo-600">
                        ${parseFloat(servicio.price).toFixed(2)}
                      </p>
                    </div>
                    <button 
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg 
                        font-medium transition-all duration-200 hover:shadow-md active:scale-95"
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