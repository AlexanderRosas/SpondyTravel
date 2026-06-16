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
  
  // --- NUEVO ESTADO PARA EL DESGLOSE ---
  const [budgetBreakdown, setBudgetBreakdown] = useState({
    subtotal: 0,
    iva_rate: 0.15,
    iva_amount: 0,
    total: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchItinerary = async () => {
    if (!travelerId) {
      setItems([]);
      setBudgetBreakdown({ subtotal: 0, iva_rate: 0.15, iva_amount: 0, total: 0 });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/traveler/${travelerId}/itinerary`);
      const data = await readJsonResponse(res, 'No se pudo obtener el itinerario');
      setItems((data.items || []).map(normalizeItem));
      
      // Guardamos el desglose que viene del backend
      if (data.budget_breakdown) {
        setBudgetBreakdown(data.budget_breakdown);
      }
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

    // Actualización optimista calculando el IVA
    if (servicePrice !== null) {
      setBudgetBreakdown((prev) => {
        const newSubtotal = prev.subtotal + (servicePrice * quantity);
        const newIvaAmount = newSubtotal * prev.iva_rate;
        return {
          ...prev,
          subtotal: newSubtotal,
          iva_amount: newIvaAmount,
          total: newSubtotal + newIvaAmount
        };
      });
    }

    try {
      const res = await fetch(`${API_BASE}/traveler/${travelerId}/itinerary/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_id: serviceId, quantity }),
      });
      const item = normalizeItem(await readJsonResponse(res, 'Error agregando item'));
      await fetchItinerary(); // Esto sincroniza con los datos reales del backend
      return { item };
    } catch (err) {
      // Revertir actualización optimista en caso de error
      if (servicePrice !== null) {
        setBudgetBreakdown((prev) => {
          const newSubtotal = prev.subtotal - (servicePrice * quantity);
          const newIvaAmount = newSubtotal * prev.iva_rate;
          return {
            ...prev,
            subtotal: newSubtotal,
            iva_amount: newIvaAmount,
            total: newSubtotal + newIvaAmount
          };
        });
      }
      return { error: err.message };
    }
  };

  const removeItem = async (itemId, itemTotal = null) => {
    if (!travelerId) return { error: 'No traveler id' };

    // Actualización optimista al eliminar
    if (itemTotal !== null) {
      setBudgetBreakdown((prev) => {
        const newSubtotal = prev.subtotal - itemTotal;
        const newIvaAmount = newSubtotal * prev.iva_rate;
        return {
          ...prev,
          subtotal: newSubtotal,
          iva_amount: newIvaAmount,
          total: newSubtotal + newIvaAmount
        };
      });
    }

    try {
      const res = await fetch(`${API_BASE}/traveler/${travelerId}/itinerary/items/${itemId}`, {
        method: 'DELETE',
      });
      await readJsonResponse(res, 'Error eliminando item');
      await fetchItinerary(); // Sincronizamos
      return { ok: true };
    } catch (err) {
      // Revertir
      if (itemTotal !== null) {
        setBudgetBreakdown((prev) => {
          const newSubtotal = prev.subtotal + itemTotal;
          const newIvaAmount = newSubtotal * prev.iva_rate;
          return {
            ...prev,
            subtotal: newSubtotal,
            iva_amount: newIvaAmount,
            total: newSubtotal + newIvaAmount
          };
        });
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
      budgetBreakdown, // <--- EXPORTAMOS EL DESGLOSE COMPLETO
      total: budgetBreakdown.total, // Mantenemos "total" por si algún otro componente antiguo lo usa
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