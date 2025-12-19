const { Router } = require('express');
const {
  listHandler,
  getHandler,
  createHandler,
  updateHandler,
  closeHandler,
} = require('../controllers/EpisodeController');
const {
  validateCreate,
  validateUpdate,
  validateId,
  validateList,
} = require('../validators/EpisodeValidator');
const { episodeDiagnosisRouter } = require('./DiagnosisRouter');

const router = Router();

router.get('/', validateList, listHandler);
router.post('/', validateCreate, createHandler);
router.get('/:id', validateId, getHandler);
router.patch('/:id', validateUpdate, updateHandler);
router.patch('/:id/cerrar', validateId, closeHandler);
router.use('/', episodeDiagnosisRouter);

module.exports = router;
