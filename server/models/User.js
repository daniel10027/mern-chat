const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String, required: [true, 'Name is required'],
    trim: true, maxlength: [50, 'Name max 50 chars'],
  },
  username: {
    type: String, required: [true, 'Username is required'],
    unique: true, trim: true, lowercase: true,
    minlength: [3, 'Username min 3 chars'],
    maxlength: [20, 'Username max 20 chars'],
    match: [/^[a-z0-9_]+$/, 'Username: letters, numbers, underscores only'],
  },
  email: {
    type: String, required: [true, 'Email is required'],
    unique: true, lowercase: true, trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
  },
  password: {
    type: String,
    minlength: [6, 'Password min 6 chars'],
    select: false,
  },
  avatar: { type: String, default: '' },
  bio:    { type: String, maxlength: [200, 'Bio max 200 chars'], default: '' },
  role:   { type: String, enum: ['user', 'admin'], default: 'user' },
  isOnline:   { type: Boolean, default: false },
  lastSeen:   { type: Date, default: Date.now },
  isVerified: { type: Boolean, default: false },
  googleId:   { type: String, sparse: true },

  // Password reset
  resetPasswordToken:   String,
  resetPasswordExpires: Date,

  // Email verification
  emailVerifyToken:   String,
  emailVerifyExpires: Date,

  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare passwords
userSchema.methods.correctPassword = async function (candidate, hashed) {
  return bcrypt.compare(candidate, hashed);
};

// Generate password reset token
userSchema.methods.createPasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
  this.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  return token;
};

// Generate email verify token
userSchema.methods.createEmailVerifyToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerifyToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerifyExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
  return token;
};

// Remove password from output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  delete obj.emailVerifyToken;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
