import { useEffect, useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';

export default function Dashboard({ user, onLogout }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load provider's services
    fetch(`http://localhost:8000/api/provider/${user.id}/services`)
      .then(res => res.json())
      .then(data => {
        setServices(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [user.id]);

  const userName = user.full_name || user.name || user.email;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Navbar */}
      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-indigo-600">Spondy Travel</h1>
            <p className="text-xs text-gray-500">Panel de Proveedor — {userName}</p>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-sm text-gray-600">
              <span className="font-medium">{userName}</span>
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
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-12">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Mis Servicios Turísticos</h2>
            <p className="text-gray-600">Gestiona y organiza tus ofertas turísticas</p>
          </div>
          <button 
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white 
              px-6 py-3 rounded-xl font-medium transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
              active:scale-95 shadow-sm hover:shadow-md w-full sm:w-auto justify-center"
            aria-label="Crear nuevo servicio"
          >
            <PlusIcon className="w-5 h-5" />
            Nuevo Servicio
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <svg className="animate-spin h-12 w-12 text-indigo-600 mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-gray-600">Cargando servicios...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-100">
            <p className="text-red-600 font-medium">Error al cargar servicios</p>
            <p className="text-gray-500 text-sm mt-2">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && services.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
            <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m0 0h6" />
            </svg>
            <p className="text-gray-900 font-medium text-lg">No tienes servicios aún</p>
            <p className="text-gray-500 text-sm mt-2">Crea tu primer servicio turístico para que los viajeros lo conozcan</p>
            <button 
              className="mt-6 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white 
                px-6 py-3 rounded-xl font-medium transition-all duration-200"
              aria-label="Crear nuevo servicio"
            >
              <PlusIcon className="w-5 h-5" />
              Crear Servicio
            </button>
          </div>
        )}

        {/* Services Grid */}
        {!loading && !error && services.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((servicio) => (
              <div 
                key={servicio.id}
                className="group bg-white rounded-2xl overflow-hidden border border-slate-100
                  hover:border-slate-200 hover:shadow-lg transition-all duration-300"
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
                  {/* Status Badge */}
                  <span className="inline-block text-xs font-medium text-green-700 bg-green-50 px-3 py-1 rounded-full mb-3">
                    {servicio.status}
                  </span>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-gray-900 leading-snug mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                    {servicio.name}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {servicio.description}
                  </p>

                  {/* Footer: Price and Actions */}
                  <div className="pt-4 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Precio</p>
                        <p className="text-2xl font-bold text-indigo-600">
                          ${parseFloat(servicio.price).toFixed(2)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg
                            transition-all duration-200"
                          aria-label={`Editar ${servicio.name}`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button 
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg
                            transition-all duration-200"
                          aria-label={`Eliminar ${servicio.name}`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
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