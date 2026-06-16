from pydantic import BaseModel

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

class TourServiceUpdate(TourServiceCreate):
    pass

class ServiceStatusUpdate(BaseModel):
    status: str

class AddItineraryItemRequest(BaseModel):
    service_id: int
    quantity: int = 1

class ItineraryItemResponse(BaseModel):
    id: int
    service_id: int
    quantity: int
    service_name: str
    service_price: float
    added_at: str

class BudgetBreakdown(BaseModel):
    subtotal: float
    iva_rate: float
    iva_amount: float
    total: float

class ItineraryResponse(BaseModel):
    id: int
    traveler_id: int
    items: list[ItineraryItemResponse]
    budget_breakdown: BudgetBreakdown
    created_at: str
    updated_at: str

class BudgetResponse(BaseModel):
    budget_breakdown: BudgetBreakdown
    item_count: int