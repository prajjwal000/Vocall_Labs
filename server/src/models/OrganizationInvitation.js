const mongoose = require('mongoose');

const organizationInvitationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      index: true,
      select: false,
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'accepted', 'expired', 'revoked'],
        message: '{VALUE} is not a valid invitation status',
      },
      default: 'pending',
      index: true,
    },
    roleKey: {
      type: String,
      default: 'member',
      trim: true,
    },
    roleName: {
      type: String,
      default: 'Member',
      trim: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
    revokedAt: {
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
        delete ret.tokenHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Index for compound lookup
organizationInvitationSchema.index({ organizationId: 1, email: 1, status: 1 });

const OrganizationInvitation = mongoose.model(
  'OrganizationInvitation',
  organizationInvitationSchema
);

module.exports = OrganizationInvitation;
