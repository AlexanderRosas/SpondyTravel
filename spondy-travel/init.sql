-- Creación de tabla de Usuarios (Para el Login)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL
);

-- Creación de tabla de Servicios Turísticos (Para la HU1)
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    provider_id INT REFERENCES users(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Activo'
);

-- INSERCIÓN DE DATOS QUEMADOS

-- 1. Insertar un usuario Proveedor (La contraseña asume un hash simple o texto plano por ahora para el MVP)
INSERT INTO users (email, password, role) 
VALUES ('proveedor@spondytravel.com', '123456', 'PROVIDER');

-- 2. Insertar servicios de prueba vinculados a ese proveedor
INSERT INTO services (provider_id, name, description, price, image_url, status)
VALUES 
(1, 'Habitación Matrimonial Vista al Mar', 'Habitación amplia con balcón y desayuno incluido.', 85.00, 'https://ejemplo.com/habitacion.jpg', 'Activo'),
(1, 'Tour de Snorkel', 'Tour guiado de 3 horas por los arrecifes locales.', 35.00, 'https://ejemplo.com/snorkel.jpg', 'Activo');