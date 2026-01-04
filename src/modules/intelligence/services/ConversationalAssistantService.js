// fileName: src/modules/intelligence/services/ConversationalAssistantService.js
const OpenAI = require("openai");
const { Op } = require("sequelize");
const db = require("../../../../database/models");
const fs = require('fs');
const path = require('path');

/**
 * Servicio de Asistente Conversacional para Clínica Dental
 * Maneja conversaciones naturales con contexto de usuario para:
 * - Agendar citas
 * - Reagendar citas existentes
 * - Cancelar citas
 * - Consultar citas del paciente
 */
class ConversationalAssistantService {
  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      console.error("⚠️ FALTA OPENAI_API_KEY");
    }
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    // Cargar el contexto del prompt
    const promptPath = path.join(__dirname, '../prompts/AsistenteClinicaDental.md');
    this.systemPrompt = fs.existsSync(promptPath) 
      ? fs.readFileSync(promptPath, 'utf-8')
      : "Eres María, asistente virtual de Clínica Dental Plus.";
    
    // Memoria de conversaciones por usuario (en producción usar Redis o BD)
    this.conversationMemory = new Map();
    // Estado por conversación (intenciones pendientes, datos parciales)
    this.conversationState = new Map();
  }

  /**
   * Procesa un mensaje del usuario y genera respuesta contextualizada
   * @param {string} userMessage - Mensaje del usuario
   * @param {number} userId - ID del usuario/paciente logueado
   * @param {number} patientId - ID del registro de paciente (People)
   * @returns {Object} Respuesta del asistente con acciones sugeridas
   */
  async processMessage(userMessage, userId, patientId) {
    try {
      console.log(`[Chat IA] Mensaje de usuario ${userId}: "${userMessage}"`);

      // 1. Obtener o crear historial de conversación
      const conversationKey = `user_${userId}`;
      if (!this.conversationMemory.has(conversationKey)) {
        this.conversationMemory.set(conversationKey, []);
      }
      const conversationHistory = this.conversationMemory.get(conversationKey);
      const convoState = this.conversationState.get(conversationKey) || {};

      // ELIMINADO: Ya no interceptamos patrones específicos.
      // Dejamos que el modelo de IA procese TODOS los mensajes usando el contexto precargado.

      // 2. Obtener contexto del usuario - PRIORIZAR CONTEXTO PRECARGADO
      let userContext = null;
      let availabilityContext = null;
      let fullAvailability = null;

      // Si existe contexto inicial precargado, usarlo EXCLUSIVAMENTE (no hacer consultas)
      if (convoState.initialContext) {
        console.log('[ChatIA] Usando contexto precargado para usuario', userId);
        userContext = {
          patient: convoState.initialContext.patient,
          appointments: convoState.initialContext.appointments || []
        };
        
        // Guardar la disponibilidad completa para incluirla en el contexto
        fullAvailability = convoState.initialContext.availability;
        
        // Extraer disponibilidad del contexto precargado basándose en la especialidad mencionada
        availabilityContext = this._extractAvailabilityFromPreloaded(
          userMessage, 
          convoState.initialContext.availability
        );
      } else {
        // Solo si NO hay contexto precargado, hacer consultas
        console.log('[ChatIA] No hay contexto precargado, consultando BD para usuario', userId);
        userContext = await this._getUserContext(userId, patientId);
        availabilityContext = await this._getAvailabilityContext(userMessage);
      }

      // 4. Construir el contexto completo (con reglas anti-contradicción)
      const contextualInfo = this._buildContextualInfo(userContext, availabilityContext, fullAvailability);
      
      // LOG DETALLADO DEL CONTEXTO
      console.log('==========================================');
      console.log('[ChatIA CONTEXTO COMPLETO] Usuario:', userId);
      console.log('[ChatIA CONTEXTO] userContext:', JSON.stringify(userContext, null, 2));
      console.log('[ChatIA CONTEXTO] availabilityContext:', availabilityContext ? 'Presente' : 'No presente');
      console.log('[ChatIA CONTEXTO] Texto enviado al modelo:');
      console.log(contextualInfo);
      console.log('==========================================');

      // ELIMINADO: Ya no interceptamos patrones para "consultar agenda de otro paciente".
      // El modelo de IA manejará estas conversaciones naturalmente.

      // ELIMINADO: Ya no manejamos flujos de "consult_by_document" con lógica fija.
      // El modelo de IA manejará estas conversaciones de forma natural.

      // 5. Construir mensajes para OpenAI
      const strictAvailabilityRules = `
REGLAS ESTRICTAS (MUY IMPORTANTE):
- SOLO usa la información del CONTEXTO ACTUAL que se te proporciona abajo.
- NO inventes disponibilidad ni citas que no estén en el contexto.
- Si CITAS_ACTIVAS_COUNT > 0, el paciente SÍ tiene citas. Muéstralas exactamente como aparecen.
- Si CITAS_ACTIVAS_COUNT = 0, el paciente NO tiene citas activas.
- Si en el contexto aparece HORARIOS_DISPONIBLES_COUNT mayor que 0, entonces SÍ hay disponibilidad.
  En ese caso, está PROHIBIDO decir "no hay horarios" o frases equivalentes.
- Si HORARIOS_DISPONIBLES_COUNT es 0 (y el usuario pidió una especialidad), entonces di que no hay para esa especialidad
  y ofrece alternativas (otra fecha/otro doctor/otra especialidad).
- Recomienda MÁXIMO 3 horarios y SOLO los que aparecen listados en HORARIOS_DISPONIBLES.
- El CONTEXTO ACTUAL ya contiene TODA la información del paciente. NO necesitas hacer consultas adicionales.
`;

      const messages = [
        {
          role: "system",
          content: `${this.systemPrompt}\n\n${strictAvailabilityRules}\n\nCONTEXTO ACTUAL (DATOS REALES):\n${contextualInfo}`
        },
        ...conversationHistory,
        { role: "user", content: userMessage }
      ];

      // LOG: Mostrar el mensaje system completo que recibe OpenAI
      console.log('========== MENSAJE SYSTEM ENVIADO A OPENAI ==========');
      console.log(messages[0].content.substring(messages[0].content.indexOf('CONTEXTO ACTUAL')));
      console.log('=====================================================');

      // 6. Llamar a OpenAI con function calling
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: messages,
        functions: this._getFunctionDefinitions(),
        function_call: "auto",
        // Temperatura baja para reducir contradicciones/hallucinations
        temperature: 0.3
      });

      const assistantMessage = completion.choices[0].message;
      
      // 7. Procesar si hay function call (ANTES de guardar en historial)
      let actionResult = null;
      let finalMessage = assistantMessage.content || "";

      if (assistantMessage.function_call) {
        console.log(`[ChatIA] Ejecutando función: ${assistantMessage.function_call.name}`);
        
        actionResult = await this._executeFunctionCall(
          assistantMessage.function_call,
          userId,
          patientId
        );

        console.log(`[ChatIA] Resultado de función:`, JSON.stringify(actionResult, null, 2));

        // Si la función fue exitosa, generar una respuesta contextualizada
        if (actionResult && actionResult.success) {
          // Agregar el resultado de la función al contexto
          conversationHistory.push(
            { role: "user", content: userMessage },
            { role: "assistant", content: assistantMessage.content, function_call: assistantMessage.function_call },
            { 
              role: "function", 
              name: assistantMessage.function_call.name,
              content: JSON.stringify(actionResult)
            }
          );

          // Hacer una segunda llamada a OpenAI para generar respuesta apropiada
          const followUpMessages = [
            {
              role: "system",
              content: `${this.systemPrompt}\n\n${strictAvailabilityRules}\n\nCONTEXTO ACTUAL (DATOS REALES):\n${contextualInfo}`
            },
            ...conversationHistory
          ];

          console.log('[ChatIA] Generando respuesta contextualizada después de ejecutar función...');

          const followUpCompletion = await this.openai.chat.completions.create({
            model: "gpt-4.1-mini",
            messages: followUpMessages,
            temperature: 0.3
          });

          finalMessage = followUpCompletion.choices[0].message.content || finalMessage;
          
          // Actualizar el último mensaje del asistente en el historial
          conversationHistory[conversationHistory.length - 3] = {
            role: "assistant",
            content: finalMessage
          };
        } else {
          // Si la función falló, comunicar el error
          conversationHistory.push(
            { role: "user", content: userMessage },
            { role: "assistant", content: assistantMessage.content }
          );
        }
      } else {
        // No hay function call, flujo normal
        conversationHistory.push(
          { role: "user", content: userMessage },
          { role: "assistant", content: assistantMessage.content || "" }
        );
      }

      // Limitar historial a últimos 10 mensajes
      if (conversationHistory.length > 10) {
        conversationHistory.splice(0, conversationHistory.length - 10);
      }

      return {
        message: finalMessage,
        action: assistantMessage.function_call?.name || null,
        actionResult: actionResult,
        requiresConfirmation: this._requiresConfirmation(assistantMessage.function_call?.name)
      };

    } catch (error) {
      console.error("[Chat IA ERROR]:", error);
      return {
        message: "Lo siento, ocurrió un error. ¿Puedes repetir tu solicitud?",
        action: null,
        actionResult: null,
        error: true
      };
    }
  }

  /**
   * Obtiene el contexto del usuario (nombre, citas existentes)
   */
  async _getUserContext(userId, patientId) {
    try {
      // Obtener información del paciente
      const patient = await db.People.findByPk(patientId);
      
      // Obtener citas activas del paciente
      const appointments = await db.Appointment.findAll({
        where: {
          peopleId: patientId,
          status: { [Op.ne]: 'cancelada' }
        },
        include: [
          {
            model: db.Professional,
            as: 'professional',
            attributes: ['names', 'surNames', 'specialty']
          }
        ],
        order: [['startTime', 'ASC']]
      });

      return {
        patient,
        appointments
      };
    } catch (error) {
      console.error("Error obteniendo contexto de usuario:", error);
      return { patient: null, appointments: [] };
    }
  }

  /**
   * Extrae disponibilidad del contexto precargado basándose en la especialidad mencionada
   * @param {string} userMessage - Mensaje del usuario
   * @param {Object} preloadedAvailability - Disponibilidad precargada { especialidad: [slots] }
   * @returns {Object|null} Contexto de disponibilidad en formato esperado
   */
  _extractAvailabilityFromPreloaded(userMessage, preloadedAvailability) {
    if (!preloadedAvailability) {
      console.log('[ChatIA] No hay disponibilidad precargada');
      return null;
    }

    const lowerMessage = userMessage.toLowerCase();
    
    // Detectar especialidad mencionada en el mensaje
    const KNOWN_SPECIALTIES = [
      'odontología general', 'ortodoncia', 'endodoncia', 'periodoncia',
      'odontopediatría', 'cirugía oral', 'prótesis', 'implantología', 'estética'
    ];

    const mentionedSpecialty = KNOWN_SPECIALTIES.find(s => 
      lowerMessage.includes(s.toLowerCase())
    );

    if (!mentionedSpecialty) {
      console.log('[ChatIA] No se detectó especialidad en el mensaje');
      return null;
    }

    // Buscar en la disponibilidad precargada
    const slots = preloadedAvailability[mentionedSpecialty];
    
    if (!slots || slots.length === 0) {
      console.log(`[ChatIA] No hay slots disponibles para ${mentionedSpecialty}`);
      return {
        specialty: mentionedSpecialty,
        freeSlots: []
      };
    }

    console.log(`[ChatIA] Encontrados ${slots.length} slots precargados para ${mentionedSpecialty}`);
    
    // Convertir formato del contexto precargado al formato esperado
    const freeSlots = slots.map(slot => ({
      scheduleId: slot.scheduleId,
      professionalId: slot.professionalId,
      professionalName: slot.professional || 'Doctor',
      startTime: new Date(slot.date_iso),
      dateHuman: slot.date_human
    }));

    return {
      specialty: mentionedSpecialty,
      freeSlots: freeSlots.slice(0, 3) // Máximo 3 opciones
    };
  }

  /**
   * Obtiene contexto de disponibilidad si el usuario menciona especialidad
   */
  async _getAvailabilityContext(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    const KNOWN_SPECIALTIES = [
      'odontología general', 'ortodoncia', 'endodoncia', 'periodoncia',
      'odontopediatría', 'cirugía oral', 'prótesis', 'implantología', 'estética'
    ];

    const mentionedSpecialty = KNOWN_SPECIALTIES.find(s => 
      lowerMessage.includes(s.toLowerCase())
    );

    if (!mentionedSpecialty) return null;

    try {
      // Buscar profesionales de esa especialidad
      const professionals = await db.Professional.findAll({
        where: {
          specialty: { [Op.like]: `%${mentionedSpecialty}%` },
          status: true
        },
        limit: 5
      });

      if (!professionals.length) return null;

      const professionalIds = professionals.map(p => p.id);

      // Buscar horarios disponibles
      const schedules = await db.Schedule.findAll({
        where: {
          professionalId: { [Op.in]: professionalIds },
          status: 'abierta',
          startTime: { [Op.gt]: new Date() }
        },
        order: [['startTime', 'ASC']],
        limit: 15
      });

      // Obtener citas ya agendadas
      const takenAppointments = await db.Appointment.findAll({
        where: {
          professionalId: { [Op.in]: professionalIds },
          status: { [Op.not]: 'cancelada' },
          startTime: { [Op.gte]: new Date() }
        }
      });

      // Generar slots libres
      const freeSlots = this._generateFreeSlots(schedules, takenAppointments, professionals);

      return {
        specialty: mentionedSpecialty,
        freeSlots: freeSlots.slice(0, 3) // Máximo 3 opciones
      };
    } catch (error) {
      console.error("Error obteniendo disponibilidad:", error);
      return null;
    }
  }

  /**
   * Genera slots libres de 30 minutos
   */
  _generateFreeSlots(schedules, takenAppointments, professionals) {
    const freeSlots = [];
    const SLOT_DURATION = 30; // minutos

    // Crear mapa de profesionales por ID
    const profMap = {};
    professionals.forEach(p => {
      profMap[p.id] = `Dr. ${p.names} ${p.surNames} (${p.specialty})`;
    });

    for (const schedule of schedules) {
      let currentTime = new Date(schedule.startTime);
      const endTime = new Date(schedule.endTime);

      while (currentTime < endTime) {
        const slotEnd = new Date(currentTime.getTime() + SLOT_DURATION * 60000);
        if (slotEnd > endTime) break;

        // Verificar si está ocupado
        const isTaken = takenAppointments.some(app => {
          if (!app.startTime || app.professionalId !== schedule.professionalId) return false;
          const appointmentTime = new Date(app.startTime);
          return Math.abs(appointmentTime.getTime() - currentTime.getTime()) < 60000;
        });

        if (!isTaken) {
          freeSlots.push({
            scheduleId: schedule.id,
            professionalId: schedule.professionalId,
            professionalName: profMap[schedule.professionalId] || "Doctor",
            startTime: new Date(currentTime),
            dateHuman: currentTime.toLocaleDateString('es-ES', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit',
              timeZone: 'America/Caracas'
            })
          });
        }

        currentTime = new Date(currentTime.getTime() + SLOT_DURATION * 60000);
      }
    }

    return freeSlots;
  }

  /**
   * Construye información contextual para el prompt
   * @param {Object} userContext - Contexto del usuario { patient, appointments }
   * @param {Object} availabilityContext - Contexto de disponibilidad { specialty, freeSlots }
   * @param {Object} fullAvailability - Disponibilidad completa precargada (opcional)
   */
  _buildContextualInfo(userContext, availabilityContext, fullAvailability = null) {
    let info = "";

    // Información del paciente
    if (userContext.patient) {
      info += `PACIENTE_NOMBRE: ${userContext.patient.names} ${userContext.patient.surNames}\n`;
      info += `PACIENTE_ID: ${userContext.patient.id}\n\n`;
    }

    // Citas existentes
    if (userContext.appointments && userContext.appointments.length > 0) {
      info += `CITAS_ACTIVAS_COUNT: ${userContext.appointments.length}\n`;
      info += `CITAS_ACTIVAS:\n`;
      userContext.appointments.forEach((apt, idx) => {
        // Manejar tanto appointments de BD (con professional object) como del contexto precargado (con strings)
        let dateStr = '';
        if (apt.date_human) {
          dateStr = apt.date_human; // Ya viene formateado del contexto precargado
        } else if (apt.startTime) {
          const date = new Date(apt.startTime);
          dateStr = date.toLocaleDateString('es-ES', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
          });
        }
        
        const professionalName = apt.professional || (apt.professional?.names && apt.professional?.surNames ? `${apt.professional.names} ${apt.professional.surNames}` : 'No especificado');
        const specialty = apt.specialty || apt.professional?.specialty || 'No especificada';
        
        info += `- CITA_${idx + 1}: ID=${apt.id} | ${dateStr} | ${professionalName} | ESPECIALIDAD=${specialty}\n`;
      });
      info += "\n";
    } else {
      info += "CITAS_ACTIVAS_COUNT: 0\nCITAS_ACTIVAS: Ninguna\n\n";
    }

    // Disponibilidad específica si se detectó una especialidad
    if (availabilityContext && availabilityContext.freeSlots) {
      info += `ESPECIALIDAD_DETECTADA: ${availabilityContext.specialty}\n`;
      info += `HORARIOS_DISPONIBLES_COUNT: ${availabilityContext.freeSlots.length}\n`;
      info += `HORARIOS_DISPONIBLES:\n`;
      availabilityContext.freeSlots.forEach((slot, idx) => {
        info += `- HORARIO_${idx + 1}: SCHEDULE_ID=${slot.scheduleId} | ${slot.dateHuman} | ${slot.professionalName}\n`;
      });
      info += "\n";
    } else {
      // Si no detectamos especialidad, no forzamos un "0" (para evitar que el modelo diga "no hay" sin que se haya pedido algo).
      info += "HORARIOS_DISPONIBLES_COUNT: -1\n";
    }

    // Incluir resumen de disponibilidad completa (si está disponible)
    if (fullAvailability && typeof fullAvailability === 'object') {
      info += "\n=== DISPONIBILIDAD COMPLETA POR ESPECIALIDAD ===\n";
      info += "(Usa esta información si el usuario pregunta por otras especialidades)\n\n";
      
      Object.keys(fullAvailability).forEach(specialty => {
        const slots = fullAvailability[specialty];
        if (slots && Array.isArray(slots) && slots.length > 0) {
          info += `${specialty.toUpperCase()}: ${slots.length} horarios disponibles\n`;
          slots.slice(0, 3).forEach((slot, idx) => {
            info += `  ${idx + 1}. ${slot.date_human} - ${slot.professional}\n`;
          });
        } else {
          info += `${specialty.toUpperCase()}: Sin horarios disponibles\n`;
        }
      });
      info += "\n";
    }

    return info;
  }

  /**
   * Define las funciones que el asistente puede llamar
   */
  _getFunctionDefinitions() {
    return [
      {
        name: "agendar_cita",
        description: "Agenda una nueva cita dental para el paciente",
        parameters: {
          type: "object",
          properties: {
            scheduleId: {
              type: "number",
              description: "ID del horario de trabajo (Schedule) seleccionado"
            },
            startTime: {
              type: "string",
              description: "Fecha y hora de inicio en formato ISO 8601"
            },
            reason: {
              type: "string",
              description: "Motivo o descripción de la cita"
            }
          },
          required: ["scheduleId", "startTime"]
        }
      },
      {
        name: "confirmar_cita",
        description: "Confirma una cita que está en estado 'solicitada' cambiándola a estado 'confirmada'. Solo usar si el paciente solicita explícitamente confirmar una cita existente.",
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
      },
      {
        name: "reagendar_cita",
        description: "Reagenda una cita existente a un nuevo horario",
        parameters: {
          type: "object",
          properties: {
            appointmentId: {
              type: "number",
              description: "ID de la cita existente a reagendar"
            },
            newScheduleId: {
              type: "number",
              description: "ID del nuevo horario de trabajo"
            },
            newStartTime: {
              type: "string",
              description: "Nueva fecha y hora en formato ISO 8601"
            }
          },
          required: ["appointmentId", "newScheduleId", "newStartTime"]
        }
      },
      {
        name: "cancelar_cita",
        description: "Cancela una cita existente del paciente",
        parameters: {
          type: "object",
          properties: {
            appointmentId: {
              type: "number",
              description: "ID de la cita a cancelar"
            }
          },
          required: ["appointmentId"]
        }
      },
      {
        name: "consultar_citas",
        description: "Consulta todas las citas activas del paciente",
        parameters: {
          type: "object",
          properties: {}
        }
      }
      ,
      {
        name: "consultar_citas_por_documento",
        description: "Busca citas activas de un paciente a partir de tipo/numero de documento y nombre/apellido",
        parameters: {
          type: "object",
          properties: {
            docType: {
              type: "string",
              description: "Tipo de documento (DNI, CUIL, PASAPORTE)"
            },
            docNumber: {
              type: "string",
              description: "Número de documento"
            },
            firstName: {
              type: "string",
              description: "Nombre del paciente"
            },
            lastName: {
              type: "string",
              description: "Apellido del paciente"
            }
          },
          required: ["docType", "docNumber", "firstName", "lastName"]
        }
      }
    ];
  }

  /**
   * Ejecuta la función llamada por el asistente
   */
  async _executeFunctionCall(functionCall, userId, patientId) {
    const functionName = functionCall.name;
    const args = JSON.parse(functionCall.arguments);

    console.log(`[Function Call] ${functionName} con args:`, args);

    try {
      switch (functionName) {
        case "agendar_cita":
          return await this._agendarCita(patientId, args);
        
        case "confirmar_cita":
          return await this._confirmarCita(patientId, args);
        
        case "reagendar_cita":
          return await this._reagendarCita(patientId, args);
        
        case "cancelar_cita":
          return await this._cancelarCita(patientId, args);
        
        case "consultar_citas":
          return await this._consultarCitas(patientId);
        
        case "consultar_citas_por_documento":
          return await this._consultarCitasPorDocumento(args);
        
        default:
          return { success: false, message: "Función no reconocida" };
      }
    } catch (error) {
      console.error(`Error ejecutando ${functionName}:`, error);
      return { success: false, message: "Error al procesar la acción", error: error.message };
    }
  }

  /**
   * Agenda una nueva cita
   */
  async _agendarCita(patientId, args) {
    const { scheduleId, startTime, reason } = args;

    // Obtener información del Schedule
    const schedule = await db.Schedule.findByPk(scheduleId);
    if (!schedule) {
      return { success: false, message: "Horario no encontrado" };
    }

    // Verificar que no esté ocupado
    const existing = await db.Appointment.findOne({
      where: {
        scheduleId: scheduleId,
        startTime: new Date(startTime),
        status: { [Op.ne]: 'no asistio' }
      }
    });

    if (existing) {
      return { success: false, message: "Este horario ya está ocupado" };
    }

    // Crear la cita
    const appointment = await db.Appointment.create({
      peopleId: patientId,
      professionalId: schedule.professionalId,
      scheduleId: scheduleId,
      startTime: new Date(startTime),
      status: 'solicitada',
      reason: reason || 'Consulta dental'
    });

    return {
      success: true,
      message: "Cita agendada exitosamente",
      appointmentId: appointment.id,
      appointment: {
        id: appointment.id,
        startTime: appointment.startTime,
        status: appointment.status,
        reason: appointment.reason
      }
    };
  }

  /**
   * Confirma una cita existente (cambia de estado 'solicitada' a 'confirmada')
   */
  async _confirmarCita(patientId, args) {
    const { appointmentId } = args;

    console.log(`[_confirmarCita] Intentando confirmar cita ID=${appointmentId} para patientId=${patientId}`);

    // Verificar que la cita existe y pertenece al paciente
    const appointment = await db.Appointment.findOne({
      where: {
        id: appointmentId,
        peopleId: patientId
      },
      include: [
        {
          model: db.Professional,
          as: 'professional',
          attributes: ['names', 'surNames', 'specialty']
        }
      ]
    });

    if (!appointment) {
      return { 
        success: false, 
        message: "Cita no encontrada o no pertenece al paciente" 
      };
    }

    // Verificar que el estado actual sea 'solicitada'
    if (appointment.status !== 'solicitada') {
      return { 
        success: false, 
        message: `No se puede confirmar. La cita está en estado '${appointment.status}'. Solo se pueden confirmar citas en estado 'solicitada'.`,
        currentStatus: appointment.status
      };
    }

    // Actualizar el estado a 'confirmada'
    const previousStatus = appointment.status;
    appointment.status = 'confirmada';
    await appointment.save();

    console.log(`[_confirmarCita] ✅ Cita ID=${appointmentId} confirmada exitosamente. Estado anterior: ${previousStatus} → nuevo: confirmada`);

    return {
      success: true,
      message: "Cita confirmada exitosamente",
      appointmentId: appointment.id,
      appointment: {
        id: appointment.id,
        startTime: appointment.startTime,
        previousStatus: previousStatus,
        newStatus: 'confirmada',
        reason: appointment.reason,
        professional: appointment.professional ? 
          `${appointment.professional.names} ${appointment.professional.surNames}` : null,
        specialty: appointment.professional?.specialty || null,
        dateHuman: new Date(appointment.startTime).toLocaleString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'America/Caracas'
        })
      }
    };
  }

  /**
   * Reagenda una cita existente
   */
  async _reagendarCita(patientId, args) {
    const { appointmentId, newScheduleId, newStartTime } = args;

    // Verificar que la cita pertenece al paciente
    const appointment = await db.Appointment.findOne({
      where: {
        id: appointmentId,
        peopleId: patientId
      }
    });

    if (!appointment) {
      return { success: false, message: "Cita no encontrada o no pertenece al paciente" };
    }

    // Obtener nuevo schedule
    const newSchedule = await db.Schedule.findByPk(newScheduleId);
    if (!newSchedule) {
      return { success: false, message: "Nuevo horario no encontrado" };
    }

    // Actualizar la cita
    appointment.scheduleId = newScheduleId;
    appointment.professionalId = newSchedule.professionalId;
    appointment.startTime = new Date(newStartTime);
    await appointment.save();

    return {
      success: true,
      message: "Cita reagendada exitosamente",
      appointmentId: appointment.id
    };
  }

  /**
   * Cancela una cita
   */
  async _cancelarCita(patientId, args) {
    const { appointmentId } = args;

    const appointment = await db.Appointment.findOne({
      where: {
        id: appointmentId,
        peopleId: patientId
      }
    });

    if (!appointment) {
      return { success: false, message: "Cita no encontrada o no pertenece al paciente" };
    }

    appointment.status = 'no asistio';
    await appointment.save();

    return {
      success: true,
      message: "Cita cancelada exitosamente",
      appointmentId: appointment.id
    };
  }

  /**
   * Consulta citas del paciente
   */
  async _consultarCitas(patientId) {
    const appointments = await db.Appointment.findAll({
      where: {
        peopleId: patientId,
        status: { [Op.ne]: 'no asistio' }
      },
      include: [
        {
          model: db.Professional,
          as: 'professional',
          attributes: ['names', 'surNames', 'specialty']
        }
      ],
      order: [['startTime', 'ASC']]
    });

    return {
      success: true,
      appointments: appointments.map(apt => ({
        id: apt.id,
        date: apt.startTime,
        dateHuman: new Date(apt.startTime).toLocaleDateString('es-ES', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit'
        }),
        professional: `${apt.professional.names} ${apt.professional.surNames}`,
        specialty: apt.professional.specialty
      }))
    };
  }

  /**
   * Consulta citas del paciente a partir de tipo/número de documento y nombre/apellido
   * @param {Object} args - { docType, docNumber, firstName, lastName }
   */
  async _consultarCitasPorDocumento(args) {
    try {
      const { docType, docNumber, firstName, lastName } = args;
      const PeopleAttended = db.modules.operative.PeopleAttended;

      // Normalizar tipo de documento a los valores de la BD
      const normalizedType = (docType || '').toString().trim().toLowerCase();
      let dbDocType = null;
      if (['dni', 'cedula', 'cédula', 'ci'].includes(normalizedType)) dbDocType = 'cedula';
      else if (['cuil', 'rif'].includes(normalizedType)) dbDocType = 'rif';
      else if (['pasaporte', 'passport'].includes(normalizedType)) dbDocType = 'pasaporte';
      else if (['extranjero', 'extranjera'].includes(normalizedType)) dbDocType = 'extranjero';
      else dbDocType = 'otro';

      // Buscar persona por documento
      let person = await PeopleAttended.findOne({
        where: {
          documentType: dbDocType,
          documentId: docNumber.toString().trim()
        }
      });

      // Si no se encuentra por documento, buscar por nombre/apellido (búsqueda parcial)
      if (!person) {
        person = await PeopleAttended.findOne({
          where: {
            names: { [Op.iLike]: `%${firstName}%` },
            surNames: { [Op.iLike]: `%${lastName}%` }
          }
        });
      }

      if (!person) {
        return { success: true, appointments: [] };
      }

      // Buscar citas activas relacionadas con la persona
      const appointments = await db.Appointment.findAll({
        where: {
          peopleId: person.id,
          status: { [Op.ne]: 'no asistio' }
        },
        include: [
          {
            model: db.Professional,
            as: 'professional',
            attributes: ['names', 'surNames', 'specialty']
          }
        ],
        order: [['startTime', 'ASC']]
      });

      const mapped = appointments.map(apt => ({
        id: apt.id,
        date_iso: apt.startTime,
        date_human: new Date(apt.startTime).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        professional: apt.professional ? `${apt.professional.names} ${apt.professional.surNames}` : null,
        status: apt.status,
        reason: apt.description || null
      }));

      return { success: true, appointments: mapped };
    } catch (error) {
      console.error('[_consultarCitasPorDocumento Error]:', error);
      return { success: false, message: error.message || 'Error consultando citas por documento' };
    }
  }

  /**
   * Extrae campos de documento y nombre/apellido a partir de un array de mensajes
   * @param {Array} messages - array de { role, content }
   * @returns {Object} { docType, docNumber, firstName, lastName }
   */
  _extractDocumentFields(messages) {
    const joined = messages.map(m => m.content).join('\n');
    const result = {
      docType: null,
      docNumber: null,
      firstName: null,
      lastName: null
    };

    // Buscar tipo de documento
    const typeMatch = joined.match(/\b(DNI|CUIL|PASAPORTE|cedula|cédula|rif|extranjero)\b/i);
    if (typeMatch) result.docType = typeMatch[0];

    // Buscar número (5 a 12 dígitos, permite guiones/espacios)
    const numberMatch = joined.match(/([0-9]{5,12})/);
    if (numberMatch) result.docNumber = numberMatch[0];

    // Buscar nombre y apellido (dos palabras consecutivas con letras)
    const nameMatch = joined.match(/([A-Za-zÁÉÍÓÚáéíóúÑñ]{2,}\s+[A-Za-zÁÉÍÓÚáéíóúÑñ]{2,})/);
    if (nameMatch) {
      const parts = nameMatch[0].trim().split(/\s+/);
      result.firstName = parts[0];
      result.lastName = parts.slice(1).join(' ');
    }

    return result;
  }

  /**
   * Determina si una acción requiere confirmación del usuario
   */
  _requiresConfirmation(functionName) {
    return ['cancelar_cita', 'reagendar_cita'].includes(functionName);
  }

  /**
   * Limpia el historial de conversación de un usuario
   */
  clearConversationHistory(userId) {
    const conversationKey = `user_${userId}`;
    this.conversationMemory.delete(conversationKey);
  }

  /**
   * Establece contexto inicial para una conversación (pre-cargado en login)
   * @param {number} userId
   * @param {Object} context - { patient, appointments, availability }
   */
  setInitialContext(userId, context) {
    const conversationKey = `user_${userId}`;
    // Limpiar historial previo para partir fresco con el nuevo contexto
    this.conversationMemory.delete(conversationKey);
    // Establecer nuevo contexto
    const convoState = { initialContext: context };
    this.conversationState.set(conversationKey, convoState);
    console.log('==========================================');
    console.log(`[ChatIA setInitialContext] Usuario ${userId}`);
    console.log(`[ChatIA setInitialContext] Paciente:`, context.patient?.names, context.patient?.surNames);
    console.log(`[ChatIA setInitialContext] Citas: ${context.appointments?.length || 0}`);
    if (context.appointments && context.appointments.length > 0) {
      context.appointments.forEach((apt, idx) => {
        console.log(`  ${idx + 1}. ID=${apt.id} | ${apt.date_human} | ${apt.professional} | ${apt.status}`);
      });
    }
    console.log(`[ChatIA setInitialContext] Availability:`, Object.keys(context.availability || {}).length, 'especialidades');
    console.log('==========================================');
  }
}

module.exports = new ConversationalAssistantService();

