'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // Obtener episodios existentes
    const episodes = await queryInterface.sequelize.query(
      `SELECT id, openingDate, status FROM Episodes ORDER BY id ASC`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (episodes.length === 0) {
      throw new Error('No hay episodios disponibles. Ejecuta primero el seeder de episodios.');
    }

    // Tipos de órdenes
    const tiposOrdenes = ['laboratorio', 'imagen', 'procedimiento'];
    const prioridades = ['normal', 'urgente'];
    const estados = ['emitida', 'autorizada', 'en curso', 'completada', 'anulada'];

    // Items por tipo de orden
    const itemsLaboratorio = [
      { codigo: 'LAB001', descripcion: 'Hemograma completo', indicaciones: 'En ayunas de 8 horas' },
      { codigo: 'LAB002', descripcion: 'Glicemia en ayunas', indicaciones: 'Ayuno mínimo de 8 horas' },
      { codigo: 'LAB003', descripcion: 'Perfil lipídico', indicaciones: 'Ayuno de 12 horas' },
      { codigo: 'LAB004', descripcion: 'Creatinina sérica', indicaciones: 'No requiere ayuno' },
      { codigo: 'LAB005', descripcion: 'Urea en sangre', indicaciones: 'No requiere ayuno' },
      { codigo: 'LAB006', descripcion: 'Ácido úrico', indicaciones: 'Ayuno de 8 horas' },
      { codigo: 'LAB007', descripcion: 'Transaminasas (TGO, TGP)', indicaciones: 'Ayuno de 8 horas' },
      { codigo: 'LAB008', descripcion: 'Examen general de orina', indicaciones: 'Primera orina de la mañana' },
      { codigo: 'LAB009', descripcion: 'Hemoglobina glicosilada (HbA1c)', indicaciones: 'No requiere ayuno' },
      { codigo: 'LAB010', descripcion: 'TSH (Hormona estimulante de tiroides)', indicaciones: 'No requiere ayuno' },
      { codigo: 'LAB011', descripcion: 'Proteína C reactiva', indicaciones: 'No requiere ayuno' },
      { codigo: 'LAB012', descripcion: 'Electrolitos séricos (Na, K, Cl)', indicaciones: 'No requiere ayuno' },
      { codigo: 'LAB013', descripcion: 'Tiempo de protrombina', indicaciones: 'No requiere ayuno' },
      { codigo: 'LAB014', descripcion: 'VSG (Velocidad de sedimentación)', indicaciones: 'No requiere ayuno' },
      { codigo: 'LAB015', descripcion: 'Coprocultivo', indicaciones: 'Muestra en fresco' },
    ];

    const itemsImagen = [
      { codigo: 'IMG001', descripcion: 'Radiografía de tórax AP y lateral', indicaciones: 'Sin preparación especial' },
      { codigo: 'IMG002', descripcion: 'Radiografía de abdomen simple', indicaciones: 'Vejiga llena' },
      { codigo: 'IMG003', descripcion: 'Ecografía abdominal', indicaciones: 'Ayuno de 6 horas' },
      { codigo: 'IMG004', descripcion: 'Ecografía pélvica', indicaciones: 'Vejiga llena' },
      { codigo: 'IMG005', descripcion: 'Tomografía de cráneo simple', indicaciones: 'Sin preparación especial' },
      { codigo: 'IMG006', descripcion: 'Tomografía de abdomen con contraste', indicaciones: 'Ayuno de 6 horas, función renal normal' },
      { codigo: 'IMG007', descripcion: 'Resonancia magnética de columna lumbar', indicaciones: 'Retirar objetos metálicos' },
      { codigo: 'IMG008', descripcion: 'Ecocardiograma doppler color', indicaciones: 'Sin preparación especial' },
      { codigo: 'IMG009', descripcion: 'Mamografía bilateral', indicaciones: 'Evitar uso de desodorante' },
      { codigo: 'IMG010', descripcion: 'Ecografía tiroidea', indicaciones: 'Sin preparación especial' },
      { codigo: 'IMG011', descripcion: 'Radiografía de columna lumbar', indicaciones: 'Sin preparación especial' },
      { codigo: 'IMG012', descripcion: 'Doppler venoso de miembros inferiores', indicaciones: 'Sin preparación especial' },
    ];

    const itemsProcedimiento = [
      { codigo: 'PROC001', descripcion: 'Electrocardiograma de 12 derivaciones', indicaciones: 'Ropa cómoda' },
      { codigo: 'PROC002', descripcion: 'Holter de 24 horas', indicaciones: 'No mojar el equipo' },
      { codigo: 'PROC003', descripcion: 'Espirometría', indicaciones: 'No fumar 4 horas antes' },
      { codigo: 'PROC004', descripcion: 'Endoscopia digestiva alta', indicaciones: 'Ayuno de 8 horas' },
      { codigo: 'PROC005', descripcion: 'Colonoscopia', indicaciones: 'Preparación intestinal completa' },
      { codigo: 'PROC006', descripcion: 'Prueba de esfuerzo', indicaciones: 'Ropa deportiva, ayuno de 3 horas' },
      { codigo: 'PROC007', descripcion: 'Biopsia de piel', indicaciones: 'Antisepsia local' },
      { codigo: 'PROC008', descripcion: 'Curva de tolerancia a la glucosa', indicaciones: 'Ayuno de 10-12 horas' },
      { codigo: 'PROC009', descripcion: 'Monitoreo ambulatorio de presión arterial', indicaciones: 'No mojar el equipo' },
      { codigo: 'PROC010', descripcion: 'Audiometría', indicaciones: 'Evitar ruidos fuertes previos' },
    ];

    const orders = [];
    const orderItems = [];
    let orderIdCounter = 1;

    // Crear órdenes para el 70% de los episodios
    const episodiosConOrdenes = episodes.slice(0, Math.floor(episodes.length * 0.7));

    for (const episode of episodiosConOrdenes) {
      // Crear 1-3 órdenes por episodio
      const numOrdenes = Math.floor(Math.random() * 3) + 1;

      for (let i = 0; i < numOrdenes; i++) {
        const tipo = tiposOrdenes[Math.floor(Math.random() * tiposOrdenes.length)];
        const prioridad = Math.random() > 0.7 ? 'urgente' : 'normal';
        
        // Distribuir estados de forma realista
        let estado;
        const rand = Math.random();
        if (episode.status === 'cerrado') {
          // Episodios cerrados tienen más órdenes completadas
          if (rand < 0.6) estado = 'completada';
          else if (rand < 0.8) estado = 'en curso';
          else if (rand < 0.9) estado = 'autorizada';
          else estado = 'anulada';
        } else {
          // Episodios abiertos tienen estados más variados
          if (rand < 0.2) estado = 'emitida';
          else if (rand < 0.4) estado = 'autorizada';
          else if (rand < 0.7) estado = 'en curso';
          else if (rand < 0.9) estado = 'completada';
          else estado = 'anulada';
        }

        const fechaOrden = new Date(episode.openingDate);
        fechaOrden.setHours(fechaOrden.getHours() + (i * 24));

        orders.push({
          id: orderIdCounter,
          episodeId: episode.id,
          type: tipo,
          priority: prioridad,
          status: estado,
          createdAt: fechaOrden,
          updatedAt: estado === 'completada' 
            ? new Date(fechaOrden.getTime() + (1000 * 60 * 60 * 48)) // 2 días después
            : now
        });

        // Crear items para esta orden
        let itemsDisponibles;
        if (tipo === 'laboratorio') itemsDisponibles = itemsLaboratorio;
        else if (tipo === 'imagen') itemsDisponibles = itemsImagen;
        else itemsDisponibles = itemsProcedimiento;

        const numItems = Math.floor(Math.random() * 4) + 1; // 1-4 items por orden
        const indicesUsados = new Set();

        for (let j = 0; j < numItems; j++) {
          let index;
          do {
            index = Math.floor(Math.random() * itemsDisponibles.length);
          } while (indicesUsados.has(index));
          indicesUsados.add(index);

          const item = itemsDisponibles[index];
          const prioridadItem = prioridad === 'urgente' && Math.random() > 0.5 
            ? 'urgente' 
            : 'normal';

          // Estado del item según el estado de la orden
          let estadoItem;
          if (estado === 'emitida') estadoItem = 'pendiente';
          else if (estado === 'autorizada') estadoItem = Math.random() > 0.5 ? 'pendiente' : 'en curso';
          else if (estado === 'en curso') estadoItem = Math.random() > 0.3 ? 'en curso' : 'completada';
          else if (estado === 'completada') estadoItem = 'completada';
          else estadoItem = 'anulada';

          orderItems.push({
            orderId: orderIdCounter,
            code: item.codigo,
            description: item.descripcion,
            indications: item.indicaciones,
            priority: prioridadItem,
            status: estadoItem,
            createdAt: fechaOrden,
            updatedAt: estadoItem === 'completada' 
              ? new Date(fechaOrden.getTime() + (1000 * 60 * 60 * 36))
              : now
          });
        }

        orderIdCounter++;
      }
    }

    await queryInterface.bulkInsert('Orders', orders, {});
    await queryInterface.bulkInsert('OrderItems', orderItems, {});

    // Estadísticas
    const porTipo = {
      laboratorio: orders.filter(o => o.type === 'laboratorio').length,
      imagen: orders.filter(o => o.type === 'imagen').length,
      procedimiento: orders.filter(o => o.type === 'procedimiento').length
    };

    const porEstado = {
      emitida: orders.filter(o => o.status === 'emitida').length,
      autorizada: orders.filter(o => o.status === 'autorizada').length,
      'en curso': orders.filter(o => o.status === 'en curso').length,
      completada: orders.filter(o => o.status === 'completada').length,
      anulada: orders.filter(o => o.status === 'anulada').length
    };

    const urgentes = orders.filter(o => o.priority === 'urgente').length;

    console.log('✅ Seeder de órdenes ejecutado exitosamente:');
    console.log(`   - ${orders.length} órdenes creadas`);
    console.log(`   - ${orderItems.length} items de órdenes creados`);
    console.log(`\n📊 Por tipo:`);
    console.log(`   - Laboratorio: ${porTipo.laboratorio}`);
    console.log(`   - Imagen: ${porTipo.imagen}`);
    console.log(`   - Procedimiento: ${porTipo.procedimiento}`);
    console.log(`\n📊 Por estado:`);
    console.log(`   - Emitida: ${porEstado.emitida}`);
    console.log(`   - Autorizada: ${porEstado.autorizada}`);
    console.log(`   - En curso: ${porEstado['en curso']}`);
    console.log(`   - Completada: ${porEstado.completada}`);
    console.log(`   - Anulada: ${porEstado.anulada}`);
    console.log(`\n📊 Por prioridad:`);
    console.log(`   - Urgentes: ${urgentes}`);
    console.log(`   - Normales: ${orders.length - urgentes}`);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('OrderItems', null, {});
    await queryInterface.bulkDelete('Orders', null, {});
    console.log('✅ Rollback ejecutado: Órdenes e items eliminados');
  }
};

