const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Generate family tree with AI assistance
router.post('/generate-tree', protect, async (req, res) => {
  try {
    // Check if AI is configured
    const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
    const hasGemini = Boolean(process.env.GEMINI_API_KEY);

    if (!hasOpenAI && !hasGemini) {
      return res.status(503).json({
        success: false,
        error: 'AI generation is currently unavailable. No AI provider is configured on this server.',
        code: 'AI_NOT_CONFIGURED'
      });
    }

    // Dynamically import the controller
    const { generateTree } = require('../controllers/ai/generateTreeController');

    // Call the actual handler
    return await generateTree(req, res);
  } catch (error) {
    console.error('AI Route Error:', error.message);

    // Check for specific error conditions
    if (error.message?.includes('OPENAI_API_KEY') || error.message?.includes('GEMINI_API_KEY')) {
      return res.status(503).json({
        success: false,
        error: 'AI service is not properly configured. Please contact support.',
        code: 'AI_NOT_CONFIGURED'
      });
    }

    // Generic error fallback
    return res.status(500).json({
      success: false,
      error: error.message || 'AI generation failed. Please try again.'
    });
  }
});

module.exports = router;
