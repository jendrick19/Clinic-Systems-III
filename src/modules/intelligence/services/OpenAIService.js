const OpenAI = require("openai");
const { Op } = require("sequelize");
const db = require("../../../../database/models");
const fs = require('fs');
const path = require('path');

/**
 * SERVICIO LEGACY - Recomendación Simple de Horarios
 * 
 * Este servicio proporciona recomendaciones simples de horarios disponibles
 * sin mantener contexto conversacional ni memoria de usuario.
 * 
 * Para un asistente conversacional completo con contexto de usuario,
 * ver: ConversationalAssistantService.js
 * 
 * Endpoint: POST /api/intelligence/recommend
 */

const KNOWN_SPECIALTIES = [
  'odontología general', 'ortodoncia', 'endodoncia', 'periodoncia', 
  'odontopediatría', 'cirugía oral', 'prótesis', 'implantología', 'estética'
];

class OpenAIService {
  constructor() {
    if (!process.env.OPENAI_API_KEY) console.error("⚠️ FALTA OPENAI_API_KEY");
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    // Cargar el contexto del prompt externo
    const promptPath = path.join(__dirname, '../prompts/AsistenteClinicaDental.md');
    this.fullPrompt = fs.existsSync(promptPath) 
      ? fs.readFileSync(promptPath, 'utf-8')
      : "Eres María, asistente virtual de Clínica Dental Plus.";
  }

  async recommendSlots(userQuery, defaultProfessionalId) {
    try {
      console.log(`[IA] Analizando: "${userQuery}"`);

      const lowerQuery = userQuery.toLowerCase();
      const targetSpecialty = KNOWN_SPECIALTIES.find(s => lowerQuery.includes(s.toLowerCase()));
      
      let professionalsMap = {}; 
      let professionalIdsToSearch = [];

      // --- 1. SELECCIÓN DE PROFESIONALES ---
      if (targetSpecialty) {
        const professionals = await db.Professional.findAll({
          where: { 
            specialty: { [Op.like]: `%${targetSpecialty}%` },
            status: true 
          }
        });
        if (!professionals.length) return { message: `No encontré doctores activos de ${targetSpecialty}.` };
        
        professionalIdsToSearch = professionals.map(p => p.id);
        professionals.forEach(p => professionalsMap[p.id] = `${p.names} ${p.surNames} (${p.specialty})`);
        
      } else {
        const allProfessionals = await db.Professional.findAll({
          where: { status: true },
          limit: 10
        });

        professionalIdsToSearch = allProfessionals.map(p => p.id);
        allProfessionals.forEach(p => {
             professionalsMap[p.id] = `${p.names} ${p.surNames} (${p.specialty})`;
        });
      }

      // --- 2. OBTENER HORARIOS DE TRABAJO (SCHEDULES) ---
      const schedules = await db.Schedule.findAll({
        where: {
          professionalId: { [Op.in]: professionalIdsToSearch },
          status: 'abierta', 
          startTime: { [Op.gt]: new Date() } 
        },
        order: [['startTime', 'ASC']],
        limit: 20 
      });

      if (!schedules.length) return { message: "No hay horarios de trabajo habilitados próximamente." };

      // --- 3. OBTENER CITAS OCUPADAS (APPOINTMENTS) ---
      // CORRECCIÓN: Usamos 'startTime' en lugar de 'date'
      const takenAppointments = await db.Appointment.findAll({
        where: {
          professionalId: { [Op.in]: professionalIdsToSearch },
          status: { [Op.not]: 'cancelada' }, 
          startTime: { [Op.gte]: new Date() } // <-- CAMBIO AQUÍ
        }
      });

      // --- 4. GENERAR SLOTS LIBRES ---
      let freeSlotsList = [];
      const SLOT_DURATION = 30; // Minutos

      for (const schedule of schedules) {
        let currentTime = getUTCDateFromSequelize(schedule.startTime);
        const endTime = getUTCDateFromSequelize(schedule.endTime);

        while (currentTime.getTime() < endTime.getTime()) {
          const slotEnd = new Date(currentTime.getTime() + SLOT_DURATION * 60000);
          if (slotEnd.getTime() > endTime.getTime()) break; 

          // --- COMPARACIÓN DE FECHAS ---
          const isTaken = takenAppointments.some(app => {
            try {
                // CORRECCIÓN: Usamos app.startTime
                if (!app.startTime) return false;

                const appointmentFullDate = getUTCDateFromSequelize(app.startTime);
                
                if (!appointmentFullDate || isNaN(appointmentFullDate.getTime())) return false;

                // Comparamos si es el mismo doctor Y la misma hora (margen 1 min)
                return app.professionalId === schedule.professionalId && 
                       Math.abs(appointmentFullDate.getTime() - currentTime.getTime()) < 60000; 
            } catch (err) {
                return false;
            }
          });

          if (!isTaken) {
            const doctorInfo = professionalsMap[schedule.professionalId] || "Doctor";
            
            // HORA SIN CONVERSIÓN (usa la hora tal cual está en la BD)
            const fechaBonita = formatDateHumanWithoutTimezone(currentTime);

            freeSlotsList.push(`- ID_AGENDA: ${schedule.id} | ${doctorInfo} | ${fechaBonita}`);
          }

          currentTime = new Date(currentTime.getTime() + SLOT_DURATION * 60000);
        }
      }

      if (freeSlotsList.length === 0) {
        return { message: "Todas las citas próximas están ocupadas." };
      }

      const finalSlotsString = freeSlotsList.slice(0, 15).join('\n');

      // --- 5. PROMPT ---
      // Usar el prompt base del archivo externo + instrucciones específicas para este servicio
      const systemPrompt = `
        ${this.fullPrompt}
        
        ## INSTRUCCIONES ADICIONALES PARA ESTE SERVICIO (Recomendación Simple):
        - Este es el servicio de RECOMENDACIÓN SIMPLE (no conversacional completo).
        - Analiza la consulta del usuario y RECOMIENDA SOLO LOS HORARIOS DE LA LISTA proporcionada.
        - USA SIEMPRE LOS NOMBRES Y ESPECIALIDADES exactos que ves en la lista.
        - Si el usuario saluda, pregunta la especialidad que desea.
        
        ## FORMATO DE RESPUESTA (OBLIGATORIO - JSON):
        Debes responder SOLO en formato JSON, de una de estas dos formas:
        
        OPCIÓN 1 - Con recomendaciones:
        {
          "recommendations": [
            {
              "scheduleId": 123,
              "reason": "Disponible martes por la tarde como solicitaste",
              "date_human": "Martes 11 de enero, 2:00 PM con Dra. Ana López"
            }
          ]
        }
        
        OPCIÓN 2 - Mensaje informativo:
        {
          "message": "No encontré horarios disponibles para esa especialidad esta semana."
        }

        ## HORARIOS LIBRES (DATOS REALES - NO INVENTAR):
        ${finalSlotsString}
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: systemPrompt },
          // El mensaje del usuario NO debe incluir la agenda; la agenda va en el system/contexto.
          { role: "user", content: `${userQuery}` }
        ],
        response_format: { type: "json_object" }
      });

      const raw = completion.choices[0].message.content;
      let parsed;
      try { parsed = JSON.parse(raw); } catch (e) { return { message: "Error procesando IA." }; }

      if (parsed.recommendations && Array.isArray(parsed.recommendations)) return parsed.recommendations;
      return parsed; 

    } catch (error) {
      console.error("[IA ERROR]:", error); 
      if (error.status === 403) return { message: "Error de región (VPN requerido)." };
      return { message: "Ocurrió un error interno." };
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
 * @returns {string} Fecha formateada legible (ej: "lunes 15 de enero, 13:00")
 */
function formatDateHumanWithoutTimezone(date) {
  if (!date) return '';
  const weekdays = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  
  const weekday = weekdays[date.getUTCDay()];
  const day = date.getUTCDate();
  const month = months[date.getUTCMonth()];
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  
  return `${weekday} ${day} de ${month}, ${hours}:${minutes}`;
}

module.exports = new OpenAIService();