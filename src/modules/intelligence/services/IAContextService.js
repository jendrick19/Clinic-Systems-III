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
async function initializeIAContext(userId, entityId) {
  try {
    console.log(`[IAContextService] Inicializando contexto para userId=${userId}, entityId=${entityId}`);

    // Determinar si es Profesional o Paciente
    const Professional = db.Professional;
    const PeopleAttended = db.modules.operative.PeopleAttended;

    // Intentar buscar como profesional primero
    let professional = null;
    if (entityId) {
      professional = await Professional.findByPk(entityId);
    }

    let patient = null;
    let role = 'patient';

    if (professional) {
      role = 'professional';
      console.log(`[IAContextService] Usuario identificado como PROFESIONAL: ${professional.names} ${professional.surNames}`);
    } else {
      // Si no es profesional, buscar como paciente
      if (entityId) {
        patient = await PeopleAttended.findByPk(entityId);
      } else if (userId) {
        patient = await PeopleAttended.findByPk(userId);
      }

      if (patient) {
        console.log(`[IAContextService] Usuario identificado como PACIENTE: ${patient.names} ${patient.surNames}`);
      }
    }

    if (!professional && !patient) {
      console.warn(`[IAContextService] No se encontró entidad para userId=${userId}, entityId=${entityId}`);
      // No retornamos null, permitimos contexto vacío
    }

    let appointments = [];
    let schedules = [];

    if (role === 'professional') {
      // === CONTEXTO DE PROFESIONAL ===
      // Obtener citas donde él es el doctor
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Intentamos incluir datos del paciente. Si falla por alias, al menos tendremos los IDs.
      try {
        appointments = await db.Appointment.findAll({
          where: {
            professionalId: professional.id,
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
      } catch (err) {
        console.warn('[IAContextService] Error incluyendo paciente, cargando sin include:', err.message);
        appointments = await db.Appointment.findAll({
          where: {
            professionalId: professional.id,
            status: { [Op.notIn]: ['no asistio', 'cancelada'] },
            startTime: { [Op.gte]: today }
          },
          order: [['startTime', 'ASC']]
        });
      }

      // Obtener sus horarios
      schedules = await db.Schedule.findAll({
        where: {
          professionalId: professional.id,
          status: 'abierta',
          startTime: { [Op.gte]: today }
        },
        order: [['startTime', 'ASC']]
      });

    } else if (patient) {
      // === CONTEXTO DE PACIENTE ===
      appointments = await db.Appointment.findAll({
        where: {
          peopleId: patient.id,
          status: { [Op.notIn]: ['no asistio', 'cancelada'] }
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
    }

    // Preparar datos de appointments
    const appointmentsData = [];
    for (const apt of appointments) {
      let patientInfo = null;

      // Intentar extraer info del paciente si existe en el include
      if (apt.PeopleAttended) {
        patientInfo = `${apt.PeopleAttended.names} ${apt.PeopleAttended.surNames}`;
      } else if (apt.people) { // Alias común
        patientInfo = `${apt.people.names} ${apt.people.surNames}`;
      } else if (role === 'professional' && apt.peopleId) {
        // Si es profesional y no vino el include, cargar manualmente
        try {
          const patientData = await PeopleAttended.findByPk(apt.peopleId, {
            attributes: ['names', 'surNames']
          });
          if (patientData) {
            patientInfo = `${patientData.names} ${patientData.surNames}`;
          }
        } catch (err) {
          console.warn('[IAContextService] Error cargando paciente:', err.message);
        }
      }

      appointmentsData.push({
        id: apt.id,
        date_iso: apt.startTime,
        date_human: formatDateWithoutTimezone(getUTCDateFromSequelize(apt.startTime)),
        // Para profesional mostramos paciente, para paciente mostramos profesional
        professional: apt.professional ? `${apt.professional.names} ${apt.professional.surNames}` : null,
        patientName: patientInfo,
        specialty: apt.professional ? apt.professional.specialty : (professional ? professional.specialty : null),
        status: apt.status,
        reason: apt.description || null
      });
    }


    // Disponibilidad general (útil para reagendar o ver huecos)
    const availability = await getAvailabilityBySpecialty();

    // Guardar contexto
    // Usamos entityId como clave si userId es nulo, o userId si existe.
    // AuthController pasa userId real.
    const effectiveUserId = userId || entityId;

    const contextData = {
      role: role,
      // Guardamos la entidad principal en 'user'
      userData: role === 'professional' ? professional : patient,
      patient: role === 'patient' ? patient : null, // Compatibilidad hacia atrás
      appointments: appointmentsData,
      availability,
      schedules: schedules.map(s => ({
        id: s.id,
        start: s.startTime,
        end: s.endTime,
        date_human: formatDateWithoutTimezone(getUTCDateFromSequelize(s.startTime))
      }))
    };

    console.log(`[IAContextService] 📦 Guardando contexto con role=${role}`);
    conversationalAssistantService.setInitialContext(effectiveUserId, contextData);

    console.log(`[IAContextService] ✅ Contexto inicializado exitosamente para ${role.toUpperCase()} (ID: ${effectiveUserId})`);
    console.log(`  - Citas cargadas: ${appointmentsData.length}`);

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
        const startUTC = getUTCDateFromSequelize(s.startTime);
        const endUTC = getUTCDateFromSequelize(s.endTime);
        const duration = (endUTC.getTime() - startUTC.getTime()) / (1000 * 60 * 60);
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
        // Trabajar directamente con el objeto Date de Sequelize usando componentes UTC
        let currentTime = getUTCDateFromSequelize(schedule.startTime);
        const endTime = getUTCDateFromSequelize(schedule.endTime);
        const prof = professionals.find(p => p.id === schedule.professionalId);

        console.log(`[IAContextService] Generando slots para Schedule ID ${schedule.id}:`);
        console.log(`  - Rango original BD: ${schedule.startTime} (UTC: ${formatTimeWithoutTimezone(currentTime)}) hasta ${schedule.endTime} (UTC: ${formatTimeWithoutTimezone(endTime)})`);

        let slotsGenerated = 0;

        // Generar slots de 30 minutos dentro del rango del schedule
        while (currentTime.getTime() < endTime.getTime()) {
          const slotEnd = new Date(currentTime.getTime() + SLOT_DURATION * 60000);
          if (slotEnd.getTime() > endTime.getTime()) break;

          // Verificar si este slot específico está ocupado
          const isTaken = takenAppointments.some(app => {
            if (!app.startTime || app.professionalId !== schedule.professionalId) return false;
            const appointmentTime = getUTCDateFromSequelize(app.startTime);
            return Math.abs(appointmentTime.getTime() - currentTime.getTime()) < 60000; // Dentro de 1 minuto
          });

          if (!isTaken) {
            slots.push({
              scheduleId: schedule.id,
              professionalId: schedule.professionalId,
              professional: prof ? `${prof.names} ${prof.surNames}` : null,
              startTime_iso: currentTime,
              endTime_iso: endTime,
              date_iso: currentTime,
              startTime_human: formatDateWithoutTimezone(currentTime),
              endTime_human: formatDateWithoutTimezone(endTime),
              date_human: formatDateWithoutTimezone(currentTime)
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

/**
 * Obtiene un objeto Date con componentes UTC desde un objeto Date de Sequelize
 * Crea una nueva fecha usando los componentes UTC como si fueran valores locales
 * para evitar conversiones automáticas de timezone
 * @param {Date|string} sequelizeDate - Fecha que viene de Sequelize
 * @returns {Date} Nueva fecha con componentes UTC preservados
 */
function getUTCDateFromSequelize(sequelizeDate) {
  if (!sequelizeDate) return null;
  
  // Forzar UTC agregando Z si es un string
  let dateStr = String(sequelizeDate);
  if (dateStr.indexOf('Z') === -1 && dateStr.indexOf('+') === -1) {
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
  // Asegurar que date sea un objeto Date creado como UTC
  const d = date instanceof Date ? date : getUTCDateFromSequelize(date);
  if (!d || isNaN(d.getTime())) return '';

  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const minutes = String(d.getUTCMinutes()).padStart(2, '0');
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

/**
 * Formatea una hora sin conversión de timezone
 * @param {Date} date - Fecha a formatear
 * @returns {string} Hora formateada en formato HH:mm
 */
function formatTimeWithoutTimezone(date) {
  if (!date) return '';
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

module.exports = {
  initializeIAContext,
  getAvailabilityBySpecialty
};

