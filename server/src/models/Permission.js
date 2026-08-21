const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, 'Permission key is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Permission name is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    module: {
      type: String,
      required: [true, 'Permission module is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    action: {
      type: String,
      required: [true, 'Permission action is required'],
      lowercase: true,
      trim: true,
    },
    isSystem: {
      type: Boolean,
      default: true,
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

const Permission = mongoose.model('Permission', permissionSchema);

module.exports = Permission;
