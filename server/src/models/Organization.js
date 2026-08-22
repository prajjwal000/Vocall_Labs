const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      maxlength: [100, 'Organization name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Organization slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    logo: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ['active', 'suspended', 'deleted'],
        message: '{VALUE} is not a valid organization status',
      },
      default: 'active',
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    settings: {
      timezone: {
        type: String,
        default: 'Asia/Kolkata',
      },
      dateFormat: {
        type: String,
        default: 'DD/MM/YYYY',
      },
      currency: {
        type: String,
        default: 'INR',
      },
      language: {
        type: String,
        default: 'en',
      },
      domainRestrictionEnabled: {
        type: Boolean,
        default: false,
      },
      allowedEmailDomains: {
        type: [String],
        default: [],
      },
      aiConfig: {
        provider: {
          type: String,
          enum: ['gemini', 'openai', 'claude', 'none'],
          default: 'none',
        },
        apiKey: {
          type: String,
          default: '',
        },
        model: {
          type: String,
          default: 'gemini-2.5-flash-lite',
        },
        isConfigured: {
          type: Boolean,
          default: false,
        },
      },
      storageConfig: {
        provider: {
          type: String,
          enum: ['s3', 'azure', 'local', 'none'],
          default: 'none',
        },
        s3: {
          bucket: { type: String, default: '' },
          region: { type: String, default: 'us-east-1' },
          accessKeyId: { type: String, default: '' },
          secretAccessKey: { type: String, default: '' },
          endpoint: { type: String, default: '' },
        },
        azure: {
          accountName: { type: String, default: '' },
          accountKey: { type: String, default: '' },
          containerName: { type: String, default: '' },
        },
        isConfigured: {
          type: Boolean,
          default: false,
        },
      },
      smtpConfig: {
        host: { type: String, default: '' },
        port: { type: Number, default: 587 },
        username: { type: String, default: '' },
        password: { type: String, default: '' },
        encryption: {
          type: String,
          enum: ['tls', 'ssl', 'none'],
          default: 'tls',
        },
        fromEmail: { type: String, default: '' },
        fromName: { type: String, default: '' },
        isConfigured: {
          type: Boolean,
          default: false,
        },
      },
    },
    plan: {
      type: String,
      default: 'free',
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

const Organization = mongoose.model('Organization', organizationSchema);

module.exports = Organization;
