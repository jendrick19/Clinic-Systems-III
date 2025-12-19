'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      User.hasOne(models.Professional, {
        foreignKey: 'userId',
        as: 'professional'
      });
    }
  }
  User.init({
    username: DataTypes.STRING,
    email: DataTypes.STRING,
    passwordHash: DataTypes.STRING,
    status: DataTypes.BOOLEAN,
    creationDate: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};