# Arquitectura del Sistema - Clinic Systems III

Este documento describe la arquitectura modular del backend, diseñada para escalar y separar responsabilidades por dominio de negocio.

## 🏗️ Estructura General

El proyecto sigue una arquitectura **MVC Modular** (Modelo-Vista-Controlador por Módulos). Cada funcionalidad principal del negocio tiene su propia carpeta dentro de `src/modules`, conteniendo toda su lógica encapsulada.

```text
src/
├── app.js               # Configuración de Express y Middlewares globales
├── routes.js            # Router principal (Gateway)
├── modules/             # Módulos de negocio
│   ├── platform/        # Usuarios y Seguridad
│   ├── operative/       # Agendas y Citas
│   ├── clinic/          # Historia Clínica
│   ├── bussines/        # Facturación y Seguros
│   ├── intelligence/    # IA y Chatbot
│   └── dashboard/       # Estadísticas
└── shared/              # Recursos compartidos
    ├── middlewares/     # Autenticación, Logs, Errores
    ├── utils/           # Helpers (Fechas, Paginación)
    ├── validators/      # Validadores genéricos
    └── errors/          # Manejo de errores personalizados

```

---

## 🧩 Descripción de Módulos

### 1. Platform (`src/modules/platform`)

**Responsabilidad:** Gestión de identidad y acceso.

* **Modelos:** `User`, `Role`, `Permission`, `Notification`.
* **Servicios Clave:**
* `AuthService`: Manejo de Login, Registro y generación de JWT.
* `NotificationService`: Envío de correos (Mailtrap) y notificaciones in-app.



### 2. Operative (`src/modules/operative`)

**Responsabilidad:** Logística diaria de la clínica.

* **Modelos:**
* `Professional`: Odontólogos y especialistas.
* `Schedule`: Disponibilidad de horarios (Turnos de trabajo).
* `Appointment`: Citas médicas (solicitada, confirmada, realizada).
* `PeopleAttended`: Pacientes (Unificación de personas).


* **Lógica Clave:** Validación de solapamiento de citas y gestión de estados.

### 3. Clinic (`src/modules/clinic`)

**Responsabilidad:** Información médica (Historia Clínica).

* **Modelos:**
* `Episode`: Contenedor de una visita médica.
* `ClinicalNote`: Evolución redactada por el doctor (con versionamiento).
* `Diagnosis`: Códigos CIE-10.
* `Order` / `Result`: Exámenes y laboratorios.



### 4. Intelligence (`src/modules/intelligence`)

**Responsabilidad:** Integración con LLMs (OpenAI).

* **Componentes:**
* `ConversationalAssistantService`: Orquestador del flujo de chat.
* `IAContextService`: Inyector de datos (RAG - Retrieval Augmented Generation).
* `Prompts`: Archivos `.md` con las instrucciones del sistema para la IA.



### 5. Dashboard (`src/modules/dashboard`)

**Responsabilidad:** Visualización de datos agregados.

* **Características:**
* Controladores de solo lectura (Read-Only).
* Consultas SQL optimizadas para reportes.
* Formateo de fechas para el frontend (UTC -> Texto).



---

## 🔄 Flujo de una Petición (Request Lifecycle)

1. **Entrada:** El cliente (Vue.js) envía una petición HTTP a `/api/operative/appointments`.
2. **Gateway:** `src/routes.js` recibe la petición y la redirige al router del módulo `operative`.
3. **Middlewares:**
* `accessLogMiddleware`: Registra la petición.
* `authMiddleware`: Verifica el JWT.
* `authorizationMiddleware`: Verifica si el usuario tiene permiso (RBAC).
* `Validator`: (Express-Validator) Revisa el cuerpo de la petición.


4. **Controller:** Recibe la data limpia y llama al Service.
5. **Service:** Ejecuta la lógica de negocio (ej: verificar disponibilidad).
6. **Repository/Model:** Interactúa con la base de datos (Sequelize).
7. **Respuesta:** Retorna un JSON estandarizado `{ success: true, data: ... }`.
8. **Manejo de Errores:** Si algo falla, `errorHandler.js` captura la excepción y devuelve un código HTTP apropiado (400, 404, 500).

---

## 🛡️ Patrones de Diseño Utilizados

* **Repository Pattern (Parcial):** Se utiliza en módulos complejos para abstraer consultas SQL pesadas.
* **Service Layer:** Toda la lógica de negocio reside en los Servicios, nunca en los Controladores.
* **Singleton:** Los servicios se exportan como instancias únicas (`new Service()`).
* **Factory:** (En IA) Para crear instancias de chat según el proveedor (OpenAI/Gemini).

```
