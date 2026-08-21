const Form = require('../models/Form');
const FormVersion = require('../models/FormVersion');

/**
 * Validates form fields definition
 */
const validateFormFields = (fields) => {
  if (!Array.isArray(fields) || fields.length === 0) {
    const err = new Error('Form must contain at least one field');
    err.statusCode = 400;
    err.code = 'INVALID_FORM_SCHEMA';
    throw err;
  }

  const seenKeys = new Set();
  for (const field of fields) {
    if (!field.fieldKey || !field.label) {
      const err = new Error('Each field must have a valid fieldKey and label');
      err.statusCode = 400;
      err.code = 'INVALID_FIELD_DEFINITION';
      throw err;
    }
    const cleanKey = field.fieldKey.trim().toLowerCase();
    if (seenKeys.has(cleanKey)) {
      const err = new Error(`Duplicate field key detected: "${field.fieldKey}"`);
      err.statusCode = 400;
      err.code = 'DUPLICATE_FIELD_KEY';
      throw err;
    }
    seenKeys.add(cleanKey);
  }
};

/**
 * Creates a parent Form and its initial v1 Version
 */
const createForm = async ({ organizationId, userId, data, publishImmediately = false }) => {
  const { name, description = '', category = 'general', icon = '📋', fields = [], changeSummary = '' } = data;

  if (!name || !name.trim()) {
    const err = new Error('Form name is required');
    err.statusCode = 400;
    err.code = 'MISSING_NAME';
    throw err;
  }

  if (publishImmediately) {
    validateFormFields(fields);
  }

  // 1. Create parent Form
  const form = await Form.create({
    organizationId,
    name: name.trim(),
    description: description.trim(),
    category,
    icon,
    latestVersionNumber: 1,
    createdBy: userId,
    updatedBy: userId,
  });

  // 2. Create initial v1 FormVersion
  const initialStatus = publishImmediately ? 'published' : 'draft';
  const initialVersion = await FormVersion.create({
    organizationId,
    formId: form._id,
    version: 1,
    status: initialStatus,
    name: name.trim(),
    description: description.trim(),
    category,
    icon,
    fields: fields || [],
    changeSummary: changeSummary || (publishImmediately ? 'Initial published version' : 'Initial draft version'),
    createdBy: userId,
    publishedBy: publishImmediately ? userId : null,
    publishedAt: publishImmediately ? new Date() : null,
  });

  // 3. Link parent to version
  form.currentVersionId = initialVersion._id;
  if (publishImmediately) {
    form.publishedVersionId = initialVersion._id;
  }
  await form.save();

  return {
    form,
    version: initialVersion,
  };
};

/**
 * Lists organization forms with active version metadata
 */
const getForms = async ({ organizationId, category, search = '', page = 1, limit = 20 }) => {
  const query = { organizationId };

  if (category) {
    query.category = category;
  }

  if (search && search.trim()) {
    const searchRegex = { $regex: search.trim(), $options: 'i' };
    query.$or = [{ name: searchRegex }, { description: searchRegex }];
  }

  const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);

  const [forms, total] = await Promise.all([
    Form.find(query)
      .sort({ updatedAt: -1 })
      .skip((parsedPage - 1) * parsedLimit)
      .limit(parsedLimit)
      .populate('currentVersionId')
      .populate('publishedVersionId')
      .populate('createdBy', 'firstName lastName email'),
    Form.countDocuments(query),
  ]);

  return {
    data: forms,
    pagination: {
      page: parsedPage,
      limit: parsedLimit,
      total,
      totalPages: Math.ceil(total / parsedLimit),
    },
  };
};

/**
 * Gets single Form along with requested or current active version
 */
const getFormById = async ({ organizationId, formId, versionId = null, versionNumber = null }) => {
  const form = await Form.findOne({ _id: formId, organizationId })
    .populate('currentVersionId')
    .populate('publishedVersionId')
    .populate('createdBy', 'firstName lastName email');

  if (!form) {
    const err = new Error('Form not found in this organization');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  let versionDoc = null;

  if (versionId) {
    versionDoc = await FormVersion.findOne({ _id: versionId, formId, organizationId })
      .populate('createdBy', 'firstName lastName email')
      .populate('publishedBy', 'firstName lastName email');
  } else if (versionNumber) {
    versionDoc = await FormVersion.findOne({ formId, organizationId, version: versionNumber })
      .populate('createdBy', 'firstName lastName email')
      .populate('publishedBy', 'firstName lastName email');
  } else {
    // Default to currentVersionId or publishedVersionId or latest
    versionDoc = form.currentVersionId || form.publishedVersionId;
    if (!versionDoc) {
      versionDoc = await FormVersion.findOne({ formId, organizationId }).sort({ version: -1 });
    }
  }

  return {
    form,
    version: versionDoc,
  };
};

/**
 * Returns all historical versions of a form
 */
const getFormVersions = async ({ organizationId, formId }) => {
  const form = await Form.findOne({ _id: formId, organizationId });
  if (!form) {
    const err = new Error('Form not found');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  const versions = await FormVersion.find({ formId, organizationId })
    .sort({ version: -1 })
    .populate('createdBy', 'firstName lastName email')
    .populate('publishedBy', 'firstName lastName email');

  return versions;
};

/**
 * Creates a new sequential Draft version forked from an existing version or published version
 */
const createFormDraft = async ({ organizationId, formId, fromVersionId = null, userId }) => {
  const form = await Form.findOne({ _id: formId, organizationId });
  if (!form) {
    const err = new Error('Form not found');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  // Check if an open draft already exists for this form
  const existingDraft = await FormVersion.findOne({
    formId,
    organizationId,
    status: 'draft',
  }).populate('createdBy', 'firstName lastName email');

  if (existingDraft) {
    // If open draft exists and user did not explicitly request forking from another specific version
    if (!fromVersionId || existingDraft._id.toString() === fromVersionId.toString()) {
      return {
        form,
        version: existingDraft,
        isExistingDraft: true,
      };
    }
  }

  // Resolve source version to clone from
  let sourceVersion = null;
  if (fromVersionId) {
    sourceVersion = await FormVersion.findOne({ _id: fromVersionId, formId, organizationId });
  }
  if (!sourceVersion && form.publishedVersionId) {
    sourceVersion = await FormVersion.findById(form.publishedVersionId);
  }
  if (!sourceVersion) {
    sourceVersion = await FormVersion.findOne({ formId, organizationId }).sort({ version: -1 });
  }

  // Sequential version number: next integer after latestVersionNumber
  const nextVersionNumber = (form.latestVersionNumber || 0) + 1;

  const newDraft = await FormVersion.create({
    organizationId,
    formId: form._id,
    version: nextVersionNumber,
    status: 'draft',
    name: sourceVersion?.name || form.name,
    description: sourceVersion?.description || form.description,
    category: sourceVersion?.category || form.category,
    icon: sourceVersion?.icon || form.icon,
    fields: sourceVersion?.fields ? JSON.parse(JSON.stringify(sourceVersion.fields)) : [],
    changeSummary: `Draft v${nextVersionNumber} created from v${sourceVersion?.version || 1}`,
    createdBy: userId,
    publishedBy: null,
    publishedAt: null,
  });

  // Update parent form pointers
  form.latestVersionNumber = nextVersionNumber;
  form.currentVersionId = newDraft._id;
  form.updatedBy = userId;
  await form.save();

  return {
    form,
    version: newDraft,
    isExistingDraft: false,
  };
};

/**
 * Updates an editable draft version
 * BACKEND IMMUTABILITY ENFORCEMENT: Rejects changes to published versions with 409 Conflict
 */
const updateFormDraft = async ({ organizationId, formId, versionId, data, userId }) => {
  const version = await FormVersion.findOne({ _id: versionId, formId, organizationId });

  if (!version) {
    const err = new Error('Form version not found');
    err.statusCode = 404;
    err.code = 'VERSION_NOT_FOUND';
    throw err;
  }

  // Enforce Immutability
  if (version.status === 'published') {
    const err = new Error('Published versions cannot be modified. Create a new version.');
    err.statusCode = 409;
    err.code = 'PUBLISHED_VERSION_IMMUTABLE';
    throw err;
  }

  if (version.status === 'archived') {
    const err = new Error('Archived versions cannot be modified.');
    err.statusCode = 409;
    err.code = 'ARCHIVED_VERSION_IMMUTABLE';
    throw err;
  }

  // Update allowed draft fields
  if (data.name !== undefined) version.name = data.name.trim();
  if (data.description !== undefined) version.description = data.description.trim();
  if (data.category !== undefined) version.category = data.category;
  if (data.icon !== undefined) version.icon = data.icon;
  if (data.fields !== undefined) version.fields = data.fields;
  if (data.changeSummary !== undefined) version.changeSummary = data.changeSummary.trim();

  await version.save();

  // Sync parent metadata if name/description changed
  await Form.findByIdAndUpdate(formId, {
    name: version.name,
    description: version.description,
    category: version.category,
    icon: version.icon,
    updatedBy: userId,
  });

  return version;
};

/**
 * Publishes a draft version and makes it the active published standard
 */
const publishFormVersion = async ({ organizationId, formId, versionId, userId, changeSummary = '' }) => {
  const version = await FormVersion.findOne({ _id: versionId, formId, organizationId });

  if (!version) {
    const err = new Error('Form version not found');
    err.statusCode = 404;
    err.code = 'VERSION_NOT_FOUND';
    throw err;
  }

  // If already published, return immediately
  if (version.status === 'published') {
    return version;
  }

  // Validate form structure before publishing
  validateFormFields(version.fields);

  // Archive prior published versions
  await FormVersion.updateMany(
    { formId, organizationId, status: 'published', _id: { $ne: versionId } },
    { status: 'archived' }
  );

  // Publish target version
  version.status = 'published';
  version.publishedBy = userId;
  version.publishedAt = new Date();
  if (changeSummary && changeSummary.trim()) {
    version.changeSummary = changeSummary.trim();
  }
  await version.save();

  // Update parent form pointers
  await Form.findByIdAndUpdate(formId, {
    publishedVersionId: version._id,
    currentVersionId: version._id,
    name: version.name,
    description: version.description,
    category: version.category,
    icon: version.icon,
    updatedBy: userId,
  });

  return version;
};

/**
 * Discards an un-published draft version
 */
const discardFormDraft = async ({ organizationId, formId, versionId }) => {
  const version = await FormVersion.findOne({ _id: versionId, formId, organizationId });

  if (!version) {
    const err = new Error('Form version not found');
    err.statusCode = 404;
    err.code = 'VERSION_NOT_FOUND';
    throw err;
  }

  if (version.status === 'published') {
    const err = new Error('Cannot discard a published version. Published versions are immutable.');
    err.statusCode = 400;
    err.code = 'CANNOT_DISCARD_PUBLISHED';
    throw err;
  }

  await FormVersion.findByIdAndDelete(versionId);

  // Fallback parent currentVersionId to published or latest remaining
  const form = await Form.findById(formId);
  if (form && form.currentVersionId?.toString() === versionId.toString()) {
    const latestRemaining = await FormVersion.findOne({ formId, organizationId }).sort({ version: -1 });
    form.currentVersionId = form.publishedVersionId || (latestRemaining ? latestRemaining._id : null);
    await form.save();
  }

  return { success: true, discardedVersionNumber: version.version };
};

/**
 * Compares two form version snapshots and returns structured diff
 */
const compareFormVersions = async ({ organizationId, formId, v1Id, v2Id }) => {
  const [v1, v2] = await Promise.all([
    FormVersion.findOne({ _id: v1Id, formId, organizationId }),
    FormVersion.findOne({ _id: v2Id, formId, organizationId }),
  ]);

  if (!v1 || !v2) {
    const err = new Error('Both versions must exist to perform comparison');
    err.statusCode = 404;
    err.code = 'VERSION_NOT_FOUND';
    throw err;
  }

  const v1FieldMap = new Map((v1.fields || []).map((f) => [f.fieldKey, f]));
  const v2FieldMap = new Map((v2.fields || []).map((f) => [f.fieldKey, f]));

  const added = [];
  const removed = [];
  const modified = [];

  // Identify Added & Modified
  for (const [key, f2] of v2FieldMap.entries()) {
    if (!v1FieldMap.has(key)) {
      added.push(f2);
    } else {
      const f1 = v1FieldMap.get(key);
      const changes = [];
      if (f1.label !== f2.label) changes.push({ property: 'label', from: f1.label, to: f2.label });
      if (f1.type !== f2.type) changes.push({ property: 'type', from: f1.type, to: f2.type });
      if (Boolean(f1.required) !== Boolean(f2.required)) changes.push({ property: 'required', from: f1.required, to: f2.required });
      if (JSON.stringify(f1.options || []) !== JSON.stringify(f2.options || [])) {
        changes.push({ property: 'options', from: f1.options, to: f2.options });
      }

      if (changes.length > 0) {
        modified.push({
          fieldKey: key,
          label: f2.label,
          changes,
        });
      }
    }
  }

  // Identify Removed
  for (const [key, f1] of v1FieldMap.entries()) {
    if (!v2FieldMap.has(key)) {
      removed.push(f1);
    }
  }

  return {
    baseVersion: { id: v1._id, version: v1.version, status: v1.status },
    targetVersion: { id: v2._id, version: v2.version, status: v2.status },
    diff: {
      added,
      removed,
      modified,
      hasChanges: added.length > 0 || removed.length > 0 || modified.length > 0,
    },
  };
};

module.exports = {
  validateFormFields,
  createForm,
  getForms,
  getFormById,
  getFormVersions,
  createFormDraft,
  updateFormDraft,
  publishFormVersion,
  discardFormDraft,
  compareFormVersions,
};
