'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const people = await queryInterface.sequelize.query(
      `SELECT id FROM PeopleAttendeds WHERE status = 1 ORDER BY id ASC LIMIT 30`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (people.length === 0) {
      throw new Error('No hay personas disponibles. Ejecuta primero el seeder de personas.');
    }
    const professionals = await queryInterface.sequelize.query(
      `SELECT id FROM Profesionals WHERE status = 1 ORDER BY id ASC LIMIT 15`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    if (professionals.length === 0) {
      throw new Error('No hay profesionales disponibles. Ejecuta primero el seeder de profesionales.');
    }
    const motivos = [
      'Dolor abdominal persistente',
      'Fiebre y malestar general',
      'Control rutinario de salud',
      'Dolor de cabeza recurrente',
      'Problemas respiratorios',
      'Control de presión arterial',
      'Dolor en articulaciones',
      'Chequeo preventivo anual',
      'Seguimiento post-operatorio',
      'Evaluación de resultados de laboratorio',
      'Dolor torácico',
      'Problemas dermatológicos',
      'Control de diabetes',
      'Síntomas gripales',
      'Mareos y vértigo',
      'Problemas digestivos',
      'Control de colesterol',
      'Dolor lumbar',
      'Evaluación cardiológica',
      'Problemas de visión'
    ];
    const tipos = ['consulta', 'procedimiento', 'control', 'urgencia'];
    const episodes = [];
    for (let i = 0; i < 30; i++) {
      const personaId = people[i % people.length].id;
      const tipo = tipos[Math.floor(Math.random() * tipos.length)];
      const motivo = motivos[Math.floor(Math.random() * motivos.length)];
      const fechaApertura = new Date(now);
      fechaApertura.setDate(now.getDate() - Math.floor(Math.random() * 180));
      const estado = Math.random() > 0.3 ? 'abierto' : 'cerrado';
      episodes.push({
        peopleId: personaId,
        openingDate: fechaApertura,
        reason: motivo,
        type: tipo,
        status: estado,
        createdAt: fechaApertura,
        updatedAt: estado === 'cerrado' ? new Date(fechaApertura.getTime() + (1000 * 60 * 60 * 24 * 7)) : now
      });
    }
    await queryInterface.bulkInsert('Episodes', episodes, {});
    const insertedEpisodes = await queryInterface.sequelize.query(
      `SELECT id, peopleId, openingDate FROM Episodes ORDER BY id DESC LIMIT 30`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    insertedEpisodes.reverse();
    const clinicalNotes = [];
    for (let i = 0; i < insertedEpisodes.length; i++) {
      const episode = insertedEpisodes[i];
      const numNotas = Math.floor(Math.random() * 3) + 1; 
      for (let j = 0; j < numNotas; j++) {
        const professional = professionals[Math.floor(Math.random() * professionals.length)];
        const fechaNota = new Date(episode.openingDate);
        fechaNota.setDate(fechaNota.getDate() + (j * 2)); 
        clinicalNotes.push({
          episodeId: episode.id,
          professionalId: professional.id,
          noteDate: fechaNota,
          createdAt: fechaNota,
          updatedAt: fechaNota
        });
      }
    }
    await queryInterface.bulkInsert('ClinicalNotes', clinicalNotes, {});
    const diagnosticos = [
      { code: 'J06.9', description: 'Infección aguda de las vías respiratorias superiores', type: 'definitivo' },
      { code: 'R10.4', description: 'Dolores abdominales, otros y los no especificados', type: 'presuntivo' },
      { code: 'I10', description: 'Hipertensión esencial (primaria)', type: 'definitivo' },
      { code: 'E11.9', description: 'Diabetes mellitus no insulinodependiente, sin mención de complicación', type: 'definitivo' },
      { code: 'M54.5', description: 'Dolor lumbar', type: 'presuntivo' },
      { code: 'K21.9', description: 'Enfermedad del reflujo gastroesofágico sin esofagitis', type: 'presuntivo' },
      { code: 'R51', description: 'Cefalea', type: 'presuntivo' },
      { code: 'E78.5', description: 'Hiperlipidemia, no especificada', type: 'definitivo' },
      { code: 'J45.9', description: 'Asma, no especificada', type: 'definitivo' },
      { code: 'M25.5', description: 'Dolor en articulación', type: 'presuntivo' },
      { code: 'R42', description: 'Mareo y vértigo', type: 'presuntivo' },
      { code: 'L30.9', description: 'Dermatitis, no especificada', type: 'presuntivo' },
      { code: 'I20.9', description: 'Angina de pecho, no especificada', type: 'presuntivo' },
      { code: 'R50.9', description: 'Fiebre, no especificada', type: 'presuntivo' },
      { code: 'Z00.0', description: 'Examen médico general', type: 'definitivo' },
      { code: 'K59.0', description: 'Estreñimiento', type: 'presuntivo' },
      { code: 'R07.4', description: 'Dolor torácico, no especificado', type: 'presuntivo' },
      { code: 'H52.1', description: 'Miopía', type: 'definitivo' },
      { code: 'M79.3', description: 'Panículo, no especificado', type: 'presuntivo' },
      { code: 'Z09', description: 'Examen de seguimiento consecutivo a tratamiento', type: 'definitivo' }
    ];
    const diagnosis = [];
    for (let i = 0; i < insertedEpisodes.length; i++) {
      const episode = insertedEpisodes[i];
      const numDiagnosticos = Math.floor(Math.random() * 2) + 1; 
      for (let j = 0; j < numDiagnosticos; j++) {
        const diagnostico = diagnosticos[Math.floor(Math.random() * diagnosticos.length)];
        const fechaDiagnostico = new Date(episode.openingDate);
        fechaDiagnostico.setHours(fechaDiagnostico.getHours() + (j * 12)); 
        diagnosis.push({
          episodeId: episode.id,
          code: diagnostico.code,
          description: diagnostico.description,
          type: diagnostico.type,
          isPrimary: j === 0, 
          createdAt: fechaDiagnostico,
          updatedAt: fechaDiagnostico
        });
      }
    }
    await queryInterface.bulkInsert('Diagnoses', diagnosis, {});
    console.log('✅ Seeder ejecutado exitosamente:');
    console.log(`   - ${episodes.length} episodios creados`);
    console.log(`   - ${clinicalNotes.length} notas clínicas creadas`);
    console.log(`   - ${diagnosis.length} diagnósticos creados`);
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Diagnoses', null, {});
    await queryInterface.bulkDelete('ClinicalNotes', null, {});
    await queryInterface.bulkDelete('Episodes', null, {});
    console.log('✅ Rollback ejecutado: Episodios, notas clínicas y diagnósticos eliminados');
  }
};
