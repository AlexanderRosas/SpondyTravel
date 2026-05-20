from fastapi import FastAPI, HTTPException, Depends, Header
from pydantic import BaseModel, field_validator
from sqlalchemy import create_engine, Column, Integer, String, Numeric, Boolean, ForeignKey, Text, TIMESTAMP, text
from sqlalchemy.orm import declarative_base, sessionmaker, Session, relationship
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
from typing import Optional
from security import get_password_hash, verify_password
from auth_utils import generate_token, validate_token, revoke_token
from budget_utils import calculate_budget_total
from notification_utils import send_provider_status_email

import models

DATABASE_URL = "postgresql://spondy_admin:spondy_password@localhost:5432/spondy_travel_db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 2. Modelos de Base de Datos (Mapean tu init.sql)
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    full_name = Column(String)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String)
    is_verified = Column(Boolean, default=False)
    provider_status = Column(String, default="pendiente")
    provider_detail = relationship("ProviderDetail", back_populates="user", uselist=False)

class ProviderDetail(Base):
    __tablename__ = "provider_details"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    business_name = Column(String)
    tax_id = Column(String, unique=True)
    phone = Column(String)
    address = Column(Text)
    city = Column(String, nullable=True)
    category = Column(String, nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    user = relationship("User", back_populates="provider_detail")

class TourService(Base):
    __tablename__ = "services"
    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String)
    description = Column(Text)
    price = Column(Numeric(10, 2), nullable=False)
    image_url = Column(String)
    city = Column(String, nullable=True)
    category = Column(String, nullable=True)
    status = Column(String, default="Activo")

class Itinerary(Base):
    __tablename__ = "itineraries"
    id = Column(Integer, primary_key=True, index=True)
    traveler_id = Column(Integer, ForeignKey("users.id"), unique=True)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    updated_at = Column(TIMESTAMP, default=datetime.utcnow, onupdate=datetime.utcnow)
    items = relationship("ItineraryItem", back_populates="itinerary", cascade="all, delete-orphan")

class ItineraryItem(Base):
    __tablename__ = "itinerary_items"
    id = Column(Integer, primary_key=True, index=True)
    itinerary_id = Column(Integer, ForeignKey("itineraries.id"))
    service_id = Column(Integer, ForeignKey("services.id"))
    quantity = Column(Integer, default=1)
    dia_asignado = Column(Integer, default=1, nullable=False)
    added_at = Column(TIMESTAMP, default=datetime.utcnow)
    itinerary = relationship("Itinerary", back_populates="items")

# Crear las tablas si no existen
Base.metadata.create_all(bind=engine)

def ensure_schema_compatibility():
    with engine.begin() as connection:
        connection.execute(text(
            "ALTER TABLE itinerary_items "
            "ADD COLUMN IF NOT EXISTS dia_asignado INT NOT NULL DEFAULT 1 "
            "CHECK (dia_asignado > 0)"
        ))
        connection.execute(text(
            "ALTER TABLE users "
            "ADD COLUMN IF NOT EXISTS provider_status VARCHAR(50) DEFAULT 'pendiente'"
        ))
        connection.execute(text(
            "UPDATE users "
            "SET provider_status = CASE "
            "WHEN role = 'PROVIDER' AND is_verified = TRUE THEN 'aprobado' "
            "WHEN role = 'PROVIDER' AND is_verified = FALSE THEN 'pendiente' "
            "ELSE 'aprobado' END "
            "WHERE provider_status IS NULL"
        ))
        connection.execute(text(
            "UPDATE users "
            "SET provider_status = 'aprobado' "
            "WHERE provider_status = 'pendiente' "
            "AND (role != 'PROVIDER' OR is_verified = TRUE)"
        ))

ensure_schema_compatibility()

# 3. Esquemas (Para recibir datos del Frontend)
class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    name: str
    full_name: str | None = None
    email: str
    password: str
    role: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: str
    full_name: str
    role: str

class ProviderResponse(BaseModel):
    id: int
    email: str
    full_name: str | None = None
    business_name: str
    tax_id: str
    phone: str | None = None
    address: str | None = None
    city: str | None = None
    category: str | None = None
    provider_status: str
    created_at: datetime | None = None


class SearchServiceResult(BaseModel):
    id: int
    name: str
    description: str | None = None
    price: float
    image_url: str | None = None
    city: str | None = None
    category: str | None = None
    status: str
    provider_full_name: str
    business_name: str | None = None

class ApproveRequest(BaseModel):
    status: bool

class ProviderStatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def validate_status(cls, value):
        normalized = value.lower()
        if normalized not in ("aprobado", "rechazado"):
            raise ValueError("El estado debe ser aprobado o rechazado")
        return normalized

class ProviderProfileCreate(BaseModel):
    business_name: str
    tax_id: str
    phone: str | None = None
    address: str | None = None
    city: str | None = None
    category: str | None = None

class ProviderProfileUpdate(ProviderProfileCreate):
    pass

class ProviderProfileResponse(ProviderProfileCreate):
    id: int
    user_id: int
    is_verified: bool

class TourServiceCreate(BaseModel):
    name: str
    description: str | None = None
    price: float
    image_url: str | None = None
    city: str | None = None
    category: str | None = None
    status: str = "Activo"
    
    @field_validator('price')
    @classmethod
    def validate_price(cls, v):
        """Validate price: must be positive and have max 2 decimal places"""
        if v <= 0:
            raise ValueError("El precio debe ser mayor a 0")
        # Check if price has more than 2 decimal places
        price_str = f"{v:.10f}".rstrip('0')
        if '.' in price_str:
            decimals = len(price_str.split('.')[1])
            if decimals > 2:
                raise ValueError("El precio no puede tener más de 2 decimales")
        return round(v, 2)

class TourServiceUpdate(TourServiceCreate):
    pass

class ServiceStatusUpdate(BaseModel):
    status: str

class AddItineraryItemRequest(BaseModel):
    service_id: int
    quantity: int = 1

class UpdateItineraryItemDayRequest(BaseModel):
    dia_asignado: int

class ItineraryItemResponse(BaseModel):
    id: int
    service_id: int
    quantity: int
    dia_asignado: int
    service_name: str
    service_price: float
    added_at: str

class ItineraryResponse(BaseModel):
    id: int
    traveler_id: int
    items: list[ItineraryItemResponse]
    total_budget: float
    created_at: str
    updated_at: str

class BudgetResponse(BaseModel):
    total_budget: float
    item_count: int

# 4. Inicializar FastAPI
app = FastAPI(title="Spondy Travel API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependencia para abrir y cerrar la sesión de la BD en cada petición
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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

def get_current_user(authorization: Optional[str] = Header(None)):
    """Extract and validate the current user from the Authorization header."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid authorization format")
    
    token = parts[1]
    token_data = validate_token(token)
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    return token_data

def require_role(allowed_roles: list):
    """Dependency that checks if the current user has one of the allowed roles."""
    def check_role(current_user: dict = Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail=f"Insufficient permissions. Required role: {', '.join(allowed_roles)}"
            )
        return current_user
    return check_role

# 5. ENDPOINTS

@app.post("/api/auth/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.password):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    token = generate_token(user.id, user.role)
    
    return LoginResponse(
        access_token=token,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name or user.name,
        role=user.role
    )

@app.post("/api/auth/register", response_model=LoginResponse)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    role = request.role.upper()
    if role not in ("PROVIDER", "TRAVELER"):
        raise HTTPException(status_code=400, detail="Rol inválido. Debe ser PROVIDER o TRAVELER")

    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=409, detail="El correo ya está registrado")

    hashed_password = get_password_hash(request.password)
    user = User(
        name=request.name,
        full_name=request.full_name,
        email=request.email,
        password=hashed_password,
        role=role,
        is_verified=(role == "TRAVELER"),
        provider_status=("pendiente" if role == "PROVIDER" else "aprobado")
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    token = generate_token(user.id, user.role)
    
    return LoginResponse(
        access_token=token,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name or user.name,
        role=user.role
    )

@app.get("/api/provider/{provider_id}/services")
def get_services(provider_id: int, db: Session = Depends(get_db)):
    get_provider_or_404(provider_id, db)
    services = db.query(TourService).filter(TourService.provider_id == provider_id).all()
    return services

@app.get("/api/provider/{provider_id}/profile", response_model=ProviderProfileResponse)
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

@app.put("/api/provider/{provider_id}/profile", response_model=ProviderProfileResponse)
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

@app.post("/api/provider/{provider_id}/services")
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

@app.put("/api/provider/{provider_id}/services/{service_id}")
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

@app.patch("/api/provider/{provider_id}/services/{service_id}/status")
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

@app.get("/api/admin/pending-providers", response_model=list[ProviderResponse])
def get_pending_providers(
    current_user: dict = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """
    ST-01: Get all pending providers waiting for verification.
    This endpoint is protected and only accessible to ADMIN users.
    Returns providers with is_verified=False including their business details.
    """
    providers = db.query(User).join(ProviderDetail).filter(
        User.role == "PROVIDER",
        User.provider_status == "pendiente"
    ).all()
    
    result = []
    for user in providers:
        if user.provider_detail:
            result.append(ProviderResponse(
                id=user.id,
                email=user.email,
                full_name=user.full_name or user.name,
                business_name=user.provider_detail.business_name,
                tax_id=user.provider_detail.tax_id,
                phone=user.provider_detail.phone,
                address=user.provider_detail.address,
                city=user.provider_detail.city,
                category=user.provider_detail.category,
                provider_status=user.provider_status,
                created_at=user.provider_detail.created_at
            ))
    return result

def apply_provider_status(user_id: int, status: str, db: Session):
    user = db.query(User).filter(User.id == user_id, User.role == "PROVIDER").first()
    if not user:
        raise HTTPException(status_code=404, detail="Provider not found")

    user.provider_status = status
    user.is_verified = status == "aprobado"
    db.commit()
    db.refresh(user)

    business_name = user.provider_detail.business_name if user.provider_detail else user.full_name or user.name
    try:
        send_provider_status_email(user.email, business_name, status)
    except Exception as exc:
        print(f"[ProviderStatusEmailError] provider_id={user.id} error={exc}")

    return {
        "message": f"Provider status updated to {status}",
        "provider_id": user.id,
        "status": status,
        "is_verified": user.is_verified
    }

@app.put("/api/admin/providers/{user_id}/status")
def update_provider_status(
    user_id: int,
    payload: ProviderStatusUpdate,
    current_user: dict = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """Approve or reject a pending provider. ADMIN only."""
    return apply_provider_status(user_id, payload.status, db)

@app.put("/api/admin/verify-provider/{user_id}")
def verify_provider(
    user_id: int,
    current_user: dict = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """Verify a pending provider. ADMIN only."""
    return apply_provider_status(user_id, "aprobado", db)

@app.get("/api/services", response_model=list[SearchServiceResult])
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

    response = []
    for service, user, provider in services:
        response.append(SearchServiceResult(
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
        ))
    return response

@app.get("/api/services/search", response_model=list[SearchServiceResult])
def search_services(city: str = None, category: str = None, max_price: float = None, db: Session = Depends(get_db)):
    """
    Search for services by city, category, and max price.
    Returns only verified services and provider full name.
    """
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
    
    response = []
    for service, user, provider in results:
        response.append(SearchServiceResult(
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
        ))
    
    return response

# ==================== HU03: Calculadora de Presupuesto ====================

def get_traveler_or_404(traveler_id: int, db: Session) -> User:
    traveler = db.query(User).filter(User.id == traveler_id, User.role == "TRAVELER").first()
    if not traveler:
        raise HTTPException(status_code=404, detail="Viajero no encontrado")
    return traveler

def get_or_create_itinerary(traveler_id: int, db: Session) -> Itinerary:
    """Obtiene o crea el itinerario del viajero"""
    itinerary = db.query(Itinerary).filter(Itinerary.traveler_id == traveler_id).first()
    if not itinerary:
        itinerary = Itinerary(traveler_id=traveler_id)
        db.add(itinerary)
        db.commit()
        db.refresh(itinerary)
    return itinerary

def calculate_itinerary_total(itinerary: Itinerary, db: Session) -> float:
    """
    Calcula el total presupuestado del itinerario usando Decimal para precisión exacta.
    Evita errores de redondeo inherentes a los cálculos con float.
    """
    budget_entries = []
    for item in itinerary.items:
        service = db.query(TourService).filter(TourService.id == item.service_id).first()
        if service:
            budget_entries.append({
                "price": service.price,
                "quantity": item.quantity,
            })

    return float(calculate_budget_total(budget_entries))

@app.get("/api/traveler/{traveler_id}/itinerary", response_model=ItineraryResponse)
def get_traveler_itinerary(traveler_id: int, db: Session = Depends(get_db)):
    """Obtiene el itinerario del viajero con todos los servicios y el total presupuestado"""
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
                dia_asignado=item.dia_asignado or 1,
                service_name=service.name,
                service_price=float(service.price),
                added_at=item.added_at.isoformat()
            ))
    
    total_budget = calculate_itinerary_total(itinerary, db)
    
    return ItineraryResponse(
        id=itinerary.id,
        traveler_id=itinerary.traveler_id,
        items=items,
        total_budget=total_budget,
        created_at=itinerary.created_at.isoformat(),
        updated_at=itinerary.updated_at.isoformat()
    )

@app.post("/api/traveler/{traveler_id}/itinerary/items", response_model=ItineraryItemResponse)
def add_service_to_itinerary(traveler_id: int, payload: AddItineraryItemRequest, db: Session = Depends(get_db)):
    """Agrega un servicio al itinerario del viajero"""
    get_traveler_or_404(traveler_id, db)
    
    # Validar que el servicio exista
    service = db.query(TourService).filter(TourService.id == payload.service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    
    # Validar cantidad
    if payload.quantity <= 0:
        raise HTTPException(status_code=400, detail="La cantidad debe ser mayor a 0")
    
    # Obtener o crear itinerario
    itinerary = get_or_create_itinerary(traveler_id, db)
    
    # Verificar si el servicio ya está en el itinerario
    existing_item = db.query(ItineraryItem).filter(
        ItineraryItem.itinerary_id == itinerary.id,
        ItineraryItem.service_id == payload.service_id
    ).first()
    
    if existing_item:
        # Si ya existe, actualizar la cantidad
        existing_item.quantity += payload.quantity
        item = existing_item
    else:
        # Si no existe, crear un nuevo item
        item = ItineraryItem(
            itinerary_id=itinerary.id,
            service_id=payload.service_id,
            quantity=payload.quantity
        )
        db.add(item)
    
    # Actualizar el timestamp del itinerario
    itinerary.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(item)
    
    return ItineraryItemResponse(
        id=item.id,
        service_id=item.service_id,
        quantity=item.quantity,
        dia_asignado=item.dia_asignado or 1,
        service_name=service.name,
        service_price=float(service.price),
        added_at=item.added_at.isoformat()
    )

@app.patch("/api/traveler/{traveler_id}/itinerary/items/{item_id}/day", response_model=ItineraryItemResponse)
def update_itinerary_item_day(
    traveler_id: int,
    item_id: int,
    payload: UpdateItineraryItemDayRequest,
    db: Session = Depends(get_db)
):
    """Actualiza el dia asignado de una actividad del itinerario."""
    get_traveler_or_404(traveler_id, db)

    if payload.dia_asignado < 1:
        raise HTTPException(status_code=400, detail="El dia asignado debe ser mayor o igual a 1")

    itinerary = db.query(Itinerary).filter(Itinerary.traveler_id == traveler_id).first()
    if not itinerary:
        raise HTTPException(status_code=404, detail="Itinerario no encontrado")

    item = db.query(ItineraryItem).filter(
        ItineraryItem.id == item_id,
        ItineraryItem.itinerary_id == itinerary.id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item del itinerario no encontrado")

    service = db.query(TourService).filter(TourService.id == item.service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")

    item.dia_asignado = payload.dia_asignado
    itinerary.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(item)

    return ItineraryItemResponse(
        id=item.id,
        service_id=item.service_id,
        quantity=item.quantity,
        dia_asignado=item.dia_asignado,
        service_name=service.name,
        service_price=float(service.price),
        added_at=item.added_at.isoformat()
    )

@app.delete("/api/traveler/{traveler_id}/itinerary/items/{item_id}")
def remove_service_from_itinerary(traveler_id: int, item_id: int, db: Session = Depends(get_db)):
    """Elimina un servicio del itinerario del viajero"""
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

@app.get("/api/traveler/{traveler_id}/itinerary/budget", response_model=BudgetResponse)
def get_traveler_budget(traveler_id: int, db: Session = Depends(get_db)):
    """Obtiene el presupuesto total del itinerario (sin detalles de items)"""
    get_traveler_or_404(traveler_id, db)
    itinerary = get_or_create_itinerary(traveler_id, db)
    
    total_budget = calculate_itinerary_total(itinerary, db)
    item_count = len(itinerary.items)
    
    return BudgetResponse(
        total_budget=total_budget,
        item_count=item_count
    )

@app.post("/api/traveler/{traveler_id}/itinerary/budget/calculate", response_model=BudgetResponse)
def calculate_traveler_budget(traveler_id: int, db: Session = Depends(get_db)):
    """Recalcula el presupuesto total actual del itinerario del viajero."""
    get_traveler_or_404(traveler_id, db)
    itinerary = get_or_create_itinerary(traveler_id, db)

    return BudgetResponse(
        total_budget=calculate_itinerary_total(itinerary, db),
        item_count=len(itinerary.items)
    )
