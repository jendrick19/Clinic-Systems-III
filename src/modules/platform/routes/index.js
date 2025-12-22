const { Router } = require('express');
const authRoutes = require('./AuthRoutes');

const router = Router();

router.get('/health', (req, res) => {
  res.json({
    module: 'platform-access',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Rutas de autenticación: /api/platform/auth
router.use('/auth', authRoutes);

module.exports = router;
