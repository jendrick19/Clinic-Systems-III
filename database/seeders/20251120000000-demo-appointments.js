'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const motivos = [
      'Consulta general de control',
      'Dolor abdominal persistente',
      'Control de presión arterial',
      'Revisión de exámenes de laboratorio',
      'Dolor de cabeza frecuente',
      'Control post-operatorio',
      'Evaluación dermatológica',
      'Chequeo cardiológico',
      'Consulta pediátrica de rutina',
      'Dolor en articulaciones',
      'Control de diabetes',
      'Evaluación neurológica',
      'Consulta oftalmológica',
      'Control prenatal',
      'Revisión odontológica',
      'Dolor de espalda crónico',
      'Evaluación nutricional',
      'Control de asma',
      'Consulta de traumatología',
      'Chequeo anual preventivo'
    ];
    const observaciones = [
      'Paciente en ayunas',
      'Traer exámenes previos',
      'Primera consulta',
      'Paciente requiere atención urgente',
      'Traer radiografías',
      null,
      'Paciente con movilidad reducida',
      'Consulta de seguimiento',
      null,
      'Paciente alérgico a penicilina',
      'Traer historia clínica',
      null,
      'Paciente embarazada - segundo trimestre',
      'Requiere acompañante',
      null,
      'Consulta por referencia',
      'Paciente pediátrico',
      null,
      'Traer carnet de vacunación',
      'Consulta prioritaria'
    ];
    const canales = ['Presencial', 'Virtual'];
    const estados = ['Solicitada', 'Confirmada', 'Cumplida', 'Cancelada', 'No asistio'];
    const appointments = [];
    const generarFecha = (diasDesdeHoy) => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() + diasDesdeHoy);
      return fecha;
    };
    const generarHorario = (fecha, horaInicio) => {
      const start = new Date(fecha);
      start.setHours(horaInicio, 0, 0, 0);
      const end = new Date(start);
      end.setMinutes(start.getMinutes() + 30); 
      return { start, end };
    };
    // Obtener el ID del único odontólogo
    const professional = await queryInterface.sequelize.query(
      `SELECT id FROM Profesionals WHERE professionalRegister = 'OD-01' LIMIT 1`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (professional.length === 0) {
      throw new Error('No se encontró el profesional OD-01. Ejecuta primero el seeder de profesionales.');
    }

    const professionalId = professional[0].id;

    // Obtener los IDs de las schedules del odontólogo
    const schedules = await queryInterface.sequelize.query(
      `SELECT id FROM Schedules WHERE professionalId = ${professionalId}`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const scheduleIds = schedules.map(s => s.id);

    // Obtener los IDs de los pacientes disponibles
    const people = await queryInterface.sequelize.query(
      `SELECT id FROM PeopleAttendeds WHERE status = 1 ORDER BY id ASC`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (people.length === 0) {
      throw new Error('No hay pacientes disponibles. Ejecuta primero el seeder de pacientes.');
    }

    const peopleIds = people.map(p => p.id);

    // Obtener el ID de la primera unidad de cuidado
    const careUnit = await queryInterface.sequelize.query(
      `SELECT id FROM CareUnits WHERE status = 1 ORDER BY id ASC LIMIT 1`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (careUnit.length === 0) {
      throw new Error('No se encontró una unidad de cuidado activa. Ejecuta primero el seeder de unidades de cuidado.');
    }

    const unitId = careUnit[0].id;

    const randomItem = (array) => array[Math.floor(Math.random() * array.length)];
    for (let i = 0; i < 30; i++) {
      let diasOffset;
      let estado;
      if (i < 10) {
        diasOffset = -30 + i * 2;
        estado = randomItem(['Cumplida', 'Cancelada', 'No asistio']);
      } else if (i < 20) {
        diasOffset = i - 10;
        estado = randomItem(['Solicitada', 'Confirmada']);
      } else {
        diasOffset = 5 + (i - 20) * 2;
        estado = randomItem(['Solicitada', 'Confirmada']);
      }
      const fechaCita = generarFecha(diasOffset);
      const hora = 8 + (i % 8); 
      const { start, end } = generarHorario(fechaCita, hora);
      const peopleId = randomItem(peopleIds);
      const scheduleId = scheduleIds.length > 0 && Math.random() > 0.3 
        ? randomItem(scheduleIds) 
        : null;
      appointments.push({
        peopleId,
        professionalId,
        unitId,
        scheduleId, 
        startTime: start,
        endTime: end,
        channel: randomItem(canales),
        status: estado,
        reason: motivos[i % motivos.length],
        observations: observaciones[i % observaciones.length],
        createdAt: new Date(start.getTime() - 7 * 24 * 60 * 60 * 1000), 
        updatedAt: now
      });
    }
    await queryInterface.bulkInsert('Appointments', appointments, {});
    console.log('✅ Seeder ejecutado: 30 citas creadas');
    const appointmentHistories = [
      {
        appointmentId: 1,
        oldStatus: 'Solicitada',
        newStatus: 'Confirmada',
        oldStartTime: null,
        newStartTime: null,
        oldEndTime: null,
        newEndTime: null,
        changeReason: 'Confirmación del paciente vía telefónica',
        changedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), 
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        appointmentId: 1,
        oldStatus: 'Confirmada',
        newStatus: 'Cumplida',
        oldStartTime: null,
        newStartTime: null,
        oldEndTime: null,
        newEndTime: null,
        changeReason: 'Paciente asistió a la consulta',
        changedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), 
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        appointmentId: 3,
        oldStatus: null,
        newStatus: null,
        oldStartTime: generarHorario(generarFecha(-26), 8).start,
        newStartTime: generarHorario(generarFecha(-26), 10).start,
        oldEndTime: generarHorario(generarFecha(-26), 8).end,
        newEndTime: generarHorario(generarFecha(-26), 10).end,
        changeReason: 'Reagendamiento por solicitud del paciente',
        changedAt: new Date(now.getTime() - 27 * 24 * 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 27 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 27 * 24 * 60 * 60 * 1000)
      },
      {
        appointmentId: 5,
        oldStatus: 'Confirmada',
        newStatus: 'Cancelada',
        oldStartTime: null,
        newStartTime: null,
        oldEndTime: null,
        newEndTime: null,
        changeReason: 'Paciente no puede asistir por motivos personales',
        changedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000)
      },
      {
        appointmentId: 7,
        oldStatus: 'Confirmada',
        newStatus: 'No asistio',
        oldStartTime: null,
        newStartTime: null,
        oldEndTime: null,
        newEndTime: null,
        changeReason: 'Paciente no se presentó a la cita',
        changedAt: new Date(now.getTime() - 16 * 24 * 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 16 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 16 * 24 * 60 * 60 * 1000)
      },
      {
        appointmentId: 11,
        oldStatus: 'Solicitada',
        newStatus: 'Confirmada',
        oldStartTime: null,
        newStartTime: null,
        oldEndTime: null,
        newEndTime: null,
        changeReason: 'Confirmación automática del sistema',
        changedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        appointmentId: 15,
        oldStatus: 'Solicitada',
        newStatus: 'Confirmada',
        oldStartTime: generarHorario(generarFecha(5), 9).start,
        newStartTime: generarHorario(generarFecha(5), 11).start,
        oldEndTime: generarHorario(generarFecha(5), 9).end,
        newEndTime: generarHorario(generarFecha(5), 11).end,
        changeReason: 'Cambio de horario por disponibilidad del profesional',
        changedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000), 
        createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000)
      },
      {
        appointmentId: 20,
        oldStatus: 'Solicitada',
        newStatus: 'Confirmada',
        oldStartTime: null,
        newStartTime: null,
        oldEndTime: null,
        newEndTime: null,
        changeReason: 'Primera confirmación',
        changedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        appointmentId: 20,
        oldStatus: null,
        newStatus: null,
        oldStartTime: generarHorario(generarFecha(10), 14).start,
        newStartTime: generarHorario(generarFecha(10), 15).start,
        oldEndTime: generarHorario(generarFecha(10), 14).end,
        newEndTime: generarHorario(generarFecha(10), 15).end,
        changeReason: 'Ajuste de horario por reorganización de agenda',
        changedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000)
      }
    ];
    await queryInterface.bulkInsert('AppointmentHistories', appointmentHistories, {});
    console.log('✅ Seeder ejecutado: 9 registros de historial creados');
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('AppointmentHistories', {
      appointmentId: {
        [Sequelize.Op.between]: [1, 30]
      }
    }, {});
    console.log('✅ Rollback: Historial de citas eliminado');
    await queryInterface.bulkDelete('Appointments', {
      id: {
        [Sequelize.Op.between]: [1, 30]
      }
    }, {});
    console.log('✅ Rollback: Citas eliminadas');
  }
};
