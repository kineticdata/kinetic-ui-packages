export const integrationTypes = [
  { label: 'HTTP', value: 'http' },
  { label: 'SMTP', value: 'smtp' },
  { label: 'SQL', value: 'sql' },
];

// Helper function for getting the label for a given type value
integrationTypes.getLabel = value =>
  integrationTypes.find(t => t.value === value)?.label || value;

export default integrationTypes;
