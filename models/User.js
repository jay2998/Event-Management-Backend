const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const softDeletePlugin = require('../middlewares/softDelete');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      validate: {
        validator: function (v) {
          if (v == null || v === '') return true; // optional
          const re = /^(\+92\d{10}|03\d{9})$/;
          return re.test(String(v));
        },
        message: 'Please provide a valid Pakistani phone number (+92... or 03...)',
      },
    },
    role: {
      type: String,
      enum: ['customer', 'vendor', 'admin', 'supervisor'],
      default: 'customer',
    },
    avatar: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.index({ role: 1 });

userSchema.plugin(softDeletePlugin);


// Hash password before saving (skip if already hashed)
userSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return;
  }
  if (this.password && this.password.startsWith('$2a$')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

