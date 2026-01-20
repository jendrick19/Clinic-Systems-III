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
      let convoState = this.conversationState.get(conversationKey) || {};

      // ELIMINADO: Ya no interceptamos patrones específicos.
      // Dejamos que el modelo de IA procese TODOS los mensajes usando el contexto precargado.

      // 2. Obtener contexto del usuario - PRIORIZAR CONTEXTO PRECARGADO
      let userContext = null;
      let availabilityContext = null;
      let fullAvailability = null;

      // Si existe contexto inicial precargado, usarlo EXCLUSIVAMENTE (no hacer consultas)
      if (convoState.initialContext) {
        console.log('[ChatIA] Usando contexto precargado para usuario', userId);

        // Determinar rol del usuario
        const isProfessional = convoState.initialContext.role === 'professional';

        console.log('[ChatIA DEBUG] ===== VERIFICACIÓN DE ROL =====');
        console.log('[ChatIA DEBUG] convoState.initialContext.role:', convoState.initialContext.role);
        console.log('[ChatIA DEBUG] isProfessional:', isProfessional);
        console.log('[ChatIA DEBUG] userData:', convoState.initialContext.userData);
        console.log('[ChatIA DEBUG] ================================');

        userContext = {
          role: convoState.initialContext.role || 'patient',
          isProfessional: isProfessional,
          userData: convoState.initialContext.userData, // Profesional o Paciente
          patient: convoState.initialContext.patient, // Solo si es paciente
          appointments: convoState.initialContext.appointments || [],
          schedules: convoState.initialContext.schedules || []
        };

        // Guardar la disponibilidad completa para incluirla en el contexto
        fullAvailability = convoState.initialContext.availability;

        // Extraer disponibilidad del contexto precargado basándose en la especialidad mencionada
        availabilityContext = this._extractAvailabilityFromPreloaded(
          userMessage,
          convoState.initialContext.availability,
          userContext
        );
      } else {
        // Solo si NO hay contexto precargado, hacer consultas
        console.log('[ChatIA] No hay contexto precargado, consultando BD para usuario', userId);
        userContext = await this._getUserContext(userId, patientId);
        availabilityContext = await this._getAvailabilityContext(userMessage, userContext);
      }

      // 4. Guardar las opciones disponibles en el estado de la conversación
      if (availabilityContext && availabilityContext.freeSlots && availabilityContext.freeSlots.length > 0) {
        convoState.lastShownOptions = availabilityContext.freeSlots.map((slot, idx) => ({
          optionNumber: idx + 1,
          scheduleId: slot.scheduleId,
          startTime: slot.startTime_iso || slot.startTime,  // Usar el string ISO/MySQL directamente
          dateHuman: slot.dateHuman,
          professional: slot.professionalName,
          specialty: availabilityContext.specialty
        }));
        this.conversationState.set(conversationKey, convoState);
        console.log('[ChatIA] Opciones guardadas en estado:', convoState.lastShownOptions);
      }

      // 5. Construir el contexto completo (con reglas anti-contradicción)
      const contextualInfo = this._buildContextualInfo(userContext, availabilityContext, fullAvailability, convoState.lastShownOptions);

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
      // Determinar qué prompt usar según el rol
      let activePrompt = this.systemPrompt; // Prompt de paciente por defecto

      if (userContext.isProfessional) {
        // Cargar prompt específico para profesionales
        const professionalPromptPath = path.join(__dirname, '../prompts/PromptProfesional.md');
        console.log('[ChatIA DEBUG] Intentando cargar prompt profesional desde:', professionalPromptPath);
        console.log('[ChatIA DEBUG] Archivo existe?:', fs.existsSync(professionalPromptPath));
        if (fs.existsSync(professionalPromptPath)) {
          activePrompt = fs.readFileSync(professionalPromptPath, 'utf-8');
          console.log('[ChatIA] ✅ Usando prompt de PROFESIONAL');
          console.log('[ChatIA DEBUG] Primeras 200 caracteres del prompt:', activePrompt.substring(0, 200));
        } else {
          console.log('[ChatIA ERROR] ❌ No se encontró el archivo PromptProfesional.md');
        }
      } else {
        console.log('[ChatIA] Usando prompt de PACIENTE (María)');
      }

      const strictAvailabilityRules = `
REGLAS ESTRICTAS (MUY IMPORTANTE):
- SOLO usa la información del CONTEXTO ACTUAL que se te proporciona abajo.
- NO inventes disponibilidad ni citas que no estén en el contexto.
- Si CITAS_ACTIVAS_COUNT > 0, ${userContext.isProfessional ? 'el doctor' : 'el paciente'} SÍ tiene citas. Muéstralas exactamente como aparecen.
- Si CITAS_ACTIVAS_COUNT = 0, ${userContext.isProfessional ? 'el doctor' : 'el paciente'} NO tiene citas activas.
- El CONTEXTO ACTUAL ya contiene TODA la información. NO necesitas hacer consultas adicionales.
${userContext.isProfessional ? `
- Eres el ASISTENTE PERSONAL del doctor, no María la secretaria.
- Usa un tono profesional, ejecutivo y directo.
- Al saludar, di: "Hola Dr. [nombre del DOCTOR_NOMBRE], ¿necesita revisar su agenda?"
- NO inventes nombres, usa EXACTAMENTE el nombre que aparece en DOCTOR_NOMBRE.
` : `
- Si en el contexto aparece HORARIOS_DISPONIBLES_COUNT mayor que 0, entonces SÍ hay disponibilidad.
  En ese caso, está PROHIBIDO decir "no hay horarios" o frases equivalentes.
- Si HORARIOS_DISPONIBLES_COUNT es 0 (y el usuario pidió una especialidad), entonces di que no hay para esa especialidad
  y ofrece alternativas (otra fecha/otro doctor/otra especialidad).
- Recomienda MÁXIMO 3 horarios y SOLO los que aparecen listados en HORARIOS_DISPONIBLES.
`}
`;

      const messages = [
        {
          role: "system",
          content: `${activePrompt}\n\n${strictAvailabilityRules}\n\nCONTEXTO ACTUAL (DATOS REALES):\n${contextualInfo}`
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
          patientId,
          userContext.isProfessional ? 'professional' : 'patient'
        );

        console.log(`[ChatIA] Resultado de función:`, JSON.stringify(actionResult, null, 2));

        // Si se agendó una cita exitosamente, limpiar las opciones guardadas
        if (assistantMessage.function_call.name === 'agendar_cita' && actionResult && actionResult.success) {
          convoState.lastShownOptions = null;
          this.conversationState.set(conversationKey, convoState);
          console.log('[ChatIA] Opciones limpiadas del estado después de agendar exitosamente');
        }

        // Si la función fue exitosa, generar una respuesta contextualizada
        if (actionResult && actionResult.success) {
          // Agregar el resultado de la función al contexto
          conversationHistory.push(
            { role: "user", content: userMessage },
            { role: "assistant", content: assistantMessage.content || '', function_call: assistantMessage.function_call },
            {
              role: "function",
              name: assistantMessage.function_call.name,
              content: JSON.stringify(actionResult)
            }
          );

          // Reconstruir contexto actualizado después de la acción
          const updatedContext = this._buildContextualInfo(userContext, availabilityContext, fullAvailability, convoState.lastShownOptions);

          // Hacer una segunda llamada a OpenAI para generar respuesta apropiada
          const followUpMessages = [
            {
              role: "system",
              content: `${this.systemPrompt}\n\n${strictAvailabilityRules}\n\nCONTEXTO ACTUAL (DATOS REALES):\n${updatedContext}`
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
        requiresConfirmation: this._requiresConfirmation(assistantMessage.function_call?.name),
        appointmentChanged: ['agendar_cita', 'cancelar_cita', 'reagendar_cita', 'confirmar_cita', 'completar_cita'].includes(assistantMessage.function_call?.name) && actionResult?.success,
        fullAvailability: fullAvailability  // Agregar disponibilidad completa para el modal
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
  _extractAvailabilityFromPreloaded(userMessage, preloadedAvailability, userContext = null) {
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

    let finalSpecialty = mentionedSpecialty;

    // Si no se menciona especialidad, pero el usuario es profesional, usar su propia especialidad
    if (!finalSpecialty && userContext && userContext.isProfessional && userContext.userData?.specialty) {
      console.log('[ChatIA] Usando especialidad del doctor:', userContext.userData.specialty);
      // Intentar normalizar o buscar coincidencia flexible
      const docSpecialty = userContext.userData.specialty.toLowerCase();
      // Buscar si alguna key de preloadedAvailability coincide parcialmente
      if (preloadedAvailability) {
        const key = Object.keys(preloadedAvailability).find(k => k.toLowerCase().includes(docSpecialty) || docSpecialty.includes(k.toLowerCase()));
        if (key) finalSpecialty = key;
        else finalSpecialty = userContext.userData.specialty;
      } else {
        finalSpecialty = userContext.userData.specialty;
      }
    }

    if (!finalSpecialty) {
      console.log('[ChatIA] No se detectó especialidad en el mensaje ni por contexto de doctor');
      return null;
    }

    // Buscar en la disponibilidad precargada
    const slots = preloadedAvailability[finalSpecialty] || preloadedAvailability[Object.keys(preloadedAvailability).find(k => k.toLowerCase() === finalSpecialty.toLowerCase())];

    if (!slots || slots.length === 0) {
      console.log(`[ChatIA] No hay slots disponibles para ${finalSpecialty}`);
      return {
        specialty: finalSpecialty,
        freeSlots: []
      };
    }

    console.log(`[ChatIA] Encontrados ${slots.length} slots precargados para ${finalSpecialty}`);

    // Convertir formato del contexto precargado al formato esperado
    const freeSlots = slots.map(slot => ({
      scheduleId: slot.scheduleId,
      professionalId: slot.professionalId,
      professionalName: slot.professional || 'Doctor',
      startTime_iso: slot.startTime_iso || slot.date_iso,  // Usar el string directamente
      startTime: slot.startTime_iso || slot.date_iso,  // Para compatibilidad
      dateHuman: slot.date_human
    }));

    return {
      specialty: finalSpecialty,
      freeSlots: freeSlots  // Mostrar TODOS los slots disponibles
    };
  }

  /**
   * Obtiene contexto de disponibilidad si el usuario menciona especialidad
   */
  async _getAvailabilityContext(userMessage, userContext = null) {
    const lowerMessage = userMessage.toLowerCase();

    const KNOWN_SPECIALTIES = [
      'odontología general', 'ortodoncia', 'endodoncia', 'periodoncia',
      'odontopediatría', 'cirugía oral', 'prótesis', 'implantología', 'estética'
    ];

    let mentionedSpecialty = KNOWN_SPECIALTIES.find(s =>
      lowerMessage.includes(s.toLowerCase())
    );

    // Si es profesional y no menciona especialidad, usar la suya
    if (!mentionedSpecialty && userContext && userContext.isProfessional && userContext.userData?.specialty) {
      console.log('[getAvailability] User es profesional, usando su especialidad por defecto:', userContext.userData.specialty);
      mentionedSpecialty = userContext.userData.specialty;
    }

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
      console.log(`[getAvailability] Buscando schedules para profesionales: ${professionalIds.join(', ')}`);
      const schedules = await db.Schedule.findAll({
        where: {
          professionalId: { [Op.in]: professionalIds },
          status: 'abierta',
          startTime: { [Op.gt]: new Date() }
        },
        order: [['startTime', 'ASC']],
        limit: 15
      });

      console.log(`[getAvailability] Schedules encontrados: ${schedules.length}`);
      schedules.forEach((s, idx) => {
        console.log(`  Schedule ${idx + 1}: ID=${s.id}, Start=${s.startTime}, End=${s.endTime}, Prof=${s.professionalId}`);
      });

      // Obtener citas ya agendadas
      const takenAppointments = await db.Appointment.findAll({
        where: {
          professionalId: { [Op.in]: professionalIds },
          status: { [Op.not]: 'cancelada' },
          startTime: { [Op.gte]: new Date() }
        }
      });

      console.log(`[getAvailability] Citas ocupadas encontradas: ${takenAppointments.length}`);
      takenAppointments.forEach((app, idx) => {
        console.log(`  Cita ${idx + 1}: ID=${app.id}, Start=${app.startTime}, Prof=${app.professionalId}, Status=${app.status}`);
      });

      // Generar slots libres
      const freeSlots = this._generateFreeSlots(schedules, takenAppointments, professionals);

      return {
        specialty: mentionedSpecialty,
        freeSlots: freeSlots.slice(0, 48) // Enviar hasta 48 slots para que el agente vea el rango completo de disponibilidad
        // El agente decidirá cuáles 3 mostrar al paciente
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

    console.log('[_generateFreeSlots] Generando slots libres...');
    console.log(`[_generateFreeSlots] Total schedules recibidos: ${schedules.length}`);
    console.log(`[_generateFreeSlots] Total citas ocupadas: ${takenAppointments.length}`);

    for (const schedule of schedules) {
      // Trabajar directamente con el objeto Date de Sequelize usando componentes UTC
      let currentTime = getUTCDateFromSequelize(schedule.startTime);
      const endTime = getUTCDateFromSequelize(schedule.endTime);

      console.log(`\n[_generateFreeSlots] Procesando Schedule ID: ${schedule.id}`);
      console.log(`  - Professional ID: ${schedule.professionalId}`);
      console.log(`  - Start Time original BD: ${schedule.startTime} -> UTC: ${formatDateWithoutTimezone(currentTime)}`);
      console.log(`  - End Time original BD: ${schedule.endTime} -> UTC: ${formatDateWithoutTimezone(endTime)}`);

      const diffHours = (endTime.getTime() - currentTime.getTime()) / (1000 * 60 * 60);
      console.log(`  - Duración total: ${diffHours.toFixed(2)} horas`);
      console.log(`  - Slots posibles: ${Math.floor(diffHours * 2)}`);

      let slotsGeneratedForSchedule = 0;
      let slotsBlockedForSchedule = 0;

      while (currentTime.getTime() < endTime.getTime()) {
        const slotEnd = new Date(currentTime.getTime() + SLOT_DURATION * 60000);
        if (slotEnd.getTime() > endTime.getTime()) break;

        // Verificar si está ocupado
        const isTaken = takenAppointments.some(app => {
          if (!app.startTime || app.professionalId !== schedule.professionalId) return false;
          const appointmentTime = getUTCDateFromSequelize(app.startTime);
          const timeDiff = Math.abs(appointmentTime.getTime() - currentTime.getTime());
          return timeDiff < 60000;
        });

        if (!isTaken) {
          freeSlots.push({
            scheduleId: schedule.id,
            professionalId: schedule.professionalId,
            professionalName: profMap[schedule.professionalId] || "Doctor",
            startTime: new Date(currentTime),
            dateHuman: formatDateHumanWithoutTimezone(currentTime)
          });
          slotsGeneratedForSchedule++;
        } else {
          slotsBlockedForSchedule++;
        }

        currentTime = new Date(currentTime.getTime() + SLOT_DURATION * 60000);
      }

      console.log(`  - Slots libres generados: ${slotsGeneratedForSchedule}`);
      console.log(`  - Slots bloqueados: ${slotsBlockedForSchedule}`);
    }

    console.log(`\n[_generateFreeSlots] ✅ Total slots libres generados: ${freeSlots.length}`);
    return freeSlots;
  }

  /**
   * Construye información contextual para el prompt
   * @param {Object} userContext - Contexto del usuario { patient, appointments }
   * @param {Object} availabilityContext - Contexto de disponibilidad { specialty, freeSlots }
   * @param {Object} fullAvailability - Disponibilidad completa precargada (opcional)
   * @param {Array} lastShownOptions - Últimas opciones mostradas al paciente (opcional)
   */
  _buildContextualInfo(userContext, availabilityContext, fullAvailability = null, lastShownOptions = null) {
    let info = "";

    // Información del usuario según su rol
    if (userContext.isProfessional && userContext.userData) {
      // === CONTEXTO PARA PROFESIONAL ===
      info += `ROL_USUARIO: PROFESIONAL (DOCTOR)\n`;
      info += `DOCTOR_NOMBRE: ${userContext.userData.names} ${userContext.userData.surNames}\n`;
      info += `DOCTOR_ID: ${userContext.userData.id}\n\n`;
    } else if (userContext.patient) {
      // === CONTEXTO PARA PACIENTE ===
      info += `PACIENTE_NOMBRE: ${userContext.patient.names} ${userContext.patient.surNames}\n`;
      info += `PACIENTE_ID: ${userContext.patient.id}\n\n`;
    }

    // Citas existentes
    if (userContext.appointments && userContext.appointments.length > 0) {
      info += `CITAS_ACTIVAS_COUNT: ${userContext.appointments.length}\n`;

      if (userContext.isProfessional) {
        info += `TU AGENDA (CITAS CON PACIENTES):\n`;
      } else {
        info += `CITAS_ACTIVAS:\n`;
      }

      userContext.appointments.forEach((apt, idx) => {
        // Manejar tanto appointments de BD (con professional object) como del contexto precargado (con strings)
        let dateStr = '';
        if (apt.date_human) {
          dateStr = apt.date_human; // Ya viene formateado del contexto precargado
        } else if (apt.startTime) {
          const date = getUTCDateFromSequelize(apt.startTime);
          dateStr = formatDateHumanWithoutTimezone(date);
        }

        if (userContext.isProfessional) {
          // Para profesional: mostrar nombre del paciente
          const patientName = apt.patientName || 'Paciente';
          info += `- CITA_${idx + 1}: ID=${apt.id} | ${dateStr} | PACIENTE: ${patientName} | ESTADO: ${apt.status}\n`;
        } else {
          // Para paciente: mostrar nombre del doctor
          const professionalName = apt.professional || (apt.professional?.names && apt.professional?.surNames ? `${apt.professional.names} ${apt.professional.surNames}` : 'No especificado');
          const specialty = apt.specialty || apt.professional?.specialty || 'No especificada';
          info += `- CITA_${idx + 1}: ID=${apt.id} | ${dateStr} | ${professionalName} | ESPECIALIDAD=${specialty}\n`;
        }
      });
      info += "\n";
    } else {
      info += "CITAS_ACTIVAS_COUNT: 0\nCITAS_ACTIVAS: Ninguna\n\n";
    }

    // Disponibilidad específica si se detectó una especialidad
    if (availabilityContext && availabilityContext.freeSlots) {
      info += `ESPECIALIDAD_DETECTADA: ${availabilityContext.specialty}\n`;
      info += `HORARIOS_DISPONIBLES_COUNT: ${availabilityContext.freeSlots.length}\n`;
      const slots = availabilityContext.freeSlots;

      // Lógica para mostrar rango correcto (ej. si cierra a las 3pm, el último turno es 2:30pm)
      if (slots.length > 0) {
        const firstSlot = slots[0];
        const lastSlot = slots[slots.length - 1];
        info += `\nRESUMEN_AGENDA:\n`;
        info += `  - PRIMER_TURNO_DISPONIBLE: ${firstSlot.dateHuman}\n`;
        info += `  - ÚLTIMO_TURNO_DISPONIBLE: ${lastSlot.dateHuman}\n`;
        info += `  (Dile al usuario que tienes turnos desde ${firstSlot.dateHuman.split(',')[1]} hasta ${lastSlot.dateHuman.split(',')[1]})\n`;
      }

      info += `\nLISTA_COMPLETA_HORARIOS (Busca aquí si el usuario pide una hora específica):\n`;

      slots.forEach((slot, idx) => {
        info += `- OPCION_${idx + 1}: [ID:${slot.scheduleId}] -> ${formatDateHumanWithoutTimezone(slot.startTime)}\n`;
      });

      info += "\n⚠️ INSTRUCCIÓN: Si el usuario pide una hora (ej: 2pm) y no está en la lista exacta, ofrece la más cercana de la lista anterior (ej: 2:30pm).\n";
      info += "⚠️ Cuando el paciente elija una opción, llama a agendar_cita inmediatamente.\n\n";
    } else {
      // Si no detectamos especialidad, no forzamos un "0" (para evitar que el modelo diga "no hay" sin que se haya pedido algo).
      info += "HORARIOS_DISPONIBLES_COUNT: -1\n";
    }

    // Incluir opciones mostradas previamente (si existen)
    if (lastShownOptions && lastShownOptions.length > 0) {
      info += "\n=== OPCIONES QUE MOSTRASTE RECIENTEMENTE AL PACIENTE ===\n";
      info += "⚠️ El paciente puede referirse a estas opciones. Si dice 'sí', 'la primera', 'esa', etc., se refiere a una de estas:\n\n";
      lastShownOptions.forEach(opt => {
        info += `OPCION_${opt.optionNumber}:\n`;
        info += `  SCHEDULE_ID: ${opt.scheduleId}\n`;
        info += `  START_TIME_ISO: ${opt.startTime}\n`;
        info += `  FECHA_LEGIBLE: ${opt.dateHuman}\n`;
        info += `  PROFESIONAL: ${opt.professional}\n`;
        info += `  ESPECIALIDAD: ${opt.specialty}\n`;
      });
      info += "\n🔴 Si el usuario confirma alguna opción, llama a agendar_cita con el SCHEDULE_ID y START_TIME_ISO correspondiente.\n\n";
    }

    // Incluir resumen de disponibilidad completa (si está disponible)
    if (fullAvailability && typeof fullAvailability === 'object') {
      info += "\n=== DISPONIBILIDAD COMPLETA POR ESPECIALIDAD ===\n";
      info += "(Usa esta información si el usuario pregunta por otras especialidades)\n\n";

      Object.keys(fullAvailability).forEach(specialty => {
        const slots = fullAvailability[specialty];
        if (slots && Array.isArray(slots) && slots.length > 0) {
          info += `${specialty.toUpperCase()}: ${slots.length} horarios disponibles\n`;
          slots.forEach((slot, idx) => {  // Mostrar TODOS los slots, no solo 3
            info += `  OPCION_${idx + 1}:\n`;
            info += `    SCHEDULE_ID: ${slot.scheduleId}\n`;
            info += `    START_TIME_ISO: ${slot.startTime_iso || slot.date_iso}\n`;
            info += `    END_TIME_ISO: ${slot.endTime_iso}\n`;
            info += `    HORARIO_COMPLETO: ${slot.startTime_human || slot.date_human} hasta ${slot.endTime_human}\n`;
            info += `    FECHA_LEGIBLE: ${slot.date_human}\n`;
            info += `    PROFESIONAL: ${slot.professional}\n`;
          });
        } else {
          info += `${specialty.toUpperCase()}: Sin horarios disponibles\n`;
        }
      });
      info += "\n⚠️ Cuando el paciente elija una opción, usa el SCHEDULE_ID y START_TIME_ISO correspondiente para llamar a agendar_cita.\n\n";
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
        description: "Agenda una nueva cita dental para el paciente. ÚSALA cuando el paciente confirme que desea agendar uno de los horarios disponibles que le mostraste. Frases como 'sí', 'la primera', 'esa', 'la opción 2', 'el segundo horario', etc., indican que quiere agendar. Debes extraer el scheduleId y startTime del horario que eligió de las opciones que le mostraste previamente.",
        parameters: {
          type: "object",
          properties: {
            scheduleId: {
              type: "number",
              description: "ID del horario de trabajo (Schedule) seleccionado por el paciente de las opciones mostradas"
            },
            startTime: {
              type: "string",
              description: "Fecha y hora de inicio en formato ISO 8601 del horario seleccionado"
            },
            reason: {
              type: "string",
              description: "Motivo o especialidad de la cita (ej: 'Ortodoncia', 'Limpieza dental')"
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
      },
      {
        name: "consultar_mi_agenda",
        description: "Consulta la agenda del doctor (sus citas con pacientes). SOLO usar si el usuario es un PROFESIONAL/DOCTOR.",
        parameters: {
          type: "object",
          properties: {}
        }
      },
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
      },
      {
        name: "completar_cita",
        description: "Marca una cita como completada/cumplida. Solo para el doctor.",
        parameters: {
          type: "object",
          properties: {
            appointmentId: { type: "integer", description: "ID de la cita a completar" }
          },
          required: ["appointmentId"]
        }
      }
    ];
  }

  /**
   * Ejecuta la función llamada por el asistente
   */
  async _executeFunctionCall(functionCall, userId, patientId, role = 'patient') {
    const functionName = functionCall.name;
    const args = JSON.parse(functionCall.arguments);

    console.log(`[Function Call] ${functionName} con args:`, args, `(Role: ${role})`);

    try {
      switch (functionName) {
        case "agendar_cita":
          return await this._agendarCita(patientId, args, userId, role);

        case "confirmar_cita":
          return await this._confirmarCita(patientId, args, userId, role);

        case "completar_cita":
          return await this._completarCita(patientId, args, userId, role);

        case "reagendar_cita":
          return await this._reagendarCita(patientId, args, userId, role);

        case "cancelar_cita":
          return await this._cancelarCita(patientId, args, userId, role);

        case "consultar_citas":
          return await this._consultarCitas(patientId, userId, role);

        case "consultar_mi_agenda":
          return await this._consultarAgendaDoctor(patientId); // Este es exclusivo de doctores

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
   * Agenda una nueva cita con validaciones completas
   * @param {number} patientId - ID del paciente
   * @param {Object} args - Argumentos de la función { scheduleId, startTime, reason }
   * @param {number} userId - ID del usuario de sistema (opcional)
   */
  async _agendarCita(patientId, args, userId = null) {
    const { scheduleId, startTime, reason } = args;

    console.log('========== INICIO _agendarCita ==========');
    console.log(`[_agendarCita] patientId: ${patientId}, userId: ${userId || 'N/A'}`);
    console.log(`[_agendarCita] args:`, JSON.stringify(args, null, 2));

    try {
      // 1. Obtener información del Schedule con includes necesarios
      const schedule = await db.Schedule.findByPk(scheduleId, {
        include: [
          {
            model: db.Professional,
            as: 'professional',
            attributes: ['id', 'names', 'surNames', 'specialty']
          }
        ]
      });

      if (!schedule) {
        console.error('[_agendarCita] Schedule no encontrado:', scheduleId);
        return { success: false, message: "Horario no encontrado" };
      }

      console.log('[_agendarCita] Schedule encontrado:', {
        id: schedule.id,
        professionalId: schedule.professionalId,
        unitId: schedule.unitId,
        status: schedule.status,
        startTime: schedule.startTime,
        endTime: schedule.endTime
      });

      // 2. Verificar que el Schedule esté en estado 'abierta'
      if (schedule.status !== 'abierta') {
        return {
          success: false,
          message: `El horario no está disponible (estado: ${schedule.status})`
        };
      }

      // SOLUCIÓN: Extraer hora directamente sin conversiones de zona horaria
      const extractTimeFromISO = (dateInput) => {
        const str = String(dateInput);

        // Intentar varios formatos:
        // 1. ISO: "2026-01-25T13:00:00.000Z"
        let match = str.match(/T(\d{2}):(\d{2})/);
        if (match) {
          return { hours: parseInt(match[1]), minutes: parseInt(match[2]) };
        }

        // 2. MySQL: "2026-01-25 13:00:00"
        match = str.match(/(\d{4}-\d{2}-\d{2})\s+(\d{2}):(\d{2})/);
        if (match) {
          return { hours: parseInt(match[2]), minutes: parseInt(match[3]) };
        }

        // 3. JavaScript Date toString: "Sun Jan 25 2026 09:00:00 GMT-0400"
        // En este caso, usar getHours() y getMinutes() del objeto Date
        if (dateInput instanceof Date) {
          return { hours: dateInput.getHours(), minutes: dateInput.getMinutes() };
        }

        // 4. Intentar crear un Date y extraer
        try {
          const d = new Date(dateInput);
          if (!isNaN(d.getTime())) {
            return { hours: d.getHours(), minutes: d.getMinutes() };
          }
        } catch (e) {
          console.error('[extractTimeFromISO] Error:', e);
        }

        return null;
      };

      const requestedTime = extractTimeFromISO(startTime);
      const scheduleStartTime = extractTimeFromISO(schedule.startTime);
      const scheduleEndTime = extractTimeFromISO(schedule.endTime);

      console.log('[_agendarCita] Comparación de horarios (extrayendo del ISO):');
      console.log('  - Hora solicitada:', requestedTime);
      console.log('  - Rango del schedule:', scheduleStartTime, 'hasta', scheduleEndTime);
      console.log('  - startTime original:', startTime);
      console.log('  - schedule.startTime original:', schedule.startTime);

      if (!requestedTime || !scheduleStartTime || !scheduleEndTime) {
        return {
          success: false,
          message: 'Error al procesar las horas. Por favor intenta nuevamente.'
        };
      }

      // Convertir a minutos totales para comparar fácilmente
      const requestedMinutes = requestedTime.hours * 60 + requestedTime.minutes;
      const scheduleStartMinutes = scheduleStartTime.hours * 60 + scheduleStartTime.minutes;
      const scheduleEndMinutes = scheduleEndTime.hours * 60 + scheduleEndTime.minutes;
      const requestedEndMinutes = requestedMinutes + 30; // Duración de 30 minutos

      // 3. Verificar que el horario solicitado está dentro del rango del Schedule
      if (requestedMinutes < scheduleStartMinutes || requestedEndMinutes > scheduleEndMinutes) {
        return {
          success: false,
          message: `El horario solicitado (${requestedTime.hours}:${String(requestedTime.minutes).padStart(2, '0')}) está fuera del rango de la agenda (${scheduleStartTime.hours}:${String(scheduleStartTime.minutes).padStart(2, '0')} - ${scheduleEndTime.hours}:${String(scheduleEndTime.minutes).padStart(2, '0')})`
        };
      }

      // Crear objetos Date para las validaciones de solapamiento (usando new Date directamente)
      const requestedStartTime = new Date(startTime);
      const SLOT_DURATION = 30; // minutos
      const requestedEndTime = new Date(requestedStartTime.getTime() + SLOT_DURATION * 60000);

      // 4. Verificar que no haya solapamiento con citas del mismo paciente
      const patientOverlap = await this._checkPatientAppointmentOverlap(
        patientId,
        requestedStartTime,
        requestedEndTime
      );

      if (patientOverlap) {
        return {
          success: false,
          message: `Ya tienes una cita programada en este horario: ${formatDateWithoutTimezone(getUTCDateFromSequelize(patientOverlap.startTime))} con ${patientOverlap.professionalName}`,
          conflictingAppointment: {
            id: patientOverlap.id,
            startTime: patientOverlap.startTime,
            professional: patientOverlap.professionalName
          }
        };
      }

      // 5. Verificar que no haya solapamiento con citas de otros usuarios en el mismo profesional
      const professionalOverlap = await this._checkProfessionalAppointmentOverlap(
        schedule.professionalId,
        requestedStartTime,
        requestedEndTime
      );

      if (professionalOverlap) {
        return {
          success: false,
          message: `Este horario con ${schedule.professional.names} ${schedule.professional.surNames} ya está ocupado por otra cita`,
          suggestedAction: "Elige otro horario disponible"
        };
      }

      // 6. Validar que el Schedule tenga unitId
      if (!schedule.unitId) {
        console.error('[_agendarCita] El Schedule no tiene unitId asignado:', scheduleId);
        // Intentar obtener un unitId por defecto
        const defaultUnit = await db.CareUnit.findOne({
          where: { status: true },
          order: [['id', 'ASC']]
        });

        if (!defaultUnit) {
          return {
            success: false,
            message: "Error de configuración: No hay unidades de atención disponibles. Contacta al administrador."
          };
        }

        schedule.unitId = defaultUnit.id;
        console.log('[_agendarCita] Usando unitId por defecto:', defaultUnit.id);
      }

      // 7. Crear la cita con todos los datos necesarios
      // Convertir a formato MySQL sin conversiones de zona horaria
      const toMySQLFormat = (isoString) => {
        console.log('[toMySQLFormat] Input:', isoString);
        // Extraer fecha y hora del ISO string
        // "2026-01-25T13:00:00-04:00" -> "2026-01-25 13:00:00"
        const match = String(isoString).match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
        if (match) {
          const result = `${match[1]}-${match[2]}-${match[3]} ${match[4]}:${match[5]}:${match[6]}`;
          console.log('[toMySQLFormat] Output (matched):', result);
          return result;
        }
        // Fallback: usar el string tal cual si ya está en formato MySQL
        const result = String(isoString).replace('T', ' ').split('.')[0].split('-04:00')[0].split('Z')[0];
        console.log('[toMySQLFormat] Output (fallback):', result);
        return result;
      };

      // Calcular endTime sumando 30 minutos al startTime
      const calculateEndTime = (startTimeISO) => {
        // Regex para soportar tanto "T" como espacio
        const match = String(startTimeISO).match(/(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/);
        if (match) {
          const [, year, month, day, hours, minutes] = match;
          let endHour = parseInt(hours);
          let endMin = parseInt(minutes) + 30;
          if (endMin >= 60) {
            endHour += 1;
            endMin -= 60;
          }
          return `${year}-${month}-${day}T${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}:00-04:00`;
        }
        return startTimeISO; // Fallback
      };

      const startTimeMySQL = toMySQLFormat(startTime);
      const endTimeISO = calculateEndTime(startTime);
      const endTimeMySQL = toMySQLFormat(endTimeISO);

      console.log('[_agendarCita] Tiempos calculados:');
      console.log('  - startTime original:', startTime);
      console.log('  - startTime MySQL:', startTimeMySQL);
      console.log('  - endTime ISO:', endTimeISO);
      console.log('  - endTime MySQL:', endTimeMySQL);

      const appointmentData = {
        peopleId: patientId,
        professionalId: schedule.professionalId,
        scheduleId: scheduleId,
        unitId: schedule.unitId,
        startTime: startTimeMySQL,
        endTime: endTimeMySQL,
        status: 'solicitada',
        reason: reason || 'Consulta dental',
        channel: 'presencial'
      };

      console.log('[_agendarCita] Creando Appointment con datos:', JSON.stringify(appointmentData, null, 2));

      const appointment = await db.Appointment.create(appointmentData);

      // 8. Crear registro en el historial
      await db.AppointmentHistory.create({
        appointmentId: appointment.id,
        oldStatus: null,
        newStatus: 'solicitada',
        oldStartTime: null,
        newStartTime: requestedStartTime,
        oldEndTime: null,
        newEndTime: requestedEndTime,
        changeReason: 'Cita creada por asistente virtual',
        changedAt: new Date()
      });

      console.log(`[_agendarCita] ✅ Cita ID=${appointment.id} creada exitosamente para paciente ${patientId}`);
      console.log('========== FIN _agendarCita (ÉXITO) ==========');

      // Refrescar el contexto de la IA con las citas actualizadas
      console.log(`[ChatIA _agendarCita] Iniciando actualización de contexto para userId=${userId || 'N/A'}, patientId=${patientId}`);
      await this._refreshUserContext(userId, patientId);

      // 9. Retornar información completa de la cita creada
      return {
        success: true,
        message: "Cita agendada exitosamente",
        appointmentId: appointment.id,
        appointment: {
          id: appointment.id,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          status: appointment.status,
          reason: appointment.reason,
          professional: schedule.professional ?
            `${schedule.professional.names} ${schedule.professional.surNames}` : null,
          specialty: schedule.professional?.specialty || null,
          dateHuman: formatDateHumanWithoutTimezone(startTimeMySQL)  // Usar el string MySQL
        }
      };

    } catch (error) {
      console.error('[_agendarCita ERROR]:', error);
      console.error('[_agendarCita ERROR Stack]:', error.stack);

      // Si es un error de validación de Sequelize, extraer detalles
      if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeDatabaseError') {
        console.error('[_agendarCita ERROR Details]:', JSON.stringify(error.errors || error, null, 2));
      }

      return {
        success: false,
        message: "Error al crear la cita. Por favor intenta nuevamente.",
        error: error.message,
        errorDetails: error.errors || error.original || null
      };
    }
  }

  /**
   * Verifica si el paciente tiene citas que se solapan con el horario solicitado
   * @param {number} patientId - ID del paciente
   * @param {Date} startTime - Hora de inicio de la nueva cita
   * @param {Date} endTime - Hora de fin de la nueva cita
   * @param {number} excludeAppointmentId - ID de cita a excluir (opcional, útil al reagendar)
   * @returns {Object|null} Información de la cita solapada o null si no hay conflicto
   */
  async _checkPatientAppointmentOverlap(patientId, startTime, endTime, excludeAppointmentId = null) {
    const whereClause = {
      peopleId: patientId,
      status: { [Op.notIn]: ['no asistio', 'cancelada'] },
      [Op.or]: [
        // La nueva cita comienza durante una cita existente
        {
          startTime: { [Op.lte]: startTime },
          endTime: { [Op.gt]: startTime }
        },
        // La nueva cita termina durante una cita existente
        {
          startTime: { [Op.lt]: endTime },
          endTime: { [Op.gte]: endTime }
        },
        // La nueva cita envuelve completamente una cita existente
        {
          startTime: { [Op.gte]: startTime },
          endTime: { [Op.lte]: endTime }
        }
      ]
    };

    // Si se proporciona un ID de cita a excluir, agregarlo al where
    if (excludeAppointmentId) {
      whereClause.id = { [Op.ne]: excludeAppointmentId };
    }

    const appointments = await db.Appointment.findAll({
      where: whereClause,
      include: [
        {
          model: db.Professional,
          as: 'professional',
          attributes: ['names', 'surNames']
        }
      ]
    });

    if (appointments.length > 0) {
      const apt = appointments[0];
      return {
        id: apt.id,
        startTime: apt.startTime,
        endTime: apt.endTime,
        professionalName: apt.professional ?
          `${apt.professional.names} ${apt.professional.surNames}` : 'Doctor'
      };
    }

    return null;
  }

  /**
   * Verifica si el profesional tiene citas que se solapan con el horario solicitado
   * @param {number} professionalId - ID del profesional
   * @param {Date} startTime - Hora de inicio de la nueva cita
   * @param {Date} endTime - Hora de fin de la nueva cita
   * @param {number} excludeAppointmentId - ID de cita a excluir (opcional, útil al reagendar)
   * @returns {Object|null} Información de la cita solapada o null si no hay conflicto
   */
  async _checkProfessionalAppointmentOverlap(professionalId, startTime, endTime, excludeAppointmentId = null) {
    const whereClause = {
      professionalId: professionalId,
      status: { [Op.notIn]: ['no asistio', 'cancelada'] },
      [Op.or]: [
        // La nueva cita comienza durante una cita existente
        {
          startTime: { [Op.lte]: startTime },
          endTime: { [Op.gt]: startTime }
        },
        // La nueva cita termina durante una cita existente
        {
          startTime: { [Op.lt]: endTime },
          endTime: { [Op.gte]: endTime }
        },
        // La nueva cita envuelve completamente una cita existente
        {
          startTime: { [Op.gte]: startTime },
          endTime: { [Op.lte]: endTime }
        }
      ]
    };

    // Si se proporciona un ID de cita a excluir, agregarlo al where
    if (excludeAppointmentId) {
      whereClause.id = { [Op.ne]: excludeAppointmentId };
    }

    const appointments = await db.Appointment.findAll({
      where: whereClause
    });

    return appointments.length > 0 ? appointments[0] : null;
  }

  /**
   * Confirma una cita existente (cambia de estado 'solicitada' a 'confirmada')
   */
  async _confirmarCita(patientId, args, userId = null, role = 'patient') {
    const { appointmentId } = args;

    try {
      console.log(`[_confirmarCita] Intentando confirmar cita ID=${appointmentId} para entityId=${patientId} (Role: ${role})`);

      // 1. Verificar que la cita existe y pertenece al usuario (paciente o doctor)
      const query = { id: appointmentId };
      if (role === 'patient') {
        query.peopleId = patientId;
      } else if (role === 'professional') {
        query.professionalId = patientId;
      }

      const appointment = await db.Appointment.findOne({
        where: query,
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
          message: "Cita no encontrada o no tienes permiso para confirmarla"
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

      // Crear registro en el historial
      await db.AppointmentHistory.create({
        appointmentId: appointment.id,
        oldStatus: previousStatus,
        newStatus: 'confirmada',
        oldStartTime: appointment.startTime,
        newStartTime: appointment.startTime,
        oldEndTime: appointment.endTime,
        newEndTime: appointment.endTime,
        changeReason: 'Cita confirmada por asistente virtual',
        changedAt: new Date()
      });

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
          dateHuman: formatDateWithoutTimezone(getUTCDateFromSequelize(appointment.startTime))
        }
      };

    } catch (error) {
      console.error('[_confirmarCita ERROR]:', error);
      return {
        success: false,
        message: "Error al confirmar la cita. Por favor intenta nuevamente.",
        error: error.message
      };
    }
  }

  /**
   * Marca una cita como completada (cumplida)
   * Solo para Profesionales
   */
  async _completarCita(entityId, args, userId = null, role = 'professional') {
    const { appointmentId } = args;

    try {
      console.log(`[_completarCita] Intentando completar cita ID=${appointmentId} para entityId=${entityId}`);

      // Solo profesionales pueden completar citas
      if (role !== 'professional') {
        return { success: false, message: "Solo los doctores pueden marcar citas como completadas." };
      }

      const appointment = await db.Appointment.findOne({
        where: { id: appointmentId, professionalId: entityId },
        include: [{ model: db.modules.operative.PeopleAttended, as: 'peopleAttended' }]
      });

      if (!appointment) {
        return { success: false, message: "Cita no encontrada en tu agenda." };
      }

      if (['cancelada', 'no asistio'].includes(appointment.status)) {
        return { success: false, message: `No se puede completar una cita en estado '${appointment.status}'.` };
      }

      const previousStatus = appointment.status;
      appointment.status = 'cumplida';
      await appointment.save();

      // Historial
      await db.AppointmentHistory.create({
        appointmentId: appointment.id,
        oldStatus: previousStatus,
        newStatus: 'cumplida',
        changeReason: 'Cita marcada como cumplida por doctor',
        changedAt: new Date()
      });

      return {
        success: true,
        message: "Cita marcada como completada exitosamente.",
        appointmentId: appointment.id,
        appointment: {
          id: appointment.id,
          status: 'cumplida',
          patient: appointment.peopleAttended ? `${appointment.peopleAttended.names} ${appointment.peopleAttended.surNames}` : 'Paciente',
          date: formatDateWithoutTimezone(getUTCDateFromSequelize(appointment.startTime))
        }
      };

    } catch (error) {
      console.error('[_completarCita ERROR]:', error);
      return { success: false, message: "Error al completar la cita", error: error.message };
    }
  }

  /**
   * Reagenda una cita existente con validaciones completas
   */
  async _reagendarCita(patientId, args, userId = null, role = 'patient') {
    const { appointmentId, newScheduleId, newStartTime } = args;

    try {
      // 1. Verificar que la cita existe y pertenece al usuario (paciente o doctor)
      const query = { id: appointmentId };
      if (role === 'patient') {
        query.peopleId = patientId;
      } else if (role === 'professional') {
        query.professionalId = patientId; // Si es Dr., patientId es su professionalId
      }

      const appointment = await db.Appointment.findOne({
        where: query,
        include: [
          {
            model: db.Professional,
            as: 'professional',
            attributes: ['names', 'surNames', 'specialty']
          }
        ]
      });

      if (!appointment) {
        return { success: false, message: "Cita no encontrada o no pertenece al paciente" };
      }

      // 2. Guardar valores antiguos para el historial
      const oldStartTime = appointment.startTime;
      const oldEndTime = appointment.endTime;
      const oldProfessionalId = appointment.professionalId;
      const oldScheduleId = appointment.scheduleId;

      // 3. Obtener nuevo schedule
      const newSchedule = await db.Schedule.findByPk(newScheduleId, {
        include: [
          {
            model: db.Professional,
            as: 'professional',
            attributes: ['names', 'surNames', 'specialty']
          }
        ]
      });

      if (!newSchedule) {
        return { success: false, message: "Nuevo horario no encontrado" };
      }

      // 4. Verificar que el Schedule esté abierto
      if (newSchedule.status !== 'abierta') {
        return {
          success: false,
          message: `El nuevo horario no está disponible (estado: ${newSchedule.status})`
        };
      }

      // Helpers de formato (mismos que en _agendarCita)
      const toMySQLFormat = (isoString) => {
        // Extraer fecha y hora del ISO string o MySQL string
        const match = String(isoString).match(/(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2}):?(\d{2})?/);
        if (match) {
          // Si viene sin segundos, asumir 00
          const seconds = match[6] || '00';
          return `${match[1]}-${match[2]}-${match[3]} ${match[4]}:${match[5]}:${seconds}`;
        }
        return String(isoString);
      };

      const calculateEndTime = (startTimeISO) => {
        const match = String(startTimeISO).match(/(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/);
        if (match) {
          const [, year, month, day, hours, minutes] = match;
          let endHour = parseInt(hours);
          let endMin = parseInt(minutes) + 30;
          if (endMin >= 60) {
            endHour += 1;
            endMin -= 60;
          }
          return `${year}-${month}-${day} ${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}:00`;
        }
        return startTimeISO;
      };

      const startTimeMySQL = toMySQLFormat(newStartTime);
      const endTimeMySQL = calculateEndTime(newStartTime);

      console.log('[_reagendarCita] Tiempos corregidos:', { startTimeMySQL, endTimeMySQL });

      // 5. Verificar que el horario solicitado está dentro del rango del Schedule
      // Convertir schedule times a string MySQL para comparar strings
      const scheduleStartMySQL = toMySQLFormat(newSchedule.startTime);
      const scheduleEndMySQL = toMySQLFormat(newSchedule.endTime);

      if (startTimeMySQL < scheduleStartMySQL || endTimeMySQL > scheduleEndMySQL) {
        return {
          success: false,
          message: `El nuevo horario está fuera del rango de la agenda disponible`
        };
      }

      // 6. Verificar solapamientos (pasar strings MySQL)
      const patientOverlap = await this._checkPatientAppointmentOverlap(
        patientId,
        startTimeMySQL,
        endTimeMySQL,
        appointmentId
      );

      if (patientOverlap) {
        return {
          success: false,
          message: `Ya tienes una cita en este horario: ${patientOverlap.dateHuman} con ${patientOverlap.professionalName}`
        };
      }

      // 7. Verificar solapamientos profesional
      const professionalOverlap = await this._checkProfessionalAppointmentOverlap(
        newSchedule.professionalId,
        startTimeMySQL,
        endTimeMySQL,
        appointmentId
      );

      if (professionalOverlap) {
        return {
          success: false,
          message: `Este horario con ${newSchedule.professional.names} ${newSchedule.professional.surNames} ya está ocupado`
        };
      }

      // 8. Validar que el nuevo Schedule tenga unitId
      let finalUnitId = newSchedule.unitId;
      if (!finalUnitId) {
        console.warn('[_reagendarCita] El Schedule no tiene unitId asignado, buscando por defecto');
        const defaultUnit = await db.CareUnit.findOne({
          where: { status: true },
          order: [['id', 'ASC']]
        });

        if (!defaultUnit) {
          return {
            success: false,
            message: "Error de configuración: No hay unidades de atención disponibles."
          };
        }

        finalUnitId = defaultUnit.id;
        console.log('[_reagendarCita] Usando unitId por defecto:', finalUnitId);
      }

      // 9. Actualizar la cita
      appointment.scheduleId = newScheduleId;
      appointment.professionalId = newSchedule.professionalId;
      appointment.unitId = finalUnitId;
      appointment.startTime = startTimeMySQL;
      appointment.endTime = endTimeMySQL;
      await appointment.save();

      // 10. Crear registro en el historial
      await db.AppointmentHistory.create({
        appointmentId: appointment.id,
        oldStatus: appointment.status,
        newStatus: appointment.status,
        oldStartTime: oldStartTime,
        newStartTime: startTimeMySQL,
        oldEndTime: oldEndTime,
        newEndTime: endTimeMySQL,
        changeReason: 'Cita reagendada por asistente virtual',
        changedAt: new Date()
      });

      console.log(`[_reagendarCita] ✅ Cita ID=${appointment.id} reagendada exitosamente`);

      // Refrescar el contexto de la IA con las citas actualizadas
      console.log(`[ChatIA _reagendarCita] Iniciando actualización de contexto para userId=${userId || 'N/A'}, patientId=${patientId}`);
      await this._refreshUserContext(userId, patientId);

      return {
        success: true,
        message: "Cita reagendada exitosamente",
        appointmentId: appointment.id,
        appointment: {
          id: appointment.id,
          oldDateTime: formatDateWithoutTimezone(getUTCDateFromSequelize(oldStartTime)),
          newDateTime: formatDateWithoutTimezone(startTimeMySQL),
          professional: newSchedule.professional ?
            `${newSchedule.professional.names} ${newSchedule.professional.surNames}` : null,
          specialty: newSchedule.professional?.specialty || null
        }
      };

    } catch (error) {
      console.error('[_reagendarCita ERROR]:', error);
      return {
        success: false,
        message: "Error al reagendar la cita. Por favor intenta nuevamente.",
        error: error.message
      };
    }
  }

  /**
   * Cancela una cita con registro en historial
   * Funciona tanto para pacientes como para profesionales
   */
  async _cancelarCita(entityId, args) {
    const { appointmentId } = args;

    try {
      // Primero buscar la cita sin restricción para determinar el rol
      const appointment = await db.Appointment.findByPk(appointmentId, {
        include: [
          {
            model: db.Professional,
            as: 'professional',
            attributes: ['names', 'surNames', 'specialty']
          }
        ]
      });

      if (!appointment) {
        return { success: false, message: "Cita no encontrada" };
      }

      // Validar que la cita pertenezca al usuario (paciente o profesional)
      const isProfessional = appointment.professionalId === entityId;
      const isPatient = appointment.peopleId === entityId;

      if (!isProfessional && !isPatient) {
        console.log(`[_cancelarCita] Validación fallida: entityId=${entityId}, professionalId=${appointment.professionalId}, peopleId=${appointment.peopleId}`);
        return {
          success: false,
          message: "No tienes permiso para cancelar esta cita"
        };
      }

      // Guardar estado anterior para el historial
      const oldStatus = appointment.status;

      // Actualizar estado a 'no asistio' (cancelada)
      appointment.status = 'cancelada';
      await appointment.save();

      // Crear registro en el historial
      await db.AppointmentHistory.create({
        appointmentId: appointment.id,
        oldStatus: oldStatus,
        newStatus: 'cancelada',
        oldStartTime: appointment.startTime,
        newStartTime: appointment.startTime,
        oldEndTime: appointment.endTime,
        newEndTime: appointment.endTime,
        changeReason: 'Cita cancelada por asistente virtual',
        changedAt: new Date()
      });

      console.log(`[_cancelarCita] ✅ Cita ID=${appointment.id} cancelada exitosamente`);

      // Refrescar el contexto de la IA con las citas actualizadas
      // No refrescamos el contexto porque puede causar problemas
      // await this._refreshUserContext(null, entityId);

      return {
        success: true,
        message: "Cita cancelada exitosamente",
        appointmentId: appointment.id,
        appointment: {
          id: appointment.id,
          dateTime: formatDateWithoutTimezone(getUTCDateFromSequelize(appointment.startTime)),
          professional: appointment.professional ?
            `${appointment.professional.names} ${appointment.professional.surNames}` : null
        }
      };

    } catch (error) {
      console.error('[_cancelarCita ERROR]:', error);
      return {
        success: false,
        message: "Error al cancelar la cita. Por favor intenta nuevamente.",
        error: error.message
      };
    }
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
        dateHuman: formatDateHumanWithoutTimezone(getUTCDateFromSequelize(apt.startTime)),
        professional: `${apt.professional.names} ${apt.professional.surNames}`,
        specialty: apt.professional.specialty
      }))
    };
  }
  /**
   * Consulta la agenda del doctor (sus citas con pacientes)
   */
  async _consultarAgendaDoctor(professionalId) {
    try {
      const PeopleAttended = db.modules.operative.PeopleAttended;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const appointments = await db.Appointment.findAll({
        where: {
          professionalId: professionalId,
          status: { [Op.notIn]: ['no asistio', 'cancelada'] },
          startTime: { [Op.gte]: today }
        },
        include: [
          {
            model: PeopleAttended,
            attributes: ['names', 'surNames', 'documentId']
          }
        ],
        order: [['startTime', 'ASC']]
      });

      return {
        success: true,
        appointments: appointments.map(apt => {
          const patientName = apt.PeopleAttended || apt.people ?
            ` ` : 'Paciente';
          return {
            id: apt.id,
            date: apt.startTime,
            dateHuman: formatDateHumanWithoutTimezone(getUTCDateFromSequelize(apt.startTime)),
            patient: patientName,
            status: apt.status,
            reason: apt.description || 'No especificado'
          };
        })
      };
    } catch (error) {
      console.error('[_consultarAgendaDoctor ERROR]:', error);
      return {
        success: false,
        message: "Error al consultar la agenda",
        error: error.message
      };
    }
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
        date_human: formatDateWithoutTimezone(getUTCDateFromSequelize(apt.startTime)),
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
   * @param {Object} context - { role, userData, patient, appointments, availability }
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
    console.log(`[ChatIA setInitialContext] ROL:`, context.role || 'NO DEFINIDO');
    console.log(`[ChatIA setInitialContext] userData:`, context.userData?.names, context.userData?.surNames);
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

  /**
   * Actualiza el contexto del usuario SIN borrar el historial de conversación
   * Usar este método cuando se modifiquen citas durante una conversación activa
   * @param {number} userId
   * @param {Object} context - { patient, appointments, availability }
   */
  updateContext(userId, context) {
    const conversationKey = `user_${userId}`;
    // NO borrar el historial de conversación, solo actualizar el contexto
    let convoState = this.conversationState.get(conversationKey) || {};
    convoState.initialContext = context;
    this.conversationState.set(conversationKey, convoState);

    console.log('==========================================');
    console.log(`[ChatIA updateContext] Usuario ${userId} - ACTUALIZACIÓN SIN BORRAR CONVERSACIÓN`);
    console.log(`[ChatIA updateContext] Paciente:`, context.patient?.names, context.patient?.surNames);
    console.log(`[ChatIA updateContext] Citas: ${context.appointments?.length || 0}`);
    if (context.appointments && context.appointments.length > 0) {
      context.appointments.forEach((apt, idx) => {
        console.log(`  ${idx + 1}. ID=${apt.id} | ${apt.date_human} | ${apt.professional} | ${apt.status}`);
      });
    }
    console.log(`[ChatIA updateContext] Availability:`, Object.keys(context.availability || {}).length, 'especialidades');
    console.log('==========================================');
  }

  /**
   * Refresca el contexto del usuario después de operaciones de citas
   * IMPORTANTE: Este método actualiza el contexto SIN borrar el historial de conversación
   * @param {number} userId - ID del usuario
   * @param {number} patientId - ID del paciente
   */
  async _refreshUserContext(userId, patientId) {
    try {
      console.log(`[ChatIA _refreshUserContext] Iniciando actualización para userId=${userId || 'N/A'}, patientId=${patientId}`);

      // Obtener información del paciente
      const PeopleAttended = db.modules.operative.PeopleAttended;
      let patient = null;

      if (patientId) {
        patient = await PeopleAttended.findByPk(patientId);
      } else if (userId) {
        patient = await PeopleAttended.findByPk(userId);
      }

      if (!patient) {
        console.warn(`[ChatIA _refreshUserContext] No se encontró paciente`);
        return;
      }

      // Obtener citas activas del paciente
      const appointments = await db.Appointment.findAll({
        where: {
          peopleId: patient.id,
          // CORRECCIÓN CRÍTICA: Usar Op.notIn en lugar de Op.ne para arrays
          status: { [Op.notIn]: ['no asistio', 'cancelada', 'cumplida', 'completada'] }
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

      console.log(`[ChatIA _refreshUserContext] Citas encontradas: ${appointments.length}`);

      // Formatear citas igual que en IAContextService
      const appointmentsData = appointments.map(apt => ({
        id: apt.id,
        date_iso: apt.startTime,
        date_human: formatDateWithoutTimezone(getUTCDateFromSequelize(apt.startTime)),
        professional: apt.professional ? `${apt.professional.names} ${apt.professional.surNames}` : null,
        specialty: apt.professional ? apt.professional.specialty : null,
        status: apt.status,
        reason: apt.description || null
      }));

      // Preparar contexto actualizado
      const effectiveUserId = userId || patientId;

      // Intentar preservar la disponibilidad existente para no perderla
      let existingAvailability = {};
      const conversationKey = `user_${effectiveUserId}`;
      const currentState = this.conversationState.get(conversationKey);
      if (currentState && currentState.initialContext && currentState.initialContext.availability) {
        existingAvailability = currentState.initialContext.availability;
        console.log(`[ChatIA _refreshUserContext] Preservando disponibilidad existente: ${Object.keys(existingAvailability).length} especialidades`);
      }

      const contextData = {
        patient: {
          id: patient.id,
          names: patient.names,
          surNames: patient.surNames,
          documentType: patient.documentType,
          documentId: patient.documentId,
          email: patient.email,
          phone: patient.phone,
          dateOfBirth: patient.dateOfBirth
        },
        appointments: appointmentsData,
        availability: existingAvailability // Usar disponibilidad preservada
      };

      // Usar updateContext en lugar de setInitialContext para NO borrar la conversación
      this.updateContext(effectiveUserId, contextData);

      console.log(`[ChatIA _refreshUserContext] ✅ Contexto actualizado exitosamente`);
      return contextData;
    } catch (error) {
      console.error(`[ChatIA _refreshUserContext] Error:`, error);
    }
  }
}

/**
 * Obtiene un objeto Date con componentes UTC desde un objeto Date de Sequelize
 * Crea una nueva fecha usando los componentes UTC como si fueran valores locales
 * para evitar conversiones automáticas de timezone
 * @param {Date|string} sequelizeDate - Fecha que viene de Sequelize
 * @returns {Date} Nueva fecha con componentes UTC preservados
 */
function getUTCDateFromSequelize(sequelizeDate) {
  if (!sequelizeDate) return null;

  // CORRECCIÓN: Tratar el string de la BD como UTC puro
  let dateStr = String(sequelizeDate);
  // Si no tiene zona horaria explícita (Z o +00), asumimos que es UTC (Z)
  if (!dateStr.endsWith('Z') && !dateStr.includes('+')) {
    dateStr += 'Z';
  }

  return new Date(dateStr);
}

/**
 * Formatea una fecha sin conversión de timezone (usa la hora tal cual está en la BD)
 * @param {Date} date - Fecha a formatear
 * @returns {string} Fecha formateada en formato DD/MM/YYYY HH:mm
 */
function formatDateWithoutTimezone(date) {
  if (!date) return '';

  // SOLUCIÓN: Intentar extraer directamente del string
  const str = String(date);

  // Formato MySQL: "2026-01-25 13:00:00"
  const mysqlMatch = str.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (mysqlMatch) {
    const [, year, month, day, hours, minutes] = mysqlMatch;
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  // Formato ISO: "2026-01-25T13:00:00-04:00" o "2026-01-25T13:00:00.000Z"
  const isoMatch = str.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (isoMatch) {
    const [, year, month, day, hours, minutes] = isoMatch;
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  // Fallback: usar objeto Date
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Formatea una fecha de forma legible sin conversión de timezone
 * @param {Date} date - Fecha a formatear
 * @returns {string} Fecha formateada legible (ej: "lunes 15 de enero, 13:00")
 */
function formatDateHumanWithoutTimezone(date) {
  if (!date) return '';
  const weekdays = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  // Helper para formato 12h
  const to12h = (hoursStr, minutesStr) => {
    const h = parseInt(hoursStr, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:${minutesStr} ${ampm}`;
  };

  // SOLUCIÓN: Intentar extraer del string primero
  const str = String(date);

  // Formato MySQL: "2026-01-25 12:00:00"
  const mysqlMatch = str.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
  if (mysqlMatch) {
    const [, year, month, day, hours, minutes] = mysqlMatch;
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const weekday = weekdays[dateObj.getDay()];
    const monthName = months[parseInt(month) - 1];
    return `${weekday} ${parseInt(day)} de ${monthName}, ${to12h(hours, minutes)}`;
  }

  // Formato ISO: "2026-01-25T12:00:00-04:00"
  const isoMatch = str.match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (isoMatch) {
    const [, year, month, day, hours, minutes] = isoMatch;
    const dateObj = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const weekday = weekdays[dateObj.getDay()];
    const monthName = months[parseInt(month) - 1];
    return `${weekday} ${parseInt(day)} de ${monthName}, ${to12h(hours, minutes)}`;
  }

  // Fallback: usar objeto Date
  const weekday = weekdays[date.getUTCDay()];
  const day = date.getUTCDate();
  const month = months[date.getUTCMonth()];
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');

  return `${weekday} ${day} de ${month}, ${to12h(hours, minutes)}`;
}

module.exports = new ConversationalAssistantService();

