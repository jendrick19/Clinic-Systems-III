Aquí tienes el contenido completo para el archivo **`docs/API_REFERENCIA_RAPIDA.md`**, diseñado para que los desarrolladores frontend tengan una guía rápida de los endpoints más utilizados.

```markdown
# Referencia Rápida de API - Clinic Systems III

Esta guía resume los endpoints principales del sistema. Para detalles completos de modelos y validaciones, revisar el código fuente en `src/modules`.

**Base URL:** `/api`
**Autenticación:** Header `Authorization: Bearer <TOKEN_JWT>` (Requerido en rutas protegidas)

---

## 🔑 Módulo de Autenticación (`/api/auth`)

| Método | Endpoint | Descripción | Body / Params |
| :--- | :--- | :--- | :--- |
| **POST** | `/login` | Iniciar sesión y obtener token. | `{ "email": "...", "password": "..." }` |
| **POST** | `/register` | Registrar un nuevo paciente. | `{ "names": "...", "surNames": "...", "email": "...", "password": "...", "documentId": "..." }` |
| **POST** | `/logout` | Cerrar sesión (Invalidación lógica). | N/A |

---

## 🤖 Módulo de Inteligencia Artificial (`/api/intelligence`)

El núcleo del chatbot.

| Método | Endpoint | Descripción | Body (JSON) |
| :--- | :--- | :--- | :--- |
| **POST** | `/chat` | Enviar mensaje al asistente. | `{ "message": "Quiero una cita", "userId": 1 }` |

**Respuesta Típica del Chatbot:**
```json
{
  "message": "Claro, tengo disponibilidad mañana a las 8:00 AM...",
  "action": "agendar_cita", // (Opcional) Si la IA ejecutó una acción
  "actionResult": { "success": true, "appointmentId": 35 },
  "requiresConfirmation": false
}

```

---

## 📊 Módulo de Dashboard (`/api/dashboard`)

Servicios de lectura optimizados para visualización rápida.

| Método | Endpoint | Descripción | Query Params |
| --- | --- | --- | --- |
| **GET** | `/stats` | Obtiene KPIs, contadores y listas. | `?userId=1&entityId=5` |

**Nota sobre Fechas:** Este endpoint devuelve las fechas y horas ya formateadas como **texto plano** (Strings) para evitar conversiones erróneas en el frontend.

* `fecha`: "19/01/2026"
* `hora`: "08:00 AM"

---

## 📅 Módulo Operativo (`/api/operative`)

Gestión manual de la clínica.

### Citas (Appointments)

| Método | Endpoint | Descripción |
| --- | --- | --- |
| **GET** | `/appointments` | Listar citas (Soporta filtros). |
| **POST** | `/appointments` | Crear cita manualmente (Sin IA). |
| **PUT** | `/appointments/:id` | Actualizar estado (ej: cancelar, completar). |

### Agendas (Schedules)

| Método | Endpoint | Descripción |
| --- | --- | --- |
| **GET** | `/schedules` | Ver disponibilidad de doctores. |
| **POST** | `/schedules` | Abrir nuevo horario de atención. |

### Pacientes (PeopleAttended)

| Método | Endpoint | Descripción |
| --- | --- | --- |
| **GET** | `/people` | Listar pacientes registrados. |
| **GET** | `/people/search` | Buscar por cédula o nombre. |

---

## 🩺 Módulo Clínico (`/api/clinic`)

Historia Clínica Electrónica (HCE).

| Método | Endpoint | Descripción |
| --- | --- | --- |
| **GET** | `/episodes/patient/:id` | Obtener historial de episodios de un paciente. |
| **POST** | `/clinical-notes` | Guardar evolución médica (Nota clínica). |
| **GET** | `/results/order/:orderId` | Ver resultados de laboratorio asociados a una orden. |

---

## 💼 Módulo de Negocio (`/api/bussines`)

Facturación y Seguros.

| Método | Endpoint | Descripción |
| --- | --- | --- |
| **GET** | `/insurers` | Listar aseguradoras activas. |
| **GET** | `/plans/insurer/:id` | Listar planes de una aseguradora. |
| **POST** | `/invoices` | Generar nueva factura. |

---

## ⚠️ Códigos de Estado Comunes

* `200 OK`: Éxito.
* `201 Created`: Recurso creado.
* `400 Bad Request`: Datos de entrada inválidos (Revisar validadores).
* `401 Unauthorized`: Falta Token o es inválido.
* `403 Forbidden`: El usuario no tiene el Rol necesario.
* `500 Server Error`: Error interno (Revisar logs del servidor).

```

```