'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    
    // Crear un paciente de prueba fijo
    const testPatient = {
      documentType: 'cedula',
      documentId: '12345678',
      names: 'Paciente',
      surNames: 'De Prueba',
      dateOfBirth: new Date(1990, 0, 1),
      gender: 'm',
      phone: '3001234567',
      email: 'paciente.prueba@example.com',
      address: 'Calle Falsa 123',
      emergencyContact: 'Contacto de Emergencia - 3110000000',
      alergias: 'Ninguna',
      status: true,
      createdAt: now,
      updatedAt: now
    };

    // Verificar si ya existe
    const existingPatient = await queryInterface.sequelize.query(
      `SELECT id FROM PeopleAttendeds WHERE documentId = '12345678' AND documentType = 'cedula'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existingPatient.length === 0) {
      await queryInterface.bulkInsert('PeopleAttendeds', [testPatient], {});
      console.log('✅ Seeder ejecutado: Paciente de prueba (12345678) creado');
    } else {
      console.log('⚠️ El paciente de prueba 12345678 ya existe');
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('PeopleAttendeds', {
      documentId: '12345678'
    }, {});
    console.log('✅ Rollback ejecutado: Paciente de prueba eliminado');
  }
};

