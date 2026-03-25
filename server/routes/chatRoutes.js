const express = require('express');
const r = express.Router();
const ctrl = require('../controllers/chatController');
const { protect } = require('../middleware/auth');
r.use(protect);
r.post('/', ctrl.accessChat);
r.get('/', ctrl.getChats);
r.post('/group', ctrl.createGroupChat);
module.exports = r;
