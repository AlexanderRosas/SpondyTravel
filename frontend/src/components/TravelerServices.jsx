import { useEffect, useState } from 'react';

export default function TravelerServices({ user, onLogout }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/services')
      .then(res => res.json())
      .then(data => {
        setServices(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-6">Cargando servicios...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-sky-900 text-white p-4 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">Spondy Travel - Servicios Disponibles</h1>
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
          <h2 className="text-2xl font-bold text-gray-800">Servicios Turísticos Disponibles</h2>
        </div>

        {/* Grid de Servicios */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((servicio) => (
            <div key={servicio.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
              {/* Imagen */}
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
                <p className="text-gray-600 text-sm mb-4">{servicio.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold text-sky-600">${servicio.price}</span>
                  <button className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition">
                    Reservar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {services.length === 0 && <p className="mt-4 text-gray-500">No hay servicios disponibles en este momento.</p>}
      </main>
    </div>
  );
}