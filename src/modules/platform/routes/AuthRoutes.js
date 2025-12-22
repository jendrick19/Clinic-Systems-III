const { Router } = require('express');
const { loginHandler } = require('../controllers/AuthController');

const router = Router();

router.post('/login', loginHandler);

module.exports = router;

