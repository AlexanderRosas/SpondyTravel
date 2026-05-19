import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const AdminPanel = ({ user, onLogout }) => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [approving, setApproving] = useState(null);

  useEffect(() => {
    fetchPendingProviders();
  }, []);

  const fetchPendingProviders = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No autorizado. Por favor, inicia sesión nuevamente.');
      const response = await fetch('http://localhost:8000/api/admin/pending-providers', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include' // Para enviar cookies si el backend las utiliza
      });
      if (!response.ok) throw new Error('No se pudieron cargar los proveedores');
      const data = await response.json();
      setProviders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const approveProvider = async (provider) => {
    setApproving(provider.id);
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No autorizado. Por favor, inicia sesión nuevamente.');
      const response = await fetch(`http://localhost:8000/api/admin/verify-provider/${provider.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      if (!response.ok) throw new Error('No se pudo aprobar el proveedor');
      setProviders(providers.filter(p => p.id !== provider.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setApproving(null);
    }
  };

  const userName = user.full_name || user.name || user.email;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-indigo-600">Spondy Travel</h1>
            <p className="text-sm text-gray-500">Panel de Administración — {userName}</p>
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
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Proveedores Pendientes de Aprobación</h2>
          <p className="text-gray-600">Revisa y aprueba los nuevos proveedores que desean unirse a Spondy Travel</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex gap-3">
            <XCircleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <svg className="animate-spin h-12 w-12 text-indigo-600 mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-gray-600">Cargando proveedores...</p>
          </div>
        ) : providers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-100">
            <CheckCircleIcon className="w-16 h-16 text-green-500 mb-4" />
            <p className="text-gray-900 font-medium text-lg">¡Todo al día!</p>
            <p className="text-gray-500 text-sm mt-2">No hay proveedores pendientes de aprobación</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {providers.map((provider) => (
              <div 
                key={provider.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 hover:border-slate-300 hover:shadow-md transition-all duration-300"
              >
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{provider.business_name}</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1">Correo Electrónico</p>
                      <p className="text-sm text-gray-700 break-all">{provider.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1">RUC/NIT</p>
                      <p className="text-sm font-mono text-gray-700">{provider.tax_id}</p>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => approveProvider(provider)}
                  disabled={approving === provider.id}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:scale-95 flex items-center justify-center gap-2"
                  aria-label={`Aprobar proveedor ${provider.business_name}`}
                >
                  {approving === provider.id ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Aprobando...
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="w-5 h-5" />
                      Aprobar Proveedor
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminPanel;