const express = require('express');
const router = express.Router();
const codeController = require('../controllers/codeController');

// Route to execute code
router.post('/run-code', codeController.runCode);

module.exports = router;
