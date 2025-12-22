const { Router } = require('express');
const platformRoutes = require('./routes');
const router = Router();

// Las rutas de platform se montan directamente sin prefijo adicional
router.use('/', platformRoutes);

module.exports = router;
