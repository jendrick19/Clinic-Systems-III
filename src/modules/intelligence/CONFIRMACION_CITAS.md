# 📋 Funcionalidad de Confirmación de Citas

## 🎯 Descripción

El agente conversacional María ahora puede **confirmar citas** que están en estado `'solicitada'`, cambiándolas automáticamente al estado `'confirmada'` cuando el paciente lo solicita.

---

## 🔄 Estados de una Cita

### Estados Disponibles

```
solicitada  →  confirmada  →  cumplida
     ↓
no asistio (cancelada)
```

| Estado | Descripción | ¿Puede confirmar? |
|--------|-------------|-------------------|
| `solicitada` | Cita recién agendada, pendiente de confirmación | ✅ Sí |
| `confirmada` | Cita confirmada por el paciente | ❌ Ya confirmada |
| `cumplida` | Cita completada | ❌ Ya completada |
| `no asistio` | Paciente no asistió | ❌ Cancelada |

### Transiciones Válidas

- ✅ `solicitada` → `confirmada` (usando `confirmar_cita`)
- ✅ `solicitada` → `cancelada` (usando `cancelar_cita`)
- ✅ `confirmada` → `cumplida` (automático después de la consulta)
- ✅ `confirmada` → `no asistio` (si no asiste)

---

## 🚀 Cómo Funciona

### 1. Usuario solicita confirmar cita

```
Usuario: "Quiero confirmar mi cita"
```

### 2. El agente identifica la cita

El agente revisa el contexto pre-cargado que incluye TODAS las citas del paciente con su estado:

```javascript
CITAS_ACTIVAS:
- CITA_1: ID=123 | 11/01/2026 14:00 | Dra. Ana López | ESPECIALIDAD=Ortodoncia | ESTADO=solicitada
- CITA_2: ID=124 | 15/01/2026 10:00 | Dr. Juan Pérez | ESPECIALIDAD=Limpieza | ESTADO=confirmada
```

### 3. El agente ejecuta la función

```javascript
{
  "function_call": {
    "name": "confirmar_cita",
    "arguments": "{\"appointmentId\": 123}"
  }
}
```

### 4. El sistema actualiza el estado

```javascript
// En la base de datos
UPDATE Appointment 
SET status = 'confirmada' 
WHERE id = 123 AND peopleId = [patientId] AND status = 'solicitada'
```

### 5. El agente confirma al paciente con detalles completos

**IMPORTANTE:** El sistema ahora hace una segunda llamada a OpenAI después de ejecutar la función exitosamente para generar una respuesta contextualizada y natural.

```
María: "¡Listo, Juan! ✅ Tu cita del 5 de enero de 2026 a las 10:10 AM para Ortodoncia 
está confirmada. Recibirás un recordatorio 24 horas antes por email y SMS 📧 
¿Hay algo más en lo que pueda ayudarte?"
```

**Nunca respuestas genéricas como:**
❌ "¿En qué más puedo ayudarte?" (sin contexto)
❌ "Listo." (sin detalles)

---

## 📝 Ejemplos de Conversación

### Ejemplo 1: Confirmar una sola cita solicitada

```
Usuario: "Confirmar mi cita"

María: "Perfecto, Juan. Veo que tienes una cita solicitada el martes 11 de enero 
a las 2:00 PM con Dra. Ana López (Ortodoncia). ¿Deseas confirmarla?"

Usuario: "Sí"

María: [Ejecuta confirmar_cita(appointmentId: 123)]
"¡Excelente! ✅ Tu cita del martes 11 de enero a las 2:00 PM con Dra. Ana López 
ha sido confirmada. Recibirás un recordatorio 24 horas antes por email y SMS 📧"
```

### Ejemplo 2: Múltiples citas solicitadas

```
Usuario: "Quiero confirmar mi cita"

María: "Tienes dos citas solicitadas, Juan:
1. Martes 11 de enero, 2:00 PM - Ortodoncia con Dra. Ana López
2. Viernes 14 de enero, 10:00 AM - Limpieza con Dr. Juan Pérez

¿Cuál deseas confirmar?"

Usuario: "La primera"

María: [Ejecuta confirmar_cita(appointmentId: 123)]
"¡Listo! Tu cita del martes 11 de enero a las 2:00 PM con Dra. Ana López 
ha sido confirmada ✅"
```

### Ejemplo 3: Cita ya confirmada

```
Usuario: "Confirmar mi cita"

María: "Juan, tu cita del martes 11 de enero a las 2:00 PM con Dra. Ana López 
ya está confirmada ✅. No necesitas confirmarla nuevamente."
```

### Ejemplo 4: No hay citas solicitadas

```
Usuario: "Quiero confirmar mi cita"

María: "Todas tus citas ya están confirmadas, Juan 😊. 
¿Hay algo más en lo que pueda ayudarte?"
```

---

## 🔧 Implementación Técnica

### Flujo de Doble Llamada a OpenAI (NUEVO)

Para evitar respuestas genéricas, el sistema ahora implementa un **flujo de doble llamada**:

1. **Primera llamada:** OpenAI decide ejecutar `confirmar_cita` y puede generar un mensaje genérico
2. **Ejecución de función:** Se confirma la cita en la base de datos
3. **Segunda llamada:** Se envía el resultado de la función a OpenAI para que genere una respuesta contextualizada

```javascript
// Primera llamada - OpenAI decide ejecutar función
const completion = await openai.chat.completions.create({ ... });

// Si hay function_call, ejecutar la función
if (assistantMessage.function_call) {
  const actionResult = await this._executeFunctionCall(...);
  
  // Si la función fue exitosa, hacer segunda llamada
  if (actionResult.success) {
    // Agregar resultado al historial
    conversationHistory.push(
      { role: "assistant", content: message, function_call: ... },
      { role: "function", name: functionName, content: JSON.stringify(actionResult) }
    );
    
    // Segunda llamada - generar respuesta contextualizada
    const followUpCompletion = await openai.chat.completions.create({
      messages: [...conversationHistory]
    });
    
    finalMessage = followUpCompletion.choices[0].message.content;
  }
}
```

**Beneficios:**
- ✅ Respuestas siempre contextualizadas con el resultado de la acción
- ✅ El agente "ve" el resultado y puede comunicarlo apropiadamente
- ✅ Elimina respuestas genéricas como "¿En qué más puedo ayudarte?"
- ✅ Mejor experiencia de usuario con confirmaciones claras

### Nueva Función en el Agente

```javascript
{
  name: "confirmar_cita",
  description: "Confirma una cita que está en estado 'solicitada' cambiándola a estado 'confirmada'",
  parameters: {
    type: "object",
    properties: {
      appointmentId: {
        type: "number",
        description: "ID de la cita a confirmar (debe estar en estado 'solicitada')"
      }
    },
    required: ["appointmentId"]
  }
}
```

### Método de Ejecución

```javascript
async _confirmarCita(patientId, args) {
  const { appointmentId } = args;

  // 1. Buscar la cita
  const appointment = await db.Appointment.findOne({
    where: { id: appointmentId, peopleId: patientId },
    include: [{ model: db.Professional, as: 'professional' }]
  });

  if (!appointment) {
    return { success: false, message: "Cita no encontrada" };
  }

  // 2. Validar que esté en estado 'solicitada'
  if (appointment.status !== 'solicitada') {
    return { 
      success: false, 
      message: `No se puede confirmar. La cita está en estado '${appointment.status}'` 
    };
  }

  // 3. Actualizar estado
  appointment.status = 'confirmada';
  await appointment.save();

  // 4. Retornar éxito con datos completos
  return {
    success: true,
    message: "Cita confirmada exitosamente",
    appointment: {
      id: appointment.id,
      startTime: appointment.startTime,
      previousStatus: 'solicitada',
      newStatus: 'confirmada',
      professional: `${appointment.professional.names} ${appointment.professional.surNames}`,
      specialty: appointment.professional.specialty,
      dateHuman: formatDate(appointment.startTime)
    }
  };
}
```

---

## ✅ Validaciones Implementadas

1. **Verificación de propiedad:**
   - La cita debe pertenecer al paciente que la está confirmando
   - Se valida `peopleId = patientId`

2. **Validación de estado:**
   - Solo se pueden confirmar citas en estado `'solicitada'`
   - Si el estado es diferente, se informa al paciente

3. **Existencia de la cita:**
   - Se verifica que la cita exista en la base de datos
   - Se incluye información del profesional

4. **Respuesta completa:**
   - Se retorna toda la información de la cita confirmada
   - Se incluye el estado anterior y nuevo
   - Se proporciona fecha formateada en español

---

## 📊 JSON de Respuesta

### Respuesta Exitosa

```json
{
  "success": true,
  "message": "Cita confirmada exitosamente",
  "appointmentId": 123,
  "appointment": {
    "id": 123,
    "startTime": "2026-01-11T14:00:00.000Z",
    "previousStatus": "solicitada",
    "newStatus": "confirmada",
    "reason": "Control de ortodoncia",
    "professional": "Dra. Ana López",
    "specialty": "Ortodoncia",
    "dateHuman": "11/01/2026 14:00"
  }
}
```

### Respuesta de Error (Estado Inválido)

```json
{
  "success": false,
  "message": "No se puede confirmar. La cita está en estado 'confirmada'. Solo se pueden confirmar citas en estado 'solicitada'.",
  "currentStatus": "confirmada"
}
```

### Respuesta de Error (Cita No Encontrada)

```json
{
  "success": false,
  "message": "Cita no encontrada o no pertenece al paciente"
}
```

---

## 🎨 Prompt Actualizado

El prompt `AsistenteClinicaDental.md` fue actualizado para incluir:

### Nueva Intención

```markdown
## Intención: `confirmar_cita`
El paciente desea confirmar una cita que está en estado 'solicitada'.

### Reglas:
1. Traer las citas del paciente que estén en estado 'solicitada'.
2. Si el paciente dice "confirmar mi cita", identificar cuál cita desea confirmar.
3. Cambiar el estado de 'solicitada' a 'confirmada'.
4. Notificar al paciente que su cita está confirmada.

### IMPORTANTE:
- SOLO se pueden confirmar citas en estado 'solicitada'.
- Si la cita ya está 'confirmada', informar al paciente.
- Si hay múltiples citas solicitadas, preguntar cuál confirmar.
```

### Nuevos Ejemplos

```markdown
## Confirmación de cita
> ¡Excelente, {{FirstName}}! ✅
> Tu cita del martes 11 de enero a las 2:00 PM con Dra. Ana López ha sido confirmada.
> Recibirás un recordatorio 24 horas antes por email y SMS 📧
```

---

## 🧪 Pruebas Recomendadas

### Test 1: Confirmar cita solicitada
```bash
POST /api/intelligence/chat
{
  "message": "Quiero confirmar mi cita",
  "userId": 1,
  "patientId": 5
}
```

**Esperado:** El agente identifica la cita en estado 'solicitada' y la confirma.

### Test 2: Intentar confirmar cita ya confirmada
```bash
POST /api/intelligence/chat
{
  "message": "Confirmar mi cita del martes",
  "userId": 1,
  "patientId": 5
}
```

**Esperado:** El agente informa que la cita ya está confirmada.

### Test 3: Confirmar con múltiples citas solicitadas
```bash
POST /api/intelligence/chat
{
  "message": "Confirmar cita",
  "userId": 1,
  "patientId": 5
}
```

**Esperado:** El agente pregunta cuál de las citas solicitadas desea confirmar.

### Test 4: No hay citas solicitadas
```bash
POST /api/intelligence/chat
{
  "message": "Quiero confirmar mi cita",
  "userId": 1,
  "patientId": 5
}
```

**Esperado:** El agente informa que no hay citas pendientes de confirmación.

---

## 📈 Beneficios

✅ **Automatización:** Los pacientes pueden confirmar sus citas sin intervención humana
✅ **Claridad:** El agente muestra el estado de cada cita
✅ **Validación:** El sistema valida que solo se confirmen citas en estado correcto
✅ **Trazabilidad:** Se registra el cambio de estado con todos los detalles
✅ **UX Mejorada:** Conversación natural para gestionar confirmaciones

---

## 🔮 Mejoras Futuras

- [ ] Enviar email automático cuando se confirme una cita
- [ ] Enviar SMS de confirmación
- [ ] Permitir confirmar todas las citas solicitadas a la vez
- [ ] Notificar al profesional cuando una cita es confirmada
- [ ] Agregar recordatorio automático 24h antes
- [ ] Historial de cambios de estado (AppointmentHistory)

---

Creado: Enero 2026  
Última actualización: Enero 2026

