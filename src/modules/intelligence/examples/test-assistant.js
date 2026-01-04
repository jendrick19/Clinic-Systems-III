/**
 * Ejemplo de uso del Asistente Conversacional
 * 
 * Este archivo muestra cómo interactuar con el asistente desde código
 * (útil para testing o integración)
 */

const conversationalAssistant = require('../services/ConversationalAssistantService');

// Datos de ejemplo
const EXAMPLE_USER_ID = 1;
const EXAMPLE_PATIENT_ID = 5;

/**
 * Ejemplo 1: Agendar una cita
 */
async function testAgendarCita() {
  console.log('\n=== TEST: Agendar Cita ===\n');
  
  // Mensaje 1: Solicitar cita
  const response1 = await conversationalAssistant.processMessage(
    "Hola, necesito una cita de ortodoncia",
    EXAMPLE_USER_ID,
    EXAMPLE_PATIENT_ID
  );
  
  console.log('Usuario: "Hola, necesito una cita de ortodoncia"');
  console.log('Asistente:', response1.message);
  console.log('Acción:', response1.action);
  console.log('\n---\n');
  
  // Mensaje 2: Elegir opción
  const response2 = await conversationalAssistant.processMessage(
    "La segunda opción",
    EXAMPLE_USER_ID,
    EXAMPLE_PATIENT_ID
  );
  
  console.log('Usuario: "La segunda opción"');
  console.log('Asistente:', response2.message);
  console.log('Acción ejecutada:', response2.action);
  console.log('Resultado:', response2.actionResult);
}

/**
 * Ejemplo 2: Consultar citas existentes
 */
async function testConsultarCitas() {
  console.log('\n=== TEST: Consultar Citas ===\n');
  
  const response = await conversationalAssistant.processMessage(
    "¿Cuáles son mis citas?",
    EXAMPLE_USER_ID,
    EXAMPLE_PATIENT_ID
  );
  
  console.log('Usuario: "¿Cuáles son mis citas?"');
  console.log('Asistente:', response.message);
  console.log('Resultado:', JSON.stringify(response.actionResult, null, 2));
}

/**
 * Ejemplo 3: Reagendar una cita
 */
async function testReagendarCita() {
  console.log('\n=== TEST: Reagendar Cita ===\n');
  
  // Mensaje 1: Solicitar reagendar
  const response1 = await conversationalAssistant.processMessage(
    "Necesito cambiar mi cita",
    EXAMPLE_USER_ID,
    EXAMPLE_PATIENT_ID
  );
  
  console.log('Usuario: "Necesito cambiar mi cita"');
  console.log('Asistente:', response1.message);
  console.log('\n---\n');
  
  // Mensaje 2: Confirmar
  const response2 = await conversationalAssistant.processMessage(
    "Sí, esa cita",
    EXAMPLE_USER_ID,
    EXAMPLE_PATIENT_ID
  );
  
  console.log('Usuario: "Sí, esa cita"');
  console.log('Asistente:', response2.message);
  console.log('\n---\n');
  
  // Mensaje 3: Elegir nueva opción
  const response3 = await conversationalAssistant.processMessage(
    "La primera opción",
    EXAMPLE_USER_ID,
    EXAMPLE_PATIENT_ID
  );
  
  console.log('Usuario: "La primera opción"');
  console.log('Asistente:', response3.message);
  console.log('Resultado:', response3.actionResult);
}

/**
 * Ejemplo 4: Cancelar una cita
 */
async function testCancelarCita() {
  console.log('\n=== TEST: Cancelar Cita ===\n');
  
  // Mensaje 1: Solicitar cancelación
  const response1 = await conversationalAssistant.processMessage(
    "Quiero cancelar mi cita del martes",
    EXAMPLE_USER_ID,
    EXAMPLE_PATIENT_ID
  );
  
  console.log('Usuario: "Quiero cancelar mi cita del martes"');
  console.log('Asistente:', response1.message);
  console.log('Requiere confirmación:', response1.requiresConfirmation);
  console.log('\n---\n');
  
  // Mensaje 2: Confirmar cancelación
  const response2 = await conversationalAssistant.processMessage(
    "Sí, estoy seguro",
    EXAMPLE_USER_ID,
    EXAMPLE_PATIENT_ID
  );
  
  console.log('Usuario: "Sí, estoy seguro"');
  console.log('Asistente:', response2.message);
  console.log('Resultado:', response2.actionResult);
}

/**
 * Ejemplo 5: Limpiar historial
 */
async function testLimpiarHistorial() {
  console.log('\n=== TEST: Limpiar Historial ===\n');
  
  conversationalAssistant.clearConversationHistory(EXAMPLE_USER_ID);
  console.log('Historial limpiado para usuario', EXAMPLE_USER_ID);
}

/**
 * Ejemplo 6: Conversación completa
 */
async function testConversacionCompleta() {
  console.log('\n=== TEST: Conversación Completa ===\n');
  
  // Limpiar historial primero
  conversationalAssistant.clearConversationHistory(EXAMPLE_USER_ID);
  
  const conversacion = [
    "Hola",
    "Necesito una cita",
    "Para endodoncia",
    "¿El martes tienen disponible?",
    "Perfecto, la primera opción",
    "Gracias"
  ];
  
  for (const mensaje of conversacion) {
    const response = await conversationalAssistant.processMessage(
      mensaje,
      EXAMPLE_USER_ID,
      EXAMPLE_PATIENT_ID
    );
    
    console.log(`\nUsuario: "${mensaje}"`);
    console.log(`María: ${response.message}`);
    
    if (response.action) {
      console.log(`[Acción ejecutada: ${response.action}]`);
    }
  }
}

// Ejecutar ejemplos
async function runAllTests() {
  try {
    // Descomentar el test que desees ejecutar:
    
    // await testAgendarCita();
    // await testConsultarCitas();
    // await testReagendarCita();
    // await testCancelarCita();
    // await testLimpiarHistorial();
    await testConversacionCompleta();
    
  } catch (error) {
    console.error('Error en tests:', error);
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  console.log('🤖 Iniciando tests del Asistente Conversacional...\n');
  runAllTests().then(() => {
    console.log('\n✅ Tests completados');
    process.exit(0);
  });
}

module.exports = {
  testAgendarCita,
  testConsultarCitas,
  testReagendarCita,
  testCancelarCita,
  testLimpiarHistorial,
  testConversacionCompleta
};

