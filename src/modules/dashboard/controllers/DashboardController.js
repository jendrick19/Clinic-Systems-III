const db = require('../../../../database/models');
const { Op } = require('sequelize');

/**
 * Obtiene estadísticas del dashboard para un usuario
 * GET /api/dashboard/stats?userId=X&entityId=Y
 */
async function getDashboardStats(req, res) {
    try {
        const { userId, entityId } = req.query;

        if (!userId && !entityId) {
            return res.status(400).json({
                success: false,
                message: 'Se requiere userId o entityId'
            });
        }

        // Determinar si es profesional o paciente
        const Professional = db.Professional;
        const PeopleAttended = db.modules.operative.PeopleAttended;

        let professional = null;
        let patient = null;
        let role = 'patient';

        if (entityId) {
            professional = await Professional.findByPk(entityId);
            console.log('[getDashboardStats] Buscando profesional con entityId:', entityId);
            console.log('[getDashboardStats] Profesional encontrado:', professional ? `${professional.names} ${professional.surNames}` : 'NO');
        }

        if (professional) {
            role = 'professional';
            console.log('[getDashboardStats] ROL DETECTADO: PROFESIONAL');
        } else {
            if (entityId) {
                patient = await PeopleAttended.findByPk(entityId);
                console.log('[getDashboardStats] Buscando paciente con entityId:', entityId);
            } else if (userId) {
                patient = await PeopleAttended.findByPk(userId);
                console.log('[getDashboardStats] Buscando paciente con userId:', userId);
            }
            if (patient) {
                console.log('[getDashboardStats] ROL DETECTADO: PACIENTE -', `${patient.names} ${patient.surNames}`);
            }
        }

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        let stats = {};

        if (role === 'professional' && professional) {
            // === ESTADÍSTICAS PARA PROFESIONAL ===

            // Citas del día
            const citasHoy = await db.Appointment.count({
                where: {
                    professionalId: professional.id,
                    startTime: {
                        [Op.gte]: today,
                        [Op.lt]: tomorrow
                    },
                    status: { [Op.notIn]: ['cancelada', 'no asistio'] }
                }
            });

            // Próximas citas (futuras)
            const proximasCitas = await db.Appointment.count({
                where: {
                    professionalId: professional.id,
                    startTime: { [Op.gte]: now },
                    status: { [Op.notIn]: ['cancelada', 'no asistio'] }
                }
            });

            // Pacientes activos (pacientes únicos con citas)
            const pacientesActivos = await db.Appointment.count({
                where: {
                    professionalId: professional.id,
                    status: { [Op.notIn]: ['cancelada', 'no asistio'] }
                },
                distinct: true,
                col: 'peopleId'
            });

            // Próxima cita detallada (sin include para evitar error de alias)
            const proximaCita = await db.Appointment.findOne({
                where: {
                    professionalId: professional.id,
                    startTime: { [Op.gte]: now },
                    status: { [Op.notIn]: ['cancelada', 'no asistio'] }
                },
                order: [['startTime', 'ASC']]
            });

            let nextAppointment = null;
            if (proximaCita) {
                const aptDate = new Date(proximaCita.startTime);

                // Cargar paciente manualmente
                let patientName = 'Paciente';
                if (proximaCita.peopleId) {
                    try {
                        const patientData = await PeopleAttended.findByPk(proximaCita.peopleId, {
                            attributes: ['names', 'surNames']
                        });
                        if (patientData) {
                            patientName = `${patientData.names} ${patientData.surNames}`;
                        }
                    } catch (err) {
                        console.warn('[getDashboardStats] Error cargando paciente:', err.message);
                    }
                }

                nextAppointment = {
                    fecha: aptDate.toLocaleDateString('es-VE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    }),
                    hora: aptDate.toLocaleTimeString('es-VE', {
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    paciente: patientName,
                    estado: proximaCita.status
                };
            }

            // Cargar lista de todas las próximas citas con detalles
            const allUpcomingAppointments = await db.Appointment.findAll({
                where: {
                    professionalId: professional.id,
                    startTime: { [Op.gte]: now },
                    status: { [Op.notIn]: ['cancelada', 'no asistio'] }
                },
                order: [['startTime', 'ASC']],
                limit: 10  // Limitar a las próximas 10 citas
            });

            // Cargar pacientes para cada cita
            const upcomingAppointmentsList = [];
            for (const apt of allUpcomingAppointments) {
                let patientName = 'Paciente';
                if (apt.peopleId) {
                    try {
                        const patientData = await PeopleAttended.findByPk(apt.peopleId, {
                            attributes: ['names', 'surNames']
                        });
                        if (patientData) {
                            patientName = `${patientData.names} ${patientData.surNames}`;
                        }
                    } catch (err) {
                        console.warn('[getDashboardStats] Error cargando paciente para cita:', err.message);
                    }
                }

                const aptDate = new Date(apt.startTime);
                upcomingAppointmentsList.push({
                    id: apt.id,
                    paciente: patientName,
                    fecha: aptDate.toLocaleDateString('es-VE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    }),
                    hora: aptDate.toLocaleTimeString('es-VE', {
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    estado: apt.status
                });
            }

            stats = {
                role: 'professional',
                citasHoy,
                pacientesActivos,
                proximasCitas,
                nextAppointment,
                upcomingAppointments: upcomingAppointmentsList
            };

            console.log('[getDashboardStats] Estadísticas de PROFESIONAL:', stats);

        } else if (patient) {
            // === ESTADÍSTICAS PARA PACIENTE ===

            // Citas programadas (futuras)
            const citasProgramadas = await db.Appointment.count({
                where: {
                    peopleId: patient.id,
                    startTime: { [Op.gte]: now },
                    status: { [Op.notIn]: ['cancelada', 'no asistio'] }
                }
            });

            // Visitas realizadas (pasadas completadas)
            const visitasRealizadas = await db.Appointment.count({
                where: {
                    peopleId: patient.id,
                    startTime: { [Op.lt]: now },
                    status: 'completada'
                }
            });

            // Próxima cita detallada
            const proximaCita = await db.Appointment.findOne({
                where: {
                    peopleId: patient.id,
                    startTime: { [Op.gte]: now },
                    status: { [Op.notIn]: ['cancelada', 'no asistio'] }
                },
                include: [{
                    model: db.Professional,
                    as: 'professional',
                    attributes: ['names', 'surNames', 'specialty']
                }],
                order: [['startTime', 'ASC']]
            });

            let nextAppointment = null;
            if (proximaCita) {
                const aptDate = new Date(proximaCita.startTime);
                nextAppointment = {
                    fecha: aptDate.toLocaleDateString('es-VE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    }),
                    hora: aptDate.toLocaleTimeString('es-VE', {
                        hour: '2-digit',
                        minute: '2-digit'
                    }),
                    odontologo: proximaCita.professional ?
                        `${proximaCita.professional.names} ${proximaCita.professional.surNames}` :
                        'Por asignar',
                    especialidad: proximaCita.professional?.specialty || 'General',
                    estado: proximaCita.status
                };
            }

            stats = {
                role: 'patient',
                citasProgramadas,
                visitasRealizadas,
                nextAppointment
            };
        }

        return res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        console.error('[getDashboardStats Error]:', error);
        return res.status(500).json({
            success: false,
            message: 'Error al obtener estadísticas',
            error: error.message
        });
    }
}

module.exports = {
    getDashboardStats
};
