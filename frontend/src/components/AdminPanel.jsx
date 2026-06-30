import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircleIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  StarIcon,
  TrashIcon,
  UserGroupIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

const API_BASE_URL = 'http://localhost:8000';

// ============================================================
// SPRINT 5 - HU09
// TIPOS DE RESEÑAS CRUZADAS
// ============================================================

const REVIEW_TYPES = {
  TRAVELER_TO_PROVIDER: 'TRAVELER_TO_PROVIDER',
  PROVIDER_TO_TRAVELER: 'PROVIDER_TO_TRAVELER',
};

const AdminPanel = ({ user, onLogout }) => {
  // ==========================================================
  // ESTADO GENERAL DEL PANEL ADMINISTRATIVO
  // ==========================================================

  const [activeModule, setActiveModule] = useState('providers');

  // ==========================================================
  // ESTADOS DEL MÓDULO DE PROVEEDORES
  // ==========================================================

  const [providers, setProviders] = useState([]);
  const [providersLoading, setProvidersLoading] = useState(true);
  const [providersError, setProvidersError] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);
  const [providerActionLoading, setProviderActionLoading] = useState(false);

  // ==========================================================
  // SPRINT 5 - HU09
  // ESTADOS DEL MÓDULO DE RESEÑAS CRUZADAS
  // ==========================================================

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState(null);

  // Pestaña activa del tablero de reseñas.
  const [reviewType, setReviewType] = useState(
    REVIEW_TYPES.TRAVELER_TO_PROVIDER,
  );

  // Filtro opcional por número de estrellas.
  const [ratingFilter, setRatingFilter] = useState('');

  // Texto ingresado por el administrador en el buscador.
  const [searchText, setSearchText] = useState('');

  // Texto que realmente se envía al backend.
  const [appliedSearch, setAppliedSearch] = useState('');

  // Reseña seleccionada para el modal de baja lógica.
  const [reviewToDeactivate, setReviewToDeactivate] = useState(null);
  const [deactivateLoading, setDeactivateLoading] = useState(false);

  const userName = user?.full_name || user?.name || user?.email || 'Administrador';

  // ==========================================================
  // FUNCIÓN AUXILIAR PARA OBTENER EL TOKEN
  // ==========================================================

  const getToken = () => {
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error(
        'No autorizado. Por favor, inicia sesión nuevamente.',
      );
    }

    return token;
  };

  // ==========================================================
  // MÓDULO EXISTENTE: PROVEEDORES PENDIENTES
  // ==========================================================

  const fetchPendingProviders = useCallback(async () => {
    try {
      setProvidersError(null);
      setProvidersLoading(true);

      const token = getToken();

      const response = await fetch(
        `${API_BASE_URL}/api/admin/pending-providers`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.status === 401) {
        throw new Error(
          'Tu sesión expiró. Por favor, inicia sesión nuevamente.',
        );
      }

      if (response.status === 403) {
        throw new Error(
          'No tienes permisos para acceder al panel de administración.',
        );
      }

      if (!response.ok) {
        throw new Error('No se pudieron cargar los proveedores.');
      }

      const data = await response.json();
      setProviders(data);
    } catch (error) {
      setProvidersError(error.message);
    } finally {
      setProvidersLoading(false);
    }
  }, []);

  useEffect(() => {
  // La consulta sincroniza el componente con la API externa.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  fetchPendingProviders();
}, [fetchPendingProviders]);

  const providerModalCopy = useMemo(() => {
    if (!selectedAction) return null;

    const isApproval = selectedAction.status === 'aprobado';

    return {
      title: isApproval ? 'Aprobar proveedor' : 'Rechazar proveedor',
      description: isApproval
        ? 'El proveedor podrá publicar servicios en la plataforma y recibirá una notificación.'
        : 'El proveedor no podrá operar en la plataforma y recibirá una notificación.',
      confirmLabel: isApproval ? 'Aprobar' : 'Rechazar',
      confirmClass: isApproval
        ? 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500'
        : 'bg-rose-600 hover:bg-rose-700 focus:ring-rose-500',
    };
  }, [selectedAction]);

  const openProviderActionModal = (provider, status) => {
    setProvidersError(null);
    setSelectedAction({ provider, status });
  };

  const closeProviderActionModal = () => {
    if (!providerActionLoading) {
      setSelectedAction(null);
    }
  };

  const submitProviderAction = async () => {
    if (!selectedAction) return;

    try {
      setProviderActionLoading(true);
      setProvidersError(null);

      const token = getToken();

      const response = await fetch(
        `${API_BASE_URL}/api/admin/providers/${selectedAction.provider.id}/status`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: selectedAction.status,
          }),
        },
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));

        throw new Error(
          payload.detail ||
            'No se pudo actualizar el estado del proveedor.',
        );
      }

      setProviders((currentProviders) =>
        currentProviders.filter(
          (provider) => provider.id !== selectedAction.provider.id,
        ),
      );

      setSelectedAction(null);
    } catch (error) {
      setProvidersError(error.message);
    } finally {
      setProviderActionLoading(false);
    }
  };

  // ==========================================================
  // SPRINT 5 - HU09
  // CONSULTA DE RESEÑAS CRUZADAS
  // ==========================================================

  const fetchReviews = useCallback(async () => {
    try {
      setReviewsError(null);
      setReviewsLoading(true);

      const token = getToken();

      // Se construyen los parámetros solicitados por el backend.
      const queryParams = new URLSearchParams({
        review_type: reviewType,
      });

      if (ratingFilter) {
        queryParams.append('rating', ratingFilter);
      }

      if (appliedSearch.trim()) {
        queryParams.append('search', appliedSearch.trim());
      }

      const response = await fetch(
        `${API_BASE_URL}/api/admin/reviews?${queryParams.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.status === 401) {
        throw new Error(
          'Tu sesión expiró. Por favor, inicia sesión nuevamente.',
        );
      }

      if (response.status === 403) {
        throw new Error(
          'No tienes permisos para consultar las reseñas.',
        );
      }

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));

        throw new Error(
          payload.detail || 'No se pudieron cargar las reseñas.',
        );
      }

      const data = await response.json();
      setReviews(data);
    } catch (error) {
      setReviewsError(error.message);
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, [reviewType, ratingFilter, appliedSearch]);

  useEffect(() => {
  // Las reseñas se consultan cuando el administrador abre
  // el módulo o modifica alguno de sus filtros.
  if (activeModule === 'reviews') {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchReviews();
  }
}, [activeModule, fetchReviews]);

  // ==========================================================
  // SPRINT 5 - HU09
  // BÚSQUEDA Y LIMPIEZA DE FILTROS
  // ==========================================================

  const submitSearch = (event) => {
    event.preventDefault();
    setAppliedSearch(searchText.trim());
  };

  const clearReviewFilters = () => {
    setRatingFilter('');
    setSearchText('');
    setAppliedSearch('');
  };

  const changeReviewType = (newType) => {
    setReviewType(newType);

    // Al cambiar de pestaña se conservan los filtros.
    // El useEffect vuelve a consultar automáticamente.
  };

  // ==========================================================
  // SPRINT 5 - HU09
  // MODAL DOUBLE-CHECK PARA DAR DE BAJA UNA RESEÑA
  // ==========================================================

  const openDeactivateReviewModal = (review) => {
    setReviewsError(null);
    setReviewToDeactivate(review);
  };

  const closeDeactivateReviewModal = () => {
    if (!deactivateLoading) {
      setReviewToDeactivate(null);
    }
  };

  const confirmDeactivateReview = async () => {
    if (!reviewToDeactivate) return;

    try {
      setDeactivateLoading(true);
      setReviewsError(null);

      const token = getToken();

      const response = await fetch(
        `${API_BASE_URL}/api/admin/reviews/${reviewToDeactivate.id}/deactivate`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (response.status === 401) {
        throw new Error(
          'Tu sesión expiró. Por favor, inicia sesión nuevamente.',
        );
      }

      if (response.status === 403) {
        throw new Error(
          'No tienes permisos para dar de baja esta reseña.',
        );
      }

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));

        throw new Error(
          payload.detail || 'No se pudo dar de baja la reseña.',
        );
      }

      // La reseña se elimina del listado visual después
      // de que el backend realiza correctamente la baja lógica.
      setReviews((currentReviews) =>
        currentReviews.filter(
          (review) => review.id !== reviewToDeactivate.id,
        ),
      );

      setReviewToDeactivate(null);
    } catch (error) {
      setReviewsError(error.message);
    } finally {
      setDeactivateLoading(false);
    }
  };

  // ==========================================================
  // SPRINT 5 - HU09
  // REPRESENTACIÓN VISUAL DE ESTRELLAS
  // ==========================================================

  const renderStars = (rating) => (
    <div
      className="flex items-center gap-0.5"
      aria-label={`${rating} de 5 estrellas`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon
          key={star}
          className={`h-5 w-5 ${
            star <= rating
              ? 'fill-amber-400 text-amber-400'
              : 'text-slate-300'
          }`}
        />
      ))}
    </div>
  );

  const formatReviewDate = (dateValue) => {
    if (!dateValue) return 'Sin fecha';

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return 'Fecha no disponible';
    }

    return new Intl.DateTimeFormat('es-EC', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // ==========================================================
  // VISTA DEL MÓDULO DE PROVEEDORES
  // ==========================================================

  const renderProvidersModule = () => (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-950">
          Proveedores pendientes
        </h2>

        <p className="mt-2 text-slate-600">
          Revisa la información de registro antes de aprobar o
          rechazar cada negocio.
        </p>
      </div>

      {providersError && (
        <div className="mb-6 flex gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4">
          <XCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-600" />

          <p className="text-sm text-rose-700">
            {providersError}
          </p>
        </div>
      )}

      {providersLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-700" />

          <p className="text-slate-600">
            Cargando proveedores...
          </p>
        </div>
      ) : providers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white py-16 shadow-sm">
          <CheckCircleIcon className="mb-4 h-16 w-16 text-emerald-600" />

          <p className="text-lg font-medium text-slate-950">
            Todo al día
          </p>

          <p className="mt-2 text-sm text-slate-500">
            No hay proveedores pendientes de aprobación.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Nombre
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Dirección
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Documentación
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {providers.map((provider) => (
                  <tr
                    key={provider.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-5 py-4 align-top">
                      <p className="font-semibold text-slate-950">
                        {provider.business_name}
                      </p>

                      <p className="mt-1 text-sm text-slate-600">
                        {provider.full_name}
                      </p>

                      <p className="text-sm text-slate-500">
                        {provider.email}
                      </p>
                    </td>

                    <td className="px-5 py-4 align-top">
                      <div className="flex max-w-sm gap-2 text-sm text-slate-700">
                        <MapPinIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />

                        <span>
                          {provider.address ||
                            'Sin dirección registrada'}
                        </span>
                      </div>

                      <p className="mt-2 text-xs uppercase tracking-wide text-slate-500">
                        {[provider.city, provider.category]
                          .filter(Boolean)
                          .join(' - ') || 'Sin categoría'}
                      </p>
                    </td>

                    <td className="px-5 py-4 align-top">
                      <div className="flex gap-2 text-sm text-slate-700">
                        <DocumentTextIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />

                        <div>
                          <p className="font-mono">
                            {provider.tax_id}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            RUC/NIT registrado
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 align-top">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openProviderActionModal(
                              provider,
                              'aprobado',
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                        >
                          <CheckCircleIcon className="h-4 w-4" />
                          Aprobar
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openProviderActionModal(
                              provider,
                              'rechazado',
                            )
                          }
                          className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-medium text-rose-700 ring-1 ring-inset ring-rose-200 transition-colors hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
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
    </>
  );

  // ==========================================================
  // SPRINT 5 - HU09
  // VISTA DEL TABLERO DE RESEÑAS CRUZADAS
  // ==========================================================

  const renderReviewsModule = () => (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-950">
          Monitoreo de reseñas cruzadas
        </h2>

        <p className="mt-2 text-slate-600">
          Audita las calificaciones emitidas entre viajeros y
          proveedores y gestiona contenido inapropiado.
        </p>
      </div>

      {/* ======================================================
          CA1 - PESTAÑAS DE SEGMENTACIÓN
          ====================================================== */}

      <div className="mb-6 border-b border-slate-200">
        <div
          className="flex flex-col gap-2 sm:flex-row"
          role="tablist"
          aria-label="Tipos de reseñas"
        >
          <button
            type="button"
            role="tab"
            aria-selected={
              reviewType === REVIEW_TYPES.TRAVELER_TO_PROVIDER
            }
            onClick={() =>
              changeReviewType(
                REVIEW_TYPES.TRAVELER_TO_PROVIDER,
              )
            }
            className={`border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
              reviewType ===
              REVIEW_TYPES.TRAVELER_TO_PROVIDER
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
            }`}
          >
            Viajeros a Proveedores
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={
              reviewType === REVIEW_TYPES.PROVIDER_TO_TRAVELER
            }
            onClick={() =>
              changeReviewType(
                REVIEW_TYPES.PROVIDER_TO_TRAVELER,
              )
            }
            className={`border-b-2 px-5 py-3 text-sm font-semibold transition-colors ${
              reviewType ===
              REVIEW_TYPES.PROVIDER_TO_TRAVELER
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
            }`}
          >
            Proveedores a Viajeros
          </button>
        </div>
      </div>

      {/* ======================================================
          CA2 - FILTRO POR ESTRELLAS Y BUSCADOR
          ====================================================== */}

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <form
          onSubmit={submitSearch}
          className="grid gap-4 lg:grid-cols-[220px_1fr_auto_auto]"
        >
          <div>
            <label
              htmlFor="rating-filter"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Filtrar por estrellas
            </label>

            <select
              id="rating-filter"
              value={ratingFilter}
              onChange={(event) =>
                setRatingFilter(event.target.value)
              }
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">Todas las estrellas</option>
              <option value="5">5 estrellas</option>
              <option value="4">4 estrellas</option>
              <option value="3">3 estrellas</option>
              <option value="2">2 estrellas</option>
              <option value="1">1 estrella</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="review-search"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Buscar usuario
            </label>

            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-slate-400" />

              <input
                id="review-search"
                type="search"
                value={searchText}
                onChange={(event) =>
                  setSearchText(event.target.value)
                }
                placeholder="Nombre o correo del usuario"
                className="w-full rounded-md border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          <button
            type="submit"
            className="self-end rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            Buscar
          </button>

          <button
            type="button"
            onClick={clearReviewFilters}
            className="self-end rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 transition hover:bg-slate-50"
          >
            Limpiar
          </button>
        </form>
      </div>

      {reviewsError && (
        <div className="mb-6 flex gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4">
          <XCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-600" />

          <p className="text-sm text-rose-700">
            {reviewsError}
          </p>
        </div>
      )}

      {reviewsLoading ? (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-700" />

          <p className="text-slate-600">
            Cargando reseñas...
          </p>
        </div>
      ) : reviews.length === 0 ? (
        /* ====================================================
           CA4 - ESTADO VACÍO
           ==================================================== */
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
          <UserGroupIcon className="mb-5 h-16 w-16 text-slate-400" />

          <h3 className="text-lg font-semibold text-slate-950">
            Sin calificaciones registradas
          </h3>

          <p className="mt-2 max-w-lg text-sm text-slate-500">
            Este usuario aún no cuenta con calificaciones en la
            plataforma
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 bg-slate-50 px-5 py-4">
            <p className="text-sm font-medium text-slate-700">
              {reviews.length}{' '}
              {reviews.length === 1
                ? 'reseña encontrada'
                : 'reseñas encontradas'}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Emisor
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Usuario calificado
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Calificación
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Comentario
                  </th>

                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Fecha
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {reviews.map((review) => (
                  <tr
                    key={review.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-5 py-4 align-top">
                      <p className="font-semibold text-slate-950">
                        {review.reviewer_name}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {review.reviewer_email}
                      </p>
                    </td>

                    <td className="px-5 py-4 align-top">
                      <p className="font-semibold text-slate-950">
                        {review.reviewed_user_name}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {review.reviewed_user_email}
                      </p>
                    </td>

                    <td className="px-5 py-4 align-top">
                      {renderStars(review.rating)}

                      <p className="mt-1 text-xs font-medium text-slate-500">
                        {review.rating} de 5
                      </p>
                    </td>

                    <td className="max-w-sm px-5 py-4 align-top">
                      <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
                        {review.comment ||
                          'Sin comentario registrado.'}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 align-top text-sm text-slate-600">
                      {formatReviewDate(review.created_at)}
                    </td>

                    <td className="px-5 py-4 text-right align-top">
                      <button
                        type="button"
                        onClick={() =>
                          openDeactivateReviewModal(review)
                        }
                        className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-rose-700 ring-1 ring-inset ring-rose-200 transition hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2"
                        aria-label={`Dar de baja la reseña ${review.id}`}
                      >
                        <TrashIcon className="h-4 w-4" />
                        Dar de baja reseña
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ======================================================
          NAVEGACIÓN PRINCIPAL DEL ADMINISTRADOR
          ====================================================== */}

      <nav className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col gap-4 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-indigo-700">
                Spondy Travel
              </h1>

              <p className="text-sm text-slate-500">
                Panel de Administración - {userName}
              </p>
            </div>

            <button
              type="button"
              onClick={onLogout}
              className="w-fit rounded-md bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-100 hover:text-rose-800"
            >
              Salir
            </button>
          </div>

          {/* Navegación entre módulos administrativos. */}
          <div className="flex gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveModule('providers')}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition ${
                activeModule === 'providers'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Proveedores pendientes
            </button>

            <button
              type="button"
              onClick={() => setActiveModule('reviews')}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition ${
                activeModule === 'reviews'
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Reseñas cruzadas
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-10">
        {activeModule === 'providers'
          ? renderProvidersModule()
          : renderReviewsModule()}
      </main>

      {/* ======================================================
          MODAL EXISTENTE PARA APROBAR/RECHAZAR PROVEEDORES
          ====================================================== */}

      {selectedAction && providerModalCopy && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="provider-modal-title"
        >
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3
              id="provider-modal-title"
              className="text-xl font-bold text-slate-950"
            >
              {providerModalCopy.title}
            </h3>

            <p className="mt-3 text-sm text-slate-600">
              {providerModalCopy.description}
            </p>

            <div className="mt-4 rounded-lg bg-slate-50 p-4">
              <p className="font-semibold text-slate-950">
                {selectedAction.provider.business_name}
              </p>

              <p className="mt-1 text-sm text-slate-600">
                {selectedAction.provider.email}
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeProviderActionModal}
                disabled={providerActionLoading}
                className="rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-inset ring-slate-300 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={submitProviderAction}
                disabled={providerActionLoading}
                className={`rounded-md px-4 py-2 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300 ${providerModalCopy.confirmClass}`}
              >
                {providerActionLoading
                  ? 'Procesando...'
                  : providerModalCopy.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          SPRINT 5 - HU09
          CA3 - MODAL DE CONFIRMACIÓN DOUBLE-CHECK
          ====================================================== */}

      {reviewToDeactivate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="deactivate-review-title"
        >
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-rose-100 p-3">
                <ExclamationTriangleIcon className="h-7 w-7 text-rose-600" />
              </div>

              <div>
                <h3
                  id="deactivate-review-title"
                  className="text-xl font-bold text-slate-950"
                >
                  Confirmar baja de reseña
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Esta acción ocultará la reseña del sistema. La
                  información permanecerá almacenada para fines de
                  auditoría.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-950">
                    {reviewToDeactivate.reviewer_name}
                  </p>

                  <p className="text-xs text-slate-500">
                    calificó a{' '}
                    {reviewToDeactivate.reviewed_user_name}
                  </p>
                </div>

                {renderStars(reviewToDeactivate.rating)}
              </div>

              <p className="mt-4 text-sm italic leading-6 text-slate-700">
                “
                {reviewToDeactivate.comment ||
                  'Sin comentario registrado.'}
                ”
              </p>
            </div>

            <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-800">
                ¿Confirmas que esta reseña infringe las normas de
                la comunidad?
              </p>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeDeactivateReviewModal}
                disabled={deactivateLoading}
                className="rounded-md bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-300 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmDeactivateReview}
                disabled={deactivateLoading}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <TrashIcon className="h-4 w-4" />

                {deactivateLoading
                  ? 'Dando de baja...'
                  : 'Sí, dar de baja'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;