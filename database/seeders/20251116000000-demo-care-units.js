'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const nombres = [
      'Sede Principal',
      'Consultorio Norte',
      'Servicio de Urgencias',
      'Sede Sur',
      'Consultorio Central',
      'Servicio de Pediatría',
      'Sede Este',
      'Consultorio Oeste',
      'Servicio de Cardiología',
      'Sede Centro'
    ];
    const tipos = [
      'sede',
      'consultorio',
      'servicio',
      'sede',
      'consultorio',
      'servicio',
      'sede',
      'consultorio',
      'servicio',
      'sede'
    ];
    const direcciones = [
      'Avenida Principal #123-45, Barrio Centro',
      'Calle 50 #30-20, Zona Norte',
      'Carrera 15 #25-10, Sector Hospitalario',
      'Avenida Sur #80-15, Barrio Sur',
      'Calle 30 #40-25, Centro Comercial',
      'Avenida Los Médicos #100-50, Zona Hospital',
      'Carrera 20 #60-30, Barrio Este',
      'Calle 70 #10-40, Zona Oeste',
      'Avenida Cardiólogos #200-80, Sector Médico',
      'Calle Central #5-10, Plaza Principal'
    ];
    const telefonos = [
      '+57 1 2345678',
      '+57 1 3456789',
      '+57 1 4567890',
      '+57 1 5678901',
      '+57 1 6789012',
      '+57 1 7890123',
      '+57 1 8901234',
      '+57 1 9012345',
      '+57 1 0123456',
      '+57 1 1234567'
    ];
    const horariosAtencion = [
      'Lunes a Viernes: 8:00 AM - 6:00 PM',
      'Lunes a Sábado: 7:00 AM - 7:00 PM',
      '24 horas - Todos los días',
      'Lunes a Viernes: 7:00 AM - 5:00 PM',
      'Lunes a Viernes: 8:00 AM - 8:00 PM, Sábados: 8:00 AM - 2:00 PM',
      'Lunes a Domingo: 6:00 AM - 10:00 PM',
      'Lunes a Viernes: 9:00 AM - 5:00 PM',
      'Lunes a Sábado: 8:00 AM - 6:00 PM',
      'Lunes a Viernes: 7:00 AM - 7:00 PM',
      'Lunes a Viernes: 8:00 AM - 4:00 PM'
    ];
    const careUnits = [];
    for (let i = 0; i < 10; i++) {
      careUnits.push({
        name: nombres[i],
        type: tipos[i],
        address: direcciones[i],
        telephone: telefonos[i],
        businessHours: horariosAtencion[i],
        status: i < 9, 
        createdAt: now,
        updatedAt: now
      });
    }
    await queryInterface.bulkInsert('CareUnits', careUnits, {});
    console.log('✅ Seeder ejecutado: 10 unidades de atención creadas');
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('CareUnits', {
      name: {
        [Sequelize.Op.in]: [
          'Sede Principal',
          'Consultorio Norte',
          'Servicio de Urgencias',
          'Sede Sur',
          'Consultorio Central',
          'Servicio de Pediatría',
          'Sede Este',
          'Consultorio Oeste',
          'Servicio de Cardiología',
          'Sede Centro'
        ]
      }
    }, {});
    console.log('✅ Rollback ejecutado: Unidades de atención eliminadas');
  }
};
