'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // Obtener órdenes completadas (solo las completadas tendrían resultados)
    const orders = await queryInterface.sequelize.query(
      `SELECT o.id, o.episodeId, o.type, o.createdAt, o.updatedAt 
       FROM Orders o 
       WHERE o.status IN ('completada', 'en curso')
       ORDER BY o.id ASC`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (orders.length === 0) {
      throw new Error('No hay órdenes disponibles. Ejecuta primero el seeder de órdenes.');
    }

    console.log(`📋 Encontradas ${orders.length} órdenes para agregar resultados`);

    // Templates de resúmenes por tipo de orden
    const resumenesLaboratorio = {
      inicial: [
        'Hemograma: Leucocitos 8.500/mm³, Hemoglobina 14.2 g/dL, Hematocrito 42%, Plaquetas 250.000/mm³. Valores dentro de rangos normales.',
        'Perfil lipídico: Colesterol total 185 mg/dL, LDL 110 mg/dL, HDL 55 mg/dL, Triglicéridos 95 mg/dL. Perfil adecuado.',
        'Función renal: Creatinina 0.9 mg/dL, Urea 32 mg/dL, Ácido úrico 5.2 mg/dL. Función renal conservada.',
        'Función hepática: TGO 28 U/L, TGP 32 U/L, Bilirrubina total 0.8 mg/dL. Función hepática normal.',
        'Glicemia en ayunas: 95 mg/dL. Valores normales. Descarta diabetes mellitus.',
        'TSH: 2.4 mUI/L, T4 libre 1.2 ng/dL. Función tiroidea normal.',
        'Examen general de orina: pH 6.0, Densidad 1.020, Proteínas negativo, Glucosa negativo, Leucocitos 0-2 por campo. Normal.',
        'Proteína C reactiva: 0.8 mg/dL. Sin evidencia de proceso inflamatorio agudo.',
      ],
      revision: [
        'Hemograma control: Leucocitos 7.800/mm³, Hemoglobina 14.5 g/dL. Mejoría en parámetros hematológicos.',
        'Perfil lipídico control: Colesterol total 170 mg/dL, LDL 100 mg/dL, HDL 60 mg/dL. Excelente respuesta al tratamiento.',
        'Función renal control: Creatinina 0.8 mg/dL, Urea 28 mg/dL. Función renal estable.',
        'Función hepática control: TGO 22 U/L, TGP 25 U/L. Normalización de enzimas hepáticas.',
        'Glicemia control: 88 mg/dL. Mantiene valores dentro de la normalidad.',
        'TSH control: 2.1 mUI/L. Función tiroidea estable con tratamiento.',
        'Examen de orina control: Completamente normal. Sin sedimento patológico.',
        'PCR control: 0.3 mg/dL. Resolución completa del proceso inflamatorio.',
      ],
      final: [
        'Hemograma final: Todos los parámetros dentro de rangos normales. Resolución completa.',
        'Perfil lipídico final: Colesterol total 165 mg/dL, LDL 95 mg/dL, HDL 62 mg/dL. Objetivos terapéuticos alcanzados.',
        'Función renal final: Creatinina 0.9 mg/dL. Función renal normal y estable.',
        'Función hepática final: Transaminasas normales. Alta laboratorial.',
        'Glicemia final: 90 mg/dL. Control metabólico óptimo.',
        'TSH final: 2.3 mUI/L. Eutiroidismo confirmado.',
        'Examen de orina final: Sin alteraciones. Cuadro resuelto.',
        'PCR final: 0.2 mg/dL. Sin actividad inflamatoria.',
      ],
    };

    const resumenesImagen = {
      inicial: [
        'Radiografía de tórax: Campos pulmonares bien ventilados. Silueta cardíaca de tamaño normal. Senos costofrénicos libres. Sin infiltrados ni consolidaciones.',
        'Ecografía abdominal: Hígado de tamaño y ecogenicidad normal. Vesícula biliar sin litiasis. Páncreas, bazo y riñones sin alteraciones. Vía biliar no dilatada.',
        'Tomografía de cráneo: Estructuras encefálicas de morfología y densidad conservadas. Sin lesiones ocupantes de espacio. Sistema ventricular de tamaño normal.',
        'Resonancia de columna lumbar: Disminución del espacio discal L4-L5. Protrusión discal posterior que contacta raíz nerviosa L5. Sin compresión medular.',
        'Ecografía pélvica: Útero en AVF, tamaño y morfología normal. Endometrio homogéneo. Ovarios de características normales. Sin masas anexiales.',
        'Ecocardiograma: Función sistólica conservada. FEVI 60%. Válvulas sin alteraciones significativas. Sin derrame pericárdico.',
        'Mamografía bilateral: Tejido fibroglandular heterogéneo. Microcalcificaciones benignas dispersas. BIRADS 2.',
        'Ecografía tiroidea: Glándula de tamaño normal. Nódulo hipoecoico de 8mm en lóbulo derecho, bien delimitado. TIRADS 2.',
      ],
      revision: [
        'Radiografía de tórax control: Mejoría en ventilación pulmonar. Índice cardiotorácico normal. Sin cambios significativos.',
        'Ecografía abdominal control: Vesícula con paredes de grosor normal. Resolución del proceso inflamatorio previo.',
        'Tomografía de cráneo control: Sin cambios respecto al estudio previo. Evolución estable.',
        'Resonancia de columna control: Discreta disminución del componente herniario. Sin nuevas alteraciones.',
        'Ecografía pélvica control: Endometrio de grosor adecuado para fase del ciclo. Sin cambios patológicos.',
        'Ecocardiograma control: FEVI 62%. Función ventricular estable.',
        'Mamografía control: Sin nuevas lesiones. Estudio de seguimiento sin cambios.',
        'Ecografía tiroidea control: Nódulo estable en tamaño. Sin características de malignidad.',
      ],
      final: [
        'Radiografía de tórax final: Campos pulmonares completamente normales. Alta radiológica.',
        'Ecografía abdominal final: Vesícula y vía biliar sin alteraciones. Estudio normal.',
        'Tomografía de cráneo final: Sin lesiones. Estudio de alta.',
        'Resonancia de columna final: Hernia discal estable. No requiere seguimiento inmediato.',
        'Ecografía pélvica final: Órganos pélvicos sin alteraciones. Estudio normal.',
        'Ecocardiograma final: Función cardíaca normal. Alta cardiológica.',
        'Mamografía final: Sin hallazgos sospechosos. Control en 1 año.',
        'Ecografía tiroidea final: Nódulo benigno estable. Control anual recomendado.',
      ],
    };

    const resumenesProcedimiento = {
      inicial: [
        'Electrocardiograma: Ritmo sinusal regular. FC 75 lpm. PR 0.16 seg. QRS 0.08 seg. Sin alteraciones de la repolarización. Eje normal.',
        'Espirometría: CVF 4.2L (95% predicho), FEV1 3.5L (92% predicho). Relación FEV1/CVF 83%. Patrón normal.',
        'Endoscopia digestiva alta: Esófago sin lesiones. Cardias continente. Mucosa gástrica eritematosa en antro. Test ureasa positivo. Gastritis crónica H. pylori (+).',
        'Colonoscopia: Colon hasta ciego. Mucosa colónica normal. Hemorroides internas grado II. Sin pólipos ni lesiones.',
        'Prueba de esfuerzo: Test negativo para isquemia miocárdica. Capacidad funcional 10 METS. Respuesta cronotrópica adecuada.',
        'Holter 24 horas: Ritmo sinusal predominante. FC promedio 72 lpm. 15 extrasístoles ventriculares aisladas. Sin arritmias sostenidas.',
        'Audiometría: Hipoacusia neurosensorial bilateral leve en frecuencias agudas. Logoaudiometría 90%.',
        'Curva de glucosa: Basal 92 mg/dL, 1h 145 mg/dL, 2h 128 mg/dL. Tolerancia normal a la glucosa.',
      ],
      revision: [
        'Electrocardiograma control: Ritmo sinusal. Sin cambios isquémicos. Evolución favorable.',
        'Espirometría control: CVF 4.4L (98% predicho), FEV1 3.7L (95% predicho). Mejoría en parámetros espirométricos.',
        'Endoscopia control: Mucosa gástrica en proceso de cicatrización. Test ureasa negativo. Erradicación exitosa de H. pylori.',
        'Colonoscopia control: Mucosa colónica sana. Hemorroides mejoradas post-tratamiento.',
        'Prueba de esfuerzo control: Test negativo. Capacidad funcional mejorada a 11 METS.',
        'Holter control: Ritmo sinusal. Reducción de extrasístoles a 5 en 24 horas.',
        'Audiometría control: Hipoacusia estable. Sin progresión.',
        'Curva de glucosa control: Valores normales en todas las mediciones.',
      ],
      final: [
        'Electrocardiograma final: Normal. Alta cardiovascular.',
        'Espirometría final: Función pulmonar normal. Alta respiratoria.',
        'Endoscopia final: Mucosa gástrica completamente cicatrizada. Alta gastroenterológica.',
        'Colonoscopia final: Sin lesiones. Control en 5 años.',
        'Prueba de esfuerzo final: Excelente capacidad funcional. Sin evidencia de isquemia.',
        'Holter final: Ritmo sinusal normal. Sin arritmias significativas.',
        'Audiometría final: Audición estable. Control anual.',
        'Curva de glucosa final: Metabolismo de glucosa normal.',
      ],
    };

    const results = [];
    const resultVersions = [];
    let resultIdCounter = 1;

    // Crear resultados para el 80% de las órdenes (las completadas y algunas en curso)
    const ordenesConResultados = orders.slice(0, Math.floor(orders.length * 0.8));

    for (const order of ordenesConResultados) {
      // Determinar número de versiones (1-3)
      const numVersions = Math.floor(Math.random() * 3) + 1;
      
      // Seleccionar templates según tipo de orden
      let templates;
      if (order.type === 'laboratorio') templates = resumenesLaboratorio;
      else if (order.type === 'imagen') templates = resumenesImagen;
      else templates = resumenesProcedimiento;

      const templateIndex = Math.floor(Math.random() * templates.inicial.length);

      // Fecha del resultado inicial (1-3 días después de la orden)
      const fechaResultadoInicial = new Date(order.updatedAt);
      fechaResultadoInicial.setDate(fechaResultadoInicial.getDate() + Math.floor(Math.random() * 3) + 1);

      // Crear el resultado principal con la versión más reciente
      let resumenActual, fechaActual, versionActual;
      
      if (numVersions === 1) {
        resumenActual = templates.inicial[templateIndex];
        fechaActual = fechaResultadoInicial;
        versionActual = 1;
      } else if (numVersions === 2) {
        resumenActual = templates.revision[templateIndex];
        fechaActual = new Date(fechaResultadoInicial);
        fechaActual.setDate(fechaActual.getDate() + 3);
        versionActual = 2;
      } else {
        resumenActual = templates.final[templateIndex];
        fechaActual = new Date(fechaResultadoInicial);
        fechaActual.setDate(fechaActual.getDate() + 7);
        versionActual = 3;
      }

      results.push({
        id: resultIdCounter,
        orderId: order.id,
        date: fechaActual,
        summary: resumenActual,
        fileId: Math.random() > 0.3 ? Math.floor(Math.random() * 100) + 1 : null, // 70% con archivo
        version: versionActual,
        createdAt: fechaResultadoInicial,
        updatedAt: fechaActual
      });

      // Crear versiones históricas
      // Versión 1 (inicial)
      resultVersions.push({
        resultId: resultIdCounter,
        date: fechaResultadoInicial,
        summary: templates.inicial[templateIndex],
        fileId: Math.random() > 0.3 ? Math.floor(Math.random() * 100) + 1 : null,
        version: 1,
        createdAt: fechaResultadoInicial,
        updatedAt: fechaResultadoInicial
      });

      // Versión 2 (revisión) si aplica
      if (numVersions >= 2) {
        const fechaVersion2 = new Date(fechaResultadoInicial);
        fechaVersion2.setDate(fechaVersion2.getDate() + 3);
        
        resultVersions.push({
          resultId: resultIdCounter,
          date: fechaVersion2,
          summary: templates.revision[templateIndex],
          fileId: Math.random() > 0.3 ? Math.floor(Math.random() * 100) + 1 : null,
          version: 2,
          createdAt: fechaVersion2,
          updatedAt: fechaVersion2
        });
      }

      // Versión 3 (final) si aplica
      if (numVersions === 3) {
        const fechaVersion3 = new Date(fechaResultadoInicial);
        fechaVersion3.setDate(fechaVersion3.getDate() + 7);
        
        resultVersions.push({
          resultId: resultIdCounter,
          date: fechaVersion3,
          summary: templates.final[templateIndex],
          fileId: Math.random() > 0.3 ? Math.floor(Math.random() * 100) + 1 : null,
          version: 3,
          createdAt: fechaVersion3,
          updatedAt: fechaVersion3
        });
      }

      resultIdCounter++;
    }

    await queryInterface.bulkInsert('Results', results, {});
    await queryInterface.bulkInsert('ResultVersions', resultVersions, {});

    // Estadísticas
    const porTipo = {
      laboratorio: results.filter(r => {
        const order = orders.find(o => o.id === r.orderId);
        return order && order.type === 'laboratorio';
      }).length,
      imagen: results.filter(r => {
        const order = orders.find(o => o.id === r.orderId);
        return order && order.type === 'imagen';
      }).length,
      procedimiento: results.filter(r => {
        const order = orders.find(o => o.id === r.orderId);
        return order && order.type === 'procedimiento';
      }).length
    };

    const distribucionVersiones = { 1: 0, 2: 0, 3: 0 };
    results.forEach(result => {
      distribucionVersiones[result.version]++;
    });

    const conArchivo = results.filter(r => r.fileId !== null).length;

    console.log('✅ Seeder de resultados ejecutado exitosamente:');
    console.log(`   - ${results.length} resultados creados`);
    console.log(`   - ${resultVersions.length} versiones de resultados creadas`);
    console.log(`\n📊 Por tipo de orden:`);
    console.log(`   - Laboratorio: ${porTipo.laboratorio}`);
    console.log(`   - Imagen: ${porTipo.imagen}`);
    console.log(`   - Procedimiento: ${porTipo.procedimiento}`);
    console.log(`\n📊 Distribución de versiones:`);
    console.log(`   - ${distribucionVersiones[1]} resultados con 1 versión (inicial)`);
    console.log(`   - ${distribucionVersiones[2]} resultados con 2 versiones (inicial + revisión)`);
    console.log(`   - ${distribucionVersiones[3]} resultados con 3 versiones (inicial + revisión + final)`);
    console.log(`\n📊 Archivos adjuntos:`);
    console.log(`   - Con archivo: ${conArchivo}`);
    console.log(`   - Sin archivo: ${results.length - conArchivo}`);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ResultVersions', null, {});
    await queryInterface.bulkDelete('Results', null, {});
    console.log('✅ Rollback ejecutado: Resultados y versiones eliminadas');
  }
};

