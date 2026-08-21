const mongoose = require('mongoose');

const organizationMemberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    roleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
      index: true,
    },
    role: {
      type: String,
      default: 'member',
      trim: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
      index: true,
    },
    jobTitle: {
      type: String,
      default: '',
      trim: true,
      maxlength: [100, 'Job title cannot exceed 100 characters'],
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'invited', 'suspended', 'removed'],
        message: '{VALUE} is not a valid membership status',
      },
      default: 'active',
      index: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
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

// Compound indexes
organizationMemberSchema.index({ organizationId: 1, userId: 1 }, { unique: true });
organizationMemberSchema.index({ organizationId: 1, roleId: 1 });
organizationMemberSchema.index({ organizationId: 1, departmentId: 1 });

const OrganizationMember = mongoose.model('OrganizationMember', organizationMemberSchema);

module.exports = OrganizationMember;
