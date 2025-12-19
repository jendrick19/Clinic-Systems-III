'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Primero obtenemos los IDs de las aseguradoras
    const insurers = await queryInterface.sequelize.query(
      'SELECT id, nombre FROM Insurers ORDER BY id ASC;',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const plans = [];
    
    // Planes para Seguros Bolívar (asumiendo ID 1)
    if (insurers[0]) {
      plans.push({
        aseguradoraId: insurers[0].id,
        nombre: 'Plan Básico',
        codigo: 'BOL-BAS-001',
        tipo: 'Básico',
        condicionesGenerales: 'Plan básico que incluye cobertura de consultas médicas generales, hospitalización básica y medicamentos esenciales. Copago: 20%. Límite anual: $50,000.',
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      plans.push({
        aseguradoraId: insurers[0].id,
        nombre: 'Plan Premium',
        codigo: 'BOL-PREM-001',
        tipo: 'Premium',
        condicionesGenerales: 'Plan premium que incluye cobertura completa de especialistas, hospitalización VIP, medicamentos de alta gama y atención internacional. Copago: 10%. Límite anual: $200,000.',
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Planes para Seguros Caracas (asumiendo ID 2)
    if (insurers[1]) {
      plans.push({
        aseguradoraId: insurers[1].id,
        nombre: 'Plan Familiar',
        codigo: 'CAR-FAM-001',
        tipo: 'Familiar',
        condicionesGenerales: 'Plan diseñado para grupos familiares. Incluye cobertura para pediatría, maternidad, consultas generales y especialistas. Copago: 15%. Límite anual por familia: $120,000.',
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      plans.push({
        aseguradoraId: insurers[1].id,
        nombre: 'Plan Individual',
        codigo: 'CAR-IND-001',
        tipo: 'Individual',
        condicionesGenerales: 'Plan individual con cobertura básica y media de servicios médicos. Copago: 25%. Límite anual: $40,000.',
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Planes para Seguros Mercantil (asumiendo ID 3)
    if (insurers[2]) {
      plans.push({
        aseguradoraId: insurers[2].id,
        nombre: 'Plan Ejecutivo',
        codigo: 'MER-EJE-001',
        tipo: 'Ejecutivo',
        condicionesGenerales: 'Plan ejecutivo con cobertura amplia para profesionales. Incluye atención prioritaria, especialistas sin referencia y hospitalización privada. Copago: 12%. Límite anual: $150,000.',
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      plans.push({
        aseguradoraId: insurers[2].id,
        nombre: 'Plan Corporativo',
        codigo: 'MER-CORP-001',
        tipo: 'Corporativo',
        condicionesGenerales: 'Plan diseñado para empresas. Cobertura grupal con beneficios extendidos. Copago: 10%. Límite anual por empleado: $80,000.',
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Planes para Seguros La Previsora (asumiendo ID 4)
    if (insurers[3]) {
      plans.push({
        aseguradoraId: insurers[3].id,
        nombre: 'Plan Senior',
        codigo: 'PREV-SEN-001',
        tipo: 'Senior',
        condicionesGenerales: 'Plan especializado para adultos mayores. Incluye cobertura geriátrica, enfermedades crónicas y medicamentos de larga duración. Copago: 8%. Límite anual: $100,000.',
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Planes para Seguros Horizonte (asumiendo ID 5)
    if (insurers[4]) {
      plans.push({
        aseguradoraId: insurers[4].id,
        nombre: 'Plan Joven',
        codigo: 'HOR-JOV-001',
        tipo: 'Juvenil',
        condicionesGenerales: 'Plan para jóvenes entre 18-35 años. Incluye cobertura deportiva, dental y oftalmológica. Copago: 20%. Límite anual: $60,000.',
        activo: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // Planes para Seguros Universitas (asumiendo ID 6) - INACTIVA
    if (insurers[5]) {
      plans.push({
        aseguradoraId: insurers[5].id,
        nombre: 'Plan Universitario',
        codigo: 'UNI-EST-001',
        tipo: 'Estudiantil',
        condicionesGenerales: 'Plan universitario para estudiantes. Cobertura básica con enfoque en prevención y salud mental. Copago: 30%. Límite anual: $30,000.',
        activo: false,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    if (plans.length > 0) {
      await queryInterface.bulkInsert('Plans', plans, {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Plans', null, {});
  }
};

