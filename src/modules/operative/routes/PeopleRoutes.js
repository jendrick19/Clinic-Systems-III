const { Router } = require('express');

const {
  listHandler,
  getHandler,
  createHandler,
  updateHandler,
  deleteHandler,
} = require('../controllers/PeopleController');

const {
  validateCreate,
  validateUpdate,
  validateId,
  validateList,
} = require('../validators/PeopleValidator');

const router = Router();

router.get('/', validateList, listHandler);
router.post('/', validateCreate, createHandler);
router.get('/:id', validateId, getHandler);
router.patch('/:id', validateUpdate, updateHandler);
router.delete('/:id', validateId, deleteHandler);

module.exports = router;
