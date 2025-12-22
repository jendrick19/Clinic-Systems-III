'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const nombres = [
      'María', 'José', 'Carlos', 'Ana', 'Luis', 'Carmen', 'Juan', 'Marta',
      'Pedro', 'Laura', 'Miguel', 'Isabel', 'Francisco', 'Rosa', 'Antonio'
    ];
    const apellidos = [
      'García', 'Rodríguez', 'Martínez', 'Hernández', 'López', 'González',
      'Pérez', 'Sánchez', 'Ramírez', 'Torres', 'Flores', 'Rivera', 'Gómez',
      'Díaz', 'Cruz'
    ];
    
    const tiposDocumento = ['cedula', 'rif', 'pasaporte', 'extranjero', 'otro'];
    const sexos = ['m', 'f', 'o'];
    
    const generarDocumento = (index) => {
      const base = 10000000 + index * 100000;
      const random = Math.floor(Math.random() * 99999);
      return (base + random).toString();
    };
    
    const generarFechaNacimiento = () => {
      const hoy = new Date();
      const añosAtras = 18 + Math.floor(Math.random() * 62); 
      const fecha = new Date(hoy);
      fecha.setFullYear(hoy.getFullYear() - añosAtras);
      fecha.setMonth(Math.floor(Math.random() * 12));
      fecha.setDate(Math.floor(Math.random() * 28) + 1);
      return fecha;
    };
    
    const generarTelefono = () => {
      const prefijos = ['300', '301', '310', '311', '320', '321'];
      const prefijo = prefijos[Math.floor(Math.random() * prefijos.length)];
      const numero = Math.floor(Math.random() * 10000000).toString().padStart(7, '0');
      return prefijo + numero;
    };
    
    const generarEmail = (nombre, apellido, index) => {
      const nombreLimpio = nombre.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      const apellidoLimpio = apellido.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      return `${nombreLimpio}.${apellidoLimpio}${index}@example.com`;
    };
    
    const generarDireccion = () => {
      const calles = [
        'Avenida Principal', 'Calle Bolívar', 'Carrera 7', 'Avenida Libertador',
        'Calle Real', 'Paseo Colón', 'Avenida República', 'Calle del Sol'
      ];
      const calle = calles[Math.floor(Math.random() * calles.length)];
      const numero = Math.floor(Math.random() * 200) + 1;
      return `${calle} #${numero}`;
    };
    
    const generarContactoEmergencia = () => {
      const nombres = ['María', 'José', 'Carlos', 'Ana', 'Luis'];
      const apellidos = ['García', 'Rodríguez', 'Martínez', 'Hernández', 'López'];
      const nombreContacto = nombres[Math.floor(Math.random() * nombres.length)];
      const apellidoContacto = apellidos[Math.floor(Math.random() * apellidos.length)];
      const telefonoContacto = generarTelefono();
      const relaciones = ['Madre', 'Padre', 'Hermano/a', 'Esposo/a', 'Hijo/a'];
      const relacion = relaciones[Math.floor(Math.random() * relaciones.length)];
      return `${nombreContacto} ${apellidoContacto} (${relacion}) - ${telefonoContacto}`;
    };
    
    const randomItem = (array) => array[Math.floor(Math.random() * array.length)];
    
    const pacientes = [];
    const now = new Date();
    
    // Crear 15 pacientes de ejemplo
    for (let i = 0; i < 15; i++) {
      const nombre = randomItem(nombres);
      const apellido1 = randomItem(apellidos);
      const apellido2 = randomItem(apellidos);
      const sexo = randomItem(sexos);
      const fechaNacimiento = generarFechaNacimiento();
      const documentId = generarDocumento(i);
      
      // Patologías opcionales (30% de probabilidad)
      let patologia = null;
      if (Math.random() > 0.7) {
        const patologiasPosibles = [
          'Hipertensión', 'Diabetes', 'Asma', 'Artritis', 'Colesterol alto',
          'Migraña', 'Ansiedad', 'Depresión', 'Alergia al polen'
        ];
        patologia = randomItem(patologiasPosibles);
      }
      
      pacientes.push({
        documentType: randomItem(tiposDocumento),
        documentId: documentId,
        names: nombre,
        surNames: `${apellido1} ${apellido2}`,
        dateOfBirth: fechaNacimiento,
        gender: sexo,
        phone: generarTelefono(),
        email: generarEmail(nombre, apellido1, i + 1),
        address: generarDireccion(),
        emergencyContact: generarContactoEmergencia(),
        patologias: patologia,
        status: true,
        createdAt: now,
        updatedAt: now
      });
    }
    
    await queryInterface.bulkInsert('PeopleAttendeds', pacientes, {});
    console.log('✅ Seeder ejecutado: 15 pacientes creados');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('PeopleAttendeds', null, {});
    console.log('✅ Rollback ejecutado: Pacientes eliminados');
  }
};

