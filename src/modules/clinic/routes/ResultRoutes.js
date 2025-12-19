const { Router } = require('express');
const {
  listHandler,
  getHandler,
  getByOrderHandler,
  createHandler,
  updateHandler,
  deleteHandler,
  getVersionHistoryHandler,
  getVersionHandler,
  getLatestVersionHandler,
  compareVersionsHandler,
} = require('../controllers/ResultController');

const {
  validateCreate,
  validateUpdate,
  validateId,
  validateOrderId,
  validateList,
  validateVersionId,
  validateCompareVersions,
} = require('../validators/ResultValidator');

const router = Router();

// Rutas sin parámetros dinámicos primero
router.get('/', validateList, listHandler);
router.post('/', validateCreate, createHandler);

// Rutas con paths específicos ANTES de rutas con :id genérico
router.get('/orden/:ordenId', validateOrderId, getByOrderHandler);
router.get('/version/:versionId', validateVersionId, getVersionHandler);

// Rutas con :id pero con sufijos específicos
router.get('/:id/versiones', validateId, getVersionHistoryHandler);
router.get('/:id/version-actual', validateId, getLatestVersionHandler);
router.get('/:id/comparar', validateCompareVersions, compareVersionsHandler);

// Rutas genéricas con :id al final (estas capturan todo)
router.get('/:id', validateId, getHandler);
router.patch('/:id', validateUpdate, updateHandler);
router.delete('/:id', validateId, deleteHandler);

module.exports = router;

