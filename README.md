# BildyApp — API de gestión de albaranes

![Tests](https://github.com/Gonzalo231021/bildyapp/actions/workflows/test.yml/badge.svg)

API REST para gestión de clientes, proyectos y albaranes de obra. Desarrollada con Node.js, Express, MongoDB y JWT.

## Tecnologías

- **Node.js** ≥ 22 + ESM
- **Express 5**
- **MongoDB** + Mongoose (soft delete, índices de texto)
- **JWT** para autenticación (access token + refresh token)
- **Zod** para validación de datos
- **Socket.IO** para eventos en tiempo real por empresa
- **Multer** para subida de imágenes
- **Sharp** para optimización de imágenes (resize + WebP)
- **Cloudinary** para almacenamiento de firmas
- **PDFKit** para generación de albaranes en PDF
- **Nodemailer** para envío de emails de verificación
- **Jest + Supertest** para tests de integración
- **Swagger UI** en `/api-docs`
- **Docker** + docker-compose

## Arrancar en local

```bash
npm install
cp .env.example .env   # Rellenar las variables
npm run dev            # Desarrollo con nodemon
npm start              # Producción
```

## Arrancar con Docker

```bash
docker-compose up --build
```

La app arranca en `http://localhost:3000`. MongoDB se levanta automáticamente con volumen persistente.

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `DB_URI` | URI de MongoDB Atlas |
| `JWT_SECRET` | Secreto para access tokens |
| `JWT_REFRESH_SECRET` | Secreto para refresh tokens |
| `CLOUDINARY_CLOUD_NAME` | Nombre del cloud en Cloudinary |
| `CLOUDINARY_API_KEY` | API key de Cloudinary |
| `CLOUDINARY_API_SECRET` | API secret de Cloudinary |
| `EMAIL_HOST` | SMTP host (ej: smtp.mailtrap.io) |
| `EMAIL_PORT` | Puerto SMTP (587) |
| `EMAIL_USER` | Usuario SMTP |
| `EMAIL_PASS` | Contraseña SMTP |
| `SLACK_WEBHOOK_URL` | Webhook de Slack para errores 5XX |

Ver `.env.example` para un ejemplo completo.

## Endpoints

Documentación interactiva completa en `/api-docs` (Swagger UI).

### Autenticación — `/api/user`

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/user/register` | Registro — devuelve token y código de verificación por email |
| PUT | `/api/user/validate` | Validar email con código de 6 dígitos |
| POST | `/api/user/login` | Login — devuelve access token y refresh token |
| POST | `/api/user/refresh` | Renovar access token |
| POST | `/api/user/logout` | Cerrar sesión |
| GET | `/api/user` | Perfil del usuario autenticado |
| PUT | `/api/user/register` | Actualizar datos personales |
| PATCH | `/api/user/company` | Configurar empresa |

### Clientes — `/api/client` 🔒

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/client` | Crear cliente |
| GET | `/api/client` | Listar clientes (`?search=`, `?page=`, `?limit=`) |
| GET | `/api/client/:id` | Obtener cliente por ID |
| PUT | `/api/client/:id` | Actualizar cliente |
| DELETE | `/api/client/:id` | Eliminar (`?soft=true` para archivar) |
| GET | `/api/client/archived` | Clientes archivados |
| PATCH | `/api/client/:id/restore` | Restaurar cliente archivado |

### Proyectos — `/api/project` 🔒

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/project` | Crear proyecto |
| GET | `/api/project` | Listar proyectos (`?name=`, `?client=`, `?active=`) |
| GET | `/api/project/:id` | Obtener proyecto por ID |
| PUT | `/api/project/:id` | Actualizar proyecto |
| DELETE | `/api/project/:id` | Eliminar (`?soft=true` para archivar) |
| GET | `/api/project/archived` | Proyectos archivados |
| PATCH | `/api/project/:id/restore` | Restaurar proyecto archivado |

### Albaranes — `/api/deliverynote` 🔒

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/deliverynote` | Crear albarán (formato: `material` o `hours`) |
| GET | `/api/deliverynote` | Listar albaranes (`?project=`, `?client=`, `?format=`) |
| GET | `/api/deliverynote/:id` | Obtener albarán con populate |
| PATCH | `/api/deliverynote/:id/sign` | Firmar albarán (multipart, campo `image`) |
| GET | `/api/deliverynote/:id/pdf` | Descargar PDF |
| DELETE | `/api/deliverynote/:id` | Eliminar (solo si no está firmado) |

🔒 Requiere `Authorization: Bearer <token>`

Ver ejemplos de peticiones en la carpeta `requests/`.

## Tests

```bash
npm test                 # Ejecutar todos los tests
npm run test:coverage    # Con informe de cobertura
```

Los tests usan `mongodb-memory-server` — no necesitan base de datos real ni variables de entorno de producción.

## Health check

```
GET /health
```

Devuelve estado de la base de datos y uptime del servidor.

## Estructura del proyecto

```
src/
├── config/         # Conexión a BD
├── controllers/    # Lógica de negocio
├── middleware/     # Auth, validate, errorHandler, checkRole
├── models/         # User, Company, Client, Project, DeliveryNote
├── routes/         # Express routers + router central
├── services/       # mail.service.js, slack.service.js
├── tests/          # Tests de integración con Jest + Supertest
├── utils/          # JWT, PDF, Cloudinary, sharp, socket, swagger, paginación
├── validators/     # Schemas Zod
├── app.js          # Express app
└── index.js        # Entry point (HTTP server + Socket.IO)
requests/           # Ejemplos .http para VS Code REST Client
```
