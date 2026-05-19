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

INSERT INTO provider_details (user_id, business_name, tax_id, phone, address, city, category) VALUES 
(2, 'Explora Ecuador S.A.', '1790001112001', '022555666', 'Amazonas y Shyris, Quito', 'Quito', 'Hospedaje'),
(3, 'Montaña Mágica Travel', '1790002223001', '098555111', 'Avenida Amazonas 123, Quito', 'Quito', 'Tours'),
(4, 'Andes Aventura Tours', '1790003334001', '099888777', 'Calle 10 de Agosto 456, Quito', 'Quito', 'Tours'),
(5, 'Selva Turística Ecuador', '1790004445001', '099444555', 'Ruta de la Selva 12, Tena', 'Tena', 'Tours'),
(6, 'Costa Caribe Tours', '1790005556001', '099777888', 'Malecón 200, Esmeraldas', 'Esmeraldas', 'Tours');

-- Insertar servicios de prueba vinculados a los proveedores
INSERT INTO services (provider_id, name, description, price, image_url, city, category, status) VALUES 
(2, 'Habitación Matrimonial Vista al Mar', 'Habitación amplia con balcón y desayuno incluido.', 85.00, 'https://images.unsplash.com/photo-1776761603930-e4509e386fbf?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 'Esmeraldas', 'Hospedaje', 'Activo'),
(2, 'Tour de Snorkel', 'Tour guiado de 3 horas por los arrecifes locales.', 35.00, 'https://plus.unsplash.com/premium_photo-1716999413705-44286906c6c2?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 'Esmeraldas', 'Tours', 'Activo'),
(3, 'Excursión de Montaña', 'Trekking de día completo con guía y almuerzo incluido.', 55.00, 'https://images.unsplash.com/photo-1551632811-561732d1e306?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 'Quito', 'Tours', 'Activo'),
(4, 'Safari en la Selva', 'Ruta de 2 días por la selva con avistamiento de fauna.', 120.00, 'https://images.unsplash.com/photo-1516426122078-c23e76319801?q=80&w=2068&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 'Tena', 'Tours', 'Activo'),
(6, 'Tour de Surf', 'Clases de surf con instructor profesional en la playa.', 40.00, 'https://images.unsplash.com/photo-1642219235453-55445eea1852?q=80&w=736&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 'Esmeraldas', 'Tours', 'Activo');