 'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Episode extends Model {
    static associate(models) {
      Episode.hasMany(models.ClinicalNote, {
        foreignKey: 'episodeId',
        as: 'clinicalNotes'
      });
      Episode.belongsTo(models.PeopleAttended, {
        foreignKey: 'peopleId',
        as: 'peopleAttended'
      });
      Episode.hasMany(models.Diagnosis, {
        foreignKey: 'episodeId',
        as: 'diagnosis'
      });
      Episode.hasMany(models.Order, {
        foreignKey: 'episodeId',
        as: 'orders'
      });
    }
  }
  Episode.init({
    peopleId: DataTypes.INTEGER,
    openingDate: DataTypes.DATE,
    reason: DataTypes.STRING,
    type: DataTypes.ENUM('consulta', 'procedimiento', 'control', 'urgencia'),
    status: DataTypes.ENUM('abierto', 'cerrado'),
  }, {
    sequelize,
    modelName: 'Episode',
  });
  return Episode;
};