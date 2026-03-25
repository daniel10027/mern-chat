const mongoose = require('mongoose');
const messageSchema = new mongoose.Schema({ chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true }, sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, content: { type: String, trim: true, maxlength: 2000 }, type: { type: String, default: 'text' }, readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' }, deleted: { type: Boolean, default: false } }, { timestamps: true });
const chatSchema = new mongoose.Schema({ name: { type: String, trim: true }, isGroup: { type: Boolean, default: false }, members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' } }, { timestamps: true });
const Message = mongoose.model('Message', messageSchema);
const Chat = mongoose.model('Chat', chatSchema);
module.exports = { Chat, Message };
