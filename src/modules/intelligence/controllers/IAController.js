const smartSchedulingService = require('../services/SmartSchedulingService');
const openAIService = require('../services/OpenAIService');
const conversationalAssistantService = require('../services/ConversationalAssistantService');
const db = require('../../../../database/models');
const { Op } = require('sequelize');

class IAController {
    
  async recommend(req, res) {
    try {
      const { query, professionalId, provider = 'gemini' } = req.body;

      if (!query || !professionalId) {
        return res.status(400).json({ 
          success: false,
          message: 'Se requiere "query" (texto del usuario) y "professionalId".' 
        });
      }

      let recommendations;

      // Lógica estricta: Si es OpenAI, usa OpenAI. Si es Gemini, usa Gemini.
      // SIN FALLBACKS automáticos que mezclen los errores.
      if (provider === 'openai') {
        console.log('[IAController] Usando proveedor: OpenAI');
        recommendations = await openAIService.recommendSlots(query, professionalId);
      } else {
        console.log('[IAController] Usando proveedor: Google Gemini');
        recommendations = await smartSchedulingService.recommendSlots(query, professionalId);
      }
      
      return res.status(200).json({
        success: true,
        data: recommendations
      });

    } catch (error) {
      console.error('[IAController Error]:', error.message);
      
      // Mensaje de error amigable para el frontend
      return res.status(500).json({ 
        success: false, 
        message: error.message || 'Error interno en el servicio de IA'
      });
    }
  }

  /**
   * Maneja conversaciones con el asistente virtual
   * POST /api/intelligence/chat
   * Body: { message: string, userId: number, patientId: number }
   */
  async chat(req, res) {
    try {
      const { message, userId, patientId } = req.body;

      // Validaciones
      if (!message || typeof message !== 'string') {
        return res.status(400).json({
          success: false,
          message: 'Se requiere "message" (string) en el body'
        });
      }

      if (!userId && !patientId) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere al menos "userId" o "patientId" del usuario autenticado'
        });
      }

      // Si falta patientId, intentar resolverlo a partir de userId
      let resolvedPatientId = patientId;
      if (!resolvedPatientId && userId) {
        try {
          const PeopleAttended = db.modules.operative.PeopleAttended;
          const person = await PeopleAttended.findOne({ where: { userId: userId } });
          if (person) {
            resolvedPatientId = person.id;
          }
        } catch (err) {
          console.error('[chat] Error buscando patientId por userId:', err);
        }
      }

      // Procesar mensaje con el asistente
      const response = await conversationalAssistantService.processMessage(
        message,
        userId,
        resolvedPatientId
      );

      return res.status(200).json({
        success: true,
        data: response
      });

    } catch (error) {
      console.error('[Chat IA Error]:', error);
      return res.status(500).json({
        success: false,
        message: 'Error procesando el mensaje',
        error: error.message
      });
    }
  }

  /**
   * POST /api/intelligence/check-appointments
   * Body: { docType, docNumber, firstName, lastName }
   * Busca el paciente por documento y devuelve sus citas activas (no canceladas).
   */
  async checkAppointments(req, res) {
    try {
      const { docType, docNumber, firstName, lastName } = req.body;

      if (!docType || !docNumber || !firstName || !lastName) {
        return res.status(400).json({
          success: false,
          message: 'Se requieren docType, docNumber, firstName y lastName'
        });
      }

      // Normalizar tipo de documento a los valores de la BD
      const normalizedType = (docType || '').toString().trim().toLowerCase();
      let dbDocType = null;
      if (['dni', 'cedula', 'cédula', 'ci'].includes(normalizedType)) dbDocType = 'cedula';
      else if (['cuil', 'rif'].includes(normalizedType)) dbDocType = 'rif';
      else if (['pasaporte', 'passport'].includes(normalizedType)) dbDocType = 'pasaporte';
      else if (['extranjero', 'extranjera'].includes(normalizedType)) dbDocType = 'extranjero';
      else dbDocType = 'otro';

      // Buscar persona por documento primero
      const PeopleAttended = db.modules.operative.PeopleAttended;
      let person = await PeopleAttended.findOne({
        where: {
          documentType: dbDocType,
          documentId: docNumber.toString().trim()
        }
      });

      // Si no se encuentra por documento, intentar buscar por nombre y apellido
      if (!person) {
        person = await PeopleAttended.findOne({
          where: {
            names: { [Op.iLike]: `%${firstName}%` },
            surNames: { [Op.iLike]: `%${lastName}%` }
          }
        });
      }

      if (!person) {
        return res.status(200).json({
          success: true,
          data: [] // No encontrado -> no hay citas
        });
      }

      // Obtener citas activas del paciente
      const appointments = await db.Appointment.findAll({
        where: {
          peopleId: person.id || person.id, // soporta distintos nombres de FK
          patientId: person.id, // en algunos modelos puede usarse patientId
          status: { [Op.not]: 'cancelada' },
          startTime: { [Op.gte]: new Date() }
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

      // Mapear resultados a formato simple
      const mapped = appointments.map(apt => ({
        id: apt.id,
        date_iso: apt.startTime,
        date_human: new Date(apt.startTime).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        professional: apt.professional ? `${apt.professional.names} ${apt.professional.surNames}` : null,
        status: apt.status,
        reason: apt.description || null
      }));

      return res.status(200).json({
        success: true,
        data: mapped
      });

    } catch (error) {
      console.error('[checkAppointments Error]:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al consultar las citas'
      });
    }
  }

  /**
   * POST /api/intelligence/init-session
   * Body: { userId, patientId }
   * Devuelve contexto inicial: paciente, citas activas y disponibilidad por especialidad
   */
  async initSession(req, res) {
    try {
      const { userId, patientId } = req.body;

      if (!userId && !patientId) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere userId o patientId'
        });
      }

      // Intentar obtener paciente por patientId o por userId vía PeopleAttended (si aplica)
      const PeopleAttended = db.modules.operative.PeopleAttended;
      let patient = null;
      if (patientId) {
        patient = await PeopleAttended.findByPk(patientId);
      } else if (userId) {
        // Si solo viene userId, lo usamos como patientId
        patient = await PeopleAttended.findByPk(userId);
      }

      // Obtener citas activas (si hay paciente)
      // NOTA: Incluye todas las citas (pasadas y futuras) para contexto completo
      let appointments = [];
      if (patient) {
        appointments = await db.Appointment.findAll({
          where: {
            peopleId: patient.id,
            status: { [Op.ne]: 'no asistio' } // Excluir solo las que no asistieron
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
        
        console.log(`[init-session] Citas encontradas para peopleId ${patient.id}:`, appointments.length);
        appointments.forEach(apt => {
          console.log(`  - ID ${apt.id}: ${apt.startTime} | Status: ${apt.status} | Prof: ${apt.professional?.names}`);
        });
      }

      // Disponibilidad por especialidad (búsqueda rápida: hasta 3 slots por especialidad)
      const KNOWN_SPECIALTIES = [
        'odontología general', 'ortodoncia', 'endodoncia', 'periodoncia',
        'odontopediatría', 'cirugía oral', 'prótesis', 'implantología', 'estética'
      ];

      const availability = {};
      for (const spec of KNOWN_SPECIALTIES) {
        try {
          const professionals = await db.Professional.findAll({
            where: {
              specialty: { [Op.like]: `%${spec}%` },
              status: true
            },
            limit: 5
          });
          if (!professionals.length) {
            availability[spec] = [];
            continue;
          }
          const professionalIds = professionals.map(p => p.id);
          const schedules = await db.Schedule.findAll({
            where: {
              professionalId: { [Op.in]: professionalIds },
              status: 'abierta',
              startTime: { [Op.gt]: new Date() }
            },
            order: [['startTime', 'ASC']],
            limit: 10
          });

          // Obtener citas ya agendadas para estos profesionales
          const takenAppointments = await db.Appointment.findAll({
            where: {
              professionalId: { [Op.in]: professionalIds },
              status: { [Op.not]: 'cancelada' },
              startTime: { [Op.gte]: new Date() }
            }
          });

          // Generar slots simples: tomar los primeros schedules no ocupados
          const slots = [];
          for (const schedule of schedules) {
            if (slots.length >= 3) break;
            const isTaken = takenAppointments.some(app => {
              if (!app.startTime || app.professionalId !== schedule.professionalId) return false;
              const appointmentTime = new Date(app.startTime);
              return Math.abs(appointmentTime.getTime() - new Date(schedule.startTime).getTime()) < 60000;
            });
            if (!isTaken) {
              const prof = professionals.find(p => p.id === schedule.professionalId);
              slots.push({
                scheduleId: schedule.id,
                professionalId: schedule.professionalId,
                professional: prof ? `${prof.names} ${prof.surNames}` : null,
                date_iso: schedule.startTime,
                date_human: new Date(schedule.startTime).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
              });
            }
          }
          availability[spec] = slots;
        } catch (err) {
          console.error('[initSession availability error]:', err);
          availability[spec] = [];
        }
      }

      // Preparar datos estructurados
      const appointmentsData = appointments.map(apt => ({
        id: apt.id,
        date_iso: apt.startTime,
        date_human: new Date(apt.startTime).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        professional: apt.professional ? `${apt.professional.names} ${apt.professional.surNames}` : null,
        specialty: apt.professional ? apt.professional.specialty : null,
        status: apt.status,
        reason: apt.description || null
      }));

      // Guardar contexto inicial en el servicio conversacional (cache en memoria)
      // Esto debe hacerse ANTES de retornar
      const effectiveUserId = userId || patientId;
      try {
        conversationalAssistantService.setInitialContext(effectiveUserId, {
          patient,
          appointments: appointmentsData,
          availability
        });
        console.log(`[initSession] Contexto guardado exitosamente para userId ${effectiveUserId}`);
      } catch (err) {
        console.error('[initSession setInitialContext error]:', err);
      }

      // Retornar respuesta después de guardar el contexto
      return res.status(200).json({
        success: true,
        data: {
          patient,
          appointments: appointmentsData,
          availability
        }
      });

    } catch (error) {
      console.error('[initSession Error]:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al inicializar sesión'
      });
    }
  }

  /**
   * Limpia el historial de conversación de un usuario
   * DELETE /api/intelligence/chat/history/:userId
   */
  async clearChatHistory(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'Se requiere userId en la URL'
        });
      }

      conversationalAssistantService.clearConversationHistory(Number(userId));

      return res.status(200).json({
        success: true,
        message: 'Historial de conversación limpiado exitosamente'
      });

    } catch (error) {
      console.error('[Clear History Error]:', error);
      return res.status(500).json({
        success: false,
        message: 'Error limpiando el historial',
        error: error.message
      });
    }
  }
}

module.exports = new IAController();