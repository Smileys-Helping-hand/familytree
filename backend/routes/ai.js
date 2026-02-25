const express = require('express');
const router = express.Router();
const { generateTree } = require('../controllers/ai/generateTreeController');

router.post('/generate-tree', generateTree);

module.exports = router;
