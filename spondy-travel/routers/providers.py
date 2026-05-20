from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models import ProviderDetail, TourService, User
from schemas import (
    ProviderProfileCreate,
    ProviderProfileResponse,
    ProviderProfileUpdate,
    TourServiceCreate,
    TourServiceUpdate,
    ServiceStatusUpdate,
)
from dependencies import get_db

router = APIRouter(prefix="/api/provider", tags=["Providers"])


def get_provider_or_404(provider_id: int, db: Session) -> User:
    provider = db.query(User).filter(User.id == provider_id, User.role == "PROVIDER").first()
    if not provider:
        raise HTTPException(status_code=404, detail="Proveedor no encontrado")
    return provider


def validate_unique_tax_id(provider_id: int, tax_id: str, db: Session):
    existing = db.query(ProviderDetail).filter(
        ProviderDetail.tax_id == tax_id,
        ProviderDetail.user_id != provider_id
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="El tax_id ya esta registrado por otro proveedor")


def validate_service_payload(payload: TourServiceCreate | TourServiceUpdate):
    if payload.price <= 0:
        raise HTTPException(status_code=400, detail="El precio del servicio debe ser mayor a 0")
    if payload.status not in ("Activo", "Inactivo"):
        raise HTTPException(status_code=400, detail="El estado debe ser Activo o Inactivo")


@router.get("/{provider_id}/services")
def get_services(provider_id: int, db: Session = Depends(get_db)):
    get_provider_or_404(provider_id, db)
    services = db.query(TourService).filter(TourService.provider_id == provider_id).all()
    return services


@router.get("/{provider_id}/profile", response_model=ProviderProfileResponse)
def get_provider_profile(provider_id: int, db: Session = Depends(get_db)):
    provider = get_provider_or_404(provider_id, db)
    detail = db.query(ProviderDetail).filter(ProviderDetail.user_id == provider_id).first()
    if not detail:
        raise HTTPException(status_code=404, detail="Perfil del negocio no encontrado")
    return ProviderProfileResponse(
        id=detail.id,
        user_id=detail.user_id,
        business_name=detail.business_name,
        tax_id=detail.tax_id,
        phone=detail.phone,
        address=detail.address,
        city=detail.city,
        category=detail.category,
        is_verified=provider.is_verified
    )


@router.put("/{provider_id}/profile", response_model=ProviderProfileResponse)
def upsert_provider_profile(provider_id: int, payload: ProviderProfileUpdate, db: Session = Depends(get_db)):
    provider = get_provider_or_404(provider_id, db)
    validate_unique_tax_id(provider_id, payload.tax_id, db)

    detail = db.query(ProviderDetail).filter(ProviderDetail.user_id == provider_id).first()
    if not detail:
        detail = ProviderDetail(user_id=provider_id)
        db.add(detail)

    detail.business_name = payload.business_name
    detail.tax_id = payload.tax_id
    detail.phone = payload.phone
    detail.address = payload.address
    detail.city = payload.city
    detail.category = payload.category

    db.commit()
    db.refresh(detail)

    return ProviderProfileResponse(
        id=detail.id,
        user_id=detail.user_id,
        business_name=detail.business_name,
        tax_id=detail.tax_id,
        phone=detail.phone,
        address=detail.address,
        city=detail.city,
        category=detail.category,
        is_verified=provider.is_verified
    )


@router.post("/{provider_id}/services")
def create_provider_service(provider_id: int, payload: TourServiceCreate, db: Session = Depends(get_db)):
    get_provider_or_404(provider_id, db)
    validate_service_payload(payload)

    service = TourService(
        provider_id=provider_id,
        name=payload.name,
        description=payload.description,
        price=payload.price,
        image_url=payload.image_url,
        city=payload.city,
        category=payload.category,
        status=payload.status
    )
    db.add(service)
    db.commit()
    db.refresh(service)
    return service


@router.put("/{provider_id}/services/{service_id}")
def update_provider_service(provider_id: int, service_id: int, payload: TourServiceUpdate, db: Session = Depends(get_db)):
    get_provider_or_404(provider_id, db)
    validate_service_payload(payload)

    service = db.query(TourService).filter(
        TourService.id == service_id,
        TourService.provider_id == provider_id
    ).first()
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado para este proveedor")

    service.name = payload.name
    service.description = payload.description
    service.price = payload.price
    service.image_url = payload.image_url
    service.city = payload.city
    service.category = payload.category
    service.status = payload.status

    db.commit()
    db.refresh(service)
    return service


@router.patch("/{provider_id}/services/{service_id}/status")
def update_provider_service_status(provider_id: int, service_id: int, payload: ServiceStatusUpdate, db: Session = Depends(get_db)):
    get_provider_or_404(provider_id, db)
    if payload.status not in ("Activo", "Inactivo"):
        raise HTTPException(status_code=400, detail="El estado debe ser Activo o Inactivo")

    service = db.query(TourService).filter(
        TourService.id == service_id,
        TourService.provider_id == provider_id
    ).first()
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado para este proveedor")

    service.status = payload.status
    db.commit()
    db.refresh(service)
    return service