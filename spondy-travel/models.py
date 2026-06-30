from datetime import datetime
from sqlalchemy import Column, Integer, String, Numeric, Boolean, ForeignKey, Text, TIMESTAMP
from sqlalchemy.orm import relationship
from database import Base

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
    capacity = Column(Integer, default=10, nullable=False)

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

# --- NUEVA TABLA SPRINT 4 ---
class ProviderNotification(Base):
    __tablename__ = "provider_notifications"
    id = Column(Integer, primary_key=True, index=True)
    provider_id = Column(Integer, ForeignKey("users.id"), index=True)
    traveler_id = Column(Integer, ForeignKey("users.id"))
    itinerary_id = Column(Integer, ForeignKey("itineraries.id"))
    message = Column(Text)
    status = Column(String, default="Pendiente")
    created_at = Column(TIMESTAMP, default=datetime.utcnow)

# ============================================================
# SPRINT 5 - HU09
# TABLA PARA EL SISTEMA DE CALIFICACIONES CRUZADAS
# ============================================================

class Review(Base):
    """
    Representa una calificación realizada entre usuarios.
    """

    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)

    reviewer_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    reviewed_user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )

    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)

    review_type = Column(
        String,
        nullable=False,
        index=True
    )

    is_active = Column(
        Boolean,
        default=True,
        nullable=False
    )

    created_at = Column(
        TIMESTAMP,
        default=datetime.utcnow
    )

    deactivated_at = Column(
        TIMESTAMP,
        nullable=True
    )

    deactivated_by = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True
    )

    reviewer = relationship(
        "User",
        foreign_keys=[reviewer_id]
    )

    reviewed_user = relationship(
        "User",
        foreign_keys=[reviewed_user_id]
    )

    administrator = relationship(
        "User",
        foreign_keys=[deactivated_by]
    )