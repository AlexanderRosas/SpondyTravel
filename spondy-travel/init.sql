-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'ADMIN', 'PROVIDER', 'TRAVELER'
    is_verified BOOLEAN DEFAULT FALSE, -- Compatibilidad con filtros existentes
    provider_status VARCHAR(50) DEFAULT 'pendiente' -- 'pendiente', 'aprobado', 'rechazado'
);

-- Detalles del Negocio (Lo que el admin revisa)
CREATE TABLE IF NOT EXISTS provider_details (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(20) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Servicios (HU01)
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    provider_id INT REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(255),
    city VARCHAR(100),
    category VARCHAR(100),
    status VARCHAR(50) DEFAULT 'Activo',
    capacity INT NOT NULL DEFAULT 10 CHECK (capacity > 0) -- NUEVO: Límite de cupos
);

-- Itinerarios de Viajeros (HU03)
CREATE TABLE IF NOT EXISTS itineraries (
    id SERIAL PRIMARY KEY,
    traveler_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(traveler_id)
);

-- Items del Itinerario (HU03)
CREATE TABLE IF NOT EXISTS itinerary_items (
    id SERIAL PRIMARY KEY,
    itinerary_id INT NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
    service_id INT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    quantity INT DEFAULT 1 CHECK (quantity > 0),
    dia_asignado INT NOT NULL DEFAULT 1 CHECK (dia_asignado > 0),
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Buzón de Notificaciones para Proveedores (SPRINT 4)
CREATE TABLE IF NOT EXISTS provider_notifications (
    id SERIAL PRIMARY KEY,
    provider_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    traveler_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    itinerary_id INT NOT NULL REFERENCES itineraries(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'Pendiente',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Compatibilidad con bases existentes (ALTERS de seguridad)
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS provider_status VARCHAR(50) DEFAULT 'pendiente';
UPDATE users
SET provider_status = CASE
    WHEN role = 'PROVIDER' AND is_verified = TRUE THEN 'aprobado'
    WHEN role = 'PROVIDER' AND is_verified = FALSE THEN 'pendiente'
    ELSE 'aprobado'
END
WHERE provider_status IS NULL;
UPDATE users
SET provider_status = 'aprobado'
WHERE provider_status = 'pendiente'
AND (role != 'PROVIDER' OR is_verified = TRUE);
ALTER TABLE provider_details ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE provider_details ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE provider_details ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE provider_details ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE services ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE services ADD COLUMN IF NOT EXISTS city VARCHAR(100);
ALTER TABLE services ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Activo';
ALTER TABLE services ADD COLUMN IF NOT EXISTS capacity INT NOT NULL DEFAULT 10 CHECK (capacity > 0);
ALTER TABLE itinerary_items ADD COLUMN IF NOT EXISTS dia_asignado INT NOT NULL DEFAULT 1 CHECK (dia_asignado > 0);
CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_details_user_id ON provider_details(user_id);

-- DATOS DE PRUEBA
INSERT INTO users (name, full_name, email, password, role, is_verified, provider_status) VALUES 
('Administrador', 'Admin Spondy', 'admin@spondy.com', '$2b$12$OSlpUUhHKJHmCyKFMQfGPO8zdkGLLjZ.W9.3y99Brx8SZ0uCWAxBG', 'ADMIN', TRUE, 'aprobado'),
('Proveedor Aprobado', 'Proveedor Aprobado', 'proveedorAprobado@spondytravel.com', '$2b$12$.uLOn1GSMz21aQk/i.ZH4ONI0ORGxRESgHZ.nZbV3an2u3smpR29y', 'PROVIDER', TRUE, 'aprobado'),
('Proveedor Aprobado Dos', 'Proveedor Aprobado Dos', 'proveedorAprobadoDos@spondytravel.com', '$2b$12$.uLOn1GSMz21aQk/i.ZH4ONI0ORGxRESgHZ.nZbV3an2u3smpR29y', 'PROVIDER', TRUE, 'aprobado'),
('Proveedor Pendiente Uno', 'Proveedor Pendiente Uno', 'proveedorPendienteUno@spondytravel.com', '$2b$12$.uLOn1GSMz21aQk/i.ZH4ONI0ORGxRESgHZ.nZbV3an2u3smpR29y', 'PROVIDER', FALSE, 'pendiente'),
('Proveedor Pendiente Dos', 'Proveedor Pendiente Dos', 'proveedorPendienteDos@spondytravel.com', '$2b$12$.uLOn1GSMz21aQk/i.ZH4ONI0ORGxRESgHZ.nZbV3an2u3smpR29y', 'PROVIDER', FALSE, 'pendiente'),
('Proveedor Pendiente Tres', 'Proveedor Pendiente Tres', 'proveedorPendienteTres@spondytravel.com', '$2b$12$.uLOn1GSMz21aQk/i.ZH4ONI0ORGxRESgHZ.nZbV3an2u3smpR29y', 'PROVIDER', FALSE, 'pendiente'),
('Viajero Uno', 'Christian Puchaicela', 'viajeroUno@spondytravel.com', '$2b$12$.uLOn1GSMz21aQk/i.ZH4ONI0ORGxRESgHZ.nZbV3an2u3smpR29y', 'TRAVELER', TRUE, 'aprobado'),
('Viajero Dos', 'Viajero Dos', 'viajeroDos@spondytravel.com', '$2b$12$.uLOn1GSMz21aQk/i.ZH4ONI0ORGxRESgHZ.nZbV3an2u3smpR29y', 'TRAVELER', TRUE, 'aprobado');

INSERT INTO provider_details (user_id, business_name, tax_id, phone, address, city, category) VALUES 
(2, 'Explora Ecuador S.A.', '1790001112001', '022555666', 'Amazonas y Shyris, Quito', 'Quito', 'Hospedaje'),
(3, 'Montaña Mágica Travel', '1790002223001', '098555111', 'Avenida Amazonas 123, Quito', 'Quito', 'Tours'),
(4, 'Andes Aventura Tours', '1790003334001', '099888777', 'Calle 10 de Agosto 456, Quito', 'Quito', 'Tours'),
(5, 'Selva Turística Ecuador', '1790004445001', '099444555', 'Ruta de la Selva 12, Tena', 'Tena', 'Tours'),
(6, 'Costa Caribe Tours', '1790005556001', '099777888', 'Malecón 200, Esmeraldas', 'Esmeraldas', 'Tours');

-- Actualizar datos de prueba de full_name
UPDATE users SET full_name = 'Admin Spondy' WHERE role = 'ADMIN';
UPDATE users SET full_name = 'Christian Puchaicela' WHERE email = 'viajeroUno@spondytravel.com';

-- Insertar servicios de prueba con CAPACIDAD incluida
INSERT INTO services (provider_id, name, description, price, image_url, city, category, status, capacity) VALUES 
(2, 'Habitación Matrimonial Vista al Mar', 'Habitación amplia con balcón y desayuno incluido.', 85.00, 'https://images.unsplash.com/photo-1776761603930-e4509e386fbf?q=80&w=1170&auto=format&fit=crop', 'Esmeraldas', 'Alojamiento', 'Activo', 5),
(2, 'Tour de Snorkel', 'Tour guiado de 3 horas por los arrecifes locales.', 35.00, 'https://plus.unsplash.com/premium_photo-1716999413705-44286906c6c2?q=80&w=1170&auto=format&fit=crop', 'Esmeraldas', 'Actividad', 'Activo', 15),
(3, 'Excursión de Montaña', 'Trekking de día completo con guía y almuerzo incluido.', 55.00, 'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=1170&auto=format&fit=crop', 'Quito', 'Actividad', 'Activo', 12),
(4, 'Safari en la Selva', 'Ruta de 2 días por la selva con avistamiento de fauna.', 120.00, 'https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=2068&auto=format&fit=crop', 'Tena', 'Actividad', 'Activo', 8),
(6, 'Tour de Surf', 'Clases de surf con instructor profesional en la playa.', 40.00, 'https://images.unsplash.com/photo-1642219235453-55445eea1852?q=80&w=736&auto=format&fit=crop', 'Esmeraldas', 'Actividad', 'Activo', 6),
(2, 'Traslado privado nocturno', 'Traslado reservado desde el aeropuerto con conductor local.', 28.00, 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=1170&auto=format&fit=crop', 'Quito', 'Transporte', 'Inactivo', 4),
(4, 'Ruta cultural pendiente', 'Servicio activo de un proveedor aun no verificado para validar filtros.', 45.00, 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=1170&auto=format&fit=crop', 'Quito', 'Cultura', 'Activo', 20);


-- ============================================================
-- SPRINT 5 - HU09
-- TABLA PARA EL SISTEMA DE CALIFICACIONES CRUZADAS
-- ============================================================

CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,

    -- Usuario que realiza la calificación.
    reviewer_id INTEGER NOT NULL,

    -- Usuario que recibe la calificación.
    reviewed_user_id INTEGER NOT NULL,

    -- Puntaje entre 1 y 5 estrellas.
    rating INTEGER NOT NULL,

    -- Comentario opcional de la reseña.
    comment TEXT,

    -- Dirección de la reseña:
    -- TRAVELER_TO_PROVIDER o PROVIDER_TO_TRAVELER.
    review_type VARCHAR(50) NOT NULL,

    -- Permite ocultar una reseña sin eliminarla físicamente.
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Fecha de creación de la reseña.
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Fecha en la que el administrador dio de baja la reseña.
    deactivated_at TIMESTAMP NULL,

    -- Administrador que realizó la baja lógica.
    deactivated_by INTEGER NULL,

    -- Relaciones con la tabla users.
    CONSTRAINT fk_reviews_reviewer
        FOREIGN KEY (reviewer_id)
        REFERENCES users(id),

    CONSTRAINT fk_reviews_reviewed_user
        FOREIGN KEY (reviewed_user_id)
        REFERENCES users(id),

    CONSTRAINT fk_reviews_deactivated_by
        FOREIGN KEY (deactivated_by)
        REFERENCES users(id),

    -- La puntuación solo puede ser de 1 a 5 estrellas.
    CONSTRAINT chk_reviews_rating
        CHECK (rating BETWEEN 1 AND 5),

    -- Solo se permiten los dos tipos de calificación cruzada.
    CONSTRAINT chk_reviews_type
        CHECK (
            review_type IN (
                'TRAVELER_TO_PROVIDER',
                'PROVIDER_TO_TRAVELER'
            )
        ),

    -- Un usuario no puede calificarse a sí mismo.
    CONSTRAINT chk_reviews_different_users
        CHECK (reviewer_id <> reviewed_user_id)
);


-- Índices para mejorar los filtros del tablero administrativo.

CREATE INDEX IF NOT EXISTS idx_reviews_type
    ON reviews(review_type);

CREATE INDEX IF NOT EXISTS idx_reviews_rating
    ON reviews(rating);

CREATE INDEX IF NOT EXISTS idx_reviews_active
    ON reviews(is_active);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewer
    ON reviews(reviewer_id);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_user
    ON reviews(reviewed_user_id);