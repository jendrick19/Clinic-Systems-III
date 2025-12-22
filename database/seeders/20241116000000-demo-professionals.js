'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Verificar si ya existe el odontólogo
    const existingProfessional = await queryInterface.sequelize.query(
      `SELECT id FROM Profesionals WHERE professionalRegister = 'OD-01'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (existingProfessional.length > 0) {
      console.log('⚠️ El odontólogo OD-01 ya existe, omitiendo creación');
      return;
    }

    const now = new Date();
    
    // Verificar si ya existe el usuario
    const existingUser = await queryInterface.sequelize.query(
      `SELECT id FROM Users WHERE email = 'odontologo@clinicadental.com'`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    let userId;
    
    if (existingUser.length > 0) {
      // Usuario ya existe, usar su ID
      userId = existingUser[0].id;
      console.log('⚠️ El usuario ya existe, usando ID existente');
    } else {
      // Crear un solo usuario para el odontólogo
      const user = {
        username: 'dr.odontologo',
        email: 'odontologo@clinicadental.com',
        passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJ',
        status: true,
        creationDate: now,
        createdAt: now,
        updatedAt: now,
      };

      await queryInterface.bulkInsert('Users', [user], {});
      
      // Obtener el ID del usuario recién creado
      const insertedUsers = await queryInterface.sequelize.query(
        `SELECT id FROM Users WHERE email = 'odontologo@clinicadental.com'`,
        { type: Sequelize.QueryTypes.SELECT }
      );

      if (insertedUsers.length === 0) {
        throw new Error('No se pudo crear el usuario del odontólogo');
      }

      userId = insertedUsers[0].id;
    }

    // Crear un solo odontólogo
    const professional = {
      userId: userId,
      names: 'Dr. Juan',
      surNames: 'Pérez García',
      professionalRegister: 'OD-01',
      specialty: 'Odontología',
      email: 'odontologo@clinicadental.com',
      phone: '+584121234567',
      scheduleEnabled: true,
      status: true,
      createdAt: now,
      updatedAt: now,
    };

    await queryInterface.bulkInsert('Profesionals', [professional], {});
    console.log('✅ Seeder ejecutado: 1 odontólogo creado');
  },

  async down(queryInterface, Sequelize) {
    // Eliminar el profesional
    await queryInterface.bulkDelete('Profesionals', {
      professionalRegister: 'OD-01'
    }, {});

    // Eliminar el usuario
    await queryInterface.bulkDelete('Users', {
      email: 'odontologo@clinicadental.com'
    }, {});

    console.log('✅ Rollback ejecutado: Odontólogo y usuario eliminados');
  }
};
