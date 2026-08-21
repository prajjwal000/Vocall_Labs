const mongoose = require('mongoose');

const TaskActivitySchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: ['created', 'started', 'completed', 'delegated', 'cancelled', 'updated', 'commented'],
        message: '{VALUE} is not a valid task activity type',
      },
      required: true,
    },
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    actorName: {
      type: String,
      default: '',
    },
    actorEmail: {
      type: String,
      default: '',
    },
    details: {
      type: String,
      default: '',
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
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

TaskActivitySchema.index({ taskId: 1, createdAt: 1 });
TaskActivitySchema.index({ organizationId: 1, createdAt: -1 });

const TaskActivity = mongoose.model('TaskActivity', TaskActivitySchema);

module.exports = TaskActivity;
