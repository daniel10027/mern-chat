const crypto = require('crypto');
const User = require('../models/User');
const { sendTokenResponse } = require('../utils/jwt');
const { sendEmail, emailTemplates } = require('../utils/email');

// ── Register ──────────────────────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { name, username, email, password } = req.body;
    if (!name || !username || !email || !password)
      return res.status(400).json({ message: 'All fields are required' });

    const user = await User.create({ name, username, email, password });

    // Send verification email
    try {
      const token = user.createEmailVerifyToken();
      await user.save({ validateBeforeSave: false });
      const url = `${process.env.CLIENT_URL}/verify-email/${token}`;
      const tpl = emailTemplates.verifyEmail(user.name, url);
      await sendEmail({ to: user.email, ...tpl });
    } catch { /* don't block registration if email fails */ }

    sendTokenResponse(user, 201, res);
  } catch (err) { next(err); }
};

// ── Login ─────────────────────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Email and password required' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.correctPassword(password, user.password)))
      return res.status(401).json({ message: 'Invalid credentials' });

    sendTokenResponse(user, 200, res);
  } catch (err) { next(err); }
};

// ── Logout ────────────────────────────────────────────────────────────────────
exports.logout = (req, res) => {
  res.cookie('jwt', '', { httpOnly: true, expires: new Date(0) });
  res.json({ message: 'Logged out successfully' });
};

// ── Get current user ──────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  res.json(req.user);
};

// ── Verify email ──────────────────────────────────────────────────────────────
exports.verifyEmail = async (req, res, next) => {
  try {
    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      emailVerifyToken: hashed,
      emailVerifyExpires: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ message: 'Invalid or expired verification link' });
    user.isVerified = true;
    user.emailVerifyToken = undefined;
    user.emailVerifyExpires = undefined;
    await user.save({ validateBeforeSave: false });
    sendTokenResponse(user, 200, res);
  } catch (err) { next(err); }
};

// ── Forgot password ───────────────────────────────────────────────────────────
exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ message: 'No account with that email' });

    const token = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const url = `${process.env.CLIENT_URL}/reset-password/${token}`;
    const tpl = emailTemplates.resetPassword(user.name, url);
    await sendEmail({ to: user.email, ...tpl });

    res.json({ message: 'Password reset link sent to your email' });
  } catch (err) {
    next(err);
  }
};

// ── Reset password ────────────────────────────────────────────────────────────
exports.resetPassword = async (req, res, next) => {
  try {
    const hashed = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashed,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ message: 'Invalid or expired reset link' });

    if (!req.body.password || req.body.password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (err) { next(err); }
};

// ── Change password ───────────────────────────────────────────────────────────
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');
    if (!await user.correctPassword(currentPassword, user.password))
      return res.status(400).json({ message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    sendTokenResponse(user, 200, res);
  } catch (err) { next(err); }
};
