const { Router } = require('express');
const bussinessRoutes = require('./routes');
const router = Router();

// Las rutas de bussines se montan directamente sin prefijo adicional
router.use('/', bussinessRoutes);

module.exports = router;
