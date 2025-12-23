const smartSchedulingService = require('../services/SmartSchedulingService');

class IAController {
    
  async recommend(req, res) {
    try {
      const { query, professionalId } = req.body;

      if (!query || !professionalId) {
        return res.status(400).json({ 
          error: 'Se requiere "query" (texto del usuario) y "professionalId".' 
        });
      }

      const recommendations = await smartSchedulingService.recommendSlots(query, professionalId);
      
      return res.status(200).json({
        success: true,
        data: recommendations
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