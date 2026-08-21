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

const WorkflowStepSchema = new mongoose.Schema(
  {
    stepNumber: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    stepType: {
      type: String,
      enum: ['approval', 'notification', 'task'],
      default: 'approval',
    },
    assigneeType: {
      type: String,
      enum: ['role', 'manager', 'user', 'department_head'],
      default: 'role',
    },
    assigneeRoleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      default: null,
    },
    assigneeRoleKey: {
      type: String,
      default: null,
    },
    assigneeUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    autoApproveHours: {
      type: Number,
      default: 0,
    },
    slaHours: {
      type: Number,
      default: 24,
    },
    conditionLogic: {
      type: String,
      enum: ['always', 'all', 'any'],
      default: 'always',
    },
    conditions: [
      {
        field: {
          type: String,
          default: '',
        },
        operator: {
          type: String,
          enum: ['gt', 'gte', 'lt', 'lte', 'eq', 'neq', 'contains'],
          default: 'gt',
        },
        value: {
          type: mongoose.Schema.Types.Mixed,
          default: '',
        },
        action: {
          type: String,
          enum: ['require', 'skip'],
          default: 'require',
        },
      },
    ],
    requireAll: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

const WorkflowSchema = new mongoose.Schema(
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
      default: '⚡',
    },
    status: {
      type: String,
      enum: ['active', 'draft', 'archived'],
      default: 'active',
      index: true,
    },
    formSchema: [FormFieldSchema],
    steps: [WorkflowStepSchema],
    // Pointers to active versions
    currentVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkflowVersion',
      default: null,
    },
    publishedVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkflowVersion',
      default: null,
    },
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

WorkflowSchema.index({ organizationId: 1, name: 1 });
WorkflowSchema.index({ organizationId: 1, status: 1 });

module.exports = mongoose.model('Workflow', WorkflowSchema);
