import { get, List, Map, OrderedMap } from 'immutable';

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

const SUBMISSION_STATIC_BINDINGS = [
  ['Anonymous', 'anonymous'],
  ['Closed At', 'closedAt'],
  ['Closed By', 'closedBy'],
  ['Core State', 'coreState'],
  ['Created At', 'createdAt'],
  ['Created By', 'createdBy'],
  ['Current Page', 'currentPage'],
  ['Id', 'id'],
  ['Session Token', 'sessionToken'],
  ['Submitted At', 'submittedAt'],
  ['Submitted By', 'submittedBy'],
  ['Type', 'type'],
  ['Updated At', 'updatedAt'],
  ['Updated By', 'updatedBy'],
];
const TEAM_STATIC_BINDINGS = [['Name', 'name'], ['Slug', 'slug']];
const USER_STATIC_BINDINGS = [
  ['Display Name', 'displayName'],
  ['Email', 'email'],
  ['Invited By', 'invitedBy'],
  ['Space Admin', 'spaceAdmin'],
  ['Username', 'username'],
];
const FORM_STATIC_BINDINGS = [['Name', 'name'], ['Slug', 'slug']];
const KAPP_STATIC_BINDINGS = [['Name', 'name'], ['Slug', 'slug']];
const SPACE_STATIC_BINDINGS = [['Name', 'name'], ['Slug', 'slug']];
const IDENTITY_STATIC_BINDINGS = [
  ['Username', 'username'],
  ['Display Name', 'displayName'],
  ['Email Address', 'email'],
  ['Groups', 'groups'],
  ['Session Token', 'sessionToken'],
  ['Is Anonymous?', 'anonymous'],
  ['Is Authenticated?', 'authenticated'],
  ['Is Space Admin?', 'spaceAdmin'],
];

const bindifyProfile = (
  fnName,
  staticMap,
  attributes,
  profileAttributes,
  attributeTag = 'Attribute',
  profileAttributeTag = 'Profile Attribute',
) => {
  const attributesMap = attributes.map((value, label) =>
    Map({
      value: `${fnName}('attribute:${label}')`,
      tags: [attributeTag],
    }),
  );
  const profileAttributesMap = profileAttributes.map((value, label) =>
    Map({
      value: `${fnName}('profileAttribute:${label}')`,
      tags: [profileAttributeTag],
    }),
  );
  const combinedMap = OrderedMap(staticMap)
    .merge(attributesMap)
    .merge(profileAttributesMap);
  return combinedMap.map((value, label) => {
    return Map({
      value: Map.isMap(value) ? value.get('value') : `${fnName}('${value}')`,
      tags: [],
    });
  });
};

const bindify = (
  fnName,
  staticMap,
  attributeDefinitions = List(),
  attributeTag = 'Attribute',
) =>
  attributeDefinitions.reduce(
    (reduction, attrDef) =>
      reduction.set(
        attrDef.get('name'),
        Map({
          value: `${fnName}('attribute:${attrDef.get('name')}')`,
          tags: [attributeTag],
        }),
      ),
    OrderedMap(staticMap).map(value =>
      Map({
        value: `${fnName}('${value}')`,
        tags: [],
      }),
    ),
  );

export const buildBindings = ({ space, kapp, form, scope, profile }) => {
  return OrderedMap([
    [
      'Identity',
      Map({
        children:
          profile &&
          bindifyProfile(
            'identity',
            IDENTITY_STATIC_BINDINGS,
            get(profile, 'attributesMap'),
            get(profile, 'profileAttributesMap'),
          ),
      }),
    ],
    [
      'Form',
      Map({
        children:
          [
            'Datastore Form',
            'Datastore Submission',
            'Form',
            'Submission',
          ].includes(scope) &&
          bindify(
            'form',
            FORM_STATIC_BINDINGS,
            scope.startsWith('Datastore')
              ? get(space, 'datastoreFormAttributeDefinitions')
              : get(kapp, 'formAttributeDefinitions'),
          ),
      }),
    ],
    [
      'Kapp',
      Map({
        children:
          ['Kapp', 'Form', 'Submission'].includes(scope) &&
          bindify(
            'kapp',
            KAPP_STATIC_BINDINGS,
            get(kapp, 'kappAttributeDefinitions'),
          ),
      }),
    ],
    [
      'Space',
      Map({
        children: bindify(
          'space',
          SPACE_STATIC_BINDINGS,
          get(space, 'spaceAttributeDefinitions'),
        ),
      }),
    ],
    [
      'Submission',
      Map({
        children:
          ['Submission', 'Datastore Submission'].includes(scope) &&
          bindify('submission', SUBMISSION_STATIC_BINDINGS),
      }),
    ],
    [
      'Team',
      Map({
        children:
          scope === 'Team' &&
          bindify(
            'team',
            TEAM_STATIC_BINDINGS,
            get(space, 'teamAttributeDefinitions'),
          ),
      }),
    ],
    [
      'User',
      Map({
        children:
          scope === 'User' &&
          bindify(
            'user',
            USER_STATIC_BINDINGS,
            get(space, 'userAttributeDefinitions'),
          ),
      }),
    ],
    [
      'Values',
      Map({
        children:
          ['Submission', 'Datastore Submission'].includes(scope) &&
          (form || kapp) &&
          OrderedMap(
            (form ? form.get('fields') : kapp.get('fields')).map(field => [
              field.get('name'),
              Map({
                value: `values('${field.get('name')}')`,
                tags: [],
              }),
            ]),
          ),
      }),
    ],
  ]).filter(
    o => (o.get('children') && !o.get('children').isEmpty()) || o.has('value'),
  );
};
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
