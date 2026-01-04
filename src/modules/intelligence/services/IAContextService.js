// fileName: src/modules/intelligence/services/IAContextService.js
const { Op } = require('sequelize');
const db = require('../../../../database/models');
const conversationalAssistantService = require('./ConversationalAssistantService');

/**
 * Servicio para inicializar el contexto del agente IA
 * Consulta toda la información necesaria del usuario al iniciar sesión:
 * - Datos del paciente
 * - Citas activas (schedules y appointments)
 * - Disponibilidad por especialidad
 */

/**
 * Inicializa el contexto IA para un usuario/paciente al iniciar sesión
 * @param {number} userId - ID del usuario (de la tabla Users)
 * @param {number} patientId - ID del paciente (de la tabla PeopleAttended)
 * @returns {Promise<Object>} Contexto inicializado
 */
async function initializeIAContext(userId, patientId) {
  try {
    console.log(`[IAContextService] Inicializando contexto para userId=${userId}, patientId=${patientId}`);

    // 1. Obtener información del paciente
    const PeopleAttended = db.modules.operative.PeopleAttended;
    let patient = null;
    
    if (patientId) {
      patient = await PeopleAttended.findByPk(patientId);
    } else if (userId) {
      // Si solo viene userId, intentar usarlo como patientId
      patient = await PeopleAttended.findByPk(userId);
    }

    if (!patient) {
      console.warn(`[IAContextService] No se encontró paciente para userId=${userId}, patientId=${patientId}`);
    }

    // 2. Obtener citas activas del paciente
    // Incluye todas las citas (pasadas y futuras) para contexto completo
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
      
      console.log(`[IAContextService] Citas encontradas para peopleId ${patient.id}:`, appointments.length);
      appointments.forEach(apt => {
        console.log(`  - ID ${apt.id}: ${apt.startTime} | Status: ${apt.status} | Prof: ${apt.professional?.names}`);
      });
    }

    // 3. Obtener disponibilidad por especialidad
    // Consulta horarios disponibles para las especialidades más comunes
    const availability = await getAvailabilityBySpecialty();

    // 4. Preparar datos estructurados
    const appointmentsData = appointments.map(apt => ({
      id: apt.id,
      date_iso: apt.startTime,
      date_human: new Date(apt.startTime).toLocaleString('es-ES', { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'America/Caracas'
      }),
      professional: apt.professional ? `${apt.professional.names} ${apt.professional.surNames}` : null,
      specialty: apt.professional ? apt.professional.specialty : null,
      status: apt.status,
      reason: apt.description || null
    }));

    // 5. Guardar contexto inicial en el servicio conversacional
    const effectiveUserId = userId || patientId;
    const contextData = {
      patient: patient ? {
        id: patient.id,
        names: patient.names,
        surNames: patient.surNames,
        documentType: patient.documentType,
        documentId: patient.documentId,
        email: patient.email,
        phone: patient.phone,
        dateOfBirth: patient.dateOfBirth
      } : null,
      appointments: appointmentsData,
      availability
    };

    conversationalAssistantService.setInitialContext(effectiveUserId, contextData);

    console.log(`[IAContextService] ✅ Contexto inicializado exitosamente para userId ${effectiveUserId}`);
    console.log(`  - Paciente: ${patient?.names} ${patient?.surNames}`);
    console.log(`  - Citas activas: ${appointmentsData.length}`);
    console.log(`  - Especialidades con disponibilidad: ${Object.keys(availability).length}`);

    return contextData;

  } catch (error) {
    console.error('[IAContextService Error]:', error);
    throw error;
  }
}

/**
 * Obtiene disponibilidad de horarios por especialidad
 * Consulta los próximos slots disponibles para cada especialidad
 * @returns {Promise<Object>} Objeto con disponibilidad por especialidad
 */
async function getAvailabilityBySpecialty() {
  const KNOWN_SPECIALTIES = [
    'odontología general',
    'ortodoncia',
    'endodoncia',
    'periodoncia',
    'odontopediatría',
    'cirugía oral',
    'prótesis',
    'implantología',
    'estética dental'
  ];

  const availability = {};

  for (const specialty of KNOWN_SPECIALTIES) {
    try {
      // Buscar profesionales activos de esta especialidad
      const professionals = await db.Professional.findAll({
        where: {
          specialty: { [Op.like]: `%${specialty}%` },
          status: true
        },
        limit: 5
      });

      if (!professionals.length) {
        availability[specialty] = [];
        continue;
      }

      const professionalIds = professionals.map(p => p.id);

      // Buscar horarios (schedules) disponibles
      const schedules = await db.Schedule.findAll({
        where: {
          professionalId: { [Op.in]: professionalIds },
          status: 'abierta',
          startTime: { [Op.gt]: new Date() }
        },
        order: [['startTime', 'ASC']],
        limit: 10
      });

      // Buscar citas ya agendadas para estos profesionales
      const takenAppointments = await db.Appointment.findAll({
        where: {
          professionalId: { [Op.in]: professionalIds },
          status: { [Op.not]: 'cancelada' },
          startTime: { [Op.gte]: new Date() }
        }
      });

      // Generar slots libres
      const slots = [];
      for (const schedule of schedules) {
        if (slots.length >= 3) break; // Máximo 3 slots por especialidad

        // Verificar si el horario está ocupado
        const isTaken = takenAppointments.some(app => {
          if (!app.startTime || app.professionalId !== schedule.professionalId) return false;
          const appointmentTime = new Date(app.startTime);
          const scheduleTime = new Date(schedule.startTime);
          return Math.abs(appointmentTime.getTime() - scheduleTime.getTime()) < 60000; // Dentro de 1 minuto
        });

        if (!isTaken) {
          const prof = professionals.find(p => p.id === schedule.professionalId);
          slots.push({
            scheduleId: schedule.id,
            professionalId: schedule.professionalId,
            professional: prof ? `${prof.names} ${prof.surNames}` : null,
            date_iso: schedule.startTime,
            date_human: new Date(schedule.startTime).toLocaleString('es-ES', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric', 
              hour: '2-digit', 
              minute: '2-digit',
              timeZone: 'America/Caracas'
            })
          });
        }
      }

      availability[specialty] = slots;

    } catch (err) {
      console.error(`[IAContextService] Error obteniendo disponibilidad para ${specialty}:`, err);
      availability[specialty] = [];
    }
  }

  return availability;
}

module.exports = {
  initializeIAContext,
  getAvailabilityBySpecialty
};

