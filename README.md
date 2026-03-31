# WebApp Citas v2

[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-4479A1?logo=mysql&logoColor=white)](https://mysql.com)
[![Railway](https://img.shields.io/badge/Deploy-Railway-0B0D0E?logo=railway&logoColor=white)](https://railway.app)
[![License](https://img.shields.io/badge/Licencia-MIT-blue)](LICENSE)

---

## Descripción

**WebApp Citas v2** es un sistema web de gestión de citas médicas orientado a centros de atención que trabajan con intérpretes de lengua de señas para la comunidad sorda.

El sistema permite a pacientes, staff e intérpretes coordinar agendas de manera centralizada, con trazabilidad completa de cada cita: cambios de estado, sector de atención, intérprete asignado e historial de accesos.

**Problema que resuelve:** eliminar el uso de planillas Excel descentralizadas y sistemas PHP legacy, migrando a una plataforma moderna, segura y desplegable en la nube.

---

## Stack Tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| Frontend | Nuxt 3, Vue 3, Bootstrap 5 | Nuxt ^3.11 |
| Backend | Node.js, Express, mysql2, JWT | Node 20.x / Express ^4.19 |
| Base de datos | MySQL 8 | 8.0 |
| Deploy | Railway | — |
| CI/CD | GitHub + Railway auto-deploy | — |
| Auth | JWT en cookie httpOnly (24h) | jsonwebtoken ^9.0 |
| Passwords | bcryptjs (salt 12) | ^2.4 |

---

## Arquitectura

Monorepo con dos servicios independientes desplegados en Railway:

```
webapp-citas-v2/
├── frontend/            ← Nuxt 3 SSR / SPA
│   ├── pages/
│   ├── components/
│   ├── composables/
│   └── railpack.toml    ← config build Railway
├── backend/             ← Express REST API
│   ├── src/
│   │   ├── app.js
│   │   ├── db.js
│   │   ├── middleware/
│   │   │   └── auth.js
│   │   └── routes/
│   │       ├── auth.js
│   │       ├── users.js
│   │       ├── appointments.js
│   │       ├── patients.js
│   │       ├── audit.js
│   │       └── health.js
│   ├── .env             ← variables locales (no commitear)
│   └── railpack.toml    ← config build Railway
├── sql/
│   └── schema.sql       ← DDL completo (tablas + índices)
└── scripts/
    └── db-migrate-railway.sh  ← migración local → Railway
```

**Flujo de requests:**

```
Browser → Nuxt 3 (frontend :3000)
               ↓ fetch /api/*
          Express (backend :3001)
               ↓ mysql2
          MySQL 8 (local :3306 / Railway)
```

---

## Funcionalidades

### Por rol

| Funcionalidad | admin | staff | user | interpreter |
|---|:---:|:---:|:---:|:---:|
| Login / logout | ✅ | ✅ | ✅ | ✅ |
| Ver perfil propio | ✅ | ✅ | ✅ | ✅ |
| Cambiar contraseña propia | ✅ | ✅ | ✅ | ✅ |
| Ver citas propias | ✅ | ✅ | ✅ | ✅ |
| Crear cita propia | ✅ | ✅ | ✅ | — |
| Ver todas las citas | ✅ | ✅ | — | — |
| Crear / editar citas de otros | ✅ | ✅ | — | — |
| Asignar intérprete / sector | ✅ | ✅ | — | — |
| CRUD pacientes | ✅ | ✅ | — | — |
| CRUD usuarios | ✅ | — | — | — |
| Auditoría login_logs | ✅ | — | — | — |

### Detalle de módulos

- **Auth:** login con JWT en cookie httpOnly, logout, `/me` para sesión activa, cambio de contraseña con verificación de actual
- **Citas:** creación, edición de estado/notas/sector/intérprete, historial de cambios de estado, filtros por rango de fechas
- **Pacientes:** CRUD completo (23 campos: RUT, nombres, género, discapacidad, establecimiento, sector, foto, observaciones, etc.)
- **Usuarios:** CRUD con roles, soft delete (status → inactive), hash bcrypt en creación y edición
- **Auditoría:** registro de intentos de login (exitosos y fallidos) con IP y User-Agent, solo visible para admin

---

## Instalación Local

### Prerrequisitos

- Node.js 20.x o superior
- MySQL 8.0 local
- npm 10.x

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/NacAbarca/webapp-citas-v2.git
cd webapp-citas-v2

# 2. Instalar dependencias del backend
cd backend
npm ci
cd ..

# 3. Instalar dependencias del frontend
cd frontend
npm ci
cd ..

# 4. Configurar variables de entorno del backend
cp backend/.env.example backend/.env
# Editar backend/.env con tus valores locales

# 5. Crear la base de datos e importar schema
mysql -u root -p -e "CREATE DATABASE webapp_citas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p webapp_citas < sql/schema.sql

# 6. Iniciar servidores de desarrollo
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm run dev
```

El backend queda disponible en `http://localhost:3001` y el frontend en `http://localhost:3000`.

---

## Variables de Entorno

### backend/.env

| Variable | Descripción |
|---|---|
| `DB_HOST` | Host de la base de datos MySQL local |
| `DB_PORT` | Puerto MySQL (default: 3306) |
| `DB_NAME` | Nombre de la base de datos |
| `DB_USER` | Usuario MySQL |
| `DB_PASS` | Contraseña MySQL |
| `JWT_SECRET` | Clave secreta para firmar tokens JWT (mínimo 32 chars) |
| `NODE_ENV` | Entorno: `development` o `production` |
| `PORT` | Puerto donde corre Express (default: 3001) |
| `CORS_ORIGIN` | Origen permitido por CORS (URL del frontend) |
| `RAILWAY_HOST` | Host del proxy MySQL en Railway |
| `RAILWAY_PORT` | Puerto del proxy MySQL en Railway |
| `RAILWAY_DB` | Nombre de la base de datos en Railway |
| `RAILWAY_USER` | Usuario MySQL en Railway |
| `RAILWAY_PASS` | Contraseña MySQL en Railway (nunca commitear) |

### frontend/.env (si aplica)

| Variable | Descripción |
|---|---|
| `NUXT_PUBLIC_API_BASE` | URL base del backend (ej: `https://api.tudominio.com`) |

---

## Deploy en Railway

### Requisitos previos

- Cuenta en [railway.app](https://railway.app)
- Repositorio en GitHub conectado a Railway
- Railway CLI (opcional): `npm install -g @railway/cli`

### Paso a paso

**1. Crear proyecto en Railway**

Desde el dashboard de Railway: New Project → Empty Project.

**2. Agregar servicio MySQL**

New Service → Database → MySQL. Railway provisiona la base de datos automáticamente y expone las variables de conexión.

**3. Conectar el repositorio GitHub (dos servicios)**

Crear dos servicios desde el mismo repo:

- Servicio `backend`: New Service → GitHub Repo → seleccionar `webapp-citas-v2`
- Servicio `frontend`: repetir el proceso

**4. Configurar Root Directory por servicio**

En Settings de cada servicio:

| Servicio | Root Directory |
|---|---|
| backend | `/backend` |
| frontend | `/frontend` |

Railway leerá el `railpack.toml` de cada subcarpeta y ejecutará el build/start correspondiente.

**5. Agregar variables de entorno**

En Variables de cada servicio, configurar:

*Backend:*
```
DB_HOST=<host Railway MySQL>
DB_PORT=<puerto Railway MySQL>
DB_NAME=railway
DB_USER=root
DB_PASS=<password Railway MySQL>
JWT_SECRET=<cadena aleatoria 32+ chars>
NODE_ENV=production
PORT=3001
CORS_ORIGIN=<URL pública del frontend en Railway>
```

*Frontend:*
```
NUXT_PUBLIC_API_BASE=<URL pública del backend en Railway>
```

**6. Migrar base de datos**

Primero configurar las variables `RAILWAY_*` en `backend/.env`, luego ejecutar:

```bash
chmod +x scripts/db-migrate-railway.sh
bash scripts/db-migrate-railway.sh
```

El script aplica el schema, exporta los datos locales e importa en Railway con verificación final de conteos.

---

## Base de Datos

### Tablas

| Tabla | Descripción | PK |
|---|---|---|
| `users` | Cuentas del sistema (admin, staff, user, interpreter) | `id` (auto) |
| `pacientes` | Registro de pacientes (23 campos) | `id_paciente` (RUT/código) |
| `appointments` | Citas médicas con estado, sector e intérprete | `id` (auto) |
| `appointment_status_history` | Historial de cambios de estado por cita | `id` (auto) |
| `login_logs` | Intentos de login (exitosos y fallidos) con IP/UA | `id` (auto) |

### Relaciones (ERD)

```
users ──────────────────────────────────────────┐
  │ id                                           │
  │                                              │
  ├─< appointments (user_id)                     │
  │      │ id                                    │
  │      ├─< appointment_status_history          │
  │      │      appointment_id → appointments.id │
  │      │      changed_by    → users.id         │
  │      │                                       │
  │      ├── staff_id         → users.id         │
  │      ├── created_by_staff_id → users.id      │
  │      ├── interpreter_id   → users.id ────────┘
  │      └── id_paciente      → pacientes.id_paciente
  │
  └─< login_logs (user_id, nullable)
```

---

## API Endpoints

Todos los endpoints devuelven `{ ok: true, data: {...} }` en éxito o `{ ok: false, error: { message } }` en error.

### Auth — `/api/auth`

| Método | Ruta | Rol requerido | Descripción |
|---|---|---|---|
| POST | `/api/auth/login` | — | Login con email/password, setea cookie JWT |
| GET | `/api/auth/me` | Autenticado | Devuelve datos del usuario en sesión |
| PUT | `/api/auth/me` | Autenticado | Cambiar contraseña propia |
| POST | `/api/auth/logout` | — | Elimina la cookie JWT |

### Usuarios — `/api/users`

| Método | Ruta | Rol requerido | Descripción |
|---|---|---|---|
| GET | `/api/users` | admin | Listar todos los usuarios |
| POST | `/api/users` | admin | Crear usuario |
| PUT | `/api/users/:id` | admin | Editar nombre, rol, estado o contraseña |
| DELETE | `/api/users/:id` | admin | Soft delete (status → inactive) |

### Citas — `/api/appointments`

| Método | Ruta | Rol requerido | Descripción |
|---|---|---|---|
| GET | `/api/appointments` | Autenticado | Listar citas (filtros: `from`, `to`; staff/admin ve todas) |
| POST | `/api/appointments` | Autenticado | Crear cita |
| PUT | `/api/appointments/:id` | Autenticado | Editar estado, notas, sector, intérprete |
| GET | `/api/appointments/:id/history` | Autenticado | Historial de cambios de estado |

### Pacientes — `/api/patients`

| Método | Ruta | Rol requerido | Descripción |
|---|---|---|---|
| GET | `/api/patients` | admin, staff | Listar pacientes (filtro: `vigente`) |
| POST | `/api/patients` | admin, staff | Crear paciente |
| PUT | `/api/patients/:id_paciente` | admin, staff | Editar todos los campos |

### Auditoría — `/api/audit`

| Método | Ruta | Rol requerido | Descripción |
|---|---|---|---|
| GET | `/api/audit/login-logs` | admin | Últimos N intentos de login (default 100, máx 500) |

### Sistema

| Método | Ruta | Rol requerido | Descripción |
|---|---|---|---|
| GET | `/api/health` | — | Health check del servidor y conexión DB |

---

## Scripts Disponibles

### Backend

```bash
cd backend
npm run dev    # Servidor con hot-reload (node --watch)
npm start      # Servidor de producción
```

### Frontend

```bash
cd frontend
npm run dev      # Servidor de desarrollo Nuxt
npm run build    # Build de producción (.output/)
npm run preview  # Preview del build local
npm start        # Iniciar servidor SSR producido
```

### Scripts de base de datos

```bash
# Migración completa local → Railway
bash scripts/db-migrate-railway.sh

# Exportar schema desde DB local
mysqldump -u root --no-data webapp_citas > sql/schema.sql

# Importar schema en Railway
mysql -h $RAILWAY_HOST -P $RAILWAY_PORT -u $RAILWAY_USER \
  -p$RAILWAY_PASS $RAILWAY_DB < sql/schema.sql
```

---

## Control de Versiones

| Versión | Descripción |
|---|---|
| v1.0.0 | Commit inicial: estructura base, autenticación, CRUD completo de citas, pacientes y usuarios, control de roles, modal de perfil, auditoría |
| v1.0.1 | Fix `railpack.toml`: formato `[phases.build]` correcto para detección Railway/Railpack |
| v1.0.2 | Limpieza de `start.sh`, README profesional completo |

---

## Estado del Proyecto

### Completado (v1.0.2)

- Autenticación JWT con cookie httpOnly
- CRUD completo de Citas, Pacientes, Usuarios
- Control de acceso por roles (admin / staff / user / interpreter)
- Modal de perfil + cambio de contraseña
- Auditoría de login (solo admin)
- Migración de datos desde DB legacy (Webapp PHP)
- Deploy en Railway con Railpack
- Script de migración DB local → Railway
- Colección Postman para testing de API

### En Progreso

- Configuración Root Directory en Railway (pendiente verificar build)
- Variables de entorno en Railway dashboard

### Próximos Sprints

- Historial de cambios de estado por cita (tabla `appointment_status_history`)
- Notificaciones por email (citas confirmadas/canceladas)
- PWA / modo offline
- Tests unitarios backend (Jest)
- Tests e2e frontend (Playwright)
- Búsqueda y filtros avanzados en citas y pacientes
- Dashboard con métricas (admin)
- Exportar reportes PDF/Excel
- Conectar dominio personalizado en Railway

---

## Autor

**Nac Abarca** — [github.com/NacAbarca](https://github.com/NacAbarca)

---

## Licencia

MIT © 2026 Nac Abarca
