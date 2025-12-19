'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Plan extends Model {
    static associate(models) {
      // Relación con Aseguradora
      Plan.belongsTo(models.Insurer, {
        foreignKey: 'aseguradoraId',
        as: 'aseguradora'
      });
      
      // Futuras asociaciones con Afiliacion, etc.
    }
  }
  
  Plan.init({
    aseguradoraId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    codigo: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    tipo: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    condicionesGenerales: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Plan',
    tableName: 'Plans',
  });
  
  return Plan;
};

