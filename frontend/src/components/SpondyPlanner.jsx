import { useMemo, useState } from 'react';
import {
  CalendarDaysIcon,
  ClockIcon,
  ExclamationCircleIcon,
  MinusIcon,
  MapPinIcon,
  PlusIcon,
  SparklesIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useItinerary } from '../context/ItineraryContext';

const MIN_VISIBLE_DAYS = 3;
const MAX_SELECTABLE_DAYS = 30;

function getTodayInputValue() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getPlannerStorageKey(travelerId) {
  return `spondy-planner:${travelerId || 'guest'}`;
}

function getStoredPlannerSettings(travelerId) {
  try {
    const rawSettings = window.localStorage.getItem(getPlannerStorageKey(travelerId));
    return rawSettings ? JSON.parse(rawSettings) : {};
  } catch {
    return {};
  }
}

function savePlannerSettings(travelerId, settings) {
  try {
    window.localStorage.setItem(getPlannerStorageKey(travelerId), JSON.stringify(settings));
  } catch {
    // localStorage can fail in private browsing; the planner still works in memory.
  }
}

function addDays(dateValue, daysToAdd) {
  const [year, month, day] = dateValue.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + daysToAdd);
  return date;
}

function formatPlannerDate(dateValue, dayIndex) {
  if (!dateValue) return 'Fecha por definir';

  const date = addDays(dateValue, dayIndex - 1);
  return new Intl.DateTimeFormat('es-EC', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(date);
}

function formatPrice(value) {
  return Number(value || 0).toFixed(2);
}

function getItemTime(item) {
  return item.hora || item.time || item.start_time || null;
}

export default function SpondyPlanner() {
  const { travelerId, items, loading, error, removeItem, updateItemDay } = useItinerary();
  const storedSettings = useMemo(() => getStoredPlannerSettings(travelerId), [travelerId]);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [deletingItemId, setDeletingItemId] = useState(null);
  const [plannerError, setPlannerError] = useState('');
  const [tripStartDate, setTripStartDate] = useState(storedSettings.tripStartDate || getTodayInputValue());
  const [visibleDayCount, setVisibleDayCount] = useState(
    Number(storedSettings.visibleDayCount || MIN_VISIBLE_DAYS)
  );

  const maxAssignedDay = useMemo(() => (
    items.reduce((maxDay, item) => Math.max(maxDay, Number(item.dia_asignado || 1)), 1)
  ), [items]);

  const dayCount = Math.min(
    Math.max(visibleDayCount, maxAssignedDay, MIN_VISIBLE_DAYS),
    MAX_SELECTABLE_DAYS
  );
  const minAllowedDayCount = Math.max(maxAssignedDay, MIN_VISIBLE_DAYS);
  const canRemoveDay = dayCount > minAllowedDayCount;

  const days = useMemo(
    () => Array.from({ length: dayCount }, (_, index) => index + 1),
    [dayCount]
  );

  const itemsByDay = useMemo(() => (
    days.reduce((groups, day) => {
      groups[day] = items.filter((item) => Number(item.dia_asignado || 1) === day);
      return groups;
    }, {})
  ), [days, items]);

  const handleStartDateChange = (event) => {
    const nextStartDate = event.target.value;
    setTripStartDate(nextStartDate);
    savePlannerSettings(travelerId, {
      tripStartDate: nextStartDate,
      visibleDayCount: dayCount,
    });
  };

  const handleAddDay = () => {
    const nextDayCount = Math.min(dayCount + 1, MAX_SELECTABLE_DAYS);
    setVisibleDayCount(nextDayCount);
    savePlannerSettings(travelerId, {
      tripStartDate,
      visibleDayCount: nextDayCount,
    });
  };

  const handleRemoveDay = () => {
    setPlannerError('');

    if (!canRemoveDay) {
      setPlannerError('No puedes quitar un dia que tiene actividades. Muevelas o eliminalas primero.');
      return;
    }

    const nextDayCount = Math.max(dayCount - 1, MIN_VISIBLE_DAYS);
    setVisibleDayCount(nextDayCount);
    savePlannerSettings(travelerId, {
      tripStartDate,
      visibleDayCount: nextDayCount,
    });
  };

  const handleDayChange = async (itemId, nextDay) => {
    setPlannerError('');
    setUpdatingItemId(itemId);

    const result = await updateItemDay(itemId, Number(nextDay));
    if (result.error) {
      setPlannerError(result.error);
    }

    setUpdatingItemId(null);
  };

  const handleRemoveActivity = async (item) => {
    setPlannerError('');
    setDeletingItemId(item.id);

    const itemTotal = Number(item.service_price || 0) * Number(item.quantity || 1);
    const result = await removeItem(item.id, itemTotal);
    if (result.error) {
      setPlannerError(result.error);
    }

    setDeletingItemId(null);
  };

  return (
    <section className="mb-12 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl shadow-slate-950/20">
      <div className="border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-cyan-300">
              <CalendarDaysIcon className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em]">Spondy Planner</span>
            </div>
            <h2 className="mt-2 text-2xl font-bold text-white">Cronograma del viaje</h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm text-slate-300">
              <span className="text-xs font-medium text-slate-500">Inicio</span>
              <input
                type="date"
                value={tripStartDate}
                onChange={handleStartDateChange}
                className="border-0 bg-transparent text-sm text-slate-100 outline-none [color-scheme:dark]"
              />
            </label>

            <button
              type="button"
              onClick={handleAddDay}
              disabled={dayCount >= MAX_SELECTABLE_DAYS}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/60 hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-900 disabled:text-slate-500"
            >
              <PlusIcon className="h-4 w-4" />
              Agregar dia
            </button>

            <button
              type="button"
              onClick={handleRemoveDay}
              disabled={!canRemoveDay}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm font-medium text-slate-300 transition hover:border-red-300/50 hover:bg-red-400/10 hover:text-red-100 disabled:cursor-not-allowed disabled:border-slate-800 disabled:bg-slate-900/50 disabled:text-slate-600"
            >
              <MinusIcon className="h-4 w-4" />
              Quitar dia
            </button>

            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-sm text-slate-300">
              <SparklesIcon className="h-4 w-4 text-cyan-300" />
              {items.length} {items.length === 1 ? 'actividad' : 'actividades'}
            </div>
          </div>
        </div>
      </div>

      {(error || plannerError) && (
        <div className="mx-5 mt-5 flex items-center gap-2 rounded-xl border border-red-400/30 bg-red-950/50 px-4 py-3 text-sm text-red-100 sm:mx-6">
          <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0 text-red-300" />
          <span>{plannerError || error}</span>
        </div>
      )}

      <div className="overflow-x-auto px-5 py-6 sm:px-6">
        <div className="flex min-w-full gap-4 pb-2">
          {days.map((day) => {
            const dayItems = itemsByDay[day] || [];

            return (
              <div
                key={day}
                className="flex min-h-[340px] w-[300px] flex-shrink-0 flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-slate-950/20"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-slate-500">Itinerario</p>
                    <h3 className="mt-1 text-xl font-bold text-white">Dia {day}</h3>
                    <p className="mt-1 text-sm capitalize text-cyan-200/80">
                      {formatPlannerDate(tripStartDate, day)}
                    </p>
                  </div>
                  <span className="grid h-9 min-w-9 place-items-center rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 text-sm font-semibold text-cyan-200">
                    {dayItems.length}
                  </span>
                </div>

                {loading ? (
                  <div className="grid flex-1 place-items-center rounded-xl border border-dashed border-slate-700 bg-slate-950/40 px-5 py-10 text-center text-sm text-slate-400">
                    Cargando itinerario...
                  </div>
                ) : dayItems.length === 0 ? (
                  <div className="grid flex-1 place-items-center rounded-xl border border-dashed border-slate-700 bg-slate-950/40 px-5 py-10 text-center text-sm text-slate-500">
                    Sin actividades para este dia
                  </div>
                ) : (
                  <div className="space-y-3">
                    {dayItems.map((item) => {
                      const itemTime = getItemTime(item);
                      const isUpdating = updatingItemId === item.id;
                      const isDeleting = deletingItemId === item.id;

                      return (
                        <article
                          key={item.id}
                          className="rounded-2xl border border-slate-700/80 bg-slate-950/80 p-4 shadow-md shadow-slate-950/30 transition hover:border-cyan-300/40 hover:bg-slate-950"
                        >
                          <div className="mb-3 flex items-start justify-between gap-3">
                            <span className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-200">
                              <MapPinIcon className="h-5 w-5" />
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="rounded-full border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs font-medium text-slate-400">
                                ${formatPrice(item.service_price)}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveActivity(item)}
                                disabled={isDeleting}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-500 transition hover:border-red-300/50 hover:bg-red-400/10 hover:text-red-200 disabled:cursor-wait disabled:opacity-60"
                                aria-label={`Eliminar ${item.service_name}`}
                                title="Eliminar actividad"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          <h4 className="text-base font-semibold leading-snug text-white">
                            {item.service_name}
                          </h4>

                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2.5 py-1">
                              <ClockIcon className="h-3.5 w-3.5 text-slate-500" />
                              {itemTime || 'Hora por definir'}
                            </span>
                            <span className="rounded-full bg-slate-900 px-2.5 py-1">
                              Cantidad: {item.quantity}
                            </span>
                          </div>

                          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/70 p-3">
                            <label
                              htmlFor={`planner-day-${item.id}`}
                              className="mb-2 block text-xs font-medium text-slate-400"
                            >
                              Mover a:
                            </label>
                            <select
                              id={`planner-day-${item.id}`}
                              value={item.dia_asignado}
                              onChange={(event) => handleDayChange(item.id, event.target.value)}
                              disabled={isUpdating}
                              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20 disabled:cursor-wait disabled:opacity-60"
                            >
                              {days.map((optionDay) => (
                                <option key={optionDay} value={optionDay}>
                                  Dia {optionDay}
                                </option>
                              ))}
                            </select>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
