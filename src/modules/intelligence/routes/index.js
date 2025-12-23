const { Router } = require('express');
const iaController = require('../controllers/IAController');

const router = Router();

// Endpoint: POST /api/intelligence/recommend
router.post('/recommend', iaController.recommend);

module.exports = router;