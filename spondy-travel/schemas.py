from datetime import datetime
from pydantic import BaseModel, field_validator

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
    capacity: int

class ApproveRequest(BaseModel):
    status: bool

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
    capacity: int = 10
    @field_validator('capacity')
    @classmethod
    def validate_capacity(cls, v):
        if v <= 0:
            raise ValueError("La capacidad debe ser de al menos 1")
        return v

class TourServiceUpdate(TourServiceCreate):
    pass

class ServiceStatusUpdate(BaseModel):
    status: str

class AddItineraryItemRequest(BaseModel):
    service_id: int
    quantity: int = 1


# --- NUEVO MODELO PARA EL DESGLOSE DE IVA ---
class BudgetBreakdown(BaseModel):
    subtotal: float
    iva_rate: float
    iva_amount: float
    total: float

class ItineraryItemResponse(BaseModel):
    id: int
    service_id: int
    quantity: int
    dia_asignado: int
    service_name: str
    service_price: float
    added_at: str

# Actualizado con IVA
class ItineraryResponse(BaseModel):
    id: int
    traveler_id: int
    items: list[ItineraryItemResponse]
    budget_breakdown: BudgetBreakdown  # <-- IVA
    created_at: str
    updated_at: str

# Actualizado con IVA
class BudgetResponse(BaseModel):
    budget_breakdown: BudgetBreakdown  # <-- IVA
    item_count: int

# --- ESQUEMAS SPRINT 4 (CHECKOUT B2B2C) ---
class ProviderContactInfo(BaseModel):
    provider_id: int
    business_name: str
    phone: str | None
    whatsapp_url: str
    services_count: int

class CheckoutItineraryResponse(BaseModel):
    message: str
    providers_contacted: int
    contacts: list[ProviderContactInfo]

# ============================================================
# SPRINT 5 - HU09
# ESQUEMAS PARA EL TABLERO DE RESEÃ‘AS CRUZADAS
# ============================================================

class ReviewResponse(BaseModel):
    """
    InformaciÃ³n que serÃ¡ presentada en la tabla
    administrativa de reseÃ±as.
    """

    id: int

    reviewer_id: int
    reviewer_name: str
    reviewer_email: str

    reviewed_user_id: int
    reviewed_user_name: str
    reviewed_user_email: str

    rating: int
    comment: str | None = None
    review_type: str
    is_active: bool
    created_at: datetime


class ReviewDeactivateResponse(BaseModel):
    """
    Respuesta de la baja lÃ³gica de una reseÃ±a.
    """

    message: str
    review_id: int
    is_active: bool
