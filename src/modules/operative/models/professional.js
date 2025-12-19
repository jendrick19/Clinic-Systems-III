'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Professional extends Model {
    static associate(models) {
      Professional.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
      Professional.hasMany(models.Appointment, {
        foreignKey: 'professionalId',
        as: 'appointments'
      });
      Professional.hasMany(models.Schedule, {
        foreignKey: 'professionalId',
        as: 'schedules'
      });
      Professional.hasMany(models.ClinicalNote, {
        foreignKey: 'professionalId',
        as: 'clinicalNotes'
      });
    }
  }
  Professional.init({
    userId: DataTypes.INTEGER,
    names: DataTypes.STRING,
    surNames: DataTypes.STRING,
    professionalRegister: DataTypes.STRING,
    specialty: DataTypes.STRING,
    email: DataTypes.STRING,
    phone: DataTypes.STRING,
    scheduleEnabled: DataTypes.BOOLEAN,
    status: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Professional',
    tableName: 'Profesionals',
  });
  return Professional;
};