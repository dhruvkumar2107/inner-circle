const mongoose = require('mongoose');

// Define the User schema with all fields from the build prompt
const userSchema = new mongoose.Schema({
  realName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  studentId: { type: String, trim: true },
  college: { type: String, trim: true },
  dept: { type: String, trim: true },
  year: { type: Number },
  alias: { type: String, unique: true, trim: true },
  role: { type: String, enum: ['student', 'volunteer', 'professional', 'admin'], default: 'student' },
  aliasHistory: [{ type: String }],
  language: { type: String, enum: ['en', 'hi', 'kn'], default: 'en' },
  consent: {
    privacy: { type: Boolean, default: false },
    research: { type: Boolean, default: false },
    ts: { type: Date, default: Date.now },
  },
  allowAliasRevealToCounselor: { type: Boolean, default: false },
  assignedProfessionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  streak: { type: Number, default: 0 },
  points: { type: Number, default: 0 },
  badges: [{ type: String }],
  isAnonymous: { type: Boolean, default: true },
  lockUntil: { type: Date },
  lastLoginAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Methods
userSchema.methods.getProfileJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  return obj;
};

userSchema.methods.verifyPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign({ _id: this._id, role: this.role }, process.env.JWT_SECRET || 'inner-circle-jwt-secret', { expiresIn: '24h' });
  return token;
};

// Static methods
userSchema.statics.findByEmail = async function (email) {
  return await this.findOne({ email: email.trim().toLowerCase() });
};

userSchema.statics.findByAlias = async function (alias) {
  return await this.findOne({ alias: alias.trim() });
};

userSchema.statics.findAdmins = async function () {
  return await this.find({ role: 'admin' });
};

module.exports = mongoose.model('User', userSchema);