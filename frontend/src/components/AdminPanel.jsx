import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircleIcon,
  DocumentTextIcon,
  MapPinIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

const API_BASE_URL = 'http://localhost:8000';

const AdminPanel = ({ user, onLogout }) => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPendingProviders = useCallback(async () => {
    try {
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No autorizado. Por favor, inicia sesion nuevamente.');

      const response = await fetch(`${API_BASE_URL}/api/admin/pending-providers`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 403) {
        throw new Error('No tienes permisos para acceder al panel de administracion.');
      }
      if (!response.ok) throw new Error('No se pudieron cargar los proveedores.');

      const data = await response.json();
      setProviders(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPendingProviders();
  }, [fetchPendingProviders]);

  const userName = user.full_name || user.name || user.email;

  const modalCopy = useMemo(() => {
    if (!selectedAction) return null;
    const isApproval = selectedAction.status === 'aprobado';
    return {
      title: isApproval ? 'Aprobar proveedor' : 'Rechazar proveedor',
      description: isApproval
        ? 'El proveedor podra publicar servicios en la plataforma y recibira una notificacion.'
        : 'El proveedor no podra operar en la plataforma y recibira una notificacion.',
      confirmLabel: isApproval ? 'Aprobar' : 'Rechazar',
      confirmClass: isApproval
        ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500'
        : 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500',
    };
  }, [selectedAction]);

  const openActionModal = (provider, status) => {
    setError(null);
    setSelectedAction({ provider, status });
  };

  const closeActionModal = () => {
    if (!actionLoading) setSelectedAction(null);
  };

  const submitProviderAction = async () => {
    if (!selectedAction) return;
    setActionLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No autorizado. Por favor, inicia sesion nuevamente.');

      const response = await fetch(
        `${API_BASE_URL}/api/admin/providers/${selectedAction.provider.id}/status`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: selectedAction.status }),
        },
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.detail || 'No se pudo actualizar el estado del proveedor.');
      }

      setProviders((currentProviders) =>
        currentProviders.filter((provider) => provider.id !== selectedAction.provider.id),
      );
      setSelectedAction(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-indigo-700">Spondy Travel</h1>
            <p className="text-sm text-slate-500">Panel de Administracion - {userName}</p>
          </div>
          <button
            onClick={onLogout}
            className="w-fit rounded-md bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-100 hover:text-rose-800"
            aria-label="Cerrar sesion"
          >
            Salir
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-950">Proveedores pendientes</h2>
          <p className="mt-2 text-slate-600">
            Revisa la informacion de registro antes de aprobar o rechazar cada negocio.
          </p>
        </div>

        {error && (
          <div className="mb-6 flex gap-3 rounded-md border border-rose-200 bg-rose-50 p-4">
            <XCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-600" />
            <p className="text-sm text-rose-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <svg className="mb-4 h-12 w-12 animate-spin text-indigo-700" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-slate-600">Cargando proveedores...</p>
          </div>
        ) : providers.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-md border border-slate-200 bg-white py-16">
            <CheckCircleIcon className="mb-4 h-16 w-16 text-emerald-600" />
            <p className="text-lg font-medium text-slate-950">Todo al dia</p>
            <p className="mt-2 text-sm text-slate-500">No hay proveedores pendientes de aprobacion.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Nombre</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Direccion</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">Documentacion</th>
                    <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {providers.map((provider) => (
                    <tr key={provider.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4 align-top">
                        <p className="font-semibold text-slate-950">{provider.business_name}</p>
                        <p className="mt-1 text-sm text-slate-600">{provider.full_name}</p>
                        <p className="text-sm text-slate-500">{provider.email}</p>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="flex max-w-sm gap-2 text-sm text-slate-700">
                          <MapPinIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                          <span>{provider.address || 'Sin direccion registrada'}</span>
                        </div>
                        <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">
                          {[provider.city, provider.category].filter(Boolean).join(' - ') || 'Sin categoria'}
                        </p>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="flex gap-2 text-sm text-slate-700">
                          <DocumentTextIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                          <div>
                            <p className="font-mono">{provider.tax_id}</p>
                            <p className="mt-1 text-xs text-slate-500">RUC/NIT registrado</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 align-top">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openActionModal(provider, 'aprobado')}
                            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                            aria-label={`Aprobar proveedor ${provider.business_name}`}
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                            Aprobar
                          </button>
                          <button
                            onClick={() => openActionModal(provider, 'rechazado')}
                            className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-rose-700 ring-1 ring-inset ring-rose-200 transition-colors hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                            aria-label={`Rechazar proveedor ${provider.business_name}`}
                          >
                            <XCircleIcon className="h-4 w-4" />
                            Rechazar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {selectedAction && modalCopy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-md bg-white p-6 shadow-xl">
            <h3 className="text-xl font-bold text-slate-950">{modalCopy.title}</h3>
            <p className="mt-3 text-sm text-slate-600">
              {modalCopy.description}
            </p>
            <div className="mt-4 rounded-md bg-slate-50 p-4">
              <p className="font-semibold text-slate-950">{selectedAction.provider.business_name}</p>
              <p className="mt-1 text-sm text-slate-600">{selectedAction.provider.email}</p>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeActionModal}
                disabled={actionLoading}
                className="rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-inset ring-slate-300 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={submitProviderAction}
                disabled={actionLoading}
                className={`rounded-md px-4 py-2 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 ${modalCopy.confirmClass}`}
              >
                {actionLoading ? 'Procesando...' : modalCopy.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
