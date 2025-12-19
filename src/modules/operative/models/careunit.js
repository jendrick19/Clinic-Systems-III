'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CareUnit extends Model {
    static associate(models) {
      CareUnit.hasMany(models.Schedule, {
        foreignKey: 'unitId',
        as: 'schedules'
      });
      CareUnit.hasMany(models.Appointment, {
        foreignKey: 'unitId',
        as: 'appointments'
      });
    }
  }
  CareUnit.init({
    name: DataTypes.STRING,
    type: DataTypes.ENUM('sede', 'consultorio', 'servicio'),
    address: DataTypes.STRING,
    telephone: DataTypes.STRING,
    businessHours: DataTypes.STRING,
    status: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'CareUnit',
  });
  return CareUnit;
};