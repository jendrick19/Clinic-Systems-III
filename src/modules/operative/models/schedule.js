'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Schedule extends Model {
    static associate(models) {
      Schedule.belongsTo(models.Professional, {
        foreignKey: 'professionalId',
        as: 'professional'
      });
      Schedule.belongsTo(models.CareUnit, {
        foreignKey: 'unitId',
        as: 'careUnit'
      });
      Schedule.hasMany(models.Appointment, {
        foreignKey: 'scheduleId',
        as: 'appointments'
      });
    }
  }
  Schedule.init({
    professionalId: DataTypes.INTEGER,
    unitId: DataTypes.INTEGER,
    startTime: DataTypes.DATE,
    endTime: DataTypes.DATE,
    capacity: DataTypes.INTEGER,
    status: DataTypes.ENUM('abierta', 'cerrado', 'reservado'),
  }, {
    sequelize,
    modelName: 'Schedule',
  });
  return Schedule;
};