const OpenAI = require("openai");
const { Op } = require("sequelize");
const db = require("../../../../database/models");

class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async recommendSlots(userQuery, professionalId) {
    try {
      console.log(`[OpenAI] Analizando solicitud: "${userQuery}" para profesional ID: ${professionalId}`);
      
      const availableSlots = await db.Schedule.findAll({
        where: {
          professionalId: professionalId,
          status: 'abierta', 
          startTime: {
            [Op.gt]: new Date()
          }
        },
        attributes: ['id', 'startTime', 'endTime'],
        order: [['startTime', 'ASC']],
        limit: 20
      });

      if (!availableSlots || availableSlots.length === 0) {
        return { message: "No hay horarios disponibles en el sistema." };
      }

      const slotsString = availableSlots.map(slot => {
        const date = new Date(slot.startTime);
        const dateStr = date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        return `- ID: ${slot.id} | Fecha: ${dateStr} | Hora: ${timeStr} (ISO: ${slot.startTime.toISOString()})`;
      }).join('\n');

      const systemPrompt = `
        Actúa como un asistente de agendamiento de citas médicas inteligente.
        
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

      const userPrompt = `
        PETICIÓN DEL USUARIO: "${userQuery}"
        
        DATOS DISPONIBLES:
        ${slotsString}
      `;

      // Reintentos y parseo tolerante de la respuesta
      const maxAttempts = 3;
      let lastError = null;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
          const completion = await this.openai.chat.completions.create({
            model,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" }
          });

          const raw = completion?.choices?.[0]?.message?.content;
          console.log("[OpenAI] Respuesta raw:", raw);

          // Si ya es objeto, usarlo directamente
          if (raw && typeof raw === 'object') {
            const parsedObj = raw;
            if (Array.isArray(parsedObj)) return parsedObj;
            if (parsedObj.recommendations && Array.isArray(parsedObj.recommendations)) return parsedObj.recommendations;
            if (parsedObj.data && Array.isArray(parsedObj.data)) return parsedObj.data;
            const keys = Object.keys(parsedObj);
            if (keys.length === 1 && Array.isArray(parsedObj[keys[0]])) return parsedObj[keys[0]];
            return parsedObj;
          }

          // Si es string, intentar extraer JSON
          if (raw && typeof raw === 'string') {
            let content = raw.trim();
            content = content.replace(/```json/g, '').replace(/```/g, '').trim();
            const jsonMatch = content.match(/(\[.*\]|\{[\s\S]*\})/);
            const candidate = jsonMatch ? jsonMatch[0] : content;
            try {
              const result = JSON.parse(candidate);
              if (Array.isArray(result)) return result;
              if (result.recommendations && Array.isArray(result.recommendations)) return result.recommendations;
              if (result.data && Array.isArray(result.data)) return result.data;
              const keys = Object.keys(result);
              if (keys.length === 1 && Array.isArray(result[keys[0]])) return result[keys[0]];
              return result;
            } catch (parseErr) {
              console.warn("[OpenAI] No se pudo parsear JSON, devolviendo texto:", parseErr.message);
              return { message: content };
            }
          }

          // Si no hay contenido válido
          return { message: "La IA no devolvió contenido legible." };
        } catch (err) {
          lastError = err;
          console.warn(`[OpenAI] intento ${attempt} fallido:`, err.message || err.code || err);
          await new Promise(r => setTimeout(r, 500 * attempt));
          continue;
        }
      }

      console.error("[OpenAI] todos los intentos fallaron:", lastError);
      throw lastError;

    } catch (error) {
      console.error("❌ Error en OpenAIService:", error);
      throw error;
    }
  }
}

module.exports = new OpenAIService();
