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

El proyecto está dividido en tres componentes principales: base de datos, backend y frontend. La forma más simple de levantarlos juntos es usar el script raíz `npm run dev`.

### 1. Preparar el proyecto
```bash
# En la raíz del proyecto
npm install
```

### 2. Instalar dependencias del backend
```bash
cd spondy-travel
python -m venv venv
# En Windows PowerShell:
.\venv\Scripts\Activate.ps1
# En Windows CMD:
.\venv\Scripts\activate
# En Git Bash / Linux / macOS:
source venv/bin/activate
pip install -r requirements.txt
```

### 3. Instalar dependencias del frontend
```bash
cd ../frontend
npm install
```

### 4. Ejecutar todo junto
Desde la raíz del proyecto:

#### Windows PowerShell
```powershell
npm run dev
```

#### Windows CMD
```cmd
npm run dev
```

#### macOS / Linux / Git Bash
```bash
npm run dev
```

Esto ejecuta automáticamente:
* `npm run dev:db` — inicia la base de datos Docker con `docker-compose`
* `npm run dev:backend` — inicia el backend FastAPI
* `npm run dev:frontend` — inicia el frontend React/Vite

> Si no quieres usar `npm run dev` desde la raíz, puedes ejecutar cada componente por separado.

### Ejecución separada
Base de datos:
```bash
cd spondy-travel
docker-compose up
```
Backend:
```bash
cd spondy-travel
.\venv\Scripts\activate  # o source venv/bin/activate
uvicorn main:app --reload
```
Frontend:
```bash
cd frontend
npm run dev
```

---

## 🧪 Pruebas del Backend
El backend usa `pytest`. Ejecuta las pruebas desde la carpeta `spondy-travel` con el entorno virtual activado.

```bash
cd spondy-travel
.\venv\Scripts\activate  # o source venv/bin/activate
pytest
```

---

## 🔑 Datos de Prueba (Seeding)
El sistema viene precargado con datos para facilitar la validación de la **Historia de Usuario 1 (HU01)**. Utilice las siguientes credenciales en la pantalla de Login:

* **Rol:** Proveedor Turístico
* **Correo:** `proveedor@spondytravel.com`
* **Contraseña:** `123456`

* **Admin de prueba:** `admin1@spondy.com` / `admin1`

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
