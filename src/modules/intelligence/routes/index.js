const { Router } = require('express');
const iaController = require('../controllers/IAController');

const router = Router();

// Endpoint: POST /api/intelligence/recommend
// Recomendación simple de horarios (método antiguo)
router.post('/recommend', iaController.recommend);

// Endpoint: POST /api/intelligence/chat
// Asistente conversacional con contexto de usuario
// Body: { message: string, userId: number, patientId: number }
router.post('/chat', iaController.chat);

// Endpoint: DELETE /api/intelligence/chat/history/:userId
// Limpia el historial de conversación de un usuario
router.delete('/chat/history/:userId', iaController.clearChatHistory);

// Endpoint: POST /api/intelligence/check-appointments
// Busca citas activas de un paciente a partir de tipo/numero documento y nombre/apellido
router.post('/check-appointments', iaController.checkAppointments);

// Endpoint: POST /api/intelligence/init-session
// Devuelve contexto inicial (patient, appointments, availability)
router.post('/init-session', iaController.initSession);

module.exports = router;