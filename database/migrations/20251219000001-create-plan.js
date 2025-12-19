'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Plans', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      aseguradoraId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Insurers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      nombre: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      codigo: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      tipo: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      condicionesGenerales: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      activo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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
    await queryInterface.addIndex('Plans', ['aseguradoraId'], {
      name: 'idx_plans_aseguradora_id'
    });
    
    await queryInterface.addIndex('Plans', ['codigo'], {
      name: 'idx_plans_codigo'
    });
    
    await queryInterface.addIndex('Plans', ['activo'], {
      name: 'idx_plans_activo'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Plans');
  }
};

