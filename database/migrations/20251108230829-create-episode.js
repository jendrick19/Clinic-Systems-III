'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Episodes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      peopleId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
            model: 'PeopleAttendeds', 
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      openingDate: {
        type: Sequelize.DATE
      },
      reason: {
        type: Sequelize.STRING
      },
      type: {
        type: Sequelize.ENUM('consulta', 'procedimiento', 'control', 'urgencia'), 
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('abierto', 'cerrado'),
        allowNull: false,
        defaultValue: 'abierto'
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
    await queryInterface.dropTable('Episodes');
  }
};