const { Router } = require('express');
const insurerRoutes = require('./InsurerRoutes');
const planRoutes = require('./PlanRoutes');

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    module: 'bussines',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Rutas de aseguradoras: /api/bussines/aseguradoras
router.use('/aseguradoras', insurerRoutes);

// Rutas de planes: /api/bussines/planes
router.use('/planes', planRoutes);

module.exports = router;
