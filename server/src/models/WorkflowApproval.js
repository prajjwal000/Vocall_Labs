const mongoose = require('mongoose');

const WorkflowApprovalSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    requestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'WorkflowRequest',
      required: true,
      index: true,
    },
    workflowId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workflow',
      required: true,
      index: true,
    },
    stepNumber: {
      type: Number,
      required: true,
    },
    stepName: {
      type: String,
      required: true,
      trim: true,
    },
    assignedRoleKey: {
      type: String,
      default: null,
      index: true,
    },
    assignedRoleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      default: null,
    },
    assignedUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'skipped'],
      default: 'pending',
      index: true,
    },
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    comment: {
      type: String,
      default: '',
    },
    decidedAt: {
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
    slaStatus: {
      type: String,
      enum: ['on_track', 'approaching_breach', 'breached', 'completed'],
      default: 'on_track',
    },
  },
  {
    timestamps: true,
  }
);

WorkflowApprovalSchema.index({ organizationId: 1, status: 1 });
WorkflowApprovalSchema.index({ organizationId: 1, requestId: 1, stepNumber: 1 });

module.exports = mongoose.model('WorkflowApproval', WorkflowApprovalSchema);
