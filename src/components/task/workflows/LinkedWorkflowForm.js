import { get, List, Map } from 'immutable';
import { generateForm } from '../../form/Form';
import {
  createWorkflow,
  fetchForms,
  fetchKapps,
  fetchKappWebhookEvents,
  fetchSpaceWebhookEvents,
  fetchTree,
  fetchWorkflow,
  updateWorkflow,
} from '../../../apis';

const spaceTrees = spaceWebhookEvents =>
  spaceWebhookEvents
    .filter((_v, key) => key !== 'Discussion')
    .map((events, key) => events.map(event => `${key} ${event}`))
    .toList()
    .flatten();

const kappTrees = kappWebhookEvents =>
  kappWebhookEvents
    .map((events, key) => events.map(event => `${key} ${event}`))
    .toList()
    .flatten();

const formTrees = webhookEvents =>
  webhookEvents.get('Submission').map(event => `Submission ${event}`);

const getPossibleTrees = ({
  kappSlug,
  formSlug,
  spaceWebhookEvents,
  kappWebhookEvents,
}) =>
  kappSlug && formSlug
    ? formTrees(kappWebhookEvents)
    : !kappSlug && formSlug
      ? formTrees(spaceWebhookEvents)
      : kappSlug
        ? kappTrees(kappWebhookEvents)
        : spaceTrees(spaceWebhookEvents);

const dataSources = ({ workflowId, kappSlug, formSlug, cloneGuid }) => {
  return {
    workflow: {
      fn: fetchWorkflow,
      params: workflowId && [
        { kappSlug, formSlug, workflowId, include: 'details' },
      ],
      transform: result => result.workflow,
    },
    cloneTree: {
      fn: fetchTree,
      params: cloneGuid && [{ include: 'details,treeJson', guid: cloneGuid }],
      transform: result => result.tree,
    },
    kapps: {
      fn: fetchKapps,
      params: cloneGuid && [],
      transform: result => result.kapps,
    },
    forms: {
      fn: fetchForms,
      params: ({ values }) => {
        return (
          cloneGuid &&
          values &&
          values.get('newKappSlug') && [{ kappSlug: values.get('newKappSlug') }]
        );
      },
      transform: result => result.forms,
    }, // The requests and data manipulation needed to determine available
    // `events` for the dropdown options.
    kappWebhookEvents: {
      fn: fetchKappWebhookEvents,
      params: [],
      transform: result => result,
    },
    spaceWebhookEvents: {
      fn: fetchSpaceWebhookEvents,
      params: [],
      transform: result => result,
    },
    possibleEvents: {
      fn: getPossibleTrees,
      params: ({ spaceWebhookEvents, kappWebhookEvents }) =>
        spaceWebhookEvents &&
        kappWebhookEvents && [
          { kappSlug, formSlug, spaceWebhookEvents, kappWebhookEvents },
        ],
      transform: result => result,
    },
  };
};

const NON_CLONABLE_KEYS = [
  'createdAt',
  'createdBy',
  'updatedAt',
  'updatedBy',
  'sourceGroup',
  'sourceName',
  'name',
  'event',
  'title',
  'id',
  'guid',
  'platformItemType',
  'platformItemId',
  'versionId',
];

const handleSubmit = ({ kappSlug, formSlug, workflowId, cloneGuid }) => (
  values,
  { cloneTree },
) => {
  const submitFn = workflowId ? updateWorkflow : createWorkflow;
  const workflow = cloneGuid
    ? cloneTree
        .filter((_v, key) => !NON_CLONABLE_KEYS.includes(key))
        .set('name', values.get('name'))
        .set('event', values.get('event'))
        .toJS()
    : values.toJS();
  const targetKappSlug = cloneGuid ? values.get('newKappSlug') : kappSlug;
  const targetFormSlug = cloneGuid ? values.get('newFormSlug') : formSlug;
  return submitFn({
    kappSlug: targetKappSlug,
    formSlug: targetFormSlug,
    workflowId,
    workflow,
  }).then(({ workflow, error }) => {
    if (error) {
      throw (error.statusCode === 400 && error.message) ||
        'There was an error saving the workflow';
    }
    return { workflow, targetKappSlug, targetFormSlug };
  });
};

const isCloneReady = (cloneTree, kapps, scope) =>
  cloneTree && (scope !== 'Space' ? kapps : true);

const initialEvent = (cloneGuid, cloneTree, workflow, possibleEvents) => {
  const cloneEvent = get(cloneTree, 'event', '');

  if (!cloneGuid) {
    // If we're not cloning (editing or new).
    return get(workflow, 'event', '') || '';
  } else if (cloneGuid && cloneEvent) {
    // If we're cloning a linked workflow.
    return cloneEvent || '';
  }

  // Otherwise we have to calculate it depending on the sourceGroup and name
  const type = get(cloneTree, 'sourceGroup', '')
    .split(' > ')[0]
    .replace(/s?$/, '');
  const name = cloneTree.get('name');
  const event = `${type} ${name}`;
  const legacyEvent = possibleEvents.find(e => e === event);

  return legacyEvent || '';
};

const fields = ({ kappSlug, formSlug, cloneGuid, scope }) => ({
  workflow,
  cloneTree,
  possibleEvents,
  kapps,
}) =>
  possibleEvents &&
  (!cloneGuid || isCloneReady(cloneTree, kapps, scope)) && [
    {
      name: 'name',
      label: 'Name',
      type: 'text',
      required: true,
      initialValue: cloneGuid ? '' : get(workflow, 'name') || '',
    },
    {
      name: 'event',
      label: 'Event',
      type: 'select',
      required: true,
      enabled: !cloneGuid || !get(cloneTree, 'event', ''),
      options: possibleEvents.map(event => Map({ label: event, value: event })),
      initialValue: initialEvent(
        cloneGuid,
        cloneTree,
        workflow,
        possibleEvents,
      ),
    },
    {
      name: 'newKappSlug',
      label: 'Kapp',
      type: 'select',
      required: cloneGuid && scope !== 'Space',
      options: ({ kapps }) =>
        cloneGuid &&
        scope !== 'Space' &&
        kapps &&
        kapps.map(kapp =>
          Map({ label: kapp.get('name'), value: kapp.get('slug') }),
        ),
      initialValue: kappSlug || '',
    },
    {
      name: 'newFormSlug',
      label: 'Form',
      type: 'select',
      required: cloneGuid && scope === 'Form',
      options: ({ forms }) => {
        return forms
          ? forms.map(form =>
              Map({ label: form.get('name'), value: form.get('slug') }),
            )
          : List();
      },
      initialValue: formSlug || '',
    },
    {
      name: 'treeXml',
      label: 'Tree XML',
      type: 'text',
      required: false,
      initialValue: '',
    },
  ];

export const LinkedWorkflowForm = generateForm({
  formOptions: ['kappSlug', 'formSlug', 'workflowId', 'cloneGuid', 'scope'],
  dataSources,
  handleSubmit,
  fields,
});
