const express = require('express');
const r = express.Router();
const ctrl = require('../controllers/chatController');
const { protect } = require('../middleware/auth');
r.use(protect);
r.post('/', ctrl.sendMessage);
r.get('/:chatId', ctrl.getMessages);
r.delete('/:id', ctrl.deleteMessage);
module.exports = r;
