'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Insurers', [
      {
        nombre: 'Seguros Bolívar',
        nit: 'J-30045626-7',
        contacto: 'contacto@segurosbolivar.com.ve | +58-212-555-0100',
        estado: 'activo',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'Seguros Caracas',
        nit: 'J-00015864-4',
        contacto: 'info@seguroscaracas.com.ve | +58-212-555-0200',
        estado: 'activo',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'Seguros Mercantil',
        nit: 'J-00093413-0',
        contacto: 'atencion@segurosmercantil.com | +58-212-555-0300',
        estado: 'activo',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'Seguros La Previsora',
        nit: 'J-00021888-5',
        contacto: 'servicio@laprevisora.com.ve | +58-212-555-0400',
        estado: 'activo',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'Seguros Horizonte',
        nit: 'J-31234567-8',
        contacto: 'contacto@seguroshorizonte.com.ve | +58-212-555-0500',
        estado: 'activo',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        nombre: 'Seguros Universitas',
        nit: 'J-00028020-2',
        contacto: 'info@universitas.com.ve | +58-212-555-0600',
        estado: 'inactivo',
        createdAt: new Date(),
        updatedAt: new Date()
      },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Insurers', null, {});
  }
};

