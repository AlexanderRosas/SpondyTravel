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
    provider_status = Column(String, default="pendiente") # Traído desde main.py
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
    price = Column(Numeric(10, 2), nullable=False) # Traído desde main.py
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
    dia_asignado = Column(Integer, default=1, nullable=False) # Traído desde main.py
    added_at = Column(TIMESTAMP, default=datetime.utcnow)
    itinerary = relationship("Itinerary", back_populates="items")