from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models import Itinerary, ItineraryItem, TourService, User
# Asegúrate de importar BudgetBreakdown si es necesario explícitamente, aunque FastAPI lo maneja al usar el schema principal
from schemas import AddItineraryItemRequest, ItineraryItemResponse, ItineraryResponse, BudgetResponse
from dependencies import get_db
from budget_utils import calculate_budget_total # <-- NUEVA IMPORTACIÓN

router = APIRouter(prefix="/api/traveler", tags=["Itineraries"])

def get_traveler_or_404(traveler_id: int, db: Session) -> User:
    traveler = db.query(User).filter(User.id == traveler_id, User.role == "TRAVELER").first()
    if not traveler:
        raise HTTPException(status_code=404, detail="Viajero no encontrado")
    return traveler

def get_or_create_itinerary(traveler_id: int, db: Session) -> Itinerary:
    itinerary = db.query(Itinerary).filter(Itinerary.traveler_id == traveler_id).first()
    if not itinerary:
        itinerary = Itinerary(traveler_id=traveler_id)
        db.add(itinerary)
        db.commit()
        db.refresh(itinerary)
    return itinerary

# --- NUEVA FUNCIÓN PARA OBTENER EL DESGLOSE ---
def get_itinerary_budget_breakdown(itinerary: Itinerary, db: Session) -> dict:
    entries = []
    for item in itinerary.items:
        service = db.query(TourService).filter(TourService.id == item.service_id).first()
        if service:
            entries.append({"price": service.price, "quantity": item.quantity})
            
    # Utilizamos la utilidad que creamos para calcular Subtotal, IVA y Total
    return calculate_budget_total(entries)

@router.get("/{traveler_id}/itinerary", response_model=ItineraryResponse)
def get_traveler_itinerary(traveler_id: int, db: Session = Depends(get_db)):
    get_traveler_or_404(traveler_id, db)
    itinerary = get_or_create_itinerary(traveler_id, db)

    items = []
    for item in itinerary.items:
        service = db.query(TourService).filter(TourService.id == item.service_id).first()
        if service:
            items.append(ItineraryItemResponse(
                id=item.id,
                service_id=item.service_id,
                quantity=item.quantity,
                service_name=service.name,
                service_price=float(service.price),
                added_at=item.added_at.isoformat()
            ))

    # Obtenemos el desglose completo
    breakdown_dict = get_itinerary_budget_breakdown(itinerary, db)
    
    return ItineraryResponse(
        id=itinerary.id,
        traveler_id=itinerary.traveler_id,
        items=items,
        budget_breakdown=breakdown_dict,  # <-- CAMBIO AQUÍ
        created_at=itinerary.created_at.isoformat(),
        updated_at=itinerary.updated_at.isoformat()
    )

@router.post("/{traveler_id}/itinerary/items", response_model=ItineraryItemResponse)
def add_service_to_itinerary(traveler_id: int, payload: AddItineraryItemRequest, db: Session = Depends(get_db)):
    get_traveler_or_404(traveler_id, db)

    service = db.query(TourService).filter(TourService.id == payload.service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    if payload.quantity <= 0:
        raise HTTPException(status_code=400, detail="La cantidad debe ser mayor a 0")

    itinerary = get_or_create_itinerary(traveler_id, db)
    existing_item = db.query(ItineraryItem).filter(
        ItineraryItem.itinerary_id == itinerary.id,
        ItineraryItem.service_id == payload.service_id
    ).first()

    if existing_item:
        existing_item.quantity += payload.quantity
        item = existing_item
    else:
        item = ItineraryItem(
            itinerary_id=itinerary.id,
            service_id=payload.service_id,
            quantity=payload.quantity
        )
        db.add(item)

    itinerary.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(item)

    return ItineraryItemResponse(
        id=item.id,
        service_id=item.service_id,
        quantity=item.quantity,
        service_name=service.name,
        service_price=float(service.price),
        added_at=item.added_at.isoformat()
    )

@router.delete("/{traveler_id}/itinerary/items/{item_id}")
def remove_service_from_itinerary(traveler_id: int, item_id: int, db: Session = Depends(get_db)):
    get_traveler_or_404(traveler_id, db)

    itinerary = db.query(Itinerary).filter(Itinerary.traveler_id == traveler_id).first()
    if not itinerary:
        raise HTTPException(status_code=404, detail="Itinerario no encontrado")

    item = db.query(ItineraryItem).filter(
        ItineraryItem.id == item_id,
        ItineraryItem.itinerary_id == itinerary.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item del itinerario no encontrado")

    db.delete(item)
    itinerary.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Servicio eliminado del itinerario"}

@router.get("/{traveler_id}/itinerary/budget", response_model=BudgetResponse)
def get_traveler_budget(traveler_id: int, db: Session = Depends(get_db)):
    get_traveler_or_404(traveler_id, db)
    itinerary = get_or_create_itinerary(traveler_id, db)

    # Obtenemos el desglose completo
    breakdown_dict = get_itinerary_budget_breakdown(itinerary, db)
    item_count = len(itinerary.items)
    
    return BudgetResponse(budget_breakdown=breakdown_dict, item_count=item_count)  # <-- CAMBIO AQUÍ