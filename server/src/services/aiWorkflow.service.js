const https = require('https');

/**
 * Intelligent AI Workflow & Form Schema Generator
 */
const generateWorkflowFromPrompt = async ({ prompt, provider = 'gemini', apiKey = '', model = 'gemini-1.5-flash' }) => {
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    const error = new Error('Please provide a prompt describing your desired workflow.');
    error.statusCode = 400;
    throw error;
  }

  const cleanPrompt = prompt.trim();

  // If apiKey is provided, attempt live LLM generation
  if (apiKey && apiKey.trim()) {
    try {
      if (provider === 'gemini') {
        const geminiResult = await callGemini({ prompt: cleanPrompt, apiKey: apiKey.trim(), model });
        if (geminiResult) return geminiResult;
      } else if (provider === 'openai') {
        const openaiResult = await callOpenAI({ prompt: cleanPrompt, apiKey: apiKey.trim(), model });
        if (openaiResult) return openaiResult;
      }
    } catch (llmErr) {
      console.warn('[AI Workflow Service] Live LLM call encountered error, using semantic parser fallback:', llmErr.message);
    }
  }

  // Robust Semantic Parser for Structured Workflow Generation
  return generateSemanticWorkflow(cleanPrompt);
};

/**
 * Query available Gemini models for this API key
 */
function listGeminiModels(apiKey) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        method: 'GET',
        timeout: 10000,
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            const data = JSON.parse(raw);
            if (res.statusCode >= 200 && res.statusCode < 300 && Array.isArray(data.models)) {
              resolve(data.models);
            } else {
              const errMsg = data.error?.message || `HTTP ${res.statusCode}`;
              const err = new Error(errMsg);
              err.statusCode = 400;
              reject(err);
            }
          } catch (e) {
            reject(new Error(`Failed to parse Gemini models list: ${e.message}`));
          }
        });
      }
    );
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Gemini API connection timed out.'));
    });
    req.on('error', (e) => reject(new Error(`Network error connecting to Gemini API: ${e.message}`)));
    req.end();
  });
}

/**
 * Test generateContent with specific model
 */
function testGeminiGenerateContent({ modelName, apiKey }) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      contents: [{ parts: [{ text: 'Ping' }] }],
    });

    const modelPath = modelName.startsWith('models/') ? modelName : `models/${modelName}`;
    const url = `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${apiKey}`;

    const req = https.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
        timeout: 10000,
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            const data = JSON.parse(raw);
            if (res.statusCode >= 200 && res.statusCode < 300 && !data.error) {
              resolve(data);
            } else {
              const errMsg = data.error?.message || `HTTP ${res.statusCode}`;
              reject(new Error(errMsg));
            }
          } catch (err) {
            reject(err);
          }
        });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Gemini generateContent timed out.'));
    });

    req.on('error', (err) => reject(err));
    req.write(postData);
    req.end();
  });
}

/**
 * Google Gemini API Handler
 */
async function callGemini({ prompt, apiKey, model }) {
  let targetModelPath = model ? (model.startsWith('models/') ? model : `models/${model}`) : 'models/gemini-1.5-flash';

  try {
    const availableModels = await listGeminiModels(apiKey);
    const contentModels = availableModels.filter(
      (m) => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')
    );
    if (contentModels.length > 0) {
      const match = contentModels.find((m) => m.name === targetModelPath || m.name.endsWith(`/${model}`));
      if (match) {
        targetModelPath = match.name;
      } else {
        const fallback =
          contentModels.find((m) => m.name.includes('flash')) ||
          contentModels.find((m) => m.name.includes('pro')) ||
          contentModels[0];
        targetModelPath = fallback.name;
      }
    }
  } catch (e) {
    // Proceed with targetModelPath
  }

  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: `You are an enterprise business process architect. Generate a structured JSON workflow based on this prompt: "${prompt}".
Respond ONLY with a valid JSON object with NO markdown formatting, matching this exact schema:
{
  "name": "Workflow Name",
  "category": "expense | leave | procurement | it_support | general",
  "description": "Brief description",
  "icon": "Emoji icon",
  "formSchema": [
    {
      "fieldKey": "field_key_snake_case",
      "label": "Human Readable Label",
      "type": "text | number | date | textarea",
      "required": true
    }
  ],
  "steps": [
    {
      "stepNumber": 1,
      "name": "Stage 1 Title",
      "stepType": "approval",
      "assigneeType": "role",
      "assigneeRoleKey": "manager | approver | admin | owner"
    }
  ]
}`,
            },
          ],
        },
      ],
    });

    const url = `https://generativelanguage.googleapis.com/v1beta/${targetModelPath}:generateContent?key=${apiKey}`;
    const req = https.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(raw);
            const textContent = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const cleaned = textContent.replace(/```json/g, '').replace(/```/g, '').trim();
            const workflowData = JSON.parse(cleaned);
            resolve(sanitizeGeneratedWorkflow(workflowData));
          } catch (err) {
            reject(err);
          }
        });
      }
    );

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * OpenAI API Handler
 */
function callOpenAI({ prompt, apiKey, model }) {
  return new Promise((resolve, reject) => {
    const targetModel = model || 'gpt-4o-mini';
    const postData = JSON.stringify({
      model: targetModel,
      messages: [
        {
          role: 'system',
          content: 'You are an enterprise workflow automation architect. Return ONLY valid JSON with no markdown.',
        },
        {
          role: 'user',
          content: `Create a structured workflow for: "${prompt}". Output JSON: { name, category, description, icon, formSchema: [{ fieldKey, label, type, required }], steps: [{ stepNumber, name, stepType: "approval", assigneeType: "role", assigneeRoleKey }] }`,
        },
      ],
      response_format: { type: 'json_object' },
    });

    const req = https.request(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(postData),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (c) => (raw += c));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(raw);
            const content = parsed.choices?.[0]?.message?.content || '{}';
            const workflowData = JSON.parse(content);
            resolve(sanitizeGeneratedWorkflow(workflowData));
          } catch (err) {
            reject(err);
          }
        });
      }
    );

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

/**
 * Rule-Based Semantic Workflow Synthesizer
 */
function generateSemanticWorkflow(prompt) {
  const lower = prompt.toLowerCase();

  let name = 'Automated Workflow';
  let category = 'general';
  let icon = '⚡';
  let description = prompt;
  let formSchema = [
    { fieldKey: 'request_title', label: 'Request Title', type: 'text', required: true },
    { fieldKey: 'justification', label: 'Business Justification', type: 'textarea', required: true },
  ];
  let steps = [
    { stepNumber: 1, name: 'Department Manager Review', stepType: 'approval', assigneeType: 'role', assigneeRoleKey: 'manager' },
    { stepNumber: 2, name: 'Administrative Sign-Off', stepType: 'approval', assigneeType: 'role', assigneeRoleKey: 'admin' },
  ];

  if (lower.includes('expense') || lower.includes('travel') || lower.includes('reimburse') || lower.includes('cost') || lower.includes('invoice') || lower.includes('budget')) {
    name = 'Expense Reimbursement & Claim';
    category = 'expense';
    icon = '💰';
    description = 'Submit and route operational or travel expense claims for multi-stage review.';
    formSchema = [
      { fieldKey: 'expense_title', label: 'Expense Title / Description', type: 'text', required: true },
      { fieldKey: 'amount', label: 'Total Amount', type: 'number', required: true },
      { fieldKey: 'expense_date', label: 'Date of Expense', type: 'date', required: true },
      { fieldKey: 'notes', label: 'Receipt & Business Justification', type: 'textarea', required: false },
    ];
    steps = [
      { stepNumber: 1, name: 'Department Manager Review', stepType: 'approval', assigneeType: 'role', assigneeRoleKey: 'manager' },
      { stepNumber: 2, name: 'Finance Sign-Off', stepType: 'approval', assigneeType: 'role', assigneeRoleKey: 'approver' },
    ];
  } else if (lower.includes('leave') || lower.includes('pto') || lower.includes('vacation') || lower.includes('sick') || lower.includes('holiday')) {
    name = 'Leave & PTO Request';
    category = 'leave';
    icon = '🌴';
    description = 'Request annual vacation, personal time off, or sick leave.';
    formSchema = [
      { fieldKey: 'leave_type', label: 'Leave Type', type: 'text', required: true },
      { fieldKey: 'start_date', label: 'Start Date', type: 'date', required: true },
      { fieldKey: 'end_date', label: 'End Date', type: 'date', required: true },
      { fieldKey: 'reason', label: 'Coverage & Reason Notes', type: 'textarea', required: false },
    ];
    steps = [
      { stepNumber: 1, name: 'Direct Manager Approval', stepType: 'approval', assigneeType: 'role', assigneeRoleKey: 'manager' },
      { stepNumber: 2, name: 'HR Administration', stepType: 'approval', assigneeType: 'role', assigneeRoleKey: 'admin' },
    ];
  } else if (lower.includes('hardware') || lower.includes('laptop') || lower.includes('monitor') || lower.includes('device') || lower.includes('procurement') || lower.includes('equipment')) {
    name = 'Hardware & Equipment Procurement';
    category = 'procurement';
    icon = '💻';
    description = 'Request technical equipment, developer workstations, and peripherals.';
    formSchema = [
      { fieldKey: 'item_name', label: 'Hardware Specifications', type: 'text', required: true },
      { fieldKey: 'estimated_cost', label: 'Estimated Cost ($)', type: 'number', required: true },
      { fieldKey: 'needed_by_date', label: 'Needed By Date', type: 'date', required: true },
      { fieldKey: 'justification', label: 'Business Justification', type: 'textarea', required: true },
    ];
    steps = [
      { stepNumber: 1, name: 'Department Manager Review', stepType: 'approval', assigneeType: 'role', assigneeRoleKey: 'manager' },
      { stepNumber: 2, name: 'IT Procurement Sign-Off', stepType: 'approval', assigneeType: 'role', assigneeRoleKey: 'admin' },
      { stepNumber: 3, name: 'Executive Sign-Off', stepType: 'approval', assigneeType: 'role', assigneeRoleKey: 'owner' },
    ];
  } else if (lower.includes('onboard') || lower.includes('hire') || lower.includes('employee')) {
    name = 'Employee Onboarding Process';
    category = 'general';
    icon = '👥';
    description = 'Provision new team member accounts, hardware, and access.';
    formSchema = [
      { fieldKey: 'employee_name', label: 'Employee Full Name', type: 'text', required: true },
      { fieldKey: 'job_title', label: 'Job Title', type: 'text', required: true },
      { fieldKey: 'start_date', label: 'Start Date', type: 'date', required: true },
      { fieldKey: 'department', label: 'Department / Team', type: 'text', required: true },
    ];
    steps = [
      { stepNumber: 1, name: 'Hiring Manager Verification', stepType: 'approval', assigneeType: 'role', assigneeRoleKey: 'manager' },
      { stepNumber: 2, name: 'Workspace Admin Setup', stepType: 'approval', assigneeType: 'role', assigneeRoleKey: 'admin' },
    ];
  }

  return {
    name,
    category,
    description,
    icon,
    formSchema,
    steps,
  };
}

/**
 * Sanitizes and enforces schema correctness
 */
function sanitizeGeneratedWorkflow(data) {
  const allowedCategories = ['expense', 'leave', 'procurement', 'it_support', 'general'];
  const allowedFieldTypes = ['text', 'number', 'date', 'textarea'];
  const allowedRoles = ['manager', 'approver', 'admin', 'owner'];

  const category = allowedCategories.includes(data.category) ? data.category : 'general';

  const formSchema = (data.formSchema || []).map((f, idx) => ({
    fieldKey: (f.fieldKey || `field_${idx + 1}`).toLowerCase().replace(/[^a-z0-9]/g, '_'),
    label: f.label || `Field ${idx + 1}`,
    type: allowedFieldTypes.includes(f.type) ? f.type : 'text',
    required: Boolean(f.required),
  }));

  const steps = (data.steps || []).map((s, idx) => ({
    stepNumber: idx + 1,
    name: s.name || `Stage ${idx + 1}`,
    stepType: 'approval',
    assigneeType: 'role',
    assigneeRoleKey: allowedRoles.includes(s.assigneeRoleKey) ? s.assigneeRoleKey : 'admin',
    slaHours: Number(s.slaHours) || 24,
    conditionLogic: ['always', 'all', 'any'].includes(s.conditionLogic) ? s.conditionLogic : 'always',
    conditions: Array.isArray(s.conditions)
      ? s.conditions.map((c) => ({
          field: c.field || '',
          operator: ['gt', 'gte', 'lt', 'lte', 'eq', 'neq', 'contains'].includes(c.operator) ? c.operator : 'gt',
          value: c.value !== undefined ? c.value : '',
          action: c.action === 'skip' ? 'skip' : 'require',
        }))
      : [],
  }));

  return {
    name: data.name || 'AI Generated Workflow',
    category,
    description: data.description || 'Generated via AI Process Intelligence',
    icon: data.icon || '✨',
    formSchema: formSchema.length > 0 ? formSchema : [
      { fieldKey: 'request_title', label: 'Request Title', type: 'text', required: true },
      { fieldKey: 'details', label: 'Details', type: 'textarea', required: false },
    ],
    steps: steps.length > 0 ? steps : [
      { stepNumber: 1, name: 'Manager Review', stepType: 'approval', assigneeType: 'role', assigneeRoleKey: 'manager', slaHours: 24, conditionLogic: 'always', conditions: [] },
      { stepNumber: 2, name: 'Admin Sign-Off', stepType: 'approval', assigneeType: 'role', assigneeRoleKey: 'admin', slaHours: 48, conditionLogic: 'always', conditions: [] },
    ],
  };
}

/**
 * Validates Live API Key Connection with Provider
 */
const validateAiConnection = async ({ provider = 'gemini', apiKey = '', model = 'gemini-1.5-flash' }) => {
  if (!apiKey || !apiKey.trim()) {
    const error = new Error('API Key is required to test the connection.');
    error.statusCode = 400;
    throw error;
  }

  const cleanKey = apiKey.trim();

  if (provider === 'gemini') {
    try {
      // 1. Fetch available models for this key to verify authentication
      const availableModels = await listGeminiModels(cleanKey);
      const contentModels = availableModels.filter(
        (m) => m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')
      );

      if (contentModels.length === 0) {
        const error = new Error('This Gemini API key does not have access to any generateContent models.');
        error.statusCode = 400;
        throw error;
      }

      // 2. Candidate models to try in order
      const requestedClean = model ? model.replace(/^models\//, '') : '';
      const candidateList = [];

      if (requestedClean) {
        candidateList.push(requestedClean);
      }

      // Add common standard models to candidates (Free tier & Recommended models first)
      candidateList.push(
        'gemini-2.5-flash-lite',
        'gemini-2.5-flash',
        'gemini-1.5-flash',
        'gemini-1.5-flash-latest',
        'gemini-2.0-flash',
        'gemini-2.0-flash-exp',
        'gemini-1.5-pro',
        'gemini-1.5-pro-latest',
        'gemini-pro',
        'gemini-1.5-flash-8b'
      );

      // Append any models returned from listModels
      contentModels.forEach((m) => {
        const rawName = m.name.replace(/^models\//, '');
        if (!candidateList.includes(rawName)) {
          candidateList.push(rawName);
        }
      });

      // 3. Test generateContent on candidates until one succeeds
      let lastError = null;
      for (const candidate of candidateList) {
        try {
          await testGeminiGenerateContent({
            modelName: candidate,
            apiKey: cleanKey,
          });

          // Model verified successfully!
          return {
            success: true,
            provider: 'gemini',
            model: candidate,
            message: `Google Gemini connection verified successfully with model '${candidate}'!`,
          };
        } catch (candidateErr) {
          lastError = candidateErr;
          // If error mentions another model recommendation (e.g. "use models/gemini-3.6-flash"), try that
          const matchSuggested = candidateErr.message?.match(/models\/([a-zA-Z0-9._-]+)/);
          if (matchSuggested && matchSuggested[1] && !candidateList.includes(matchSuggested[1])) {
            candidateList.unshift(matchSuggested[1]);
          }
        }
      }

      // If all candidates failed, throw the last error
      const error = new Error(lastError?.message || 'Failed to authenticate with Google Gemini API');
      error.statusCode = 400;
      throw error;
    } catch (err) {
      const error = new Error(err.message || 'Failed to authenticate with Google Gemini API');
      error.statusCode = 400;
      throw error;
    }
  } else if (provider === 'openai') {
    return new Promise((resolve, reject) => {
      const req = https.request(
        'https://api.openai.com/v1/models',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${cleanKey}`,
            'User-Agent': 'Nexus-Platform/1.0',
          },
          timeout: 10000,
        },
        (res) => {
          let raw = '';
          res.on('data', (c) => (raw += c));
          res.on('end', () => {
            try {
              const data = JSON.parse(raw);
              if (res.statusCode >= 200 && res.statusCode < 300 && !data.error) {
                resolve({
                  success: true,
                  provider: 'openai',
                  message: 'OpenAI API connection verified successfully!',
                });
              } else {
                const errMsg = data.error?.message || `OpenAI API returned status ${res.statusCode}`;
                const err = new Error(`OpenAI Verification Failed: ${errMsg}`);
                err.statusCode = 400;
                reject(err);
              }
            } catch (parseErr) {
              const err = new Error(`Invalid response from OpenAI API: ${parseErr.message}`);
              err.statusCode = 400;
              reject(err);
            }
          });
        }
      );

      req.on('timeout', () => {
        req.destroy();
        const err = new Error('OpenAI API connection timed out. Please check network connectivity.');
        err.statusCode = 408;
        reject(err);
      });

      req.on('error', (err) => {
        const error = new Error(`Network error connecting to OpenAI API: ${err.message}`);
        error.statusCode = 400;
        reject(error);
      });

      req.end();
    });
  } else {
    const err = new Error(`Testing not supported for provider '${provider}'.`);
    err.statusCode = 400;
    throw err;
  }
};

module.exports = {
  generateWorkflowFromPrompt,
  validateAiConnection,
};
