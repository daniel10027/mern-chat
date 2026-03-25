const { Chat, Message } = require('../models/Chat');
const { getIO } = require('../config/socket');

// ── Get or create 1-on-1 chat ─────────────────────────────────────────────────
exports.accessChat = async (req, res, next) => {
  try {
    const { userId } = req.body;
    let chat = await Chat.findOne({
      isGroup: false,
      members: { $all: [req.user._id, userId] },
    }).populate('members', '-password').populate('lastMessage');

    if (!chat) {
      chat = await Chat.create({
        isGroup: false,
        members: [req.user._id, userId],
      });
      chat = await Chat.findById(chat._id).populate('members', '-password');
    }
    res.json(chat);
  } catch (err) { next(err); }
};

// ── Get all chats for user ────────────────────────────────────────────────────
exports.getChats = async (req, res, next) => {
  try {
    const chats = await Chat.find({ members: req.user._id })
      .populate('members', 'name username avatar isOnline lastSeen')
      .populate('admin', 'name username avatar')
      .populate({ path: 'lastMessage', populate: { path: 'sender', select: 'name username' } })
      .sort({ updatedAt: -1 });
    res.json(chats);
  } catch (err) { next(err); }
};

// ── Create group chat ─────────────────────────────────────────────────────────
exports.createGroupChat = async (req, res, next) => {
  try {
    const { name, members } = req.body;
    if (!name || !members || members.length < 2)
      return res.status(400).json({ message: 'Group needs a name and at least 2 members' });

    const allMembers = [...new Set([...members, req.user._id.toString()])];
    const chat = await Chat.create({
      name, isGroup: true, members: allMembers, admin: req.user._id,
    });
    const populated = await Chat.findById(chat._id)
      .populate('members', 'name username avatar')
      .populate('admin', 'name username avatar');
    res.status(201).json(populated);
  } catch (err) { next(err); }
};

// ── Send message ──────────────────────────────────────────────────────────────
exports.sendMessage = async (req, res, next) => {
  try {
    const { chatId, content, replyTo } = req.body;
    const chat = await Chat.findById(chatId);
    if (!chat) return res.status(404).json({ message: 'Chat not found' });
    if (!chat.members.includes(req.user._id))
      return res.status(403).json({ message: 'Not a member of this chat' });

    let msg = await Message.create({
      chat: chatId, sender: req.user._id, content, replyTo,
    });
    msg = await msg.populate('sender', 'name username avatar');
    if (replyTo) await msg.populate('replyTo');

    await Chat.findByIdAndUpdate(chatId, { lastMessage: msg._id });

    // Emit to chat room via socket
    try {
      getIO().to(chatId).emit('message:new', msg);
    } catch { /* socket not critical */ }

    res.status(201).json(msg);
  } catch (err) { next(err); }
};

// ── Get messages ──────────────────────────────────────────────────────────────
exports.getMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const messages = await Message.find({ chat: chatId, deleted: false })
      .populate('sender', 'name username avatar')
      .populate('replyTo')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    res.json(messages.reverse());
  } catch (err) { next(err); }
};

// ── Delete message ────────────────────────────────────────────────────────────
exports.deleteMessage = async (req, res, next) => {
  try {
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    if (msg.sender.toString() !== req.user._id.toString())
      return res.status(403).json({ message: 'Cannot delete another user\'s message' });
    msg.deleted = true;
    msg.content = 'This message was deleted';
    await msg.save();
    try { getIO().to(msg.chat.toString()).emit('message:deleted', msg._id); } catch {}
    res.json({ message: 'Message deleted' });
  } catch (err) { next(err); }
};
