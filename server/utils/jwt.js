const jwt = require('jsonwebtoken');
const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);
  res.cookie('jwt', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.status(statusCode).json({ token, user });
};
module.exports = { signToken, sendTokenResponse };
