const mongoose = require('mongoose');

const FormFieldSchema = new mongoose.Schema(
  {
    fieldKey: {
      type: String,
      required: true,
      trim: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['text', 'number', 'textarea', 'select', 'date', 'checkbox', 'file', 'file_upload'],
      default: 'text',
    },
    placeholder: {
      type: String,
      default: '',
    },
    required: {
      type: Boolean,
      default: false,
    },
    options: [
      {
        label: String,
        value: String,
      },
    ],
    defaultValue: mongoose.Schema.Types.Mixed,
  },
  { _id: false }
);

const FormVersionSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Form',
      required: true,
      index: true,
    },
    version: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
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
    },
    icon: {
      type: String,
      default: '📋',
    },
    fields: [FormFieldSchema],
    changeSummary: {
      type: String,
      default: '',
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    publishedAt: {
      type: Date,
      default: null,
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

// Unique compound index: One version number per parent form
FormVersionSchema.index({ formId: 1, version: 1 }, { unique: true });
FormVersionSchema.index({ organizationId: 1, formId: 1, status: 1 });

module.exports = mongoose.model('FormVersion', FormVersionSchema);
