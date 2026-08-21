const mongoose = require('mongoose');

const PlatformSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: 'global_config',
      unique: true,
    },
    platformName: {
      type: String,
      default: 'Nexus Platform',
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    registrationAllowed: {
      type: Boolean,
      default: true,
    },
    defaultStorageProvider: {
      type: String,
      enum: ['local', 's3', 'azure'],
      default: 'local',
    },
    aiConfig: {
      defaultProvider: {
        type: String,
        enum: ['gemini', 'openai', 'anthropic'],
        default: 'gemini',
      },
      defaultModel: {
        type: String,
        default: 'gemini-1.5-flash',
      },
      globalApiKey: {
        type: String,
        default: '',
      },
    },
    planLimits: {
      starter: {
        priceMonthly: { type: Number, default: 0 },
        membersLimit: { type: Number, default: 5 },
        workflowsLimit: { type: Number, default: 5 },
        tasksLimit: { type: Number, default: 20 },
        storageLimitMb: { type: Number, default: 500 },
      },
      growth: {
        priceMonthly: { type: Number, default: 49 },
        membersLimit: { type: Number, default: 100 },
        workflowsLimit: { type: Number, default: 50 },
        tasksLimit: { type: Number, default: 500 },
        storageLimitMb: { type: Number, default: 5000 },
      },
      enterprise: {
        priceMonthly: { type: Number, default: 199 },
        membersLimit: { type: Number, default: 1000 },
        workflowsLimit: { type: Number, default: 500 },
        tasksLimit: { type: Number, default: 10000 },
        storageLimitMb: { type: Number, default: 50000 },
      },
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

module.exports = mongoose.model('PlatformSetting', PlatformSettingSchema);
