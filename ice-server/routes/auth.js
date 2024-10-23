const express = require('express');
const { login, saveToken } = require('../controllers/auth');
const router = express.Router();

// Login route
router.post('/login', login);

// Save token route
router.post('/save-token', saveToken);

module.exports = router;
