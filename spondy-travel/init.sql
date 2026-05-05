-- Tabla de Usuarios
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'ADMIN', 'PROVIDER', 'TRAVELER'
    is_verified BOOLEAN DEFAULT FALSE -- Clave para la HU04
);

-- Detalles del Negocio (Lo que el admin revisa)
CREATE TABLE IF NOT EXISTS provider_details (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(20) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
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
    status VARCHAR(50) DEFAULT 'Activo'
);

-- DATOS DE PRUEBA
INSERT INTO users (email, password, role, is_verified) VALUES 
('admin@spondy.com', 'admin123', 'ADMIN', TRUE),
('proveedorAprobado@spondytravel.com', '123456', 'PROVIDER', TRUE),
('proveedorAprobadoDos@spondytravel.com', '123456', 'PROVIDER', TRUE),
('proveedorPendienteUno@spondytravel.com', '123456', 'PROVIDER', FALSE),
('proveedorPendienteDos@spondytravel.com', '123456', 'PROVIDER', FALSE),
('proveedorPendienteTres@spondytravel.com', '123456', 'PROVIDER', FALSE),
('viajeroUno@spondytravel.com', '123456', 'TRAVELER', TRUE),
('viajeroDos@spondytravel.com', '123456', 'TRAVELER', TRUE);

INSERT INTO provider_details (user_id, business_name, tax_id, phone, address) VALUES 
(2, 'Explora Ecuador S.A.', '1790001112001', '022555666', 'Amazonas y Shyris, Quito'),
(3, 'Montaña Mágica Travel', '1790002223001', '098555111', 'Avenida Amazonas 123, Quito'),
(4, 'Andes Aventura Tours', '1790003334001', '099888777', 'Calle 10 de Agosto 456, Quito'),
(5, 'Selva Turística Ecuador', '1790004445001', '099444555', 'Ruta de la Selva 12, Tena'),
(6, 'Costa Caribe Tours', '1790005556001', '099777888', 'Malecón 200, Esmeraldas');

-- Insertar servicios de prueba vinculados a los proveedores
INSERT INTO services (provider_id, name, description, price, image_url, status) VALUES 
(2, 'Habitación Matrimonial Vista al Mar', 'Habitación amplia con balcón y desayuno incluido.', 85.00, 'https://ejemplo.com/habitacion.jpg', 'Activo'),
(2, 'Tour de Snorkel', 'Tour guiado de 3 horas por los arrecifes locales.', 35.00, 'https://ejemplo.com/snorkel.jpg', 'Activo'),
(3, 'Excursión de Montaña', 'Trekking de día completo con guía y almuerzo incluido.', 55.00, 'https://ejemplo.com/montana.jpg', 'Activo'),
(4, 'Safari en la Selva', 'Ruta de 2 días por la selva con avistamiento de fauna.', 120.00, 'https://ejemplo.com/selva.jpg', 'Activo'),
(6, 'Tour de Surf', 'Clases de surf con instructor profesional en la playa.', 40.00, 'https://ejemplo.com/surf.jpg', 'Activo');