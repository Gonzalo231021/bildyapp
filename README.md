# BildyApp — API de gestión de albaranes

![Tests](https://github.com/Gonzalo231021/bildyapp/actions/workflows/test.yml/badge.svg)

API REST para gestión de clientes, proyectos y albaranes de obra. Desarrollada con Node.js, Express 5 y MongoDB.

**76 tests de integración · 73% de cobertura · CI/CD con GitHub Actions · Docker multi-stage**

## Tecnologías

- **Node.js** ≥ 22 + ESM nativo
- **Express 5** — manejo de errores async nativo
- **MongoDB** + Mongoose — soft delete, índices de texto, paginación
- **JWT** — access token (15 min) + refresh token
- **Zod** — validación de entrada en todos los endpoints
- **Socket.IO** — eventos en tiempo real por sala de empresa
- **Sharp** — optimización de imágenes (resize a 800px + conversión WebP)
- **Cloudinary** — almacenamiento de firmas de albaranes
- **PDFKit** — generación de albaranes en PDF con firma incluida
- **Nodemailer** — emails de verificación (compatible con Mailtrap)
- **Slack Webhook** — notificaciones automáticas en errores 5XX
- **Swagger UI** — documentación interactiva en `/api-docs`
- **Jest + Supertest** — tests de integración con BD en memoria
- **Docker** + docker-compose

## Arrancar en local

```bash
npm install
cp .env.example .env   # Rellenar las variables
npm run dev            # Servidor con hot-reload
npm start              # Producción
npm run seed           # Poblar BD con datos de demostración
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
| `EMAIL_HOST` | SMTP host (ej: sandbox.smtp.mailtrap.io) |
| `EMAIL_PORT` | Puerto SMTP (2525 para Mailtrap) |
| `EMAIL_USER` | Usuario SMTP |
| `EMAIL_PASS` | Contraseña SMTP |
| `SLACK_WEBHOOK_URL` | Webhook de Slack para alertas de errores 5XX |

Ver `.env.example` para un ejemplo completo.

## Endpoints

Documentación interactiva completa en `/api-docs` (Swagger UI).

### Autenticación — `/api/user`

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/user/register` | Registro — devuelve token + envía código por email |
| PUT | `/api/user/validation` | Validar email con código de 6 dígitos |
| POST | `/api/user/login` | Login — devuelve access token y refresh token |
| POST | `/api/user/refresh` | Renovar access token con refresh token |
| POST | `/api/user/logout` | Cerrar sesión — invalida el refresh token |
| GET | `/api/user` | Perfil del usuario autenticado |
| PUT | `/api/user/register` | Actualizar datos personales (nombre, NIF…) |
| PATCH | `/api/user/company` | Configurar empresa (nueva o freelance) |
| PATCH | `/api/user/logo` | Subir logo de empresa |
| PUT | `/api/user/password` | Cambiar contraseña |
| DELETE | `/api/user` | Eliminar cuenta (`?soft=true` para archivar) |
| POST | `/api/user/invite` | Invitar usuario a la empresa (solo admin) |

### Clientes — `/api/client` 🔒

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/client` | Crear cliente |
| GET | `/api/client` | Listar clientes (`?name=`, `?search=`, `?page=`, `?limit=`) |
| GET | `/api/client/:id` | Obtener cliente por ID |
| PUT | `/api/client/:id` | Actualizar cliente |
| DELETE | `/api/client/:id` | Eliminar (`?soft=true` para archivar) |
| GET | `/api/client/archived` | Clientes archivados |
| PATCH | `/api/client/:id/restore` | Restaurar cliente archivado |

### Proyectos — `/api/project` 🔒

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/project` | Crear proyecto |
| GET | `/api/project` | Listar proyectos (`?name=`, `?client=`, `?active=`, `?page=`) |
| GET | `/api/project/:id` | Obtener proyecto por ID |
| PUT | `/api/project/:id` | Actualizar proyecto |
| DELETE | `/api/project/:id` | Eliminar (`?soft=true` para archivar) |
| GET | `/api/project/archived` | Proyectos archivados |
| PATCH | `/api/project/:id/restore` | Restaurar proyecto archivado |

### Albaranes — `/api/deliverynote` 🔒

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/deliverynote` | Crear albarán (`format: "material"` o `"hours"`) |
| GET | `/api/deliverynote` | Listar con filtros: `?project=`, `?client=`, `?format=`, `?signed=`, `?from=`, `?to=` |
| GET | `/api/deliverynote/:id` | Obtener albarán con datos de cliente y proyecto |
| PATCH | `/api/deliverynote/:id/sign` | Firmar albarán (multipart/form-data, campo `image`) |
| GET | `/api/deliverynote/:id/pdf` | Descargar PDF del albarán (incluye firma si está firmado) |
| DELETE | `/api/deliverynote/:id` | Eliminar (solo posible si no está firmado) |

🔒 Requiere `Authorization: Bearer <token>`

Ver ejemplos paso a paso en la carpeta `requests/` (compatible con VS Code REST Client).

## Tests

```bash
npm test                  # Ejecutar los 76 tests
npm run test:coverage     # Con informe de cobertura (~73%)
```

Los tests usan `mongodb-memory-server` — no necesitan base de datos real ni variables de entorno.

Módulos cubiertos: autenticación, usuarios, clientes, proyectos, albaranes, generación de PDF, manejo de errores.

## Datos de demo

```bash
npm run seed
```

Puebla la base de datos con:
- 1 usuario admin (`demo@bildyapp.com` / `Password1`)
- Empresa **BildyCorp SL**
- 7 clientes de construcción reales
- 11 proyectos en Madrid, Barcelona, Valencia, Oviedo y Gijón
- 34 albaranes (18 firmados, 16 pendientes)

## Health check

```
GET /health
→ { status, db, uptime, timestamp }
```

## Estructura del proyecto

```
src/
├── config/         # Conexión a MongoDB
├── controllers/    # Lógica de negocio por recurso
├── middleware/     # auth, validate, checkRole, errorHandler
├── models/         # User, Company, Client, Project, DeliveryNote
├── routes/         # Express routers + router central
├── services/       # mail.service, slack.service, notification.service
├── tests/          # Tests de integración (Jest + Supertest)
├── utils/          # JWT, PDF, Cloudinary, sharp, socket, swagger, seed
├── validators/     # Schemas Zod por recurso
├── app.js          # Express app (middlewares, rutas, errorHandler)
└── index.js        # Entry point — HTTP server + Socket.IO + graceful shutdown
requests/           # Flujos .http para VS Code REST Client (auth → client → project → deliverynote)
```
