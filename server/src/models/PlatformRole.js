const mongoose = require('mongoose');

const platformRoleSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, 'Platform role key is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Platform role name is required'],
      trim: true,
      maxlength: [50, 'Platform role name cannot exceed 50 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [250, 'Description cannot exceed 250 characters'],
    },
    permissions: {
      type: [String],
      default: [],
    },
    isSystem: {
      type: Boolean,
      default: true,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const PlatformRole = mongoose.model('PlatformRole', platformRoleSchema);

module.exports = PlatformRole;
