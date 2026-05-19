import React, { createContext, useContext, useEffect, useState } from 'react';

const API_BASE = 'http://localhost:8000/api';

const ItineraryContext = createContext(null);

export function ItineraryProvider({ travelerId, children }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchItinerary = async () => {
    if (!travelerId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/traveler/${travelerId}/itinerary`);
      if (!res.ok) throw new Error('No se pudo obtener el itinerario');
      const data = await res.json();
      setItems(data.items || []);
      setTotal(parseFloat(data.total_budget || 0));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItinerary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [travelerId]);

  const addItem = async (serviceId, quantity = 1, servicePrice = null) => {
    if (!travelerId) return { error: 'No traveler id' };

    // Optimistic update: update total immediately if we have the service price
    if (servicePrice !== null) {
      setTotal(prev => parseFloat((prev + servicePrice * quantity).toFixed(2)));
    }

    try {
      const res = await fetch(`${API_BASE}/traveler/${travelerId}/itinerary/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_id: serviceId, quantity }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Error agregando item');
      }
      const item = await res.json();
      // synchronize state with server
      await fetchItinerary();
      return { item };
    } catch (err) {
      // rollback optimistic update if possible
      if (servicePrice !== null) {
        setTotal(prev => parseFloat((prev - servicePrice * quantity).toFixed(2)));
      }
      return { error: err.message };
    }
  };

  const removeItem = async (itemId, itemTotal = null) => {
    if (!travelerId) return { error: 'No traveler id' };

    // Optimistic update: subtract item total if provided
    if (itemTotal !== null) {
      setTotal(prev => parseFloat((prev - itemTotal).toFixed(2)));
    }

    try {
      const res = await fetch(`${API_BASE}/traveler/${travelerId}/itinerary/items/${itemId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Error eliminando item');
      }
      await fetchItinerary();
      return { ok: true };
    } catch (err) {
      // rollback optimistic subtraction
      if (itemTotal !== null) {
        setTotal(prev => parseFloat((prev + itemTotal).toFixed(2)));
      }
      return { error: err.message };
    }
  };

  return (
    <ItineraryContext.Provider value={{ items, total, loading, error, addItem, removeItem, refresh: fetchItinerary }}>
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
