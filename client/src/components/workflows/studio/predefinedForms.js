/**
 * Standard Predefined Forms for Nexus Enterprise Platform
 */
export const PREDEFINED_FORMS = [
  {
    id: 'expense-reimbursement',
    name: 'Expense Reimbursement',
    description: 'Finance request for travel, meals, and software claims',
    category: 'expense',
    icon: '💰',
    fields: [
      { fieldKey: 'expense_title', label: 'Expense Title / Description', type: 'text', required: true, placeholder: 'e.g. Client Dinner' },
      { fieldKey: 'amount', label: 'Total Amount', type: 'number', required: true, placeholder: '0.00' },
      { fieldKey: 'expense_date', label: 'Date of Expense', type: 'date', required: true },
      { fieldKey: 'notes', label: 'Business Justification / Receipt Details', type: 'textarea', required: false, placeholder: 'Add receipt references or justification...' },
    ],
  },
  {
    id: 'leave-pto-request',
    name: 'Leave & PTO Request',
    description: 'HR time-off, annual leave, and sick day requests',
    category: 'leave',
    icon: '🌴',
    fields: [
      { fieldKey: 'leave_type', label: 'Leave Type', type: 'text', required: true, placeholder: 'e.g. Paid Time Off (PTO)' },
      { fieldKey: 'start_date', label: 'Start Date', type: 'date', required: true },
      { fieldKey: 'end_date', label: 'End Date', type: 'date', required: true },
      { fieldKey: 'reason', label: 'Reason / Coverage Notes', type: 'textarea', required: false, placeholder: 'Reason for leave...' },
    ],
  },
  {
    id: 'hardware-procurement',
    name: 'Hardware Procurement',
    description: 'IT equipment, laptops, and peripheral requests',
    category: 'procurement',
    icon: '💻',
    fields: [
      { fieldKey: 'item_name', label: 'Hardware Item / Specifications', type: 'text', required: true, placeholder: 'e.g. MacBook Pro 16" M3' },
      { fieldKey: 'estimated_cost', label: 'Estimated Cost ($)', type: 'number', required: true, placeholder: '0.00' },
      { fieldKey: 'required_by_date', label: 'Required By Date', type: 'date', required: true },
      { fieldKey: 'business_justification', label: 'Business Justification', type: 'textarea', required: true, placeholder: 'Why is this hardware needed for your role?' },
    ],
  },
  {
    id: 'employee-onboarding',
    name: 'Employee Onboarding',
    description: 'HR new hire setup, account creation, and provisioning',
    category: 'general',
    icon: '👥',
    fields: [
      { fieldKey: 'employee_full_name', label: 'Employee Full Name', type: 'text', required: true, placeholder: 'e.g. Jane Doe' },
      { fieldKey: 'job_title', label: 'Job Title & Role', type: 'text', required: true, placeholder: 'e.g. Senior Software Engineer' },
      { fieldKey: 'start_date', label: 'Start Date', type: 'date', required: true },
      { fieldKey: 'department_name', label: 'Department / Team', type: 'text', required: true, placeholder: 'e.g. Product Engineering' },
      { fieldKey: 'special_instructions', label: 'Special Instructions / Hardware Needs', type: 'textarea', required: false, placeholder: 'Any specific requests...' },
    ],
  },
];
