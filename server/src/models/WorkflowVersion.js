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

const WorkflowVersionSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    workflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workflow',
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
      index: true,
    },
    icon: {
      type: String,
      default: '⚡',
    },
    // Explicit Form Version Pinning
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Form',
      default: null,
    },
    formVersionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FormVersion',
      default: null,
    },
    formSchema: [FormFieldSchema],
    steps: [WorkflowStepSchema],
    nodes: {
      type: Array,
      default: [],
    },
    edges: {
      type: Array,
      default: [],
    },
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

// Unique compound index: One version number per parent workflow
WorkflowVersionSchema.index({ workflowId: 1, version: 1 }, { unique: true });
WorkflowVersionSchema.index({ organizationId: 1, workflowId: 1, status: 1 });

module.exports = mongoose.model('WorkflowVersion', WorkflowVersionSchema);
