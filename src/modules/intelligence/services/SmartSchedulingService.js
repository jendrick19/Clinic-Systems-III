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
        const date = getUTCDateFromSequelize(slot.startTime);
        const dateStr = formatDateHumanWithoutTimezone(date);
        return `- ID: ${slot.id} | Fecha: ${dateStr} (ISO: ${date ? date.toISOString() : 'N/A'})`;
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

/**
 * Obtiene un objeto Date con componentes UTC desde un objeto Date de Sequelize
 * @param {Date|string} sequelizeDate - Fecha que viene de Sequelize
 * @returns {Date} Nueva fecha con componentes UTC preservados
 */
function getUTCDateFromSequelize(sequelizeDate) {
  if (!sequelizeDate) return null;
  const date = sequelizeDate instanceof Date ? sequelizeDate : new Date(sequelizeDate);
  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
    date.getUTCMilliseconds()
  ));
}

/**
 * Formatea una fecha de forma legible sin conversión de timezone
 * @param {Date} date - Fecha a formatear
 * @returns {string} Fecha formateada legible (ej: "lunes 15 de enero 2024, 13:00")
 */
function formatDateHumanWithoutTimezone(date) {
  if (!date) return '';
  const weekdays = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  
  const weekday = weekdays[date.getUTCDay()];
  const day = date.getUTCDate();
  const month = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  
  return `${weekday} ${day} de ${month} ${year}, ${hours}:${minutes}`;
}

module.exports = new SmartSchedulingService();