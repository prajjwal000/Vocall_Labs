const mongoose = require('mongoose');

const DelegationHistorySchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    delegatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    delegatedAt: {
      type: Date,
      default: Date.now,
    },
    reason: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Delegation reason cannot exceed 500 characters'],
    },
  },
  { _id: true }
);

const TaskSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Assigner is required'],
      index: true,
    },
    originalAssignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Original assignee is required'],
      index: true,
    },
    currentAssignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Current assignee is required'],
      index: true,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'in_progress', 'completed', 'cancelled', 'delegated'],
        message: '{VALUE} is not a valid task status',
      },
      default: 'pending',
      index: true,
    },
    priority: {
      type: String,
      enum: {
        values: ['low', 'medium', 'high', 'urgent'],
        message: '{VALUE} is not a valid task priority',
      },
      default: 'medium',
      index: true,
    },
    dueDate: {
      type: Date,
      default: null,
      index: true,
    },
    delegationDepth: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    delegationHistory: [DelegationHistorySchema],
    completedAt: {
      type: Date,
      default: null,
    },
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    completionNotes: {
      type: String,
      default: '',
      trim: true,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    cancellationReason: {
      type: String,
      default: '',
      trim: true,
    },
    sourceWorkflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workflow',
      default: null,
      index: true,
    },
    sourceRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkflowRequest',
      default: null,
      index: true,
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

// Compound indexes for optimal tenant-scoped queries
TaskSchema.index({ organizationId: 1, currentAssignee: 1, status: 1 });
TaskSchema.index({ organizationId: 1, assignedBy: 1, status: 1 });
TaskSchema.index({ organizationId: 1, status: 1, createdAt: -1 });
TaskSchema.index({ organizationId: 1, dueDate: 1 });

const Task = mongoose.model('Task', TaskSchema);

module.exports = Task;
