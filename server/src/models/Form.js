const mongoose = require('mongoose');

const FormSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },
    category: {
      type: String,
      enum: ['expense', 'leave', 'procurement', 'it_support', 'general'],
      default: 'general',
      index: true,
    },
    icon: {
      type: String,
      default: '📋',
    },
    // Pointers to active versions
    currentVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FormVersion',
      default: null,
    },
    publishedVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FormVersion',
      default: null,
    },
    // Tracks sequential versioning (v1, v2, v3...)
    latestVersionNumber: {
      type: Number,
      default: 1,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
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

FormSchema.index({ organizationId: 1, name: 1 });
FormSchema.index({ organizationId: 1, category: 1 });

module.exports = mongoose.model('Form', FormSchema);
