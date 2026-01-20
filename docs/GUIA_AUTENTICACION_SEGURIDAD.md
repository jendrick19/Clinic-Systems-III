# Guía de Autenticación, Seguridad y Roles (RBAC)

Este documento detalla la arquitectura de seguridad de **Clinic Systems III**, la cual se basa en **JSON Web Tokens (JWT)** para la autenticación sin estado (stateless) y un sistema de **Control de Acceso Basado en Roles (RBAC)** para la autorización.

---

## 🔐 1. Flujo de Autenticación (AuthService)

El núcleo de la identidad reside en el módulo `platform`. El proceso de inicio de sesión vincula una cuenta de usuario (`Users`) con una entidad de negocio (`PeopleAttended` o `Professionals`).

### Proceso de Login
1.  **Petición:** El cliente envía `email` y `password` a `POST /api/auth/login`.
2.  **Validación:** `AuthService` verifica el hash de la contraseña (usando `bcrypt`).
3.  **Resolución de Entidad:**
    * El sistema busca si el usuario está ligado a un Doctor (`Professional`) o a un Paciente (`PeopleAttended`).
    * Este ID se guarda como `entityId`.
4.  **Generación de Token:** Se firma un JWT que contiene los "claims" esenciales.

### Estructura del Token (Payload)
El token JWT generado contiene la siguiente información crítica:

```json
{
  "userId": 15,          // ID de la tabla Users (Autenticación)
  "role": "professional", // Rol principal para RBAC
  "entityId": 5,         // ID del Doctor/Paciente (Negocio)
  "iat": 1705670000,     // Fecha de emisión
  "exp": 1705756400      // Expiración (ej: 24h)
}

```

---

## 🛡️ 2. Middlewares de Protección

El sistema utiliza una cadena de middlewares ubicados en `src/shared/middlewares/` para proteger las rutas.

### A. `authMiddleware.js` (La Puerta de Entrada)

Este middleware es **obligatorio** para cualquier ruta privada.

1. Intercepta el Header `Authorization: Bearer <TOKEN>`.
2. Verifica la firma del token usando `process.env.JWT_SECRET`.
3. Si es válido, inyecta los datos del usuario en la petición: `req.user`.
4. Si falla, retorna `401 Unauthorized`.

**Uso:**

```javascript
const authMiddleware = require('../../../shared/middlewares/authMiddleware');
router.get('/mi-perfil', authMiddleware, controller.getProfile);

```

### B. `authorizationMiddleware.js` (El Guardia de Permisos)

Implementa la lógica RBAC. Se coloca **después** del `authMiddleware`.
Recibe un array de roles permitidos y verifica si `req.user.role` está en esa lista.

**Uso:**

```javascript
const authorize = require('../../../shared/middlewares/authorizationMiddleware');

// Solo administradores pueden ver logs
router.get('/logs', authMiddleware, authorize(['admin']), controller.getLogs);

// Doctores y Admins pueden ver pacientes
router.get('/pacientes', authMiddleware, authorize(['admin', 'professional']), controller.listPatients);

```

### C. `accessLogMiddleware.js` (Auditoría)

Registra en la base de datos (`AccessLogs`) quién hizo qué y cuándo.

* Usuario (ID)
* Método HTTP (GET, POST...)
* Ruta (`/api/operative/appointments`)
* IP de origen.

---

## 👥 3. Roles y Permisos del Sistema

Los roles están definidos en la base de datos, pero la lógica de negocio asume los siguientes roles clave:

| Rol | Alcance / Permisos | Entidad Relacionada |
| --- | --- | --- |
| **admin** | Acceso total al sistema. Configuración, Usuarios, Dashboard Financiero. | N/A (Usuario directo) |
| **professional** | Gestión clínica. Puede ver su agenda, historias clínicas y crear evoluciones. | Tabla `Professionals` |
| **patient** | Acceso limitado. Puede ver "Mis Citas", usar el Chatbot y ver su historial básico. | Tabla `PeopleAttended` |
| **secretary** | Gestión operativa. Puede agendar citas para otros, pero no ver detalles médicos profundos. | N/A |

---

## 💻 4. Implementación en el Frontend (Vue.js)

El frontend maneja la seguridad almacenando el token y el estado del usuario.

### Almacenamiento

Al hacer login exitoso, la respuesta se guarda en `localStorage`:

* Key: `user`
* Value: Objeto JSON con `{ token: "...", data: { ... } }`.

### Envío de Credenciales

Todas las peticiones a la API (excepto login/register) deben incluir el header manualmente (o vía interceptor):

```javascript
const user = JSON.parse(localStorage.getItem('user'));
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${user.token}`
};

fetch('/api/ruta-protegida', { headers: headers });

```

### Manejo de Sesión Expirada

Si el backend retorna un error **401**, el frontend debe:

1. Detectar el error.
2. Limpiar el `localStorage`.
3. Redirigir al Login inmediatamente (`router.push('/login')`).

---
