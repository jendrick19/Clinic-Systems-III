const smartSchedulingService = require('../services/SmartSchedulingService');
const openAIService = require('../services/OpenAIService');

class IAController {
    
  async recommend(req, res) {
    try {
      const { query, professionalId, provider = 'gemini' } = req.body;

      if (!query || !professionalId) {
        return res.status(400).json({ 
          success: false,
          message: 'Se requiere "query" (texto del usuario) y "professionalId".' 
        });
      }

      let recommendations;

      // Lógica estricta: Si es OpenAI, usa OpenAI. Si es Gemini, usa Gemini.
      // SIN FALLBACKS automáticos que mezclen los errores.
      if (provider === 'openai') {
        console.log('[IAController] Usando proveedor: OpenAI');
        recommendations = await openAIService.recommendSlots(query, professionalId);
      } else {
        console.log('[IAController] Usando proveedor: Google Gemini');
        recommendations = await smartSchedulingService.recommendSlots(query, professionalId);
      }
      
      return res.status(200).json({
        success: true,
        data: recommendations
      });

    } catch (error) {
      console.error('[IAController Error]:', error.message);
      
      // Mensaje de error amigable para el frontend
      return res.status(500).json({ 
        success: false, 
        message: error.message || 'Error interno en el servicio de IA'
      });
    }
  }
}

module.exports = new IAController();