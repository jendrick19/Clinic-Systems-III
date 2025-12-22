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

    // Crear agendas para el único odontólogo
    const schedules = [
      {
        professionalId: professionalId,
        unitId: unitId,
        startTime: new Date('2025-12-01 08:00:00'),
        endTime: new Date('2025-12-01 16:00:00'),
        capacity: 20,
        status: 'abierta',
        createdAt: now,
        updatedAt: now,
      },
      {
        professionalId: professionalId,
        unitId: unitId,
        startTime: new Date('2025-12-02 09:00:00'),
        endTime: new Date('2025-12-02 15:00:00'),
        capacity: 15,
        status: 'abierta',
        createdAt: now,
        updatedAt: now,
      },
      {
        professionalId: professionalId,
        unitId: unitId,
        startTime: new Date('2025-12-03 07:00:00'),
        endTime: new Date('2025-12-03 19:00:00'),
        capacity: 30,
        status: 'reservada',
        createdAt: now,
        updatedAt: now,
      },
      {
        professionalId: professionalId,
        unitId: unitId,
        startTime: new Date('2025-12-04 08:00:00'),
        endTime: new Date('2025-12-04 16:00:00'),
        capacity: 10,
        status: 'abierta',
        createdAt: now,
        updatedAt: now,
      },
      {
        professionalId: professionalId,
        unitId: unitId,
        startTime: new Date('2025-12-05 10:00:00'),
        endTime: new Date('2025-12-05 14:00:00'),
        capacity: 8,
        status: 'cerrada',
        createdAt: now,
        updatedAt: now,
      },
    ];
    await queryInterface.bulkInsert('Schedules', schedules, {});
    console.log('✅ Seeder ejecutado: 5 agendas creadas para el odontólogo');
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
