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
          status: { [Op.notIn]: ['no asistio', 'cancelada'] } // Excluir solo las que no asistieron
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

      console.log(`[IAContextService] Schedules encontrados para ${specialty}: ${schedules.length}`);
      schedules.forEach((s, idx) => {
        const duration = (new Date(s.endTime) - new Date(s.startTime)) / (1000 * 60 * 60);
        console.log(`  Schedule ${idx + 1}: ID=${s.id}, Start=${s.startTime}, End=${s.endTime}, Duración=${duration.toFixed(2)}h, Prof=${s.professionalId}`);
      });

      // Buscar citas ya agendadas para estos profesionales
      const takenAppointments = await db.Appointment.findAll({
        where: {
          professionalId: { [Op.in]: professionalIds },
          status: { [Op.not]: 'cancelada' },
          startTime: { [Op.gte]: new Date() }
        }
      });

      console.log(`[IAContextService] Citas ocupadas encontradas para ${specialty}: ${takenAppointments.length}`);

      // Generar slots libres de 30 minutos
      const slots = [];
      const SLOT_DURATION = 30; // minutos

      for (const schedule of schedules) {
        let currentTime = new Date(schedule.startTime);
        const endTime = new Date(schedule.endTime);
        const prof = professionals.find(p => p.id === schedule.professionalId);

        console.log(`[IAContextService] Generando slots para Schedule ID ${schedule.id}:`);
        console.log(`  - Rango: ${currentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Caracas' })} hasta ${endTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Caracas' })}`);

        let slotsGenerated = 0;
        
        // Generar slots de 30 minutos dentro del rango del schedule
        while (currentTime < endTime) {
          const slotEnd = new Date(currentTime.getTime() + SLOT_DURATION * 60000);
          if (slotEnd > endTime) break;

          // Verificar si este slot específico está ocupado
          const isTaken = takenAppointments.some(app => {
            if (!app.startTime || app.professionalId !== schedule.professionalId) return false;
            const appointmentTime = new Date(app.startTime);
            return Math.abs(appointmentTime.getTime() - currentTime.getTime()) < 60000; // Dentro de 1 minuto
          });

          if (!isTaken) {
            slots.push({
              scheduleId: schedule.id,
              professionalId: schedule.professionalId,
              professional: prof ? `${prof.names} ${prof.surNames}` : null,
              startTime_iso: new Date(currentTime),
              endTime_iso: schedule.endTime,
              date_iso: new Date(currentTime),
              startTime_human: currentTime.toLocaleString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'America/Caracas'
              }),
              endTime_human: endTime.toLocaleString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'America/Caracas'
              }),
              date_human: currentTime.toLocaleString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'America/Caracas'
              })
            });
            slotsGenerated++;
          }

          // Avanzar 30 minutos
          currentTime = new Date(currentTime.getTime() + SLOT_DURATION * 60000);
        }

        console.log(`  - Slots libres generados: ${slotsGenerated}`);
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

