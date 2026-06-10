const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Generate family tree with AI assistance
router.post('/generate-tree', protect, async (req, res) => {
  try {
    const { familyId, prompt } = req.body;
    if (!familyId || !prompt) {
      return res.status(400).json({
        success: false,
        error: 'familyId and prompt are required'
      });
    }

    // TODO: Implement AI generation with OpenAI/Gemini
    return res.status(501).json({
      success: false,
      error: 'AI generation not yet implemented'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
