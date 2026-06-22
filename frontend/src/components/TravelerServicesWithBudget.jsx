import { useEffect, useState } from 'react';
import SearchBar from './SearchBar';
import { ItineraryProvider, useItinerary } from '../context/ItineraryContext';
import StickyBudgetBar from './StickyBudgetBar';
import SpondyPlanner from './SpondyPlanner';

export default function TravelerServicesWithBudget({ user, onLogout }) {
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

  const clearSearch = () => {
    setSearchSummary(null);
    setFilteredServices(services);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Si no hay user, ponemos un fallback por defecto (ej. id 7) para pruebas de desarrollo
  const travelerId = user?.id || 7;

  return (
    <ItineraryProvider travelerId={travelerId}>
      <div className="min-h-screen bg-slate-50 pb-24">
        
        <header className="bg-white shadow-sm sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 text-white p-2 rounded-lg">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Explorar Servicios</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-full">
                {user?.full_name || user?.name || 'Viajero'}
              </span>
              <button onClick={onLogout} className="text-sm font-medium text-red-600 hover:text-red-800 transition-colors">
                Cerrar sesión
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <SearchBar onSearch={handleSearch} disabled={searchLoading} />
          </div>
          <SpondyPlanner />
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-md">
              <p className="font-medium">Error al cargar servicios:</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {searchSummary && (
            <div className="mb-6 flex items-center justify-between bg-indigo-50 px-4 py-3 rounded-lg border border-indigo-100">
              <div className="flex flex-wrap gap-2 items-center text-sm text-indigo-900">
                <span className="font-medium">Filtros activos:</span>
                {searchSummary.city && <span className="bg-indigo-100 px-2 py-1 rounded">Ciudad: {searchSummary.city}</span>}
                {searchSummary.category && <span className="bg-indigo-100 px-2 py-1 rounded">Categoría: {searchSummary.category}</span>}
                {searchSummary.maxPrice && <span className="bg-indigo-100 px-2 py-1 rounded">Máx: ${searchSummary.maxPrice}</span>}
              </div>
              <button 
                onClick={clearSearch}
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium underline"
              >
                Limpiar filtros
              </button>
            </div>
          )}

          {searchLoading ? (
            <div className="py-12 flex justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No se encontraron servicios</h3>
              <p className="text-gray-500">Intenta ajustar tus filtros de búsqueda</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((servicio) => (
                <div key={servicio.id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200 hover:shadow-xl transition-all duration-300 group flex flex-col">
                  <div className="h-48 overflow-hidden relative bg-slate-100">
                    {servicio.image_url ? (
                      <img 
                        src={servicio.image_url} 
                        alt={servicio.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800&q=80'; }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-5 flex flex-col flex-grow">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      {servicio.category && (
                        <span className="inline-block text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
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

                    {/* Mostramos la capacidad del servicio */}
                    <div className="text-xs font-medium text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded mb-4">
                      Cupos disponibles: {servicio.capacity}
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Precio unitario</p>
                        <p className="text-2xl font-bold text-indigo-600">${parseFloat(servicio.price).toFixed(2)}</p>
                      </div>
                      
                      {/* Botón que ahora maneja los errores (límite de cupos) */}
                      <ServiceReserveButton service={servicio} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* AQUÍ VA EL COMPONENTE DE CHECKOUT (SPRINT 4) */}
          <CheckoutSection />

        </main>
        
        <StickyBudgetBar />
      </div>
    </ItineraryProvider>
  );
}

// Subcomponente para el botón de reservar (Maneja el error de Límite de Cupos)
function ServiceReserveButton({ service }) {
  const { addItem } = useItinerary();
  const [adding, setAdding] = useState(false);

  const handleReserve = async () => {
    setAdding(true);
    const price = parseFloat(service.price) || 0;
    
    // Esperamos la respuesta de la API
    const res = await addItem(service.id, 1, price);
    
    // Si la API devuelve error (como exceder la capacidad máxima), mostramos una alerta
    if (res.error) {
      alert(`⚠️ No se pudo agregar: ${res.error}`);
    }
    
    setAdding(false);
  };

  return (
    <button
      onClick={handleReserve}
      disabled={adding}
      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-md active:scale-95 ${
        adding ? 'bg-indigo-400 cursor-not-allowed text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
      }`}
      aria-label={`Reservar ${service.name}`}
    >
      {adding ? '...' : 'Reservar'}
    </button>
  );
}

// Subcomponente de Checkout (B2B2C - Sprint 4)
function CheckoutSection() {
  const { items, checkoutItinerary, checkoutData } = useItinerary();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCheckoutClick = async () => {
    setIsProcessing(true);
    const result = await checkoutItinerary();
    setIsProcessing(false);
    if (result.ok) {
      setIsModalOpen(true);
    } else {
      alert("Error: " + result.error);
    }
  };

  return (
    <div className="mt-12 pt-8 border-t border-slate-200 pb-8">
      <h2 className="text-xl font-bold text-slate-800 mb-4">¿Terminaste de planificar?</h2>
      
      <button 
        onClick={handleCheckoutClick}
        disabled={items.length === 0 || isProcessing}
        className={`w-full py-4 rounded-xl font-bold text-white text-lg transition-all ${
          items.length === 0 
            ? 'bg-slate-300 cursor-not-allowed' 
            : 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl'
        }`}
      >
        {isProcessing ? 'Procesando Solicitudes...' : 'Contactar Proveedores (WhatsApp)'}
      </button>

      {/* Modal de confirmación */}
      {isModalOpen && checkoutData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-100 p-3 rounded-full text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800">¡Solicitudes Generadas!</h2>
            </div>
            
            <p className="text-slate-600 mb-6 leading-relaxed">
              Tu itinerario se ha procesado con éxito. Se generaron las solicitudes para 
              <span className="font-bold text-indigo-600"> {checkoutData.providers_contacted} proveedor(es)</span>. 
              Haz clic en cada uno para enviarles el detalle de tu reserva por WhatsApp.
            </p>
            
            <div className="space-y-3 mb-8 max-h-[40vh] overflow-y-auto pr-2">
              {checkoutData.contacts.map(contact => (
                <div key={contact.provider_id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <p className="font-semibold text-slate-800">{contact.business_name}</p>
                    <p className="text-sm text-slate-500">{contact.services_count} servicio(s) solicitados</p>
                  </div>
                  {contact.whatsapp_url ? (
                    <a 
                      href={contact.whatsapp_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors w-full sm:w-auto"
                    >
                      Enviar WhatsApp
                    </a>
                  ) : (
                    <span className="text-xs font-medium text-red-600 bg-red-100 px-3 py-1 rounded-full text-center">
                      Sin número configurado
                    </span>
                  )}
                </div>
              ))}
            </div>

            <button 
              onClick={() => setIsModalOpen(false)}
              className="w-full bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-900 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}