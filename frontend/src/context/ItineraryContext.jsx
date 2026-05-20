/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react';

const API_BASE = 'http://localhost:8000/api';

const ItineraryContext = createContext(null);

function normalizeItem(item) {
  return {
    ...item,
    dia_asignado: Number(item.dia_asignado || 1),
  };
}

async function readJsonResponse(response, fallbackMessage) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || fallbackMessage);
  }
  return data;
}

export function ItineraryProvider({ travelerId, children }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchItinerary = async () => {
    if (!travelerId) {
      setItems([]);
      setTotal(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/traveler/${travelerId}/itinerary`);
      const data = await readJsonResponse(res, 'No se pudo obtener el itinerario');
      setItems((data.items || []).map(normalizeItem));
      setTotal(parseFloat(data.total_budget || 0));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchItinerary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [travelerId]);

  const addItem = async (serviceId, quantity = 1, servicePrice = null) => {
    if (!travelerId) return { error: 'No traveler id' };

    if (servicePrice !== null) {
      setTotal((prev) => parseFloat((prev + servicePrice * quantity).toFixed(2)));
    }

    try {
      const res = await fetch(`${API_BASE}/traveler/${travelerId}/itinerary/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_id: serviceId, quantity }),
      });
      const item = normalizeItem(await readJsonResponse(res, 'Error agregando item'));
      await fetchItinerary();
      return { item };
    } catch (err) {
      if (servicePrice !== null) {
        setTotal((prev) => parseFloat((prev - servicePrice * quantity).toFixed(2)));
      }
      return { error: err.message };
    }
  };

  const removeItem = async (itemId, itemTotal = null) => {
    if (!travelerId) return { error: 'No traveler id' };

    if (itemTotal !== null) {
      setTotal((prev) => parseFloat((prev - itemTotal).toFixed(2)));
    }

    try {
      const res = await fetch(`${API_BASE}/traveler/${travelerId}/itinerary/items/${itemId}`, {
        method: 'DELETE',
      });
      await readJsonResponse(res, 'Error eliminando item');
      await fetchItinerary();
      return { ok: true };
    } catch (err) {
      if (itemTotal !== null) {
        setTotal((prev) => parseFloat((prev + itemTotal).toFixed(2)));
      }
      return { error: err.message };
    }
  };

  const updateItemDay = async (itemId, diaAsignado) => {
    if (!travelerId) return { error: 'No traveler id' };

    const nextDay = Number(diaAsignado);
    if (!Number.isInteger(nextDay) || nextDay < 1) {
      return { error: 'El dia asignado debe ser mayor o igual a 1' };
    }

    const previousItems = items;
    setItems((current) => current.map((item) => (
      item.id === itemId ? { ...item, dia_asignado: nextDay } : item
    )));

    try {
      const res = await fetch(`${API_BASE}/traveler/${travelerId}/itinerary/items/${itemId}/day`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dia_asignado: nextDay }),
      });
      const updatedItem = normalizeItem(await readJsonResponse(res, 'Error actualizando el dia'));
      setItems((current) => current.map((item) => (
        item.id === updatedItem.id ? { ...item, ...updatedItem } : item
      )));
      return { item: updatedItem };
    } catch (err) {
      setItems(previousItems);
      return { error: err.message };
    }
  };

  return (
    <ItineraryContext.Provider value={{
      travelerId,
      items,
      total,
      loading,
      error,
      addItem,
      removeItem,
      updateItemDay,
      refresh: fetchItinerary,
    }}>
      {children}
    </ItineraryContext.Provider>
  );
}

export function useItinerary() {
  const ctx = useContext(ItineraryContext);
  if (!ctx) throw new Error('useItinerary debe usarse dentro de ItineraryProvider');
  return ctx;
}

export default ItineraryContext;
