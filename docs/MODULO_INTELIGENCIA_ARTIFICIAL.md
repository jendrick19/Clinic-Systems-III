# Módulo de Inteligencia Artificial (Chatbot)

El módulo `intelligence` es el núcleo diferenciador de Clinic Systems III. Implementa un **Asistente Conversacional Contextual ("María")** capaz de gestionar la agenda clínica interactuando con los pacientes en lenguaje natural.

---

## 🧠 Arquitectura del Asistente

El chatbot no es una simple integración de "pregunta-respuesta". Utiliza una arquitectura **RAG (Retrieval-Augmented Generation)** simplificada y **Function Calling** para realizar acciones reales.

### Componentes Principales (`src/modules/intelligence`)

1.  **`ConversationalAssistantService.js` (El Orquestador)**
    * Gestiona el ciclo de vida del mensaje.
    * Mantiene el historial de la conversación (hasta que se reinicia).
    * Decide cuándo llamar a OpenAI y cuándo ejecutar una función local (Herramienta).
    * Inyecta las **Reglas de Disponibilidad Estrictas** en cada turno para evitar alucinaciones.

2.  **`IAContextService.js` (Inyector de Contexto)**
    * Antes de procesar un mensaje, este servicio recopila datos en tiempo real de la Base de Datos:
        * **Datos del Paciente:** Nombre, ID.
        * **Citas Activas:** Lista de citas futuras (para evitar duplicados/solapamientos).
        * **Disponibilidad Real:** Consulta `ScheduleService` para calcular los slots libres basándose en la duración de los turnos y las citas ya ocupadas.
    * Transforma estos datos en un JSON optimizado que se inserta en el "System Prompt".

3.  **`OpenAIService.js` (Cliente API)**
    * Wrapper para la API de OpenAI.
    * Configura el modelo (ej: `gpt-4o-mini`), temperatura y herramientas disponibles.

4.  **`SmartSchedulingService.js`**
    * Lógica auxiliar para interpretar intenciones de fechas complejas (ej: "el próximo martes") si fuera necesario fuera del LLM.

---

## 🔄 Flujo de Datos (Interaction Flow)

1.  **Entrada:** El frontend envía: `{ "message": "Quiero cita para mañana", "userId": 1 }`.
2.  **Carga de Contexto:**
    * Se identifica al paciente (EntityId).
    * Se calculan los slots disponibles para los próximos días.
    * Se buscan las citas actuales del paciente.
3.  **Construcción del Prompt:**
    * Se combina: `System Prompt` + `JSON Contexto` + `Reglas Estrictas` + `Historial de Chat`.
4.  **Inferencia (OpenAI):**
    * El modelo analiza si puede responder directamente o si necesita llamar a una herramienta (`agendar_cita`).
5.  **Ejecución de Herramienta (Si aplica):**
    * Si el modelo devuelve `tool_call: agendar_cita`, el backend ejecuta la función SQL correspondiente.
    * El resultado (ej: "Cita creada ID 50") se devuelve al modelo.
6.  **Respuesta Final:**
    * El modelo genera la respuesta final al usuario: "Listo, he agendado tu cita para mañana a las 8:00 AM".

---

## 🛠️ Herramientas (Function Calling)

El asistente tiene permiso para ejecutar las siguientes funciones en el Backend:

| Función | Parámetros | Descripción |
| :--- | :--- | :--- |
| `agendar_cita` | `scheduleId`, `startTime`, `reason` | Crea una nueva cita en estado 'solicitada'. |
| `reagendar_cita` | `appointmentId`, `newScheduleId`, `newStartTime` | Mueve una cita existente a otro horario. |
| `cancelar_cita` | `appointmentId` | Cancela una cita activa. |
| `consultar_citas` | N/A | Fuerza una recarga del contexto de citas del usuario. |

---

## ⚠️ Mecanismos de Seguridad y Anti-Alucinación

Para evitar que la IA invente horarios o citas, se inyectan dinámicamente las siguientes reglas en el mensaje del sistema (`strictAvailabilityRules`):

1.  **Cero Inferencia:** Si un horario no aparece explícitamente en el JSON de `HORARIOS_DISPONIBLES` calculado por el sistema, la IA tiene **prohibido** ofrecerlo.
2.  **Agendamiento Directo:** Si el usuario solicita una hora que existe en la disponibilidad real (aunque no se le haya mostrado en el menú de opciones), la IA debe agendarla inmediatamente sin pedir confirmación redundante.
3.  **Manejo de Cambios:** Si el usuario cambia de opinión ("No, mejor a las 10"), la IA interpreta esto como una orden directa de reagendamiento sobre el flujo actual.
4.  **Visualización:** Aunque la IA recibe disponibilidad de 24 horas (48 slots), se le instruye presentar las opciones de forma resumida para no saturar el chat.

---

## 📝 Prompts del Sistema

Los archivos `.md` en `src/modules/intelligence/prompts/` definen la personalidad:

* **`AsistenteClinicaDental.md`:** Prompt principal. Define a "María" como una asistente amable, profesional y eficiente. Establece el tono de voz y las restricciones de negocio (ej: no dar diagnósticos médicos).