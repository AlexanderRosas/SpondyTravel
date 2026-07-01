import { useEffect, useState } from 'react';
import {
  CheckCircleIcon,
  PencilIcon,
  PlusIcon,
  PowerIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';

const API_BASE = 'http://localhost:8000/api';

const emptyProfile = {
  business_name: '',
  tax_id: '',
  phone: '',
  address: '',
  city: '',
  category: '',
};

const emptyService = {
  name: '',
  description: '',
  price: '',
  image_url: '',
  city: '',
  category: '',
  status: 'Activo',
  capacity: 10,
};

async function readJsonResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || 'No se pudo completar la solicitud');
  }
  return data;
}

export default function Dashboard({ user, onLogout }) {
  const [services, setServices] = useState([]);
  const [profile, setProfile] = useState(emptyProfile);
  const [profileExists, setProfileExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingService, setSavingService] = useState(false);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState(emptyService);
  const userName = user.full_name || user.name || user.email;

  const fetchServices = async () => {
    const response = await fetch(`${API_BASE}/provider/${user.id}/services`);
    const data = await readJsonResponse(response);
    setServices(data);
  };

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError(null);

      try {
        const servicesResponse = await fetch(`${API_BASE}/provider/${user.id}/services`);
        const servicesData = await readJsonResponse(servicesResponse);

        const profileResponse = await fetch(`${API_BASE}/provider/${user.id}/profile`);
        let profileData = null;

        if (profileResponse.status === 404) {
          profileData = emptyProfile;
        } else {
          profileData = await readJsonResponse(profileResponse);
        }

        if (!active) return;

        setServices(servicesData);
        setProfile({
          business_name: profileData.business_name || '',
          tax_id: profileData.tax_id || '',
          phone: profileData.phone || '',
          address: profileData.address || '',
          city: profileData.city || '',
          category: profileData.category || '',
        });
        setProfileExists(profileResponse.status !== 404);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, [user.id]);

  const handleProfileChange = (event) => {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
  };

  const handleServiceChange = (event) => {
    const { name, value } = event.target;
    setServiceForm((current) => ({ ...current, [name]: value }));
  };

  const showSuccess = (message) => {
    setSuccess(message);
    window.setTimeout(() => setSuccess(''), 3500);
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/provider/${user.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const data = await readJsonResponse(response);
      setProfile({
        business_name: data.business_name || '',
        tax_id: data.tax_id || '',
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        category: data.category || '',
      });
      setProfileExists(true);
      showSuccess('Perfil del negocio guardado correctamente.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const openCreateService = () => {
    setEditingService(null);
    setServiceForm(emptyService);
    setServiceModalOpen(true);
    setError(null);
  };

  const openEditService = (service) => {
    setEditingService(service);
    setServiceForm({
      name: service.name || '',
      description: service.description || '',
      price: service.price || '',
      image_url: service.image_url || '',
      city: service.city || '',
      category: service.category || '',
      status: service.status || 'Activo',
      capacity: service.capacity ?? 10,
    });
    setServiceModalOpen(true);
    setError(null);
  };

  const closeServiceModal = () => {
    if (savingService) return;
    setServiceModalOpen(false);
    setEditingService(null);
    setServiceForm(emptyService);
  };

  const saveService = async (event) => {
    event.preventDefault();
    setSavingService(true);
    setError(null);

    const payload = {
      ...serviceForm,
      price: Number(serviceForm.price),
      capacity: Number(serviceForm.capacity),
    };

    try {
      const url = editingService
        ? `${API_BASE}/provider/${user.id}/services/${editingService.id}`
        : `${API_BASE}/provider/${user.id}/services`;
      const response = await fetch(url, {
        method: editingService ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const savedService = await readJsonResponse(response);

      setServices((current) => {
        if (!editingService) return [savedService, ...current];
        return current.map((service) => (service.id === savedService.id ? savedService : service));
      });

      setServiceModalOpen(false);
      setEditingService(null);
      setServiceForm(emptyService);
      showSuccess(editingService ? 'Servicio actualizado correctamente.' : 'Servicio creado correctamente.');
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingService(false);
    }
  };

  const toggleServiceStatus = async (service) => {
    const nextStatus = service.status === 'Activo' ? 'Inactivo' : 'Activo';
    setStatusUpdatingId(service.id);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/provider/${user.id}/services/${service.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      const updatedService = await readJsonResponse(response);
      setServices((current) => current.map((item) => (item.id === updatedService.id ? updatedService : item)));
      showSuccess(`Servicio ${nextStatus === 'Activo' ? 'activado' : 'desactivado'} correctamente.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const refreshServices = async () => {
    setLoading(true);
    setError(null);
    try {
      await fetchServices();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-indigo-600">Spondy Travel</h1>
            <p className="text-xs text-gray-500">Panel de Proveedor - {userName}</p>
          </div>
          <div className="flex items-center gap-6">
            <span className="hidden sm:inline text-sm text-gray-600">
              <span className="font-medium">{userName}</span>
            </span>
            <button
              onClick={onLogout}
              className="text-sm bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 px-4 py-2 rounded-lg transition-colors duration-200 font-medium"
              aria-label="Cerrar sesion"
            >
              Salir
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-10">
        {success && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-800">
            <CheckCircleIcon className="w-5 h-5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="mb-10 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Perfil del negocio</h2>
              <p className="text-sm text-gray-500 mt-1">
                {profileExists
                  ? 'Mantiene actualizada la informacion que revisan administradores y viajeros.'
                  : 'Completa tu perfil para que tu negocio pueda revisarse y mostrarse correctamente.'}
              </p>
            </div>
          </div>

          <form onSubmit={saveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field label="Nombre comercial" name="business_name" value={profile.business_name} onChange={handleProfileChange} required />
            <Field label="Tax ID" name="tax_id" value={profile.tax_id} onChange={handleProfileChange} required />
            <Field label="Telefono" name="phone" value={profile.phone} onChange={handleProfileChange} />
            <Field label="Ciudad" name="city" value={profile.city} onChange={handleProfileChange} />
            <Field label="Categoria" name="category" value={profile.category} onChange={handleProfileChange} />
            <Field label="Direccion" name="address" value={profile.address} onChange={handleProfileChange} />

            <div className="md:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-sm hover:shadow-md"
              >
                {savingProfile ? 'Guardando...' : 'Guardar perfil'}
              </button>
            </div>
          </form>
        </section>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Mis Servicios Turisticos</h2>
            <p className="text-gray-600">Gestiona precios, disponibilidad y datos visibles para viajeros.</p>
          </div>
          <button
            onClick={openCreateService}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 active:scale-95 shadow-sm hover:shadow-md w-full sm:w-auto justify-center"
            aria-label="Crear nuevo servicio"
          >
            <PlusIcon className="w-5 h-5" />
            Nuevo Servicio
          </button>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <svg className="animate-spin h-12 w-12 text-indigo-600 mb-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-gray-600">Cargando informacion...</p>
          </div>
        )}

        {!loading && services.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200">
            <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m0 0h6" />
            </svg>
            <p className="text-gray-900 font-medium text-lg">No tienes servicios aun</p>
            <p className="text-gray-500 text-sm mt-2">Crea tu primer servicio turistico para que los viajeros lo conozcan.</p>
            <button
              onClick={openCreateService}
              className="mt-6 inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200"
              aria-label="Crear nuevo servicio"
            >
              <PlusIcon className="w-5 h-5" />
              Crear Servicio
            </button>
          </div>
        )}

        {!loading && services.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((servicio) => {
              const isActive = servicio.status === 'Activo';
              return (
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
                        onError={(event) => {
                          event.currentTarget.src = 'https://via.placeholder.com/400x200?text=Spondy+Travel';
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
                      <span className={`inline-block text-xs font-medium px-3 py-1 rounded-full ${isActive ? 'text-green-700 bg-green-50' : 'text-gray-600 bg-gray-100'}`}>
                        {servicio.status}
                      </span>
                      {servicio.city && (
                        <span className="inline-block text-xs font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                          {servicio.city}
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 leading-snug mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                      {servicio.name}
                    </h3>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{servicio.description}</p>

                    <div className="pt-4 border-t border-slate-100">
                      <div className="flex flex-col gap-3 mb-4">
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Precio</p>
                          <p className="text-2xl font-bold text-indigo-600">
                            ${parseFloat(servicio.price).toFixed(2)}
                          </p>
                        </div>
                        <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-2 rounded-full">
                          <span>Cupos:</span>
                          <span>{servicio.capacity ?? 'N/A'}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                          <button
                            onClick={() => openEditService(servicio)}
                            className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                            aria-label={`Editar ${servicio.name}`}
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => toggleServiceStatus(servicio)}
                            disabled={statusUpdatingId === servicio.id}
                            className={`p-2 rounded-lg transition-all duration-200 disabled:opacity-50 ${isActive ? 'text-gray-600 hover:text-red-600 hover:bg-red-50' : 'text-gray-600 hover:text-green-700 hover:bg-green-50'}`}
                            aria-label={`${isActive ? 'Desactivar' : 'Activar'} ${servicio.name}`}
                          >
                            <PowerIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
              );
            })}
          </div>
        )}

        {!loading && (
          <div className="mt-8 flex justify-end">
            <button
              onClick={refreshServices}
              className="text-sm px-4 py-2 rounded-lg border border-slate-200 hover:border-slate-300 text-gray-700 hover:text-gray-900 transition-colors duration-200"
            >
              Actualizar servicios
            </button>
          </div>
        )}
      </main>

      {serviceModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/50 px-4 py-8">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {editingService ? 'Editar servicio' : 'Nuevo servicio'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">Actualiza la informacion que veran los viajeros.</p>
              </div>
              <button
                onClick={closeServiceModal}
                className="p-2 text-gray-500 hover:text-gray-900 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="Cerrar formulario"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveService} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Nombre" name="name" value={serviceForm.name} onChange={handleServiceChange} required />
              <Field label="Precio" name="price" type="number" min="0.01" step="0.01" value={serviceForm.price} onChange={handleServiceChange} required />
              <Field label="Cupos disponibles" name="capacity" type="number" min="1" step="1" value={serviceForm.capacity} onChange={handleServiceChange} required />
              <Field label="Ciudad" name="city" value={serviceForm.city} onChange={handleServiceChange} />
              <Field label="Categoria" name="category" value={serviceForm.category} onChange={handleServiceChange} />
              <Field label="Imagen URL" name="image_url" value={serviceForm.image_url} onChange={handleServiceChange} />

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  id="status"
                  name="status"
                  value={serviceForm.status}
                  onChange={handleServiceChange}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 bg-white transition-all duration-200"
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Descripcion
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={serviceForm.description}
                  onChange={handleServiceChange}
                  rows="4"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all duration-200"
                />
              </div>

              <div className="md:col-span-2 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeServiceModal}
                  className="px-5 py-3 rounded-xl border border-slate-200 text-gray-700 hover:bg-slate-50 font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingService}
                  className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium transition-colors shadow-sm"
                >
                  {savingService ? 'Guardando...' : 'Guardar servicio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, name, value, onChange, type = 'text', required = false, min, step }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        min={min}
        step={step}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-gray-900 placeholder-gray-400 transition-all duration-200"
      />
    </div>
  );
}
