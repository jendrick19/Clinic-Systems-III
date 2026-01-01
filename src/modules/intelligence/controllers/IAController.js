const smartSchedulingService = require('../services/SmartSchedulingService');
const openAIService = require('../services/OpenAIService');

class IAController {
    
  async recommend(req, res) {
    try {
      const { query, professionalId, provider = 'gemini' } = req.body;

      if (!query || !professionalId) {
        return res.status(400).json({ 
          error: 'Se requiere "query" (texto del usuario) y "professionalId".' 
        });
      }

      let recommendations;
      if (provider === 'openai') {
        try {
          recommendations = await openAIService.recommendSlots(query, professionalId);
        } catch (err) {
          console.warn('[IAController] OpenAI falló, aplicando fallback a Gemini:', err.message || err);
          // intentar fallback con Gemini (servicio interno)
          recommendations = await smartSchedulingService.recommendSlots(query, professionalId);
          // si queremos indicar que fue fallback, podemos envolver la respuesta
          if (!Array.isArray(recommendations)) {
            recommendations = { fallback: true, data: recommendations };
          } else {
            recommendations = { fallback: true, data: recommendations };
          }
        }
      } else {
        recommendations = await smartSchedulingService.recommendSlots(query, professionalId);
      }
      
      // Normalizar respuesta: si hacemos fallback, recommendations puede venir envuelto
      let responseData = recommendations;
      let meta = null;
      if (recommendations && typeof recommendations === 'object' && recommendations.fallback && recommendations.data !== undefined) {
        responseData = recommendations.data;
        meta = { fallback: true };
      }

      return res.status(200).json({
        success: true,
        data: responseData,
        meta
      });

    } catch (error) {
      return res.status(500).json({ 
        success: false, 
        message: error.message 
      });
    }
  }
}

module.exports = new IAController();