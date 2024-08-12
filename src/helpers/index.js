import { fromJS, get, List, Map, OrderedMap } from 'immutable';
import { capitalize } from 'lodash-es';

export const K = typeof window !== `undefined` ? window.K : () => {};
// platform consoles and other apps may not load app head content that
// instantiates the bundle object used by some of these helpers so we create a
// mock version here
export const bundle =
  typeof window !== `undefined` && window.bundle
    ? window.bundle
    : {
        apiLocation: () => `${process.env.REACT_APP_API_HOST || ''}/app/api/v1`,
        spaceLocation: () => process.env.REACT_APP_API_HOST || '',
        kappSlug: () => '',
      };
// when running the bundle in dev mode there will already be a bundle object but
// we want to prefix the locations with the REACT_APP_API_HOST value
if (
  typeof window !== `undefined` &&
  window.bundle &&
  process.env.REACT_APP_API_HOST
) {
  const spaceLocation = window.bundle.spaceLocation();
  const apiLocation = window.bundle.apiLocation();
  window.bundle.spaceLocation = () =>
    process.env.REACT_APP_API_HOST + spaceLocation;
  window.bundle.apiLocation = () =>
    process.env.REACT_APP_API_HOST + apiLocation;
}

export const splitTeamName = team => {
  const [local, ...parents] = team
    .get('name')
    .split('::')
    .reverse();
  return [parents.reverse().join('::'), local];
};

// Applies fn to each value in list, splitting it into a new list each time fn
// returns a different value.
export const partitionListBy = (fn, list) =>
  list.isEmpty()
    ? List()
    : list
        .rest()
        .reduce(
          (reduction, current) =>
            fn(reduction.last().last(), current)
              ? reduction.push(List([current]))
              : reduction.update(reduction.size - 1, list =>
                  list.push(current),
                ),
          List([List([list.first()])]),
        );

export const generateKey = (length = 6) => {
  let result = '';
  while (result.length < length) {
    result =
      result +
      Math.floor(Math.random() * 16)
        .toString(16)
        .toUpperCase();
  }
  return result;
};

export const slugify = text =>
  text
    .trim()
    // Convert uppercase to lowercase
    .toLowerCase()
    // Replace spaces with -
    .replace(/\s+/g, '-')
    // Remove all non-word chars
    .replace(/[^A-Za-z0-9\u0080-\u00FF-]+/g, '');

export const buildDefinitionId = text =>
  text
    .trim()
    // Convert uppercase to lowercase
    .toLowerCase()
    // Replace spaces with _
    .replace(/\s+/g, '_')
    // Remove unwanted chars
    .replace(/[^A-Za-z0-9_]+/g, '');

const STATIC_FORM_BINDINGS = [
  { label: 'name', boost: 20 },
  { label: 'slug', boost: 20 },
];
const STATIC_FORM_BINDINGS_DETAILED = [
  ...STATIC_FORM_BINDINGS,
  { label: 'anonymous' },
  { label: 'description' },
  { label: 'status' },
  { label: 'type' },
  { label: 'createdAt', boost: -20 },
  { label: 'createdBy', boost: -20 },
  { label: 'updatedAt', boost: -20 },
  { label: 'updatedBy', boost: -20 },
];

const STATIC_KAPP_BINDINGS = [
  { label: 'name', boost: 20 },
  { label: 'slug', boost: 20 },
];

const STATIC_SPACE_BINDINGS = [
  { label: 'name', boost: 20 },
  { label: 'slug', boost: 20 },
];

const STATIC_SUBMISSION_BINDINGS = [
  { label: 'id', boost: 20 },
  { label: 'coreState' },
  { label: 'currentPage' },
  { label: 'handle' },
  { label: 'type' },
  { label: 'closedAt', boost: -20 },
  { label: 'closedBy', boost: -20 },
  { label: 'createdAt', boost: -20 },
  { label: 'createdBy', boost: -20 },
  { label: 'submittedAt', boost: -20 },
  { label: 'submittedBy', boost: -20 },
  { label: 'updatedAt', boost: -20 },
  { label: 'updatedBy', boost: -20 },
];
const STATIC_SUBMISSION_BINDINGS_DETAILED = [
  ...STATIC_SUBMISSION_BINDINGS,
  { label: 'sessionToken' },
];

const STATIC_IDENTITY_BINDINGS = [
  { label: 'username', boost: 20 },
  { label: 'displayName', boost: 10 },
  { label: 'email', boost: 10 },
  { label: 'anonymous' },
  { label: 'authenticated' },
  { label: 'sessionToken' },
  { label: 'spaceAdmin' },
];

const STATIC_FILE_BINDINGS = [
  { label: 'folder' },
  { label: 'name' },
  { label: 'path' },
];

const STATIC_TEAM_BINDINGS = [{ label: 'name' }, { label: 'slug' }];

const STATIC_USER_BINDINGS = [
  { label: 'username', boost: 20 },
  { label: 'displayName', boost: 10 },
  { label: 'email', boost: 10 },
  { label: 'spaceAdmin' },
];

/**
 * Builds code editor bindings from the provided options
 *
 * @param {object} options
 *
 * @param {object} [options.values] Options for values bindings
 * @param {string} [options.values.label=values]
 * @param {object[]} options.values.data
 * @param {object} options.values.data[].name
 * @param {object} options.values.data[].renderType
 *
 * @param {object} [options.form] Options for form bindings
 * @param {string} [options.form.label=form]
 * @param {boolean} [options.form.detailed]
 * @param {object[]} [options.form.staticBindings]
 * @param {object[]} [options.form.attributeDefinitions]
 *
 * @param {object} [options.kapp] Options for kapp bindings
 * @param {string} [options.kapp.label=kapp]
 * @param {object[]} [options.kapp.staticBindings]
 * @param {object[]} [options.kapp.attributeDefinitions]
 *
 * @param {object} [options.space] Options for space bindings
 * @param {string} [options.space.label=space]
 * @param {object[]} [options.space.staticBindings]
 * @param {object[]} [options.space.attributeDefinitions]
 *
 * @param {object} [options.submission] Options for submission bindings
 * @param {string} [options.submission.label=submission]
 * @param {boolean} [options.submission.detailed]
 * @param {object[]} [options.submission.staticBindings]
 *
 * @param {object} [options.identity] Options for identity bindings
 * @param {string} [options.identity.label=identity]
 * @param {object[]} [options.identity.staticBindings]
 * @param {object[]} [options.identity.attributeDefinitions]
 * @param {object[]} [options.identity.profileAttributeDefinitions]
 *
 * @param {object} [options.user] Options for user bindings
 * @param {string} [options.user.label=user]
 * @param {object[]} [options.user.staticBindings]
 * @param {object[]} [options.user.attributeDefinitions]
 * @param {object[]} [options.user.profileAttributeDefinitions]
 *
 * @param {object} [options.team] Options for team bindings
 * @param {string} [options.team.label=team]
 * @param {object[]} [options.team.staticBindings]
 * @param {object[]} [options.team.attributeDefinitions]
 *
 * @param {object} [options.file] Options for file resource bindings
 * @param {string} [options.file.label=file]
 * @param {object[]} [options.file.staticBindings]
 *
 * @param {object} [options.resources] Options for bridged resource bindings
 * @param {string} [options.resources.label=resources]
 * @param {string} [options.resources.bridgedResourceName]
 * @param {string[]} [options.resources.attributes]
 *
 * @param {object} [options.integration] Options for integration bindings
 * @param {string} [options.integration.label=integration]
 * @param {string} [options.integration.integrationName]
 * @param {string[]} [options.integration.outputs]
 *
 * @param {object[]} [options.staticBindings] Additional bindings to include
 *
 * @returns The bindings object to be used by the CodeEditor component.
 */
export const buildCodeEditorBindings = ({
  values,
  form,
  kapp,
  space,
  submission,
  identity,
  user,
  team,
  file,
  resources,
  integration,
  staticBindings,
} = {}) => {
  return List(
    [
      values &&
        buildValuesBindings(values.label || 'values', List(values.data)),
      form &&
        buildObjectWithAttributesBindings(
          form.label || 'form',
          List(form.staticBindings).concat(
            form.detailed
              ? STATIC_FORM_BINDINGS_DETAILED
              : STATIC_FORM_BINDINGS,
          ),
          List(form.attributeDefinitions),
        ),
      kapp &&
        buildObjectWithAttributesBindings(
          kapp.label || 'kapp',
          List(kapp.staticBindings).concat(STATIC_KAPP_BINDINGS),
          List(kapp.attributeDefinitions),
        ),
      space &&
        buildObjectWithAttributesBindings(
          space.label || 'space',
          List(space.staticBindings).concat(STATIC_SPACE_BINDINGS),
          List(space.attributeDefinitions),
        ),
      submission &&
        buildObjectWithAttributesBindings(
          submission.label || 'submission',
          List(submission.staticBindings).concat(
            submission.detailed
              ? STATIC_SUBMISSION_BINDINGS_DETAILED
              : STATIC_SUBMISSION_BINDINGS,
          ),
        ),
      identity &&
        buildObjectWithAttributesBindings(
          identity.label || 'identity',
          List(identity.staticBindings).concat(STATIC_IDENTITY_BINDINGS),
          List(identity.attributeDefinitions),
          List(identity.profileAttributeDefinitions),
        ),
      user &&
        buildObjectWithAttributesBindings(
          user.label || 'user',
          List(user.staticBindings).concat(STATIC_USER_BINDINGS),
          List(user.attributeDefinitions),
          List(user.profileAttributeDefinitions),
        ),
      team &&
        buildObjectWithAttributesBindings(
          team.label || 'team',
          List(team.staticBindings).concat(STATIC_TEAM_BINDINGS),
          List(team.attributeDefinitions),
        ),
      file &&
        buildObjectWithAttributesBindings(
          file.label || 'file',
          List(file.staticBindings).concat(STATIC_FILE_BINDINGS),
          List(file.attributeDefinitions),
        ),
      resources &&
        buildResourcesBindings(
          resources.label || 'resources',
          resources.bridgedResourceName,
          resources.attributes,
        ),
      integration &&
        buildIntegrationBindings(
          integration.label || 'integration',
          integration.integrationName,
          integration.outputs,
        ),
      ...(staticBindings || []).map(binding => fromJS(binding)),
    ].filter(Boolean),
  );
};

// Builds code editor binding for kinetic objects with optional attribute
// definitions
const buildObjectWithAttributesBindings = (
  label,
  staticBindings = List(),
  attributeDefinitions,
  profileAttributeDefinitions,
) => {
  return Map({
    label,
    type: 'function',
    children: staticBindings.concat(
      [
        attributeDefinitions &&
          Map({
            label: 'attribute',
            siblings: buildAttributeBindings(attributeDefinitions),
            detail: 'Attribute Selector',
            collapseSiblings: true,
          }),
        profileAttributeDefinitions &&
          Map({
            label: 'profileAttribute',
            siblings: buildAttributeBindings(profileAttributeDefinitions, true),
            detail: 'Profile Attribute Selector',
            collapseSiblings: true,
          }),
      ].filter(Boolean),
    ),
  });
};

// Converts a list of attribute definitions to code editor bindings
const buildAttributeBindings = (definitions = List(), isProfile) =>
  definitions.map(def =>
    Map({
      label: get(def, 'name'),
      detail: `${isProfile ? 'Profile ' : ''}Attribute${
        get(def, 'allowsMultiple') ? ' (Multiple)' : ''
      }`,
      section: `${isProfile ? 'Profile ' : ''}Attributes`,
    }),
  );

// Converts a list of field data objects to code editor bindings
const buildValuesBindings = (label, data = List()) =>
  Map({
    label,
    type: 'function',
    children: data.map(field =>
      Map({
        label: get(field, 'name'),
        detail: capitalize(get(field, 'renderType')),
      }),
    ),
  });

// Converts bridged resources data to code editor bindings
const buildResourcesBindings = (label, bridgedResourceName, attributes) =>
  Map({
    label,
    type: 'function',
    children: [
      Map({
        label: bridgedResourceName,
        siblings: attributes.map(label =>
          Map({ label, section: `${bridgedResourceName} Bridged Resource` }),
        ),
        detail: 'Bridged Resource',
        collapseSiblings: true,
      }),
    ],
  });

// Converts integration data to code editor bindings
const buildIntegrationBindings = (label, integrationName, outputs) =>
  Map({
    label,
    type: 'function',
    detail: 'Integration Result',
    children: outputs.map(label =>
      Map({ label, section: `${integrationName} Integration` }),
    ),
  });

export const buildAgentPath = options =>
  `${bundle.spaceLocation()}/app/components/agents/${
    options.agentSlug ? options.agentSlug : 'system'
  }`;

export * from './SearchBuilder';

export const handleFormErrors = key => result => {
  const { error } = result;
  if (error) {
    throw (error.statusCode === 400 && error.message) ||
      'There was an error while saving.';
  }

  return key ? result[key] : result;
};

export const INDEX_STATIC_PARTS = [
  'closedBy',
  'coreState',
  'createdBy',
  'handle',
  'submittedBy',
  'type',
  'updatedBy',
].sort();

export const TIMELINES = [
  'createdAt',
  'updatedAt',
  'submittedAt',
  'closedAt',
].sort();

export const MAX_PART_LENGTH = 10;
