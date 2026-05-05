import { useEffect, useState } from 'react';

export default function Dashboard({ user, onLogout }) {
  const [services, setServices] = useState([]);

  useEffect(() => {
    // Cuando el componente carga, pedimos los servicios del proveedor a FastAPI
    fetch(`http://localhost:8000/api/provider/${user.id}/services`)
      .then(res => res.json())
      .then(data => setServices(data))
      .catch(err => console.error("Error cargando servicios:", err));
  }, [user.id]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar Simple */}
      <nav className="bg-sky-900 text-white p-4 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Spondy Travel - Panel de Proveedor</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-sky-200">{user.email}</span>
            <button onClick={onLogout} className="text-sm bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition">
              Salir
            </button>
          </div>
        </div>
      </nav>

      {/* Contenido Principal */}
      <main className="max-w-6xl mx-auto p-6 mt-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Mis Servicios Turísticos</h2>
          <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition">
            + Nuevo Servicio
          </button>
        </div>

        {/* Grid de Servicios (Tarjetas) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((servicio) => (
            <div key={servicio.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
              {/* Imagen de prueba en caso de que la URL no cargue */}
              <div className="h-48 bg-gray-200 w-full flex items-center justify-center text-gray-400">
                <img src={servicio.image_url} alt={servicio.name} className="object-cover h-full w-full" onError={(e) => {e.target.onerror = null; e.target.src="https://via.placeholder.com/400x200?text=Spondy+Travel"}}/>
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-gray-900 leading-tight">{servicio.name}</h3>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold">
                    {servicio.status}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{servicio.description}</p>
                <div className="text-xl font-bold text-sky-600">
                  ${servicio.price.toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}