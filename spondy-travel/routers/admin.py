from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from models import User
from schemas import ProviderResponse
from dependencies import get_db, require_role

router = APIRouter(prefix="/api/admin", tags=["Admin"])


@router.get("/pending-providers", response_model=list[ProviderResponse])
def get_pending_providers(
    current_user: dict = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    providers = db.query(User).join(User.provider_detail).filter(
        User.role == "PROVIDER",
        User.is_verified == False
    ).all()

    result = []
    for user in providers:
        if user.provider_detail:
            result.append(ProviderResponse(
                id=user.id,
                email=user.email,
                full_name=user.full_name or user.name,
                business_name=user.provider_detail.business_name,
                tax_id=user.provider_detail.tax_id
            ))
    return result


@router.put("/verify-provider/{user_id}")
def verify_provider(
    user_id: int,
    current_user: dict = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id, User.role == "PROVIDER").first()
    if not user:
        raise HTTPException(status_code=404, detail="Provider not found")
    user.is_verified = True
    db.commit()
    return {"message": "Provider verified successfully"}