const { Router } = require('express');
const clinicModule = require('./modules/clinic');
const operativeModule = require('./modules/operative');
const bussinesModule = require('./modules/bussines');
const platformModule = require('./modules/platform');
const router = Router();

router.get('/', (req, res) => {
  res.send('¡Servidor con Express funcionando! 🚀');
});

router.get('/api', (req, res) => {
  res.json({
    mensaje: 'API funcionando correctamente',
    version: '1.0.0',
  });
});

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

router.use('/api/clinic', clinicModule);
router.use('/api/operative', operativeModule);
router.use('/api/bussines', bussinesModule);
router.use('/api/platform', platformModule);

module.exports = router;
