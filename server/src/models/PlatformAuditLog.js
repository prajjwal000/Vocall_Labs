const mongoose = require('mongoose');

const PlatformAuditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      index: true,
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
    targetType: {
      type: String,
      default: '',
    },
    targetId: {
      type: String,
      default: '',
    },
    targetName: {
      type: String,
      default: '',
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: '127.0.0.1',
    },
    userAgent: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
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

PlatformAuditLogSchema.index({ createdAt: -1 });
PlatformAuditLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('PlatformAuditLog', PlatformAuditLogSchema);
