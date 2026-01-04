# Arquitectura del Módulo de Inteligencia Artificial

## 📐 Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────┐
│                   FASE 0: LOGIN (NUEVO)                          │
│                                                                  │
│  Usuario hace login → AuthController                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ POST /api/platform/auth/login
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AuthController                              │
│                                                                  │
│  1. Valida credenciales                                         │
│  2. Autentica usuario                                           │
│  3. ✨ AUTOMÁTICAMENTE llama a IAContextService ✨              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    IAContextService.initializeIAContext()        │
│                                                                  │
│  1. Consulta TODA la información del usuario:                   │
│     - Datos personales completos (PeopleAttended)               │
│     - TODAS las citas activas (Appointments + Professional)     │
│     - Disponibilidad COMPLETA de TODAS las especialidades:      │
│       * Odontología General, Ortodoncia, Endodoncia, etc.       │
│       * Consulta Schedules disponibles                          │
│       * Consulta Appointments ocupados                          │
│       * Genera slots libres                                     │
│  2. Pre-carga este contexto en ConversationalAssistantService   │
│     usando setInitialContext()                                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ ✅ Contexto IA cargado en memoria
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Usuario autenticado con contexto IA listo           │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│              FASE 1: CONVERSACIÓN CON AGENTE IA                  │
│                                                                  │
│  Usuario escribe: "Necesito una cita de ortodoncia"            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ POST /api/intelligence/chat
                         │ Body: { message, userId, patientId }
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      IAController.chat()                         │
│                                                                  │
│  - Valida request                                               │
│  - Llama al servicio conversacional                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│            ConversationalAssistantService                        │
│                                                                  │
│  1. Obtener historial de conversación (memoria RAM)             │
│  2. ✅ USA CONTEXTO PRE-CARGADO (ya no consulta BD):            │
│     - Información del paciente (ya cargada)                     │
│     - Citas activas (ya cargadas)                               │
│     - Disponibilidad completa (ya cargada)                      │
│  3. Construir contexto completo para OpenAI                     │
│  4. Llamar a OpenAI con Function Calling                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ API Call
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      OpenAI GPT-4o-mini                          │
│                                                                  │
│  - Lee el prompt de AsistenteClinicaDental.md                   │
│  - Analiza contexto del usuario                                 │
│  - Analiza disponibilidad de horarios                           │
│  - Genera respuesta natural                                     │
│  - Decide si llamar una función:                                │
│    * agendar_cita                                               │
│    * reagendar_cita                                             │
│    * cancelar_cita                                              │
│    * consultar_citas                                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Response
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│         ConversationalAssistantService (continuación)            │
│                                                                  │
│  6. Si hay function_call:                                       │
│     - Ejecutar función correspondiente                          │
│     - Interactuar con base de datos                             │
│     - Crear/Modificar/Cancelar citas                            │
│  7. Guardar mensaje en historial                                │
│  8. Retornar respuesta                                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    IAController (retorno)                        │
│                                                                  │
│  Response: {                                                    │
│    success: true,                                               │
│    data: {                                                      │
│      message: "Respuesta del asistente",                       │
│      action: "agendar_cita" | null,                            │
│      actionResult: {...} | null,                               │
│      requiresConfirmation: boolean                             │
│    }                                                            │
│  }                                                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND (recibe)                           │
│                                                                  │
│  - Muestra mensaje del asistente                                │
│  - Si hubo acción, actualiza UI                                 │
│  - Si requiere confirmación, pide confirmación al usuario       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Estructura de Archivos

```
src/modules/intelligence/
├── services/
│   ├── ConversationalAssistantService.js  ⭐ Servicio principal de chat
│   ├── IAContextService.js                ⭐ NUEVO: Inicialización automática de contexto
│   ├── OpenAIService.js                   (Legacy - recomendación simple)
│   └── SmartSchedulingService.js          (Legacy - Gemini)
│
├── controllers/
│   └── IAController.js                    Controlador HTTP
│
├── routes/
│   └── index.js                           Rutas API
│
├── prompts/
│   └── AsistenteClinicaDental.md          ⭐ Contexto/Personalidad del bot
│
├── examples/
│   └── test-assistant.js                  Ejemplos de uso
│
├── README.md                               Documentación de uso
├── ARQUITECTURA.md                         Este archivo
└── index.js                                Exporta rutas
```

---

## 🆕 NUEVA FUNCIONALIDAD: Inicialización Automática de Contexto IA

### ¿Qué es?

Al iniciar sesión, el sistema **automáticamente** consulta y pre-carga TODA la información necesaria para que el agente IA pueda responder de manera contextualizada sin hacer consultas adicionales a la base de datos durante la conversación.

### ¿Por qué es importante?

**ANTES:**
- El agente consultaba la BD cada vez que el usuario enviaba un mensaje
- Latencia mayor en las respuestas
- Múltiples consultas redundantes
- El agente podía olvidar información entre mensajes

**AHORA:**
- ✅ Una sola consulta completa al iniciar sesión
- ✅ Respuestas más rápidas (contexto ya en memoria)
- ✅ Sin consultas redundantes durante la conversación
- ✅ El agente siempre tiene TODO el contexto disponible

### ¿Qué información se pre-carga?

1. **Datos del paciente:**
   - Nombre completo
   - Documento (tipo y número)
   - Email, teléfono
   - Fecha de nacimiento

2. **Citas activas (todas):**
   - ID de la cita
   - Fecha y hora (ISO y formato humano)
   - Nombre del profesional
   - Especialidad
   - Estado (solicitada, confirmada, completada)
   - Motivo de la cita

3. **Disponibilidad completa (9 especialidades):**
   - Odontología General
   - Ortodoncia
   - Endodoncia
   - Periodoncia
   - Odontopediatría
   - Cirugía Oral
   - Prótesis
   - Implantología
   - Estética Dental
   
   Para cada especialidad:
   - Próximos 3 horarios disponibles
   - ID del schedule
   - ID del profesional
   - Nombre del profesional
   - Fecha y hora (ISO y formato humano)

### ¿Cómo funciona?

```javascript
// En AuthController.js (después del login exitoso)
const result = await loginByIdentifier(tipoDocumento, numeroDocumento, password);

// ✨ Automáticamente inicializa contexto IA
initializeIAContext(result.data.userId, result.data.id).catch(err => {
  console.error('[Login] Error inicializando contexto IA:', err);
});
```

### Servicio IAContextService

```javascript
// src/modules/intelligence/services/IAContextService.js

/**
 * Inicializa el contexto IA para un usuario/paciente
 * @param {number} userId - ID del usuario
 * @param {number} patientId - ID del paciente
 */
async function initializeIAContext(userId, patientId) {
  // 1. Consultar paciente
  const patient = await PeopleAttended.findByPk(patientId);
  
  // 2. Consultar TODAS las citas activas
  const appointments = await Appointment.findAll({
    where: { peopleId: patient.id, status: { [Op.ne]: 'no asistio' } },
    include: [Professional]
  });
  
  // 3. Consultar disponibilidad de TODAS las especialidades
  const availability = await getAvailabilityBySpecialty();
  
  // 4. Pre-cargar en ConversationalAssistantService
  conversationalAssistantService.setInitialContext(userId, {
    patient,
    appointments,
    availability
  });
}
```

### Integración con el Prompt

El prompt `AsistenteClinicaDental.md` ha sido actualizado para indicar:

```markdown
## CONTEXTO AUTOMÁTICO AL INICIAR SESIÓN

**IMPORTANTE:** Al iniciar sesión, el sistema ya ha cargado automáticamente:
1. Información del paciente
2. Citas activas (todas)
3. Disponibilidad completa (9 especialidades)

Este contexto está SIEMPRE disponible en tu memoria de trabajo.
NO necesitas hacer consultas adicionales, TODA la información ya está cargada.
```

### Beneficios

✅ **Rendimiento:** Respuestas más rápidas
✅ **Consistencia:** El agente siempre tiene el mismo contexto
✅ **Experiencia:** Conversaciones más fluidas sin "esperas" de consultas
✅ **Escalabilidad:** Reduce carga en la base de datos
✅ **Inteligencia:** El agente puede hacer recomendaciones más informadas

---

## 🔄 Flujo de Datos

### 1. Agendar Cita Nueva

```
Usuario: "Necesito una cita de ortodoncia"
    ↓
Servicio detecta: "ortodoncia" en el mensaje
    ↓
Consulta BD:
    - Professional.findAll({ specialty: 'ortodoncia', status: true })
    - Schedule.findAll({ professionalId: [ids], status: 'abierta' })
    - Appointment.findAll({ status: 'pendiente|confirmada' })
    ↓
Genera slots libres de 30 min
    ↓
Contexto enviado a OpenAI:
    "Horarios Disponibles para ortodoncia:
     1. [Schedule ID: 45] Lunes 10 de enero, 9:00 AM con Dra. Ana López
     2. [Schedule ID: 46] Martes 11 de enero, 2:00 PM con Dra. Ana López
     3. [Schedule ID: 50] Miércoles 12 de enero, 10:30 AM con Dr. Carlos"
    ↓
OpenAI responde con mensaje amigable + lista de opciones
    ↓
Usuario: "La opción 2"
    ↓
OpenAI ejecuta function_call: agendar_cita({
    scheduleId: 46,
    startTime: "2025-01-11T14:00:00Z",
    reason: "Consulta de ortodoncia"
})
    ↓
Servicio ejecuta:
    Appointment.create({
        patientId: 5,
        professionalId: 2,
        scheduleId: 46,
        startTime: "2025-01-11T14:00:00Z",
        status: "pendiente"
    })
    ↓
Retorna confirmación al usuario
```

### 2. Reagendar Cita Existente

```
Usuario: "Quiero cambiar mi cita"
    ↓
Servicio consulta:
    Appointment.findAll({
        patientId: 5,
        status: { not: 'cancelada' },
        startTime: { gte: new Date() }
    })
    ↓
Contexto enviado a OpenAI:
    "Citas Activas del Paciente:
     1. [ID: 123] Martes 11 de enero, 2:00 PM con Dra. Ana López"
    ↓
OpenAI pregunta confirmación: "¿Es esa la que deseas reagendar?"
    ↓
Usuario: "Sí"
    ↓
Servicio consulta nueva disponibilidad
    ↓
OpenAI muestra opciones
    ↓
Usuario elige opción
    ↓
OpenAI ejecuta function_call: reagendar_cita({
    appointmentId: 123,
    newScheduleId: 50,
    newStartTime: "2025-01-12T10:30:00Z"
})
    ↓
Servicio ejecuta:
    appointment = Appointment.findByPk(123)
    appointment.scheduleId = 50
    appointment.startTime = "2025-01-12T10:30:00Z"
    appointment.save()
    ↓
Retorna confirmación
```

### 3. Cancelar Cita

```
Usuario: "Cancelar mi cita del martes"
    ↓
Servicio trae citas del paciente
    ↓
OpenAI identifica la cita y pide confirmación
    ↓
Usuario: "Sí, cancelar"
    ↓
OpenAI ejecuta function_call: cancelar_cita({ appointmentId: 123 })
    ↓
Servicio ejecuta:
    appointment = Appointment.findByPk(123)
    appointment.status = 'cancelada'
    appointment.save()
    ↓
Retorna confirmación
```

---

## 🧠 Memoria de Conversación

### Implementación Actual (RAM)

```javascript
// Map que almacena historial por usuario
conversationMemory = Map {
  "user_1": [
    { role: "user", content: "Hola" },
    { role: "assistant", content: "Hola Juan..." },
    { role: "user", content: "Necesito una cita" },
    { role: "assistant", content: "Con gusto..." }
    // ... últimos 10 mensajes
  ],
  "user_2": [...]
}
```

**Ventajas:**
- Rápido
- Simple
- Sin dependencias

**Desventajas:**
- Se pierde al reiniciar servidor
- No escala entre múltiples instancias
- Limitado a 10 mensajes por usuario

### Mejora Recomendada (Redis)

```javascript
// Guardar en Redis con TTL
await redis.setex(
  `conversation:user_${userId}`,
  3600, // 1 hora
  JSON.stringify(conversationHistory)
);
```

**Ventajas:**
- Persistente
- Escala horizontalmente
- TTL automático

---

## 🎯 Function Calling de OpenAI

### ¿Qué es Function Calling?

Permite que GPT ejecute funciones de tu código basándose en la conversación.

### Ejemplo:

**Definición de la función:**
```javascript
{
  name: "agendar_cita",
  description: "Agenda una nueva cita dental para el paciente",
  parameters: {
    type: "object",
    properties: {
      scheduleId: { type: "number", description: "ID del horario" },
      startTime: { type: "string", description: "Fecha en ISO 8601" },
      reason: { type: "string", description: "Motivo de la cita" }
    },
    required: ["scheduleId", "startTime"]
  }
}
```

**OpenAI decide llamar la función:**
```json
{
  "function_call": {
    "name": "agendar_cita",
    "arguments": "{\"scheduleId\": 46, \"startTime\": \"2025-01-11T14:00:00Z\", \"reason\": \"Ortodoncia\"}"
  }
}
```

**Tu código ejecuta:**
```javascript
const args = JSON.parse(functionCall.arguments);
await this._agendarCita(patientId, args);
```

---

## 📊 Modelos de Base de Datos Involucrados

### People (Pacientes)
```javascript
{
  id: 5,
  names: "Juan",
  surNames: "Pérez",
  documentType: "cedula",
  documentId: "12345678",
  dateOfBirth: "1990-05-15",
  status: true
}
```

### Professional (Doctores)
```javascript
{
  id: 2,
  names: "Ana",
  surNames: "López",
  specialty: "Ortodoncia",
  status: true
}
```

### Schedule (Horarios de Trabajo)
```javascript
{
  id: 46,
  professionalId: 2,
  startTime: "2025-01-11T14:00:00Z",
  endTime: "2025-01-11T18:00:00Z",
  status: "abierta"  // "abierta" | "cerrada" | "bloqueada"
}
```

### Appointment (Citas Agendadas)
```javascript
{
  id: 123,
  patientId: 5,
  professionalId: 2,
  scheduleId: 46,
  startTime: "2025-01-11T14:00:00Z",
  status: "pendiente",  // "pendiente" | "confirmada" | "completada" | "cancelada"
  description: "Consulta de ortodoncia"
}
```

---

## 🔐 Seguridad

### Validaciones Implementadas

1. **Verificación de propiedad:**
   ```javascript
   // Solo puede modificar sus propias citas
   const appointment = await Appointment.findOne({
     where: { id: appointmentId, patientId: patientId }
   });
   ```

2. **Verificación de disponibilidad:**
   ```javascript
   // Evita doble reserva
   const existing = await Appointment.findOne({
     where: {
       scheduleId: scheduleId,
       startTime: startTime,
       status: { [Op.not]: 'cancelada' }
     }
   });
   ```

3. **Validación de entrada:**
   ```javascript
   if (!message || !userId || !patientId) {
     return res.status(400).json({ message: 'Datos requeridos' });
   }
   ```

### Mejoras Recomendadas

- [ ] Agregar middleware de autenticación JWT
- [ ] Rate limiting por usuario
- [ ] Sanitización de inputs
- [ ] Logs de auditoría
- [ ] Encriptación de datos sensibles

---

## 🚀 Despliegue

### Variables de Entorno Requeridas

```env
OPENAI_API_KEY=sk-...
NODE_ENV=production
DB_HOST=...
DB_USER=...
DB_PASSWORD=...
```

### Proceso de Despliegue

1. Instalar dependencias: `npm install`
2. Configurar variables de entorno
3. Ejecutar migraciones: `npm run migrate`
4. Iniciar servidor: `npm start`

### Monitoreo

Logs importantes a monitorear:
- `[Chat IA] Mensaje de usuario...` - Entrada de usuarios
- `[Function Call] agendar_cita...` - Acciones ejecutadas
- `[Chat IA ERROR]:` - Errores del servicio

---

## 🎨 Personalización

### Cambiar nombre del asistente

Editar: `prompts/AsistenteClinicaDental.md`

```markdown
# ROL
Eres Carlos, asistente virtual de...
```

### Cambiar duración de slots

Editar: `services/ConversationalAssistantService.js`

```javascript
const SLOT_DURATION = 45; // Cambiar de 30 a 45 minutos
```

### Agregar nuevas funciones

```javascript
// 1. Definir función en _getFunctionDefinitions()
{
  name: "solicitar_historial_medico",
  description: "Solicita el historial médico del paciente",
  parameters: { ... }
}

// 2. Implementar en _executeFunctionCall()
case "solicitar_historial_medico":
  return await this._solicitarHistorial(patientId);

// 3. Crear método
async _solicitarHistorial(patientId) {
  const records = await db.MedicalRecord.findAll({ ... });
  return { success: true, records };
}
```

---

## 📈 Métricas y Optimización

### Métricas a Trackear

- Tiempo de respuesta promedio
- Tasa de éxito en agendamiento
- Intenciones más comunes
- Tasa de abandonos
- Citas agendadas vs canceladas

### Optimizaciones

1. **Cache de disponibilidad:**
   ```javascript
   // Cache de 1 minuto para horarios
   const cached = await redis.get(`availability:${specialty}`);
   if (cached) return JSON.parse(cached);
   ```

2. **Índices de BD:**
   ```sql
   CREATE INDEX idx_appointments_patient_date 
   ON appointments(patientId, startTime, status);
   ```

3. **Batch processing:**
   - Procesar múltiples consultas de disponibilidad en paralelo
   - Usar `Promise.all()` para queries independientes

---

## 🐛 Debugging

### Activar logs detallados

```javascript
// En ConversationalAssistantService.js
console.log('[Debug] Contexto completo:', contextualInfo);
console.log('[Debug] Mensajes enviados a OpenAI:', messages);
console.log('[Debug] Respuesta de OpenAI:', assistantMessage);
```

### Herramientas útiles

- **Postman/Insomnia:** Para testear endpoints
- **MongoDB Compass / DBeaver:** Para inspeccionar BD
- **OpenAI Playground:** Para probar prompts
- **Node Inspector:** Para debugging

---

## 📚 Referencias

- [OpenAI Function Calling](https://platform.openai.com/docs/guides/function-calling)
- [OpenAI API Reference](https://platform.openai.com/docs/api-reference)
- [Sequelize ORM](https://sequelize.org/docs/v6/)
- [Express.js](https://expressjs.com/)

---

Creado por: Sistema de IA - Clínica Dental Plus
Última actualización: 2025

