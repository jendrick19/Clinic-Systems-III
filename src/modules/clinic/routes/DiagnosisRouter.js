const { Router } = require('express');
const {
  listHandler,
  getHandler,
  getByEpisodeHandler,
  getPrincipalHandler,
  createHandler,
  updateHandler,
  changePrincipalHandler,
  deleteHandler,
} = require('../controllers/DiagnosisController');
const {
  validateCreate,
  validateUpdate,
  validateId,
  validateEpisodeId,
  validateList,
  validatePrincipalByEpisode,
  validateChangePrincipal,
} = require('../validators/DiagnosisValidator');

const router = Router();

router.get('/', validateList, listHandler);
router.post('/', validateCreate, createHandler);
router.get('/:id', validateId, getHandler);
router.put('/:id', validateUpdate, updateHandler);
router.delete('/:id', validateId, deleteHandler);

const episodeDiagnosisRouter = Router();

episodeDiagnosisRouter.get('/:episodeId/diagnosticos', validateEpisodeId, getByEpisodeHandler);
episodeDiagnosisRouter.get('/:episodeId/diagnosticos/principal', validatePrincipalByEpisode, getPrincipalHandler);
episodeDiagnosisRouter.put('/:episodeId/diagnosticos/:diagnosisId/principal', validateChangePrincipal, changePrincipalHandler);

module.exports = router;
module.exports.episodeDiagnosisRouter = episodeDiagnosisRouter;
