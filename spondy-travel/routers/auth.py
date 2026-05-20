from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from security import get_password_hash, verify_password
from auth_utils import generate_token
from dependencies import get_db
from models import User
from schemas import LoginRequest, LoginResponse, RegisterRequest

router = APIRouter(prefix="/api/auth", tags=["Auth"])

@router.post("/login", response_model=LoginResponse)
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

@router.post("/register", response_model=LoginResponse)
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
        is_verified=(role == "TRAVELER")
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