import { useItinerary } from '../context/ItineraryContext';

export default function StickyBudgetBar() {
  const { budgetBreakdown, loading, items } = useItinerary();
  const ivaPercentage = (budgetBreakdown?.iva_rate * 100).toFixed(0) || 15;

  if (!budgetBreakdown) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <div className="bg-white border border-slate-200 rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-6">
        
        {/* Desglose de Costo e IVA */}
        <div className="flex flex-col text-sm text-slate-600 border-r border-slate-200 pr-6 space-y-1">
          <div className="flex justify-between gap-6">
            <span>Costo Base:</span>
            <span className="font-medium text-slate-800">${loading ? '...' : budgetBreakdown.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span>IVA ({ivaPercentage}%):</span>
            <span className="font-medium text-slate-800">${loading ? '...' : budgetBreakdown.iva_amount.toFixed(2)}</span>
          </div>
        </div>

        {/* Total Final */}
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Total a pagar</p>
          <p className="text-2xl font-bold text-indigo-600">
            ${loading ? '...' : budgetBreakdown.total.toFixed(2)}
          </p>
        </div>

        {/* Contador */}
        <div className="text-sm font-bold text-slate-700 bg-slate-100 px-4 py-2 rounded-full">
          {items.length} {items.length === 1 ? 'ítem' : 'ítems'}
        </div>
      </div>
    </div>
  );
}