'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ResultVersion extends Model {
    static associate(models) {
      ResultVersion.belongsTo(models.Result, {
        foreignKey: 'resultId',
        as: 'result'
      });
    }
  }
  ResultVersion.init({
    resultId: DataTypes.INTEGER,
    date: DataTypes.DATE,
    summary: DataTypes.TEXT,
    fileId: DataTypes.INTEGER,
    version: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'ResultVersion',
  });
  return ResultVersion;
};

