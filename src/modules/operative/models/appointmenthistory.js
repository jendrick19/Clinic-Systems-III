'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AppointmentHistory extends Model {
    static associate(models) {
      AppointmentHistory.belongsTo(models.Appointment, {
        foreignKey: 'appointmentId',
        as: 'appointment'
      });
    }
  }
  AppointmentHistory.init({
    appointmentId: DataTypes.INTEGER,
    oldStatus: DataTypes.ENUM('solicitada', 'confirmada', 'cumplida', 'cancelada', 'no asistio'),
    newStatus: DataTypes.ENUM('solicitada', 'confirmada', 'cumplida', 'cancelada', 'no asistio'),
    oldStartTime: DataTypes.DATE,
    newStartTime: DataTypes.DATE,
    oldEndTime: DataTypes.DATE,
    newEndTime: DataTypes.DATE,
    changeReason: DataTypes.TEXT,
    changedAt: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'AppointmentHistory',
  });
  return AppointmentHistory;
};
