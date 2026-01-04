/**
 * SERVICIO LEGACY - Recomendación Simple con Google Gemini
 * 
 * Este servicio proporciona recomendaciones simples de horarios disponibles
 * usando Google Gemini AI, sin mantener contexto conversacional.
 * 
 * Para un asistente conversacional completo con contexto de usuario,
 * ver: ConversationalAssistantService.js
 * 
 * Endpoint: POST /api/intelligence/recommend (con provider='gemini')
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");
const { Op } = require("sequelize");
const db = require("../../../../database/models");

class SmartSchedulingService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
  }

  async recommendSlots(userQuery, professionalId) {
    try {
      console.log(`Analizando solicitud: "${userQuery}" para profesional ID: ${professionalId}`);
      const availableSlots = await db.Schedule.findAll({
        where: {
          professionalId: professionalId,
          status: 'abierta', 
          startTime: {
            [Op.gt]: new Date() // Solo horarios futuros
          }
        },
        attributes: ['id', 'startTime', 'endTime'],
        order: [['startTime', 'ASC']],
        limit: 20
      });

      if (!availableSlots || availableSlots.length === 0) {
        console.log("⚠️ No se encontraron horarios 'abierta' en la BD.");
        return { message: "No hay horarios disponibles en el sistema." };
      }

      const slotsString = availableSlots.map(slot => {
        const date = new Date(slot.startTime);
        const dateStr = date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        return `- ID: ${slot.id} | Fecha: ${dateStr} | Hora: ${timeStr} (ISO: ${slot.startTime.toISOString()})`;
      }).join('\n');

      console.log("📅 Horarios enviados a Gemini:\n", slotsString);

      const prompt = `
        Actúa como un asistente de agendamiento de citas médicas inteligente.
        
        CONTEXTO:
        El usuario está buscando una cita y ha escrito: "${userQuery}"
        
        DATOS DISPONIBLES (Base de datos):
        ${slotsString}
        
        INSTRUCCIONES:
        1. Analiza la petición del usuario (día, momento del día, urgencia).
        2. Selecciona las 3 mejores opciones de la lista de "DATOS DISPONIBLES" que coincidan con la petición.
        3. Si la petición es ambigua, sugiere las próximas disponibles.
        
        FORMATO DE RESPUESTA (Obligatorio JSON):
        Devuelve SOLO un array de objetos JSON con este formato, sin texto adicional ni markdown:
        [
          {
            "scheduleId": 123,
            "reason": "Coincide con 'martes por la tarde' solicitado por el usuario",
            "date_human": "Martes 24 de Octubre, 3:00 PM"
          }
        ]
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      text = text.replace(/```json/g, '').replace(/```/g, '').trim();

      return JSON.parse(text);

    } catch (error) {
      console.error("❌ Error en SmartSchedulingService:", error);
      throw error;
    }
  }
}

module.exports = new SmartSchedulingService();