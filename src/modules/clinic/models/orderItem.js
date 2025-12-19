'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class OrderItem extends Model {
    static associate(models) {
      OrderItem.belongsTo(models.Order, {
        foreignKey: 'orderId',
        as: 'order'
      });
    }
  }
  OrderItem.init({
    orderId: DataTypes.INTEGER,
    code: DataTypes.STRING,
    description: DataTypes.TEXT,
    indications: DataTypes.TEXT,
    priority: DataTypes.ENUM('normal', 'urgente'),
    status: DataTypes.ENUM('pendiente', 'en curso', 'completada', 'anulada')
  }, {
    sequelize,
    modelName: 'OrderItem',
  });
  return OrderItem;
};

