'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    // Obtener el ID del único odontólogo (professionalId: 1)
    const professional = await queryInterface.sequelize.query(
      `SELECT id FROM Profesionals WHERE professionalRegister = 'OD-01' LIMIT 1`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (professional.length === 0) {
      throw new Error('No se encontró el profesional OD-01. Ejecuta primero el seeder de profesionales.');
    }

    const professionalId = professional[0].id;

    // Obtener el ID de la primera unidad de cuidado
    const careUnit = await queryInterface.sequelize.query(
      `SELECT id FROM CareUnits WHERE status = 1 ORDER BY id ASC LIMIT 1`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (careUnit.length === 0) {
      throw new Error('No se encontró una unidad de cuidado activa. Ejecuta primero el seeder de unidades de cuidado.');
    }

    const unitId = careUnit[0].id;

    // Crear agendas para el único odontólogo (Enero 2026)
    const schedulesToCreate = [
      {
        professionalId: professionalId,
        unitId: unitId,
        startTime: new Date('2026-01-05 08:00:00'),
        endTime: new Date('2026-01-05 16:00:00'),
        capacity: 20,
        status: 'abierta',
        createdAt: now,
        updatedAt: now,
      },
      {
        professionalId: professionalId,
        unitId: unitId,
        startTime: new Date('2026-01-06 09:00:00'),
        endTime: new Date('2026-01-06 15:00:00'),
        capacity: 15,
        status: 'abierta',
        createdAt: now,
        updatedAt: now,
      },
      {
        professionalId: professionalId,
        unitId: unitId,
        startTime: new Date('2026-01-07 07:00:00'),
        endTime: new Date('2026-01-07 19:00:00'),
        capacity: 30,
        status: 'reservada',
        createdAt: now,
        updatedAt: now,
      },
      {
        professionalId: professionalId,
        unitId: unitId,
        startTime: new Date('2026-01-08 08:00:00'),
        endTime: new Date('2026-01-08 16:00:00'),
        capacity: 10,
        status: 'abierta',
        createdAt: now,
        updatedAt: now,
      },
      {
        professionalId: professionalId,
        unitId: unitId,
        startTime: new Date('2026-01-09 10:00:00'),
        endTime: new Date('2026-01-09 14:00:00'),
        capacity: 8,
        status: 'cerrada',
        createdAt: now,
        updatedAt: now,
      },
    ];

    const toInsert = [];
    for (const schedule of schedulesToCreate) {
      const existing = await queryInterface.sequelize.query(
        `SELECT id FROM Schedules WHERE professionalId = ${schedule.professionalId} AND startTime = '${schedule.startTime.toISOString().slice(0, 19).replace('T', ' ')}'`,
        { type: Sequelize.QueryTypes.SELECT }
      );
      if (existing.length === 0) {
        toInsert.push(schedule);
      }
    }

    if (toInsert.length > 0) {
      await queryInterface.bulkInsert('Schedules', toInsert, {});
      console.log(`✅ Seeder ejecutado: ${toInsert.length} agendas creadas para el odontólogo`);
    } else {
      console.log('⚠️ Las agendas ya existen, omitiendo creación');
    }
  },
  async down(queryInterface, Sequelize) {
    // Eliminar agendas del odontólogo OD-01
    const professional = await queryInterface.sequelize.query(
      `SELECT id FROM Profesionals WHERE professionalRegister = 'OD-01' LIMIT 1`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (professional.length > 0) {
      await queryInterface.bulkDelete('Schedules', {
        professionalId: professional[0].id
      }, {});
    }
    console.log('✅ Rollback ejecutado: Agendas eliminadas');
  }
};
