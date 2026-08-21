/**
 * Centralized Platform Permission Catalog for Nexus Platform Administration
 */
const PLATFORM_PERMISSIONS = [
  // Organizations Platform Module
  {
    key: 'organizations.view',
    name: 'View Organizations',
    description: 'Allows viewing all customer organizations and metadata across the platform',
    module: 'organizations',
    action: 'view',
  },
  {
    key: 'organizations.create',
    name: 'Create Organizations',
    description: 'Allows provisioning new customer organizations from platform admin',
    module: 'organizations',
    action: 'create',
  },
  {
    key: 'organizations.update',
    name: 'Update Organizations',
    description: 'Allows editing organization plans, settings, and metadata',
    module: 'organizations',
    action: 'update',
  },
  {
    key: 'organizations.suspend',
    name: 'Suspend Organizations',
    description: 'Allows suspending or deactivating customer organizations',
    module: 'organizations',
    action: 'suspend',
  },

  // Users Platform Module
  {
    key: 'users.view',
    name: 'View Users',
    description: 'Allows viewing global Nexus user accounts and platform status',
    module: 'users',
    action: 'view',
  },
  {
    key: 'users.create',
    name: 'Create Users',
    description: 'Allows creating global platform and tenant user accounts',
    module: 'users',
    action: 'create',
  },
  {
    key: 'users.update',
    name: 'Update Users',
    description: 'Allows editing user details and assigning platform roles',
    module: 'users',
    action: 'update',
  },
  {
    key: 'users.suspend',
    name: 'Suspend Users',
    description: 'Allows suspending or locking global user accounts',
    module: 'users',
    action: 'suspend',
  },

  // Roles Platform Module
  {
    key: 'roles.view',
    name: 'View Platform Roles',
    description: 'Allows viewing platform roles and permission matrices',
    module: 'roles',
    action: 'view',
  },
  {
    key: 'roles.update',
    name: 'Update Platform Roles',
    description: 'Allows customizing permissions for non-locked platform roles',
    module: 'roles',
    action: 'update',
  },

  // Pricing Platform Module
  {
    key: 'pricing.view',
    name: 'View Pricing Plans',
    description: 'Allows viewing platform subscription tiers and pricing plans',
    module: 'pricing',
    action: 'view',
  },
  {
    key: 'pricing.update',
    name: 'Update Pricing Plans',
    description: 'Allows modifying subscription pricing, limits, and plan features',
    module: 'pricing',
    action: 'update',
  },

  // Subscriptions Platform Module
  {
    key: 'subscriptions.view',
    name: 'View Subscriptions',
    description: 'Allows viewing active tenant billing subscriptions and invoices',
    module: 'subscriptions',
    action: 'view',
  },
  {
    key: 'subscriptions.update',
    name: 'Update Subscriptions',
    description: 'Allows overriding subscription status, trial periods, and billing credits',
    module: 'subscriptions',
    action: 'update',
  },

  // Tickets Platform Module
  {
    key: 'tickets.view',
    name: 'View Platform Tickets',
    description: 'Allows viewing global customer support and assistance tickets',
    module: 'tickets',
    action: 'view',
  },
  {
    key: 'tickets.create',
    name: 'Create Platform Tickets',
    description: 'Allows opening support tickets on behalf of customers',
    module: 'tickets',
    action: 'create',
  },
  {
    key: 'tickets.update',
    name: 'Update Platform Tickets',
    description: 'Allows responding to, resolving, and updating support tickets',
    module: 'tickets',
    action: 'update',
  },
  {
    key: 'tickets.assign',
    name: 'Assign Platform Tickets',
    description: 'Allows routing and assigning support tickets to platform team members',
    module: 'tickets',
    action: 'assign',
  },

  // Audit Logs Platform Module
  {
    key: 'audit.view',
    name: 'View Audit Logs',
    description: 'Allows viewing security audit logs and platform administrative events',
    module: 'audit',
    action: 'view',
  },
  {
    key: 'audit.export',
    name: 'Export Audit Logs',
    description: 'Allows exporting platform audit logs for compliance audits',
    module: 'audit',
    action: 'export',
  },

  // Settings Platform Module
  {
    key: 'settings.view',
    name: 'View Platform Settings',
    description: 'Allows viewing global Nexus platform configurations',
    module: 'settings',
    action: 'view',
  },
  {
    key: 'settings.update',
    name: 'Update Platform Settings',
    description: 'Allows modifying global platform configurations and maintenance flags',
    module: 'settings',
    action: 'update',
  },
];

const PLATFORM_VALID_PERMISSION_KEYS = new Set(PLATFORM_PERMISSIONS.map((p) => p.key));

// Initial Default Platform Roles
const DEFAULT_PLATFORM_ROLES = [
  {
    key: 'platform_admin',
    name: 'Platform Admin',
    description: 'Full administrative access across the entire Nexus SaaS platform (Locked)',
    permissions: ['*'],
    isSystem: true,
    isLocked: true,
  },
  {
    key: 'platform_support',
    name: 'Platform Support',
    description: 'Customer assistance, ticket resolution, and read access to customer entities',
    permissions: [
      'organizations.view',
      'users.view',
      'tickets.view',
      'tickets.create',
      'tickets.update',
    ],
    isSystem: true,
    isLocked: false,
  },
  {
    key: 'platform_billing',
    name: 'Platform Billing',
    description: 'Manages platform pricing plans, customer billing, and subscriptions',
    permissions: [
      'organizations.view',
      'subscriptions.view',
      'subscriptions.update',
      'pricing.view',
      'pricing.update',
    ],
    isSystem: true,
    isLocked: false,
  },
  {
    key: 'platform_operations',
    name: 'Platform Operations',
    description: 'Platform infrastructure, customer organization lifecycle, and global settings',
    permissions: [
      'organizations.view',
      'organizations.update',
      'organizations.suspend',
      'users.view',
      'users.update',
      'tickets.view',
      'tickets.update',
      'settings.view',
      'settings.update',
    ],
    isSystem: true,
    isLocked: false,
  },
  {
    key: 'platform_viewer',
    name: 'Platform Viewer',
    description: 'Read-only visibility across organizations, users, subscriptions, and audit logs',
    permissions: [
      'organizations.view',
      'users.view',
      'subscriptions.view',
      'tickets.view',
      'audit.view',
    ],
    isSystem: true,
    isLocked: false,
  },
];

module.exports = {
  PLATFORM_PERMISSIONS,
  PLATFORM_VALID_PERMISSION_KEYS,
  DEFAULT_PLATFORM_ROLES,
};
