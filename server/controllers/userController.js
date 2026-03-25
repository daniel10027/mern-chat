const User = require('../models/User');

exports.getUsers = async (req, res, next) => {
  try {
    const { search = '' } = req.query;
    const q = search
      ? { $or: [{ name: { $regex: search, $options: 'i' } }, { username: { $regex: search, $options: 'i' } }], _id: { $ne: req.user._id } }
      : { _id: { $ne: req.user._id } };
    const users = await User.find(q).select('name username avatar isOnline lastSeen bio').limit(20);
    res.json(users);
  } catch (err) { next(err); }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('name username avatar isOnline lastSeen bio createdAt');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { name, bio, avatar } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (avatar) updates.avatar = avatar;
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
    res.json(user);
  } catch (err) { next(err); }
};

exports.toggleFriend = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const isFriend = user.friends.includes(req.params.id);
    isFriend ? user.friends.pull(req.params.id) : user.friends.push(req.params.id);
    await user.save();
    res.json({ isFriend: !isFriend });
  } catch (err) { next(err); }
};

exports.getFriends = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('friends', 'name username avatar isOnline lastSeen');
    res.json(user.friends);
  } catch (err) { next(err); }
};
