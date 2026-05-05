# BildyApp — API de gestión de albaranes

API REST para gestión de clientes, proyectos y albaranes de obra. Desarrollada con Node.js, Express, MongoDB y JWT.

## Tecnologías

- **Node.js** ≥ 22 + ESM
- **Express 5**
- **MongoDB** + Mongoose (soft delete, índices)
- **JWT** para autenticación
- **Zod** para validación
- **Multer** para subida de imágenes
- **Cloudinary** para almacenamiento de firmas
- **PDFKit** para generación de albaranes en PDF
- **Jest + Supertest** para tests de integración

## Instalación

```bash
npm install
```

Crea un archivo `.env` en la raíz con las variables necesarias (ver sección abajo).

```bash
npm run dev     # Arrancar en modo desarrollo
npm start       # Producción
npm test        # Tests
npm run test:coverage  # Tests con cobertura
```

## Variables de entorno

```env
DB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/bildyapp
JWT_SECRET=tu_secreto_jwt
JWT_REFRESH_SECRET=tu_secreto_refresh

CLOUDINARY_CLOUD_NAME=tu_cloud_name
CLOUDINARY_API_KEY=tu_api_key
CLOUDINARY_API_SECRET=tu_api_secret
```

## Endpoints

La documentación interactiva completa está disponible en `/api-docs` (Swagger UI).

### Autenticación — `/api/user`

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/user/register` | Registro de usuario |
| POST | `/api/user/login` | Login, devuelve access token y refresh token |
| POST | `/api/user/refresh` | Renovar access token |
| POST | `/api/user/logout` | Cerrar sesión |
| GET | `/api/user/me` | Perfil del usuario autenticado |
| PUT | `/api/user/me` | Actualizar perfil |

### Clientes — `/api/client` 🔒

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/client` | Crear cliente |
| GET | `/api/client` | Listar clientes de la empresa |
| GET | `/api/client/:id` | Obtener cliente por ID |
| PUT | `/api/client/:id` | Actualizar cliente |
| DELETE | `/api/client/:id` | Eliminar cliente (soft/hard según `?soft=true`) |
| GET | `/api/client/archived` | Clientes archivados |
| PATCH | `/api/client/:id/restore` | Restaurar cliente archivado |

### Proyectos — `/api/project` 🔒

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/project` | Crear proyecto |
| GET | `/api/project` | Listar proyectos (paginación + filtros) |
| GET | `/api/project/:id` | Obtener proyecto por ID |
| PUT | `/api/project/:id` | Actualizar proyecto |
| DELETE | `/api/project/:id` | Eliminar proyecto (soft/hard según `?soft=true`) |
| GET | `/api/project/archived` | Proyectos archivados |
| PATCH | `/api/project/:id/restore` | Restaurar proyecto archivado |

### Albaranes — `/api/deliverynote` 🔒

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/deliverynote` | Crear albarán (formato: `material` o `hours`) |
| GET | `/api/deliverynote` | Listar albaranes (filtros: project, client, format) |
| GET | `/api/deliverynote/:id` | Obtener albarán por ID |
| PATCH | `/api/deliverynote/:id/sign` | Firmar albarán (multipart/form-data, campo `signature`) |
| GET | `/api/deliverynote/:id/pdf` | Descargar PDF del albarán |
| DELETE | `/api/deliverynote/:id` | Eliminar albarán (solo si no está firmado) |

🔒 Requiere `Authorization: Bearer <token>`

## Tests

```bash
npm test                 # Ejecutar todos los tests
npm run test:coverage    # Con informe de cobertura
```

Los tests usan `mongodb-memory-server` — no necesitan una base de datos real. Actualmente hay **24 tests** cubriendo clientes, proyectos y albaranes.

## Estructura del proyecto

```
src/
├── config/         # Conexión a BD
├── controllers/    # Lógica de negocio
├── middleware/     # Auth, validate, errorHandler, role
├── models/         # Mongoose models (User, Client, Project, DeliveryNote)
├── routes/         # Express routers
├── tests/          # Tests de integración
├── utils/          # JWT, PDF, Cloudinary, multer, swagger, softDelete plugin
├── validators/     # Schemas Zod
├── app.js          # Express app
└── index.js        # Entry point
```
