const mongoose = require('mongoose');

const HistoryEntrySchema = new mongoose.Schema(
  {
    stepNumber: Number,
    stepName: String,
    action: {
      type: String,
      enum: ['submitted', 'approved', 'rejected', 'cancelled', 'advanced', 'auto_approved', 'skipped'],
      required: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    actorName: String,
    actorEmail: String,
    comment: {
      type: String,
      default: '',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const WorkflowRequestSchema = new mongoose.Schema(
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
    requesterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    requestCode: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    formData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
      index: true,
    },
    currentStepNumber: {
      type: Number,
      default: 1,
    },
    totalSteps: {
      type: Number,
      default: 1,
    },
    history: [HistoryEntrySchema],
    completedAt: {
      type: Date,
      default: null,
    },
    dueAt: {
      type: Date,
      default: null,
      index: true,
    },
    slaHours: {
      type: Number,
      default: 24,
    },
  },
  {
    timestamps: true,
  }
);

WorkflowRequestSchema.index({ organizationId: 1, requestCode: 1 }, { unique: true });
WorkflowRequestSchema.index({ organizationId: 1, status: 1 });
WorkflowRequestSchema.index({ organizationId: 1, requesterId: 1 });

module.exports = mongoose.model('WorkflowRequest', WorkflowRequestSchema);
