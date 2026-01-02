const OpenAI = require("openai");
const { Op } = require("sequelize");
const db = require("../../../../database/models");

const KNOWN_SPECIALTIES = [
  'Odontología General', 'Ortodoncia', 'Endodoncia', 'Periodoncia', 
  'Odontopediatría', 'Cirugía Oral', 'Prótesis', 'Implantología', 'Estética'
];

class OpenAIService {
  constructor() {
    if (!process.env.OPENAI_API_KEY) console.error("⚠️ FALTA OPENAI_API_KEY");
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
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
        let currentTime = new Date(schedule.startTime);
        const endTime = new Date(schedule.endTime);

        while (currentTime < endTime) {
          const slotEnd = new Date(currentTime.getTime() + SLOT_DURATION * 60000);
          if (slotEnd > endTime) break; 

          // --- COMPARACIÓN DE FECHAS ---
          const isTaken = takenAppointments.some(app => {
            try {
                // CORRECCIÓN: Usamos app.startTime
                if (!app.startTime) return false;

                const appointmentFullDate = new Date(app.startTime);
                
                if (isNaN(appointmentFullDate.getTime())) return false;

                // Comparamos si es el mismo doctor Y la misma hora (margen 1 min)
                return app.professionalId === schedule.professionalId && 
                       Math.abs(appointmentFullDate.getTime() - currentTime.getTime()) < 60000; 
            } catch (err) {
                return false;
            }
          });

          if (!isTaken) {
            const doctorInfo = professionalsMap[schedule.professionalId] || "Doctor";
            
            // HORA VENEZUELA
            const fechaBonita = currentTime.toLocaleDateString('es-ES', { 
                weekday: 'long', day: 'numeric', month: 'long', 
                hour: '2-digit', minute:'2-digit', 
                timeZone: 'America/Caracas' 
            });

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
      const systemPrompt = `
        Eres un asistente de la Clínica Dental Plus.
        
        INSTRUCCIONES:
        1. Si el usuario saluda, pregunta la especialidad que desea.
        2. Filtra por la especialidad y RECOMIENDA SOLO LOS HORARIOS DE LA LISTA .
        3. USA SIEMPRE LOS NOMBRES Y ESPECIALIDADES QUE VES EN LA LISTA.

        FORMATO RESPUESTA (JSON):
        {
          "recommendations": [
             {"scheduleId": 123, "reason": "Disponible con Dr. X", "date_human": "Lunes 5, 9:30 AM con Dr. X"}
          ]
        }
        O { "message": "..." }
      `;

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Usuario: "${userQuery}"\n\nHORARIOS LIBRES:\n${finalSlotsString}` }
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

module.exports = new OpenAIService();