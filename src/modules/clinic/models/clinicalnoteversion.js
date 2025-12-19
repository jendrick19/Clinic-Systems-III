'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ClinicalNoteVersion extends Model {
    static associate(models) {
      ClinicalNoteVersion.belongsTo(models.ClinicalNote, {
        foreignKey: 'noteId',
        as: 'clinicalNote'
      });
    }
  }
  ClinicalNoteVersion.init({
    noteId: DataTypes.INTEGER,
    versionDate: DataTypes.DATE,
    subjective: DataTypes.TEXT,
    objective: DataTypes.TEXT,
    analysis: DataTypes.TEXT,
    plan: DataTypes.TEXT,
    attachments: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'ClinicalNoteVersion',
  });
  return ClinicalNoteVersion;
};