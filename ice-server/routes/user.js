const express = require('express');
const { getUser, getUserList } = require('../controllers/user');
const router = express.Router();

// User routes
router.get('/me', getUser);
router.get('/user-list', getUserList);

module.exports = router;
