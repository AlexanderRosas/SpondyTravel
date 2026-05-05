from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Numeric
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from fastapi.middleware.cors import CORSMiddleware

# 1. Configuración de la Base de Datos (Conectando a tu PostgreSQL en Docker)
DATABASE_URL = "postgresql://spondy_admin:spondy_password@localhost:5432/spondy_travel_db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 2. Modelos de Base de Datos (Mapean tu init.sql)
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String)

class TourService(Base):
    __tablename__ = "services"
    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer)
    name = Column(String)
    description = Column(String)
    price = Column(Numeric)
    image_url = Column(String)
    status = Column(String, default="Activo")

# 3. Esquemas (Para recibir datos del Frontend)
class LoginRequest(BaseModel):
    email: str
    password: str

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