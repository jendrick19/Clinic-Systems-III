'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Insurers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nombre: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      nit: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true
      },
      contacto: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      estado: {
        type: Sequelize.ENUM('activo', 'inactivo'),
        allowNull: false,
        defaultValue: 'activo'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Índices para optimizar búsquedas
    await queryInterface.addIndex('Insurers', ['nit'], {
      name: 'idx_insurers_nit'
    });
    
    await queryInterface.addIndex('Insurers', ['estado'], {
      name: 'idx_insurers_estado'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Insurers');
  }
};

