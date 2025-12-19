'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PeopleAttended extends Model {
    static associate(models) {
      PeopleAttended.hasMany(models.Episode, {
        foreignKey: 'peopleId',
        as: 'episodes'
      });
      PeopleAttended.hasMany(models.Appointment, {
        foreignKey: 'peopleId',
        as: 'appointments'
      });
      PeopleAttended.hasMany(models.Consent, {
        foreignKey: 'peopleId',
        as: 'consents'
      });
    }
  }
  PeopleAttended.init({
    documentType: DataTypes.ENUM('cedula', 'rif', 'pasaporte', 'otro'),
    documentId: DataTypes.STRING,
    names: DataTypes.STRING,
    surNames: DataTypes.STRING,
    dateOfBirth: DataTypes.DATE,
    gender: DataTypes.ENUM('m', 'f', 'o'),
    phone: DataTypes.STRING,
    email: DataTypes.STRING,
    address: DataTypes.STRING,
    emergencyContact: DataTypes.STRING,
    allergies: DataTypes.STRING,
    status: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'PeopleAttended',
  });
  return PeopleAttended;
};