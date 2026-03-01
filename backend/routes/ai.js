const express = require('express');
const router = express.Router();
const { generateTree } = require('../controllers/ai/generateTreeController');
const { protect } = require('../middleware/auth');

router.post('/generate-tree', protect, generateTree);

module.exports = router;
