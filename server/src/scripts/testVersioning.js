const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Organization = require('../models/Organization');
const User = require('../models/User');
const Form = require('../models/Form');
const FormVersion = require('../models/FormVersion');
const Workflow = require('../models/Workflow');
const WorkflowVersion = require('../models/WorkflowVersion');
const formService = require('../services/form.service');
const workflowService = require('../services/workflow.service');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nexus';

const runTests = async () => {
  console.log('======================================================');
  console.log('🧪 RUNNING NEXUS FORMS & WORKFLOWS VERSIONING TEST SUITE');
  console.log('======================================================');

  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected to MongoDB.\n');

  try {
    // 1. Resolve test organization & user
    let org = await Organization.findOne({ slug: 'acme-corp' }) || await Organization.findOne();
    let user = await User.findOne({ email: 'owner@acme.com' }) || await User.findOne();

    if (!org || !user) {
      throw new Error('Test organization or user not found');
    }

    const orgId = org._id;
    const userId = user._id;

    console.log(`🏢 Testing with Organization: "${org.name}" (${orgId})`);
    console.log(`👤 User: ${user.firstName} ${user.lastName} (${user.email})\n`);

    // ==========================================
    // [TEST 1] FORM VERSIONING LIFECYCLE
    // ==========================================
    console.log('--- [TEST 1] Form Creation & Initial v1 Draft ---');
    const { form: createdForm, version: v1Draft } = await formService.createForm({
      organizationId: orgId,
      userId,
      data: {
        name: 'Expense Reimbursement Test Form',
        description: 'Test corporate expense submission form',
        category: 'expense',
        icon: '💰',
        fields: [
          { fieldKey: 'title', label: 'Expense Title', type: 'text', required: true },
          { fieldKey: 'amount', label: 'Amount', type: 'number', required: true },
          { fieldKey: 'date', label: 'Date', type: 'date', required: true },
        ],
      },
      publishImmediately: false,
    });

    console.log(`✅ Form created: "${createdForm.name}" (ID: ${createdForm._id})`);
    console.log(`   Version: v${v1Draft.version}, Status: ${v1Draft.status}`);
    if (v1Draft.version !== 1 || v1Draft.status !== 'draft') {
      throw new Error('Expected v1 Draft');
    }

    console.log('\n--- [TEST 2] Publish Form v1 ---');
    const publishedV1 = await formService.publishFormVersion({
      organizationId: orgId,
      formId: createdForm._id,
      versionId: v1Draft._id,
      userId,
      changeSummary: 'Published initial expense form standard',
    });

    console.log(`✅ Form published: v${publishedV1.version} Status: ${publishedV1.status}`);
    console.log(`   Published At: ${publishedV1.publishedAt}`);
    if (publishedV1.status !== 'published' || !publishedV1.publishedAt) {
      throw new Error('Form v1 publish failed');
    }

    console.log('\n--- [TEST 3] Edit Published Form -> Fork v2 Draft ---');
    const { version: v2Draft, isExistingDraft } = await formService.createFormDraft({
      organizationId: orgId,
      formId: createdForm._id,
      fromVersionId: publishedV1._id,
      userId,
    });

    console.log(`✅ Created new sequential draft: v${v2Draft.version}, Status: ${v2Draft.status}`);
    console.log(`   Is Existing Draft: ${isExistingDraft}`);
    if (v2Draft.version !== 2 || v2Draft.status !== 'draft') {
      throw new Error('Expected v2 Draft');
    }

    console.log('\n--- [TEST 4] Modify v2 Draft & Verify v1 Immutability ---');
    const updatedV2 = await formService.updateFormDraft({
      organizationId: orgId,
      formId: createdForm._id,
      versionId: v2Draft._id,
      data: {
        fields: [
          { fieldKey: 'title', label: 'Expense Title', type: 'text', required: true },
          { fieldKey: 'amount', label: 'Total Amount (USD)', type: 'number', required: true }, // Modified label
          { fieldKey: 'date', label: 'Date', type: 'date', required: true },
          { fieldKey: 'receiptNotes', label: 'Receipt Notes', type: 'textarea', required: false }, // Added field
        ],
        changeSummary: 'Added receipt notes field and clarified USD currency',
      },
      userId,
    });

    console.log(`✅ Updated v2 Draft: ${updatedV2.fields.length} fields`);

    // Verify v1 in DB is completely untouched
    const v1Check = await FormVersion.findById(publishedV1._id);
    console.log(`✅ Verified v1 in DB is immutable: ${v1Check.fields.length} fields (Expected 3)`);
    if (v1Check.fields.length !== 3) {
      throw new Error('v1 was corrupted during v2 edits!');
    }

    console.log('\n--- [TEST 5] Immutability Protection Check (409 Conflict) ---');
    try {
      await formService.updateFormDraft({
        organizationId: orgId,
        formId: createdForm._id,
        versionId: publishedV1._id, // Attempting to modify published v1
        data: { name: 'Hacked Published Form' },
        userId,
      });
      throw new Error('FAILED: Published version allowed direct update!');
    } catch (err) {
      if (err.statusCode === 409 || err.code === 'PUBLISHED_VERSION_IMMUTABLE') {
        console.log(`✅ Correctly rejected direct modification of published version: "${err.message}" (Code: ${err.code})`);
      } else {
        throw err;
      }
    }

    console.log('\n--- [TEST 6] Publish Form v2 ---');
    const publishedV2 = await formService.publishFormVersion({
      organizationId: orgId,
      formId: createdForm._id,
      versionId: updatedV2._id,
      userId,
      changeSummary: 'Published v2 with receipt notes',
    });

    const v1Archived = await FormVersion.findById(publishedV1._id);
    console.log(`✅ Form v2 published! Status: ${publishedV2.status}`);
    console.log(`   Form v1 status transitioned to: ${v1Archived.status} (Expected 'archived')`);
    if (publishedV2.status !== 'published' || v1Archived.status !== 'archived') {
      throw new Error('Version status transition failed');
    }

    console.log('\n--- [TEST 7] Form Version Comparison (Diff Engine) ---');
    const formDiff = await formService.compareFormVersions({
      organizationId: orgId,
      formId: createdForm._id,
      v1Id: publishedV1._id,
      v2Id: publishedV2._id,
    });

    console.log('✅ Form Diff (v1 → v2):');
    console.log(`   Added: ${formDiff.diff.added.map(f => f.fieldKey).join(', ')}`);
    console.log(`   Modified: ${formDiff.diff.modified.map(f => f.fieldKey).join(', ')}`);
    console.log(`   Removed: ${formDiff.diff.removed.map(f => f.fieldKey).join(', ') || 'None'}`);

    if (formDiff.diff.added.length !== 1 || formDiff.diff.modified.length !== 1) {
      throw new Error('Form diff calculation mismatch');
    }

    // ==========================================
    // [TEST 8] WORKFLOW VERSIONING & FORM PINNING
    // ==========================================
    console.log('\n--- [TEST 8] Create Workflow v1 Pinned to Form v1 ---');
    const { workflow: createdWf, version: wfV1 } = await workflowService.createWorkflow({
      organizationId: orgId,
      userId,
      data: {
        name: 'Expense Approval Workflow',
        description: 'Multi-stage expense approval',
        category: 'expense',
        icon: '💼',
        status: 'active', // publish immediately
        formId: createdForm._id,
        formVersionId: publishedV1._id, // Pinned explicitly to Form v1
        formSchema: publishedV1.fields,
        steps: [
          {
            name: 'Manager Review',
            stepType: 'approval',
            assigneeType: 'role',
            assigneeRoleKey: 'manager',
            slaHours: 24,
            conditionLogic: 'all',
            conditions: [
              { field: 'amount', operator: 'gt', value: 100, action: 'require' },
            ],
          },
          {
            name: 'Director Sign-Off',
            stepType: 'approval',
            assigneeType: 'role',
            assigneeRoleKey: 'admin',
            slaHours: 48,
          },
        ],
      },
    });

    console.log(`✅ Workflow created: "${createdWf.name}" (ID: ${createdWf._id})`);
    console.log(`   Workflow Version: v${wfV1.version} Status: ${wfV1.status}`);
    console.log(`   Pinned Form Version: ${wfV1.formVersionId} (Form v1)`);

    console.log('\n--- [TEST 9] Verify Reference Pinning when Form v2 Exists ---');
    // Verify that Workflow v1 still refers to Form v1 even after Form v2 is published
    const wfCheck = await WorkflowVersion.findById(wfV1._id);
    console.log(`✅ Verified Workflow v1 is STILL pinned to Form v1 (${wfCheck.formVersionId.toString()} === ${publishedV1._id.toString()})`);
    if (wfCheck.formVersionId.toString() !== publishedV1._id.toString()) {
      throw new Error('Workflow was erroneously upgraded to Form v2!');
    }

    console.log('\n--- [TEST 10] Fork Workflow v2 Draft & Bind to Form v2 ---');
    const { version: wfV2Draft } = await workflowService.createWorkflowDraft({
      organizationId: orgId,
      workflowId: createdWf._id,
      fromVersionId: wfV1._id,
      userId,
    });

    console.log(`✅ Workflow v2 Draft created (v${wfV2Draft.version}, status: ${wfV2Draft.status})`);

    const updatedWfV2 = await workflowService.updateWorkflowDraft({
      organizationId: orgId,
      workflowId: createdWf._id,
      versionId: wfV2Draft._id,
      updateData: {
        formVersionId: publishedV2._id, // Upgrade to Form v2
        formSchema: publishedV2.fields,
        steps: [
          {
            name: 'Team Manager Review',
            stepType: 'approval',
            assigneeType: 'role',
            assigneeRoleKey: 'manager',
            slaHours: 12,
          },
          {
            name: 'Finance & Accounts', // Added new stage
            stepType: 'approval',
            assigneeType: 'role',
            assigneeRoleKey: 'approver',
            slaHours: 24,
          },
          {
            name: 'Director Sign-Off',
            stepType: 'approval',
            assigneeType: 'role',
            assigneeRoleKey: 'admin',
            slaHours: 48,
          },
        ],
        changeSummary: 'Upgraded to Form v2 and added Finance stage',
      },
      userId,
    });

    console.log(`✅ Workflow v2 updated with ${updatedWfV2.steps.length} steps`);

    console.log('\n--- [TEST 11] Workflow Publish & Version Diff ---');
    const publishedWfV2 = await workflowService.publishWorkflowVersion({
      organizationId: orgId,
      workflowId: createdWf._id,
      versionId: updatedWfV2._id,
      userId,
      changeSummary: 'Published Workflow v2',
    });

    console.log(`✅ Workflow v2 published! Status: ${publishedWfV2.status}`);

    const wfDiff = await workflowService.compareWorkflowVersions({
      organizationId: orgId,
      workflowId: createdWf._id,
      v1Id: wfV1._id,
      v2Id: publishedWfV2._id,
    });

    console.log('✅ Workflow Diff (v1 → v2):');
    console.log(`   Added Stages: ${wfDiff.diff.addedStages.map(s => s.name).join(', ')}`);
    console.log(`   Modified Stages: ${wfDiff.diff.modifiedStages.map(s => `${s.name} (${s.changes.map(c => c.property).join(', ')})`).join(', ')}`);

    if (wfDiff.diff.addedStages.length !== 1) {
      throw new Error('Workflow diff added stages mismatch');
    }

    console.log('\n--- [TEST 12] Form ↔ Workflow Compatibility Validation Check ---');
    // Test Form missing 'amount' when workflow condition requires 'amount'
    const incompatibleFormFields = [
      { fieldKey: 'title', label: 'Title', type: 'text' },
      // 'amount' removed!
    ];

    const compatibility = workflowService.checkFormWorkflowCompatibility({
      formFields: incompatibleFormFields,
      steps: [
        {
          stepNumber: 1,
          name: 'Amount Guard Stage',
          conditions: [{ field: 'amount', operator: 'gt', value: 50 }],
        },
      ],
    });

    console.log(`   Compatibility result: ${compatibility.isCompatible ? 'COMPATIBLE' : 'INCOMPATIBLE'}`);
    console.log(`   Missing condition fields detected: ${compatibility.missingConditionFields.map(m => m.missingField).join(', ')}`);
    if (compatibility.isCompatible) {
      throw new Error('Compatibility checker failed to catch missing condition field!');
    }
    console.log('✅ Correctly flagged incompatible form version binding.');

    console.log('\n======================================================');
    console.log('🎉 ALL FORMS & WORKFLOWS VERSIONING TESTS PASSED 100%!');
    console.log('======================================================\n');
  } catch (error) {
    console.error('❌ Test suite failed with error:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

runTests();
