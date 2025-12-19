'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    static associate(models) {
      Order.belongsTo(models.Episode, {
        foreignKey: 'episodeId',
        as: 'episode'
      });
      Order.hasMany(models.OrderItem, {
        foreignKey: 'orderId',
        as: 'items'
      });
      Order.hasMany(models.Result, {
        foreignKey: 'orderId',
        as: 'results'
      });
    }
  }
  Order.init({
    episodeId: DataTypes.INTEGER,
    type: DataTypes.ENUM('laboratorio', 'imagen', 'procedimiento'),
    priority: DataTypes.ENUM('normal', 'urgente'),
    status: DataTypes.ENUM('emitida', 'autorizada', 'en curso', 'completada', 'anulada')
  }, {
    sequelize,
    modelName: 'Order',
  });
  return Order;
};

