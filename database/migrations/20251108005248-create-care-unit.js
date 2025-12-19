'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('CareUnits', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      type: {
        type: Sequelize.ENUM('sede', 'consultorio', 'servicio'), 
        allowNull: true
      },
      address: {
        type: Sequelize.STRING,
        allowNull: true
      },
      telephone: {
        type: Sequelize.STRING,
        allowNull: true
      },
      businessHours: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
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
    await queryInterface.dropTable('CareUnits');
  }
};