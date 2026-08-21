import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '../../hooks/useOrganization';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { organizationService } from '../../services/organizationService';

export const OrganizationSettings = () => {
  const { activeOrganization, refreshOrganizations, switchOrganization, organizations } = useOrganization();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    currency: 'INR',
    language: 'en',
    aiConfig: {
      provider: 'gemini',
      apiKey: '',
      model: 'gemini-2.5-flash-lite',
      isConfigured: false,
    },
    storageConfig: {
      provider: 'none',
      s3: {
        bucket: '',
        region: 'us-east-1',
        accessKeyId: '',
        secretAccessKey: '',
        endpoint: '',
      },
      azure: {
        accountName: '',
        accountKey: '',
        containerName: '',
      },
      isConfigured: false,
    },
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [showStorageKey, setShowStorageKey] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Testing state
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [testResult, setTestResult] = useState({ status: 'idle', message: '' });
  const [isApiVerified, setIsApiVerified] = useState(false);

  // Storage Testing state
  const [isTestingStorage, setIsTestingStorage] = useState(false);
  const [storageTestResult, setStorageTestResult] = useState({ status: 'idle', message: '' });
  const [isStorageVerified, setIsStorageVerified] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (activeOrganization) {
      const currentAi = activeOrganization.settings?.aiConfig;
      const currentStorage = activeOrganization.settings?.storageConfig;
      setFormData({
        name: activeOrganization.name || '',
        description: activeOrganization.description || '',
        timezone: activeOrganization.settings?.timezone || 'Asia/Kolkata',
        dateFormat: activeOrganization.settings?.dateFormat || 'DD/MM/YYYY',
        currency: activeOrganization.settings?.currency || 'INR',
        language: activeOrganization.settings?.language || 'en',
        aiConfig: {
          provider: currentAi?.provider || 'gemini',
          apiKey: currentAi?.apiKey || '',
          model: currentAi?.model || 'gemini-2.5-flash-lite',
          isConfigured: Boolean(currentAi?.isConfigured),
        },
        storageConfig: {
          provider: currentStorage?.provider || 'none',
          s3: {
            bucket: currentStorage?.s3?.bucket || '',
            region: currentStorage?.s3?.region || 'us-east-1',
            accessKeyId: currentStorage?.s3?.accessKeyId || '',
            secretAccessKey: currentStorage?.s3?.secretAccessKey || '',
            endpoint: currentStorage?.s3?.endpoint || '',
          },
          azure: {
            accountName: currentStorage?.azure?.accountName || '',
            accountKey: currentStorage?.azure?.accountKey || '',
            containerName: currentStorage?.azure?.containerName || '',
          },
          isConfigured: Boolean(currentStorage?.isConfigured),
        },
      });
      setIsApiVerified(Boolean(currentAi?.isConfigured && currentAi?.apiKey));
      setIsStorageVerified(Boolean(currentStorage?.isConfigured));
      setTestResult({ status: 'idle', message: '' });
      setStorageTestResult({ status: 'idle', message: '' });
    }
  }, [activeOrganization]);

  if (!activeOrganization) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">No Active Workspace</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Please select or create an organization to view settings.</p>
        <button
          onClick={() => navigate('/app/organizations/new')}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 cursor-pointer"
        >
          Create Organization
        </button>
      </div>
    );
  }

  const isOwner = activeOrganization.role === 'owner';
  const isAdminOrOwner = isOwner || activeOrganization.role === 'admin';

  const handleTestApi = async () => {
    if (!formData.aiConfig.apiKey.trim()) {
      setTestResult({
        status: 'error',
        message: 'Please enter an API key before testing connection.',
      });
      return;
    }

    setIsTestingApi(true);
    setTestResult({ status: 'idle', message: '' });

    try {
      const res = await organizationService.testAiConnection(activeOrganization.id, {
        provider: formData.aiConfig.provider,
        apiKey: formData.aiConfig.apiKey,
        model: formData.aiConfig.model,
      });

      if (res.success) {
        setIsApiVerified(true);
        if (res.data?.model) {
          setFormData((prev) => ({
            ...prev,
            aiConfig: { ...prev.aiConfig, model: res.data.model },
          }));
        }
        setTestResult({
          status: 'success',
          message: res.data?.message || 'API connection verified successfully!',
        });
      }
    } catch (err) {
      setIsApiVerified(false);
      setTestResult({
        status: 'error',
        message: err.response?.data?.message || err.message || 'Failed to connect to AI provider',
      });
    } finally {
      setIsTestingApi(false);
    }
  };

  const handleTestStorage = async () => {
    if (formData.storageConfig.provider === 'none') {
      setStorageTestResult({
        status: 'error',
        message: 'Please select a storage provider (AWS S3, Azure Blob, or Local) to test.',
      });
      return;
    }

    if (
      formData.storageConfig.provider === 's3' &&
      (!formData.storageConfig.s3.bucket.trim() ||
        !formData.storageConfig.s3.accessKeyId.trim() ||
        !formData.storageConfig.s3.secretAccessKey.trim())
    ) {
      setStorageTestResult({
        status: 'error',
        message: 'Bucket name, Access Key ID, and Secret Access Key are required for AWS S3.',
      });
      return;
    }

    if (
      formData.storageConfig.provider === 'azure' &&
      (!formData.storageConfig.azure.accountName.trim() ||
        !formData.storageConfig.azure.containerName.trim())
    ) {
      setStorageTestResult({
        status: 'error',
        message: 'Account Name and Container Name are required for Azure Blob Storage.',
      });
      return;
    }

    setIsTestingStorage(true);
    setStorageTestResult({ status: 'idle', message: '' });

    try {
      const res = await organizationService.testStorageConnection(
        activeOrganization.id,
        formData.storageConfig
      );
      if (res.success) {
        setIsStorageVerified(true);
        setStorageTestResult({
          status: 'success',
          message: res.data?.message || 'Storage connection verified successfully!',
        });
      }
    } catch (err) {
      setIsStorageVerified(false);
      setStorageTestResult({
        status: 'error',
        message: err.response?.data?.message || err.message || 'Failed to connect to storage provider',
      });
    } finally {
      setIsTestingStorage(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setStatusMessage({ type: '', text: '' });

    if (!formData.name.trim()) {
      setStatusMessage({ type: 'error', text: 'Organization name cannot be empty' });
      return;
    }

    // Require API testing if AI key is provided
    if (formData.aiConfig.provider !== 'none' && formData.aiConfig.apiKey.trim() && !isApiVerified) {
      setIsTestingApi(true);
      try {
        const testRes = await organizationService.testAiConnection(activeOrganization.id, {
          provider: formData.aiConfig.provider,
          apiKey: formData.aiConfig.apiKey,
          model: formData.aiConfig.model,
        });
        if (!testRes.success) {
          setStatusMessage({
            type: 'error',
            text: 'AI API verification failed. Please test and verify your API key before saving.',
          });
          setIsTestingApi(false);
          return;
        }
        setIsApiVerified(true);
      } catch (testErr) {
        setStatusMessage({
          type: 'error',
          text: testErr.response?.data?.message || 'AI API Key verification failed. Cannot save unverified key.',
        });
        setIsTestingApi(false);
        return;
      }
      setIsTestingApi(false);
    }

    setIsSubmitting(true);
    try {
      const isS3Configured = Boolean(
        formData.storageConfig.provider === 's3' &&
        formData.storageConfig.s3.bucket.trim() &&
        formData.storageConfig.s3.accessKeyId.trim() &&
        formData.storageConfig.s3.secretAccessKey.trim()
      );
      const isAzureConfigured = Boolean(
        formData.storageConfig.provider === 'azure' &&
        formData.storageConfig.azure.accountName.trim() &&
        formData.storageConfig.azure.containerName.trim()
      );
      const isLocalConfigured = formData.storageConfig.provider === 'local';

      const payload = {
        ...formData,
        aiConfig: {
          ...formData.aiConfig,
          isConfigured: Boolean(formData.aiConfig.apiKey.trim() && formData.aiConfig.provider !== 'none'),
        },
        storageConfig: {
          ...formData.storageConfig,
          isConfigured: Boolean(isStorageVerified || isS3Configured || isAzureConfigured || isLocalConfigured),
        },
      };

      const res = await organizationService.updateOrganization(activeOrganization.id, payload);
      if (res.success) {
        const returnedOrg = res.data?.organization;
        const updatedOrg = {
          ...activeOrganization,
          ...(returnedOrg || {}),
          id: returnedOrg?.id || returnedOrg?._id || activeOrganization.id,
          settings: {
            ...(activeOrganization.settings || {}),
            ...(returnedOrg?.settings || {}),
            aiConfig: payload.aiConfig,
            storageConfig: payload.storageConfig,
          },
        };
        useWorkspaceStore.getState().setActiveOrganization(updatedOrg);
        setIsApiVerified(true);
        setStatusMessage({ type: 'success', text: 'Organization settings and configurations saved successfully!' });
        await queryClient.invalidateQueries({ queryKey: ['organizations'] });
        await refreshOrganizations();
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update organization settings',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await organizationService.deleteOrganization(activeOrganization.id);
      if (res.success) {
        await queryClient.invalidateQueries({ queryKey: ['organizations'] });
        const remainingOrgs = organizations.filter((o) => o.id !== activeOrganization.id);
        if (remainingOrgs.length > 0) {
          switchOrganization(remainingOrgs[0].id);
          navigate('/app/dashboard', { replace: true });
        } else {
          navigate('/app/organizations/new', { replace: true });
        }
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to delete organization',
      });
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Organization Settings
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Manage workspace profile, cloud storage, AI models, and administration.
        </p>
      </div>

      {statusMessage.text && (
        <div
          className={`p-4 rounded-xl text-sm border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* 1. Workspace Overview Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Workspace Overview</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Basic details and metadata</p>
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/50 capitalize">
            Your Role: {activeOrganization.role}
          </span>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <span className="block text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">
              Workspace Slug
            </span>
            <span className="block font-mono text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-lg mt-1 text-xs truncate">
              {activeOrganization.slug}
            </span>
          </div>
          <div>
            <span className="block text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">
              Status
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 mt-1 capitalize">
              {activeOrganization.status || 'active'}
            </span>
          </div>
          <div>
            <span className="block text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">
              Plan
            </span>
            <span className="block font-medium text-slate-900 dark:text-white mt-1 capitalize">
              {activeOrganization.plan || 'Free'} Tier
            </span>
          </div>
        </div>
      </div>

      {/* 2. General Configuration & Integrations Form */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">General Configuration</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {isAdminOrOwner
              ? 'Update workspace name, timezone, and display preferences'
              : 'View-only: Only organization owners and admins can edit these settings'}
          </p>
        </div>

        <form onSubmit={handleUpdate} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Organization Name
              </label>
              <input
                type="text"
                disabled={!isAdminOrOwner}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm text-slate-900 dark:text-white disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Timezone
              </label>
              <select
                disabled={!isAdminOrOwner}
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm text-slate-900 dark:text-white disabled:opacity-50 font-medium"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                <option value="Europe/London">Europe/London (GMT/BST)</option>
                <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Date Format
              </label>
              <select
                disabled={!isAdminOrOwner}
                value={formData.dateFormat}
                onChange={(e) => setFormData({ ...formData, dateFormat: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm text-slate-900 dark:text-white disabled:opacity-50 font-medium"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 21/08/2026)</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY (e.g. 08/21/2026)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-08-21)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Currency
              </label>
              <select
                disabled={!isAdminOrOwner}
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm text-slate-900 dark:text-white disabled:opacity-50 font-medium"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Description
              </label>
              <textarea
                rows={2}
                disabled={!isAdminOrOwner}
                placeholder="Workspace purpose or company summary..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-950/60 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm text-slate-900 dark:text-white disabled:opacity-50"
              />
            </div>
          </div>

          {/* 3. AI Provider Configuration */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-lg">✨</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    AI Provider & Workflow Intelligence
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Configure LLM integration (Google Gemini or OpenAI) to power Prompt-to-Workflow generation in Studio.
                  </p>
                </div>
              </div>
              <span
                className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${
                  formData.aiConfig.isConfigured || (formData.aiConfig.provider !== 'none' && formData.aiConfig.apiKey)
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {formData.aiConfig.isConfigured || (formData.aiConfig.provider !== 'none' && formData.aiConfig.apiKey)
                  ? 'Configured'
                  : 'Not Configured'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  AI Provider
                </label>
                <select
                  disabled={!isAdminOrOwner}
                  value={formData.aiConfig.provider}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      aiConfig: { ...formData.aiConfig, provider: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                >
                  <option value="gemini">Google Gemini (Recommended)</option>
                  <option value="openai">OpenAI (GPT-4o)</option>
                  <option value="claude">Anthropic Claude</option>
                  <option value="none">Disabled / None</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  AI Model
                </label>
                <select
                  disabled={!isAdminOrOwner}
                  value={formData.aiConfig.model}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      aiConfig: { ...formData.aiConfig, model: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                >
                  {formData.aiConfig.provider === 'openai' ? (
                    <>
                      <option value="gpt-4o-mini">gpt-4o-mini (Fast & Cost Effective)</option>
                      <option value="gpt-4o">gpt-4o (High Accuracy)</option>
                    </>
                  ) : (
                    <>
                      <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash-Lite ⭐ (Free Tier & Recommended)</option>
                      <option value="gemini-2.5-flash">Gemini 2.5 Flash ⭐ (Free Tier & High Quality)</option>
                      <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                      <option value="gemini-pro">Gemini Pro</option>
                      <option value="gemini-1.5-flash-8b">Gemini 1.5 Flash-8b</option>
                    </>
                  )}
                </select>
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    API Key
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                  >
                    {showApiKey ? 'Hide Key' : 'Show Key'}
                  </button>
                </div>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  disabled={!isAdminOrOwner}
                  placeholder={
                    formData.aiConfig.provider === 'openai'
                      ? 'sk-proj-...'
                      : 'AIzaSy...'
                  }
                  value={formData.aiConfig.apiKey}
                  onChange={(e) => {
                    setIsApiVerified(false);
                    setTestResult({ status: 'idle', message: '' });
                    setFormData({
                      ...formData,
                      aiConfig: { ...formData.aiConfig, apiKey: e.target.value },
                    });
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Your API key is tested before saving to guarantee proper model communication.
                </p>
              </div>

              {/* Test Connection Button & Result Alert */}
              {formData.aiConfig.provider !== 'none' && (
                <div className="md:col-span-2 pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200/60 dark:border-slate-800">
                  <button
                    type="button"
                    disabled={!isAdminOrOwner || isTestingApi || !formData.aiConfig.apiKey.trim()}
                    onClick={handleTestApi}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shrink-0 disabled:opacity-50 ${
                      isApiVerified
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                    }`}
                  >
                    {isTestingApi ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Testing Connection...</span>
                      </>
                    ) : isApiVerified ? (
                      <>
                        <span>✓</span>
                        <span>API Verified (Click to Retest)</span>
                      </>
                    ) : (
                      <>
                        <span>⚡</span>
                        <span>Test API Connection</span>
                      </>
                    )}
                  </button>

                  <div className="flex-1">
                    {testResult.status === 'success' && (
                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 flex items-center space-x-1.5">
                        <span>✅</span>
                        <span>{testResult.message}</span>
                      </div>
                    )}
                    {testResult.status === 'error' && (
                      <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-[11px] font-semibold text-rose-800 dark:text-rose-300 flex items-center space-x-1.5">
                        <span>❌</span>
                        <span>{testResult.message}</span>
                      </div>
                    )}
                    {testResult.status === 'idle' && !isApiVerified && formData.aiConfig.apiKey && (
                      <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                        ⚠️ Please click "Test API Connection" to verify this key before saving.
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 4. Cloud Storage & Object Store Configuration */}
          <div id="storage-settings" className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-lg">☁️</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Cloud Storage & File Attachments (AWS S3 / Azure Blob)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Configure AWS S3 or Azure Blob Storage to enable the <strong>📁 File Upload</strong> field type in Workflow Forms.
                  </p>
                </div>
              </div>
              <span
                className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase ${
                  formData.storageConfig.isConfigured ||
                  formData.storageConfig.provider === 'local' ||
                  (formData.storageConfig.provider === 's3' && formData.storageConfig.s3.bucket) ||
                  (formData.storageConfig.provider === 'azure' && formData.storageConfig.azure.containerName)
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                }`}
              >
                {formData.storageConfig.isConfigured ||
                formData.storageConfig.provider === 'local' ||
                (formData.storageConfig.provider === 's3' && formData.storageConfig.s3.bucket) ||
                (formData.storageConfig.provider === 'azure' && formData.storageConfig.azure.containerName)
                  ? 'Configured'
                  : 'Not Configured'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Storage Provider
                </label>
                <select
                  disabled={!isAdminOrOwner}
                  value={formData.storageConfig.provider}
                  onChange={(e) => {
                    setIsStorageVerified(false);
                    setStorageTestResult({ status: 'idle', message: '' });
                    setFormData({
                      ...formData,
                      storageConfig: { ...formData.storageConfig, provider: e.target.value },
                    });
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white"
                >
                  <option value="none">Disabled / None (File Uploads Disabled)</option>
                  <option value="s3">Amazon Web Services (AWS S3 / S3-Compatible)</option>
                  <option value="azure">Microsoft Azure Blob Storage</option>
                  <option value="local">Local Workspace Storage (Development Mode)</option>
                </select>
              </div>

              {/* S3 Options */}
              {formData.storageConfig.provider === 's3' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      S3 Bucket Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={!isAdminOrOwner}
                      placeholder="e.g. acme-workflow-uploads"
                      value={formData.storageConfig.s3.bucket}
                      onChange={(e) => {
                        setIsStorageVerified(false);
                        setFormData({
                          ...formData,
                          storageConfig: {
                            ...formData.storageConfig,
                            s3: { ...formData.storageConfig.s3, bucket: e.target.value },
                          },
                        });
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      AWS Region <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={!isAdminOrOwner}
                      placeholder="e.g. us-east-1 or ap-south-1"
                      value={formData.storageConfig.s3.region}
                      onChange={(e) => {
                        setIsStorageVerified(false);
                        setFormData({
                          ...formData,
                          storageConfig: {
                            ...formData.storageConfig,
                            s3: { ...formData.storageConfig.s3, region: e.target.value },
                          },
                        });
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      AWS Access Key ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={!isAdminOrOwner}
                      placeholder="AKIAIOSFODNN7EXAMPLE"
                      value={formData.storageConfig.s3.accessKeyId}
                      onChange={(e) => {
                        setIsStorageVerified(false);
                        setFormData({
                          ...formData,
                          storageConfig: {
                            ...formData.storageConfig,
                            s3: { ...formData.storageConfig.s3, accessKeyId: e.target.value },
                          },
                        });
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        AWS Secret Access Key <span className="text-rose-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowStorageKey(!showStorageKey)}
                        className="text-[11px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer"
                      >
                        {showStorageKey ? 'Hide Key' : 'Show Key'}
                      </button>
                    </div>
                    <input
                      type={showStorageKey ? 'text' : 'password'}
                      disabled={!isAdminOrOwner}
                      placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                      value={formData.storageConfig.s3.secretAccessKey}
                      onChange={(e) => {
                        setIsStorageVerified(false);
                        setFormData({
                          ...formData,
                          storageConfig: {
                            ...formData.storageConfig,
                            s3: { ...formData.storageConfig.s3, secretAccessKey: e.target.value },
                          },
                        });
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </>
              )}

              {/* Azure Options */}
              {formData.storageConfig.provider === 'azure' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Azure Storage Account Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={!isAdminOrOwner}
                      placeholder="e.g. acmestorageaccount"
                      value={formData.storageConfig.azure.accountName}
                      onChange={(e) => {
                        setIsStorageVerified(false);
                        setFormData({
                          ...formData,
                          storageConfig: {
                            ...formData.storageConfig,
                            azure: { ...formData.storageConfig.azure, accountName: e.target.value },
                          },
                        });
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Blob Container Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={!isAdminOrOwner}
                      placeholder="e.g. workflow-attachments"
                      value={formData.storageConfig.azure.containerName}
                      onChange={(e) => {
                        setIsStorageVerified(false);
                        setFormData({
                          ...formData,
                          storageConfig: {
                            ...formData.storageConfig,
                            azure: { ...formData.storageConfig.azure, containerName: e.target.value },
                          },
                        });
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Azure Account Key / SAS Token
                    </label>
                    <input
                      type={showStorageKey ? 'text' : 'password'}
                      disabled={!isAdminOrOwner}
                      placeholder="Account key..."
                      value={formData.storageConfig.azure.accountKey}
                      onChange={(e) => {
                        setIsStorageVerified(false);
                        setFormData({
                          ...formData,
                          storageConfig: {
                            ...formData.storageConfig,
                            azure: { ...formData.storageConfig.azure, accountKey: e.target.value },
                          },
                        });
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                </>
              )}

              {/* Local Storage Info */}
              {formData.storageConfig.provider === 'local' && (
                <div className="md:col-span-2 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-xl text-xs text-emerald-800 dark:text-emerald-300">
                  📁 <strong>Local Workspace Storage Active:</strong> Files are stored directly in your server's tenant-isolated <code>/uploads</code> storage folder.
                </div>
              )}

              {/* Test Storage Connection Button & Feedback */}
              {formData.storageConfig.provider !== 'none' && (
                <div className="md:col-span-2 pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200/60 dark:border-slate-800">
                  <button
                    type="button"
                    disabled={!isAdminOrOwner || isTestingStorage}
                    onClick={handleTestStorage}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 shrink-0 disabled:opacity-50 ${
                      isStorageVerified
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                    }`}
                  >
                    {isTestingStorage ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        <span>Testing Storage...</span>
                      </>
                    ) : isStorageVerified ? (
                      <>
                        <span>✓</span>
                        <span>Storage Verified (Click to Retest)</span>
                      </>
                    ) : (
                      <>
                        <span>⚡</span>
                        <span>Test Storage Connection</span>
                      </>
                    )}
                  </button>

                  <div className="flex-1">
                    {storageTestResult.status === 'success' && (
                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 flex items-center space-x-1.5">
                        <span>✅</span>
                        <span>{storageTestResult.message}</span>
                      </div>
                    )}
                    {storageTestResult.status === 'error' && (
                      <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-[11px] font-semibold text-rose-800 dark:text-rose-300 flex items-center space-x-1.5">
                        <span>❌</span>
                        <span>{storageTestResult.message}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {isAdminOrOwner && (
            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs text-sm font-bold focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isSubmitting ? 'Saving changes...' : 'Save changes'}
              </button>
            </div>
          )}
        </form>
      </div>

      {/* 5. Danger Zone (Owner Only) */}
      {isOwner && (
        <div className="bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl shadow-xs border border-rose-200 dark:border-rose-900/50 overflow-hidden">
          <div className="p-6 border-b border-rose-100 dark:border-rose-900/50">
            <h2 className="text-lg font-semibold text-rose-900 dark:text-rose-200">Danger Zone</h2>
            <p className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">Actions here will affect all members of this workspace.</p>
          </div>

          <div className="p-6 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-rose-900 dark:text-rose-200">Delete this organization</div>
              <div className="text-xs text-rose-700 dark:text-rose-400 mt-0.5">
                Soft-delete this workspace. Members will immediately lose access.
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              Delete organization
            </button>
          </div>

          {showDeleteConfirm && (
            <div className="p-6 bg-rose-100/60 dark:bg-rose-950/60 border-t border-rose-200 dark:border-rose-800 space-y-4">
              <p className="text-sm font-medium text-rose-900 dark:text-rose-200">
                Are you sure you want to delete <span className="font-bold">{activeOrganization.name}</span>?
              </p>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium border border-slate-300 dark:border-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-medium hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, delete organization'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrganizationSettings;
