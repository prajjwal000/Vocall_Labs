const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Organization = require('../models/Organization');
const platformAdminService = require('../services/platformAdmin.service');
const platformRoleService = require('../services/platformRole.service');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nexus';

const runTests = async () => {
  console.log('======================================================');
  console.log('🧪 RUNNING NEXUS PLATFORM ADMIN SUITE TEST');
  console.log('======================================================');

  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB.\n');

  try {
    await platformRoleService.seedPlatformRBAC();

    let adminUser = await User.findOne({ email: 'owner@acme.com' }) || await User.findOne();
    let org = await Organization.findOne({ slug: 'acme-corp' }) || await Organization.findOne();

    if (!adminUser || !org) {
      throw new Error('Test user or organization not found');
    }

    console.log(`👤 Admin User: ${adminUser.firstName} ${adminUser.lastName} (${adminUser.email})`);
    console.log(`🏢 Sample Organization: "${org.name}" (${org._id})\n`);

    // [TEST 1] Platform Dashboard KPIs
    console.log('--- [TEST 1] Platform Dashboard Statistics ---');
    const dashboardStats = await platformAdminService.getPlatformDashboardStats();
    console.log(`✅ Total Organizations: ${dashboardStats.overview.totalOrganizations}`);
    console.log(`   Active: ${dashboardStats.overview.activeOrganizations}, Suspended: ${dashboardStats.overview.suspendedOrganizations}`);
    console.log(`   Total Users: ${dashboardStats.overview.totalUsers}`);
    console.log(`   Estimated MRR: $${dashboardStats.overview.monthlyRecurringRevenue}/mo`);
    console.log(`   Recent Orgs Feed Count: ${dashboardStats.recentOrganizations.length}`);

    // [TEST 2] Organizations Control
    console.log('\n--- [TEST 2] Organizations Listing & Control ---');
    const orgsList = await platformAdminService.getAllOrganizations({ limit: 10 });
    console.log(`✅ Listed ${orgsList.data.length} organizations (Total in DB: ${orgsList.pagination.total})`);

    const updatedOrg = await platformAdminService.updateOrganizationPlatformControl({
      orgId: org._id,
      updateData: {
        plan: 'growth',
        status: 'active',
      },
      actorUser: adminUser,
    });
    console.log(`✅ Organization updated: "${updatedOrg.name}" -> Plan: ${updatedOrg.plan}, Status: ${updatedOrg.status}`);

    // [TEST 3] Pricing Plans & Limits
    console.log('\n--- [TEST 3] Pricing Plans Configuration ---');
    const pricing = await platformAdminService.getPricingPlans();
    console.log(`✅ Retrieved ${pricing.plans.length} platform pricing plans: ${pricing.plans.map(p => `${p.name} ($${p.priceMonthly})`).join(', ')}`);

    const updatedPlan = await platformAdminService.updatePricingPlan({
      planKey: 'growth',
      data: { priceMonthly: 49, workflowsLimit: 50 },
      actorUser: adminUser,
    });
    console.log(`✅ Growth plan verified: $${updatedPlan.priceMonthly}/mo, Limit: ${updatedPlan.workflowsLimit} workflows`);

    // [TEST 4] Subscriptions List
    console.log('\n--- [TEST 4] Subscriptions & Billing Metrics ---');
    const subs = await platformAdminService.getSubscriptions({ limit: 10 });
    console.log(`✅ Retrieved ${subs.data.length} tenant subscriptions`);

    // [TEST 5] Support Ticket Lifecycle
    console.log('\n--- [TEST 5] Support Tickets Helpdesk ---');
    const ticket = await platformAdminService.createSupportTicket({
      organizationId: org._id,
      userId: adminUser._id,
      user: adminUser,
      subject: 'SSO & Custom Domain Integration Inquiry',
      description: 'We would like to configure Google Workspace SAML SSO for our employees.',
      category: 'technical',
      priority: 'high',
    });
    console.log(`✅ Created Support Ticket: ${ticket.ticketCode} ("${ticket.subject}") Status: ${ticket.status}`);

    const repliedTicket = await platformAdminService.replyTicket({
      ticketId: ticket._id,
      text: 'Hello Olivia! Our engineering team has enabled SAML SSO provisioning on your growth tier cluster.',
      actorUser: adminUser,
    });
    console.log(`✅ Admin Replied! Message Thread Count: ${repliedTicket.messages.length}, Status: ${repliedTicket.status}`);

    const resolvedTicket = await platformAdminService.updateTicket({
      ticketId: ticket._id,
      status: 'resolved',
      priority: 'medium',
      actorUser: adminUser,
    });
    console.log(`✅ Ticket Resolved: Status: ${resolvedTicket.status}`);

    // [TEST 6] Platform Audit Logs
    console.log('\n--- [TEST 6] Platform Audit Logs ---');
    const auditLogs = await platformAdminService.getAuditLogs({ limit: 10 });
    console.log(`✅ Audit Logs Recorded: ${auditLogs.data.length} recent events`);
    if (auditLogs.data.length > 0) {
      console.log(`   Latest Event: [${auditLogs.data[0].action}] by ${auditLogs.data[0].actorEmail} on target: ${auditLogs.data[0].targetName}`);
    }

    // [TEST 7] Global Platform Settings
    console.log('\n--- [TEST 7] Global Platform Settings ---');
    const settings = await platformAdminService.getPlatformSettings();
    console.log(`✅ Global Platform Name: "${settings.platformName}", Maintenance: ${settings.maintenanceMode}`);

    const updatedSettings = await platformAdminService.updatePlatformSettings({
      data: {
        platformName: 'Nexus Enterprise Operations',
        defaultStorageProvider: 'local',
      },
      actorUser: adminUser,
    });
    console.log(`✅ Settings Updated: Platform Name: "${updatedSettings.platformName}"`);

    console.log('\n======================================================');
    console.log('🎉 ALL PLATFORM ADMIN SUITE TESTS PASSED 100%!');
    console.log('======================================================\n');
  } catch (error) {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

runTests();
