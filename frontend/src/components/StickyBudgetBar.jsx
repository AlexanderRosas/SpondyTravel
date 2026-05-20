import { useItinerary } from '../context/ItineraryContext';

export default function StickyBudgetBar() {
  const { total, loading, items } = useItinerary();

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-white border border-slate-200 rounded-full px-5 py-3 shadow-lg flex items-center gap-4">
        <div>
          <p className="text-xs text-gray-500">Presupuesto</p>
          <p className="text-lg font-bold text-indigo-600">${loading ? '...' : total.toFixed(2)}</p>
        </div>
        <div className="text-sm text-gray-600">{items.length} ítems</div>
      </div>
    </div>
  );
}
