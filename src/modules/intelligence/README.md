# Módulo de Inteligencia Artificial - Clínica Dental Plus

Este módulo proporciona servicios de IA para la gestión inteligente de citas dentales.

## 🤖 Servicios Disponibles

### 1. Asistente Conversacional (Recomendado)
**Archivo:** `ConversationalAssistantService.js`

Asistente virtual con nombre "María" que maneja conversaciones naturales con los pacientes para:
- ✅ Agendar nuevas citas
- ✅ **Confirmar citas solicitadas** (NUEVO)
- ✅ Reagendar citas existentes
- ✅ Cancelar citas
- ✅ Consultar citas del paciente
- ✅ Mantener contexto de la conversación
- ✅ Recordar citas previas del usuario

**Características:**
- Usa el prompt/contexto definido en `prompts/AsistenteClinicaDental.md`
- Memoria de conversación por usuario (últimos 10 mensajes)
- Function calling de OpenAI para ejecutar acciones
- Recomienda máximo 3 horarios disponibles
- Filtra por especialidad automáticamente
- Verifica disponibilidad real en tiempo real

### 2. Recomendación Simple con OpenAI
**Archivo:** `OpenAIService.js`

Servicio que recomienda horarios disponibles basándose en una consulta de texto.

### 3. Recomendación con Google Gemini
**Archivo:** `SmartSchedulingService.js`

Similar al servicio de OpenAI pero usando Google Gemini.

---

## 📡 Endpoints API

### Asistente Conversacional

#### POST `/api/intelligence/chat`
Envía un mensaje al asistente virtual.

**Request Body:**
```json
{
  "message": "Necesito una cita de ortodoncia",
  "userId": 1,
  "patientId": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Perfecto, Juan. Encontré estos horarios disponibles para Ortodoncia:\n\n1. Lunes 10 de enero, 9:00 AM con Dra. Ana López\n2. Martes 11 de enero, 2:00 PM con Dra. Ana López\n3. Miércoles 12 de enero, 10:30 AM con Dr. Carlos Ruiz\n\n¿Cuál prefieres?",
    "action": null,
    "actionResult": null,
    "requiresConfirmation": false
  }
}
```

**Casos de uso:**
- Agendar: "Necesito una cita de ortodoncia"
- Reagendar: "Quiero cambiar mi cita"
- Cancelar: "Necesito cancelar mi cita del martes"
- Consultar: "¿Cuáles son mis citas?"

#### DELETE `/api/intelligence/chat/history/:userId`
Limpia el historial de conversación de un usuario.

**Response:**
```json
{
  "success": true,
  "message": "Historial de conversación limpiado exitosamente"
}
```

### Recomendación Simple (Método Antiguo)

#### POST `/api/intelligence/recommend`
Recomienda horarios sin mantener contexto conversacional.

**Request Body:**
```json
{
  "query": "Necesito una cita de ortodoncia el martes",
  "professionalId": 2,
  "provider": "openai"
}
```

---

## 🔧 Configuración

### Variables de Entorno

Agrega en tu archivo `.env`:

```env
# OpenAI (requerido para el asistente conversacional)
OPENAI_API_KEY=sk-...

# Google Gemini (opcional, para SmartSchedulingService)
GEMINI_API_KEY=...
```

### Instalación de Dependencias

El módulo ya usa las dependencias instaladas:
- `openai` - Cliente de OpenAI
- `@google/generative-ai` - Cliente de Google Gemini
- `sequelize` - ORM para base de datos

---

## 💬 Flujo del Asistente Conversacional

### 0. Usuario inicia sesión (NUEVO)
```
POST /api/platform/auth/login
{
  "tipoDocumento": "cedula",
  "numeroDocumento": "12345678",
  "password": "password123"
}
```

**¡AUTOMÁTICAMENTE al iniciar sesión!**:
1. El sistema consulta TODA la información del usuario:
   - Datos personales completos
   - TODAS las citas activas (schedules y appointments)
   - Disponibilidad COMPLETA de TODAS las especialidades

2. Esta información se pre-carga en el contexto del agente IA
3. El agente ya tiene TODO el contexto necesario sin hacer consultas adicionales

### 1. Usuario envía mensaje
```
POST /api/intelligence/chat
{
  "message": "Hola, necesito una cita",
  "userId": 1,
  "patientId": 5
}
```

### 2. El asistente:
1. **Usa el contexto PRE-CARGADO del usuario:**
   - ✅ Nombre del paciente (ya cargado al iniciar sesión)
   - ✅ Citas activas existentes (ya cargadas al iniciar sesión)
   - ✅ Disponibilidad completa por especialidad (ya cargada al iniciar sesión)
   
2. **Analiza el mensaje:**
   - Detecta la intención del usuario
   - Usa el contexto pre-cargado (NO hace consultas nuevas a BD)
   
3. **Construye respuesta contextualizada:**
   - Usa el prompt de `AsistenteClinicaDental.md`
   - Usa la información pre-cargada al login
   - Mantiene historial de la conversación

4. **Ejecuta acciones si es necesario:**
   - Puede llamar funciones: `agendar_cita`, `reagendar_cita`, `cancelar_cita`, `consultar_citas`
   - Las acciones se ejecutan en la base de datos

### 3. Usuario confirma acción
```
POST /api/intelligence/chat
{
  "message": "La opción 2",
  "userId": 1,
  "patientId": 5
}
```

El asistente recuerda el contexto y agenda la cita.

---

## 🎯 Ejemplos de Conversación

### Ejemplo 1: Agendar Nueva Cita

**Usuario:** "Hola, necesito una cita de ortodoncia"

**María (Asistente):** 
> Hola Juan 👋 Con gusto te ayudo.
> 
> Encontré estos horarios disponibles para Ortodoncia:
> 1. Lunes 10 de enero, 9:00 AM con Dra. Ana López
> 2. Martes 11 de enero, 2:00 PM con Dra. Ana López
> 3. Miércoles 12 de enero, 10:30 AM con Dr. Carlos Ruiz
> 
> ¿Cuál prefieres?

**Usuario:** "La opción 2"

**María:** 
> ¡Listo, Juan! ✅
> Tu cita está confirmada para el martes 11 de enero a las 2:00 PM con Dra. Ana López (Ortodoncia).
> Recibirás un recordatorio 24 horas antes por email y SMS 📧

---

### Ejemplo 2: Confirmar Cita Solicitada (NUEVO)

**Usuario:** "Quiero confirmar mi cita"

**María:**
> Perfecto, Juan. Veo que tienes una cita solicitada el martes 11 de enero a las 2:00 PM con Dra. Ana López (Ortodoncia).
> ¿Deseas confirmarla?

**Usuario:** "Sí"

**María:**
> ¡Excelente! ✅
> Tu cita del martes 11 de enero a las 2:00 PM con Dra. Ana López ha sido confirmada.
> Recibirás un recordatorio 24 horas antes por email y SMS 📧

---

### Ejemplo 3: Reagendar Cita Existente

**Usuario:** "Necesito cambiar mi cita"

**María:**
> Claro, Juan. Veo que tienes una cita el martes 11 de enero a las 2:00 PM con Dra. Ana López.
> ¿Es esa la que deseas reagendar?

**Usuario:** "Sí"

**María:**
> Perfecto. Estas son las nuevas opciones disponibles:
> 1. Miércoles 12 de enero, 10:30 AM
> 2. Jueves 13 de enero, 3:00 PM
> 3. Viernes 14 de enero, 9:00 AM
> 
> ¿Cuál te viene mejor?

**Usuario:** "La primera"

**María:**
> ¡Listo! Tu cita ha sido reagendada para el miércoles 12 de enero a las 10:30 AM ✅

---

### Ejemplo 4: Consultar Citas

**Usuario:** "¿Cuáles son mis citas?"

**María:**
> Estas son tus citas activas, Juan:
> 
> 1. Miércoles 12 de enero, 10:30 AM - Ortodoncia con Dra. Ana López (Confirmada)
> 2. Lunes 24 de enero, 10:00 AM - Limpieza con Dr. Juan Pérez (Solicitada)
> 
> ¿Necesitas modificar o confirmar alguna?

---

### Ejemplo 5: Cancelar Cita

**Usuario:** "Quiero cancelar mi cita del miércoles"

**María:**
> Entiendo, Juan. Tienes una cita el miércoles 12 de enero a las 10:30 AM con Dra. Ana López.
> ¿Deseas cancelar esta cita?

**Usuario:** "Sí, cancelar"

**María:**
> ¿Estás seguro de que deseas cancelar? Esta acción no se puede deshacer fácilmente.

**Usuario:** "Sí, estoy seguro"

**María:**
> Listo, Juan. Tu cita del miércoles 12 de enero a las 10:30 AM ha sido cancelada.
> Si necesitas agendar nuevamente, avísame 🙌

---

## 🔍 Cómo Funciona Internamente

### Function Calling

El asistente usa OpenAI Function Calling para ejecutar acciones:

```javascript
functions: [
  {
    name: "agendar_cita",
    description: "Agenda una nueva cita dental para el paciente",
    parameters: {
      scheduleId: number,
      startTime: string (ISO 8601),
      reason: string
    }
  },
  {
    name: "confirmar_cita",
    description: "Confirma una cita en estado 'solicitada'",
    parameters: {
      appointmentId: number
    }
  },
  {
    name: "reagendar_cita",
    description: "Reagenda una cita existente",
    parameters: {
      appointmentId: number,
      newScheduleId: number,
      newStartTime: string
    }
  },
  {
    name: "cancelar_cita",
    description: "Cancela una cita",
    parameters: {
      appointmentId: number
    }
  },
  {
    name: "consultar_citas",
    description: "Consulta citas activas",
    parameters: {}
  }
]
```

### Generación de Slots Disponibles

1. Consulta tabla `Schedule` (horarios de trabajo habilitados)
2. Consulta tabla `Appointment` (citas ya agendadas)
3. Genera slots libres de 30 minutos
4. Filtra por especialidad si se menciona
5. Retorna máximo 3 opciones

---

## 📝 Personalización del Prompt

El comportamiento del asistente está definido en:
```
src/modules/intelligence/prompts/AsistenteClinicaDental.md
```

Puedes personalizar:
- Nombre del asistente (actualmente "María")
- Tono y personalidad
- Reglas de negocio
- Mensajes de respuesta
- Especialidades disponibles
- Políticas de la clínica

**Ejemplo de cambio:**
```markdown
# ROL
Eres Carlos, asistente virtual de la Clínica Dental Premium...
```

El servicio recargará automáticamente el prompt en cada inicialización.

---

## 🚀 Integración con Frontend

### Ejemplo en React/Vue:

```javascript
// Enviar mensaje al asistente
const sendMessage = async (message) => {
  try {
    const response = await fetch('/api/intelligence/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        message: message,
        userId: currentUser.id,
        patientId: currentUser.patientId
      })
    });

    const data = await response.json();
    
    if (data.success) {
      // Mostrar respuesta del asistente
      addMessageToChat(data.data.message, 'assistant');
      
      // Si hubo una acción ejecutada
      if (data.data.actionResult) {
        console.log('Acción ejecutada:', data.data.action);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

---

## 🐛 Troubleshooting

### Error: "OPENAI_API_KEY no encontrada"
- Verifica que `.env` tenga la variable `OPENAI_API_KEY`
- Reinicia el servidor después de agregar la variable

### Error: "Horario no encontrado"
- Verifica que existan registros en la tabla `Schedule` con `status='abierta'`
- Verifica que `startTime` sea futuro

### Error: "No hay horarios disponibles"
- Todos los slots están ocupados
- Crea más horarios en `Schedule`
- Verifica que los profesionales estén activos (`status=true`)

### El asistente no recuerda la conversación
- La memoria es en RAM (se pierde al reiniciar)
- Para producción, implementar Redis o guardar en BD

---

## 📊 Base de Datos Requerida

El módulo asume estas tablas:

### `People` (Pacientes)
- `id`, `names`, `surNames`, ...

### `Professional` (Doctores)
- `id`, `names`, `surNames`, `specialty`, `status`

### `Schedule` (Horarios de Trabajo)
- `id`, `professionalId`, `startTime`, `endTime`, `status`

### `Appointment` (Citas Agendadas)
- `id`, `patientId`, `professionalId`, `scheduleId`, `startTime`, `status`, `description`

---

## 🎓 Mejoras Futuras

- [ ] Persistir historial de conversación en BD o Redis
- [ ] Soporte para múltiples idiomas
- [ ] Integración con WhatsApp/Telegram
- [ ] Análisis de sentimientos avanzado
- [ ] Recordatorios automáticos
- [ ] Recomendaciones basadas en historial médico
- [ ] Soporte para citas grupales
- [ ] Dashboard de métricas del asistente

---

## 📄 Licencia

Propiedad de Clínica Dental Plus

