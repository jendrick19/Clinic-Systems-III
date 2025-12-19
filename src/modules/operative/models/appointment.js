'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Appointment extends Model {
    static associate(models) {
      Appointment.belongsTo(models.Professional, {
        foreignKey: 'professionalId',
        as: 'professional'
      });
      Appointment.belongsTo(models.PeopleAttended, {
        foreignKey: 'peopleId',
        as: 'peopleAttended'
      });
      Appointment.belongsTo(models.Schedule, {
        foreignKey: 'scheduleId',
        as: 'schedule'
      });
      Appointment.belongsTo(models.CareUnit, {
        foreignKey: 'unitId',
        as: 'careUnit'
      });
      Appointment.hasMany(models.AppointmentHistory, {
        foreignKey: 'appointmentId',
        as: 'history'
      });
    }
  }
  Appointment.init({
    peopleId: DataTypes.INTEGER,
    professionalId: DataTypes.INTEGER,
    scheduleId: DataTypes.INTEGER,
    unitId: DataTypes.INTEGER,
    startTime: DataTypes.DATE,
    endTime: DataTypes.DATE,
    reason: DataTypes.STRING,
    channel: DataTypes.ENUM('presencial', 'virtual'),
    status: DataTypes.ENUM('solicitada', 'confirmada', 'cumplida', 'no asistio'),
    observations: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Appointment',
  });
  return Appointment;
};