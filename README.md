# 🌊 Spondy Travel: Smart Planning Ecosystem

**Spondy Travel** es una plataforma web (B2B2C) que centraliza la oferta de proveedores turísticos locales y permite a los viajeros diseñar itinerarios personalizados con un calculador de presupuesto en tiempo real. 

Desarrollado por **SpondyTech Solutions**.

## 🛠️ Tecnologías Utilizadas (Stack)
* **Frontend:** React.js, Vite, Tailwind CSS v4.
* **Backend:** Python 3.11+, FastAPI, SQLAlchemy.
* **Base de Datos & Portabilidad:** PostgreSQL 15, Docker & Docker Compose.

---

## 📋 Requisitos Previos (Prerrequisitos)
Para ejecutar este proyecto de manera local, el revisor debe tener instalado:
* [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Corriendo en segundo plano).
* [Python 3.10 o superior](https://www.python.org/downloads/).
* [Node.js v18 o superior](https://nodejs.org/).

---

## 🚀 Guía de Instalación y Ejecución

El proyecto está dividido en tres capas. Se recomienda abrir **tres terminales separadas** en la carpeta raíz del proyecto para levantar cada entorno.

### 1. Levantar la Base de Datos (Docker)
El sistema incluye un archivo de *seeding* (`init.sql`) que creará las tablas e inyectará los datos de prueba automáticamente.
```bash
# En la terminal (raíz del proyecto), ejecuta:
docker-compose up -d
```
> La base de datos estará disponible en `localhost:5432`.

### 2. Levantar el Backend (FastAPI)
```bash
# 1. Crear el entorno virtual
python -m venv venv

# 2. Activar el entorno virtual
# En Windows (CMD/PowerShell): .\venv\Scripts\activate
# En Windows (Git Bash): source venv/Scripts/activate
# En Mac/Linux: source venv/bin/activate

# 3. Instalar dependencias
pip install -r requirements.txt

# 4. Levantar el servidor
uvicorn main:app --reload
```
> El backend estará escuchando en `http://localhost:8000`.

### 3. Levantar el Frontend (React + Vite)
```bash
# 1. Navegar a la carpeta del frontend
cd frontend

# 2. Instalar módulos de Node (solo la primera vez)
npm install

# 3. Iniciar el servidor de desarrollo
npm run dev
```
> El frontend estará disponible en `http://localhost:5173`.

---

## 🔑 Datos de Prueba (Seeding)
El sistema viene precargado con datos para facilitar la validación de la **Historia de Usuario 1 (HU01)**. Utilice las siguientes credenciales en la pantalla de Login:

* **Rol:** Proveedor Turístico
* **Correo:** `proveedor@spondytravel.com`
* **Contraseña:** `123456`

---

## 🌐 Enlaces y Puertos del Sistema

| Componente | URL / Puerto | Descripción |
| :--- | :--- | :--- |
| **Aplicación Web (UI)** | `http://localhost:5173/` | Interfaz gráfica principal (Login / Dashboard). |
| **Documentación API** | `http://localhost:8000/docs` | Interfaz Swagger interactiva autogenerada por FastAPI. |
| **Base de Datos** | `localhost:5432` | Credenciales internas: User: `spondy_admin` / Pass: `spondy_password`. |

---

## 👥 Equipo de Desarrollo (SpondyTech Solutions)
* **Ariel Rosas** - Project Manager & Lead Backend Developer
* **Elian Caizapanta** - Software Architect & Backend Developer
* **Erick Espinoza** - DevOps & Database Administrator
* **Brando Pallo** - UI/UX Designer & Frontend Developer
* **Christian Puchaicela** - QA Engineer & Requirement Analyst
* **Estefano Santacruz** - Full Stack Developer & Technical Writer
