'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ResultVersions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      resultId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Results',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      date: {
        type: Sequelize.DATE,
        allowNull: false
      },
      summary: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      fileId: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      version: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Índice para buscar versiones por resultado
    await queryInterface.addIndex('ResultVersions', ['resultId'], {
      name: 'idx_result_versions_result_id'
    });

    // Índice para buscar la versión específica
    await queryInterface.addIndex('ResultVersions', ['resultId', 'version'], {
      name: 'idx_result_versions_result_version'
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ResultVersions');
  }
};

