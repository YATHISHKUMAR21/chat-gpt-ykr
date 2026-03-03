const express = require('express');
const router = express.Router();
const authUser = require('../middlewares/auth.middleware');
const chatController = require('../controllers/chat.controller');


router.post('/', authUser, chatController.createChat);

module.exports = router;