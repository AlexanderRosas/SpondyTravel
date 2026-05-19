from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from models import ProviderDetail, TourService, User
from schemas import SearchServiceResult
from dependencies import get_db

router = APIRouter(prefix="/api", tags=["Services"])


def build_service_response(service: TourService, user: User, provider: ProviderDetail | None) -> SearchServiceResult:
    return SearchServiceResult(
        id=service.id,
        name=service.name,
        description=service.description,
        price=float(service.price),
        image_url=service.image_url,
        city=service.city,
        category=service.category,
        status=service.status,
        provider_full_name=user.full_name or user.name or user.email,
        business_name=provider.business_name if provider else None
    )


@router.get("/services", response_model=list[SearchServiceResult])
def get_verified_services(db: Session = Depends(get_db)):
    services = db.query(TourService, User, ProviderDetail).join(
        User, TourService.provider_id == User.id
    ).outerjoin(
        ProviderDetail, TourService.provider_id == ProviderDetail.user_id
    ).filter(
        User.role == "PROVIDER",
        User.is_verified == True,
        TourService.status == "Activo"
    ).all()

    return [build_service_response(service, user, provider) for service, user, provider in services]


@router.get("/services/search", response_model=list[SearchServiceResult])
def search_services(city: str = None, category: str = None, max_price: float = None, db: Session = Depends(get_db)):
    query = db.query(TourService, User, ProviderDetail).join(
        User, TourService.provider_id == User.id
    ).outerjoin(
        ProviderDetail, TourService.provider_id == ProviderDetail.user_id
    ).filter(
        User.role == "PROVIDER",
        User.is_verified == True,
        TourService.status == "Activo"
    )

    if city:
        query = query.filter(TourService.city.ilike(f"%{city}%"))
    if category:
        query = query.filter(TourService.category.ilike(f"%{category}%"))
    if max_price is not None:
        query = query.filter(TourService.price <= max_price)

    results = query.all()
    return [build_service_response(service, user, provider) for service, user, provider in results]