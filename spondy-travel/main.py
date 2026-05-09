from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Numeric, Boolean, ForeignKey, Text, TIMESTAMP
from sqlalchemy.orm import declarative_base, sessionmaker, Session, relationship
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

# 1. Configuración de la Base de Datos (Conectando a tu PostgreSQL en Docker)
DATABASE_URL = "postgresql://spondy_admin:spondy_password@localhost:5432/spondy_travel_db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Crear las tablas si no existen
Base.metadata.create_all(bind=engine)

# 2. Modelos de Base de Datos (Mapean tu init.sql)
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String)
    is_verified = Column(Boolean, default=False)
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
    provider_id = Column(Integer)
    name = Column(String)
    description = Column(String)
    price = Column(Numeric)
    image_url = Column(String)
    city = Column(String, nullable=True)
    category = Column(String, nullable=True)
    status = Column(String, default="Activo")

# 3. Esquemas (Para recibir datos del Frontend)
class LoginRequest(BaseModel):
    email: str
    password: str

class ProviderResponse(BaseModel):
    id: int
    email: str
    business_name: str
    tax_id: str


class SearchServiceResult(BaseModel):
    id: int
    name: str
    description: str
    price: float
    image_url: str
    city: str | None = None
    category: str | None = None
    status: str
    business_name: str  # From provider_details
class ApproveRequest(BaseModel):
    status: bool

# 4. Inicializar FastAPI
app = FastAPI(title="Spondy Travel API")

# Habilitar CORS para que el Frontend (React) pueda conectarse sin problemas
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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

# 5. ENDPOINTS

@app.post("/api/auth/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    # Buscamos al usuario con esas credenciales
    user = db.query(User).filter(User.email == request.email, User.password == request.password).first()
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    
    return {"id": user.id, "email": user.email, "role": user.role}

@app.get("/api/provider/{provider_id}/services")
def get_services(provider_id: int, db: Session = Depends(get_db)):
    # Traemos los servicios quemados de ese proveedor
    services = db.query(TourService).filter(TourService.provider_id == provider_id).all()
    return services

@app.get("/api/admin/pending-providers")
def get_pending_providers(db: Session = Depends(get_db)):
    # Get all users with role 'PROVIDER' and is_verified False, join with provider_details
    providers = db.query(User).join(ProviderDetail).filter(User.role == 'PROVIDER', User.is_verified == False).all()
    result = []
    for user in providers:
        if user.provider_detail:
            result.append(ProviderResponse(
                id=user.id,
                email=user.email,
                business_name=user.provider_detail.business_name,
                tax_id=user.provider_detail.tax_id
            ))
    return result

@app.put("/api/admin/verify-provider/{user_id}")
def verify_provider(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id, User.role == 'PROVIDER').first()
    if not user:
        raise HTTPException(status_code=404, detail="Provider not found")
    user.is_verified = True
    db.commit()
    return {"message": "Provider verified successfully"}

@app.get("/api/services")
def get_verified_services(db: Session = Depends(get_db)):
    # Get services from verified providers
    services = db.query(TourService).join(User, TourService.provider_id == User.id).filter(User.is_verified == True).all()
    return services

@app.get("/api/services/search", response_model=list[SearchServiceResult])
def search_services(city: str = None, db: Session = Depends(get_db)):
    """
    Search for services by city (case-insensitive).
    If no city is provided, returns all verified services.
    Returns services with business_name from provider_details.
    """
    query = db.query(TourService, ProviderDetail).join(
        User, TourService.provider_id == User.id
    ).outerjoin(
        ProviderDetail, TourService.provider_id == ProviderDetail.user_id
    ).filter(User.is_verified == True)
    
    # Apply city filter if provided
    if city:
        query = query.filter(TourService.city.ilike(f"%{city}%"))
    
    results = query.all()
    
    # Build response with business_name
    response = []
    for service, provider in results:
        response.append(SearchServiceResult(
            id=service.id,
            name=service.name,
            description=service.description,
            price=float(service.price),
            image_url=service.image_url,
            city=service.city,
            category=service.category,
            status=service.status,
            business_name=provider.business_name if provider else "Unknown"
        ))
    
    return response