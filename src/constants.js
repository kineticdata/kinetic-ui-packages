// Create from template
export const DEFAULT_SURVEY_TYPE = 'Survey';
export const DEFAULT_TEMPLATE_INCLUDES = 'details,attributesMap,fields,pages';
export const DEFAULT_NOTIFICATION_TEMPLATE_NAME = 'Survey Invitation';
export const DEFAULT_NOTIFICATION_OPT_OUT_TEMPLATE_NAME =
  'Survey Invitation - Allows Opt Out';

// Attribute names
export const STATUSES_ACTIVE = 'Statuses - Active';
export const STATUSES_INACTIVE = 'Statuses - Inactive';
export const STATUSES_CANCELLED = 'Statuses - Cancelled';
export const ATTRIBUTE_ICON = 'Icon';
export const ATTRIBUTE_ORDER = 'Sort Order';
export const ATTRIBUTE_PARENT = 'Parent';
export const ATTRIBUTE_HIDDEN = 'Hidden';
export const ATTRIBUTE_SERVICE_DAYS_DUE = 'Service Days Due';
export const ATTRIBUTE_SERVICE_OWNING_TEAM = 'Service Owning Team';

// Field names
export const STATUS_FIELD = 'Status';
export const ASSIGNED_INDIVIDUAL = 'Assigned Individual';
export const REQUESTED_BY_FIELD = 'Requested By';
export const REQUESTED_FOR_FIELD = 'Requested For';
export const REQUESTED_BY_DISPLAY_NAME_FIELD = 'Requested By Display Name';
export const REQUESTED_FOR_DISPLAY_NAME_FIELD = 'Requested For Display Name';
export const RELATED_SUBMISSION_ID_FIELD = 'Related Submission Id';
export const REFERRING_ID_FIELD = 'Referring Id';

// Class names
export const DEFAULT_LABEL_CLASS = 'status--gray';
export const WARNING_LABEL_CLASS = 'status--yellow';
export const SUCCESS_LABEL_CLASS = 'status--green';
export const DANGER_LABEL_CLASS = 'status--red';

// App values
export const CORE_STATE_DRAFT = 'Draft';
export const CORE_STATE_SUBMITTED = 'Submitted';
export const CORE_STATE_CLOSED = 'Closed';

// Misc config
export const DEFAULT_LIST_MODE_THRESHOLD = 4;
export const SUBMISSION_COUNT_LIMIT = 1000;
export const SUBMISSION_FORM_TYPE = 'Survey';
export const SUBMISSION_FORM_TYPES = ['Survey'];
export const SUBMISSION_FORM_STATUS = 'Active';
export const SUBMISSION_FORM_STATUSES = ['New', 'Active'];
export const PAGE_SIZE = 10;
export const TIME_AGO_INTERVAL = 10000;
export const TIME_FORMAT = 'MMMM D, YYYY h:mm A';
export const DEFAULT_FORM_ICON = 'fa-sticky-note-o';
export const DEFAULT_CATEGORY_ICON = 'fa-cube';

export const DEFAULT_SURVEY_CONFIGURATION = {
  'Use Custom Workflow': 'false',
  Reminders: {
    'Reminder Template': 'Survey Invitation',
    'Reminder Interval': 2,
    'Reminder Max': 3,
  },
  'Invitation Notification Name': 'Survey Invitation',
  'Event Polling': {
    Poll: 'false',
    Source: '',
    Type: '',
    'Reference Id': '',
    'Email Address': '',
    Trigger: '',
    Interval: 1440,
  },
  'Survey Period': {
    Start: '2021-07-20',
    Stop: '2022-07-20',
  },
  Expiration: 365,
  'Allow Opt-out': 'false',
  'Maximum Survey Frequency': { Count: 1, Days: 7 },
  'Owning Team': null,
  'Owning Individual': null,
};
