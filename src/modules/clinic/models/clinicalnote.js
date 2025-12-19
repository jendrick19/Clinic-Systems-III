'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ClinicalNote extends Model {
    static associate(models) {
      ClinicalNote.belongsTo(models.Professional, {
        foreignKey: 'professionalId',
        as: 'professional'
      });
      ClinicalNote.belongsTo(models.Episode, {
        foreignKey: 'episodeId',
        as: 'episode'
      });
      ClinicalNote.hasMany(models.ClinicalNoteVersion, {
        foreignKey: 'noteId',
        as: 'clinicalNoteVersions'
      });
    }
  }
  ClinicalNote.init({
    episodeId: DataTypes.INTEGER,
    professionalId: DataTypes.INTEGER,
    noteDate: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'ClinicalNote',
  });
  return ClinicalNote;
};