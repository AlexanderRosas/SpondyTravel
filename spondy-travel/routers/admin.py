from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session, aliased

from models import Review, User
from schemas import ReviewDeactivateResponse, ReviewResponse
from dependencies import get_db, require_role


# ============================================================
# SPRINT 5 - HU09
# ROUTER PARA LA ADMINISTRACIÓN DE RESEÑAS CRUZADAS
# ============================================================

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin - Sprint 5 Reviews"]
)


# ============================================================
# SPRINT 5 - HU09
# LISTADO, BÚSQUEDA Y FILTRO DE RESEÑAS
# ============================================================

@router.get(
    "/reviews",
    response_model=list[ReviewResponse]
)
def get_reviews(
    review_type: str = Query(
        ...,
        description=(
            "Tipo de reseña: TRAVELER_TO_PROVIDER "
            "o PROVIDER_TO_TRAVELER"
        )
    ),
    rating: int | None = Query(
        default=None,
        ge=1,
        le=5,
        description="Filtro opcional por número de estrellas"
    ),
    search: str | None = Query(
        default=None,
        description="Búsqueda opcional por nombre o correo"
    ),
    current_user: dict = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """
    Obtiene las reseñas activas para el tablero administrativo.

    Criterios de aceptación cubiertos:

    CA1:
    Permite separar las reseñas según su dirección:
    - TRAVELER_TO_PROVIDER
    - PROVIDER_TO_TRAVELER

    CA2:
    Permite filtrar por cantidad de estrellas y buscar
    usuarios por nombre o correo electrónico.

    CA4:
    Si no existen resultados, devuelve una lista vacía.
    El frontend utilizará esa lista para mostrar el estado vacío.
    """

    # Tipos de reseña permitidos en el sistema.
    allowed_types = {
        "TRAVELER_TO_PROVIDER",
        "PROVIDER_TO_TRAVELER"
    }

    # Validación del tipo de reseña recibido.
    if review_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=(
                "El tipo de reseña debe ser "
                "TRAVELER_TO_PROVIDER o PROVIDER_TO_TRAVELER"
            )
        )

    # Se crean dos alias de la tabla users porque una reseña
    # contiene dos usuarios diferentes:
    # 1. El usuario que emite la reseña.
    # 2. El usuario que recibe la reseña.
    ReviewerUser = aliased(User)
    ReviewedUser = aliased(User)

    # Consulta base de reseñas.
    query = (
        db.query(
            Review,
            ReviewerUser,
            ReviewedUser
        )
        .join(
            ReviewerUser,
            Review.reviewer_id == ReviewerUser.id
        )
        .join(
            ReviewedUser,
            Review.reviewed_user_id == ReviewedUser.id
        )
        .filter(
            Review.review_type == review_type,
            Review.is_active == True
        )
    )

    # ========================================================
    # FILTRO OPCIONAL POR CANTIDAD DE ESTRELLAS
    # ========================================================

    if rating is not None:
        query = query.filter(
            Review.rating == rating
        )

    # ========================================================
    # BÚSQUEDA OPCIONAL POR NOMBRE O CORREO
    # ========================================================

    if search is not None and search.strip():
        search_value = f"%{search.strip()}%"

        query = query.filter(
            or_(
                ReviewerUser.name.ilike(search_value),
                ReviewerUser.full_name.ilike(search_value),
                ReviewerUser.email.ilike(search_value),

                ReviewedUser.name.ilike(search_value),
                ReviewedUser.full_name.ilike(search_value),
                ReviewedUser.email.ilike(search_value)
            )
        )

    # Las reseñas más recientes aparecen primero.
    reviews = (
        query
        .order_by(Review.created_at.desc())
        .all()
    )

    result = []

    # Se convierte cada resultado de SQLAlchemy
    # al esquema ReviewResponse.
    for review, reviewer, reviewed_user in reviews:
        result.append(
            ReviewResponse(
                id=review.id,

                reviewer_id=reviewer.id,
                reviewer_name=(
                    reviewer.full_name
                    or reviewer.name
                    or reviewer.email
                ),
                reviewer_email=reviewer.email,

                reviewed_user_id=reviewed_user.id,
                reviewed_user_name=(
                    reviewed_user.full_name
                    or reviewed_user.name
                    or reviewed_user.email
                ),
                reviewed_user_email=reviewed_user.email,

                rating=review.rating,
                comment=review.comment,
                review_type=review.review_type,
                is_active=review.is_active,
                created_at=review.created_at
            )
        )

    # Si no existen reseñas, result será [].
    return result


# ============================================================
# SPRINT 5 - HU09
# BAJA LÓGICA DE UNA RESEÑA
# ============================================================

@router.put(
    "/reviews/{review_id}/deactivate",
    response_model=ReviewDeactivateResponse
)
def deactivate_review(
    review_id: int,
    current_user: dict = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """
    Da de baja una reseña sin eliminarla físicamente.

    Criterio de aceptación cubierto:

    CA3:
    El administrador puede ocultar una reseña.
    El modal de confirmación será implementado en el frontend.
    """

    # Buscar la reseña por su identificador.
    review = (
        db.query(Review)
        .filter(Review.id == review_id)
        .first()
    )

    # Validar que la reseña exista.
    if not review:
        raise HTTPException(
            status_code=404,
            detail="La reseña no existe"
        )

    # Evitar que una reseña ya desactivada vuelva a procesarse.
    if not review.is_active:
        raise HTTPException(
            status_code=400,
            detail="La reseña ya fue dada de baja"
        )

    # ========================================================
    # BAJA LÓGICA
    # ========================================================

    # La reseña se oculta, pero permanece en la base de datos.
    review.is_active = False

    # Registrar la fecha de la baja.
    review.deactivated_at = datetime.utcnow()

    # Obtener el identificador del administrador autenticado.
    # Se contemplan dos nombres posibles según la estructura
    # actual del token o de la dependencia require_role.
    administrator_id = (
        current_user.get("user_id")
        or current_user.get("id")
    )

    # Registrar qué administrador realizó la acción.
    if administrator_id:
        review.deactivated_by = administrator_id

    # Guardar los cambios.
    db.commit()
    db.refresh(review)

    return ReviewDeactivateResponse(
        message="La reseña fue dada de baja correctamente",
        review_id=review.id,
        is_active=review.is_active
    )