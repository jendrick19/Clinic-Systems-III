'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Diagnosis extends Model {
    static associate(models) {
      Diagnosis.belongsTo(models.Episode, {
        foreignKey: 'episodeId',
        as: 'episode'
      });
    }
  }
  Diagnosis.init({
    episodeId: DataTypes.INTEGER,
    code: DataTypes.STRING,
    description: DataTypes.TEXT,
    type: DataTypes.ENUM('presuntivo', 'definitivo'),
    isPrimary: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Diagnosis',
  });
  return Diagnosis;
};