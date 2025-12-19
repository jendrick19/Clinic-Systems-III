'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Result extends Model {
    static associate(models) {
      Result.belongsTo(models.Order, {
        foreignKey: 'orderId',
        as: 'order'
      });
      Result.hasMany(models.ResultVersion, {
        foreignKey: 'resultId',
        as: 'versions'
      });
    }
  }
  Result.init({
    orderId: DataTypes.INTEGER,
    date: DataTypes.DATE,
    summary: DataTypes.TEXT,
    fileId: DataTypes.INTEGER,
    version: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Result',
  });
  return Result;
};

