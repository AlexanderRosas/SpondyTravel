import { useItinerary } from '../context/ItineraryContext';

export default function StickyBudgetBar() {
  // Extraemos budgetBreakdown en lugar del antiguo 'total'
  const { budgetBreakdown, loading, items } = useItinerary();

  // Calculamos el porcentaje entero para mostrarlo (ej. 0.15 -> 15)
  const ivaPercentage = (budgetBreakdown.iva_rate * 100).toFixed(0);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-lg flex items-center gap-5 transition-all">
        
        {/* Desglose: Subtotal e IVA (Se oculta en pantallas muy pequeñas para no romper el diseño) */}
        <div className="hidden sm:flex flex-col text-xs text-gray-500 border-r border-gray-200 pr-5">
          <div className="flex justify-between gap-4">
            <span>Subtotal:</span>
            <span>${loading ? '...' : budgetBreakdown.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span>IVA ({ivaPercentage}%):</span>
            <span>${loading ? '...' : budgetBreakdown.iva_amount.toFixed(2)}</span>
          </div>
        </div>

        {/* Total Principal */}
        <div>
          <p className="text-xs text-gray-500">Total a pagar</p>
          <p className="text-xl font-bold text-indigo-600">
            ${loading ? '...' : budgetBreakdown.total.toFixed(2)}
          </p>
        </div>

        {/* Contador de Ítems */}
        <div className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
          {items.length} {items.length === 1 ? 'ítem' : 'ítems'}
        </div>

      </div>
    </div>
  );
}