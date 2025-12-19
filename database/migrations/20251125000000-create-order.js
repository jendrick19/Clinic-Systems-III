'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Orders', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      episodeId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Episodes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      type: {
        type: Sequelize.ENUM('laboratorio', 'imagen', 'procedimiento'),
        allowNull: false
      },
      priority: {
        type: Sequelize.ENUM('normal', 'urgente'),
        allowNull: false,
        defaultValue: 'normal'
      },
      status: {
        type: Sequelize.ENUM('emitida', 'autorizada', 'en curso', 'completada', 'anulada'),
        allowNull: false,
        defaultValue: 'emitida'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Orders');
  }
};

