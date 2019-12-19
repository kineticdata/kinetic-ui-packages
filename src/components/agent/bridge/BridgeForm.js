import { get, getIn, List, Map } from 'immutable';
import { generateForm } from '../../form/Form';
import {
  fetchBridge,
  createBridge,
  updateBridge,
  fetchAdapters,
} from '../../../apis';

const dataSources = ({ bridgeSlug, agentSlug, adapterClass }) => ({
  bridge: {
    fn: fetchBridge,
    params: bridgeSlug && [{ agentSlug, bridgeSlug, include: 'details' }],
    transform: result => result.bridge,
  },
  adapters: {
    fn: fetchAdapters,
    params: [{ include: 'details', type: 'bridge', agentSlug }],
    transform: result => result.adapters,
  },
  adapterProperties: {
    fn: (adapters, bridge) => {
      const appliedAdapterClass = bridge
        ? bridge.get('adapterClass')
        : adapterClass;
      const adapter = adapters.find(
        adapter => adapter.get('class') === appliedAdapterClass,
      );
      return adapter ? List(adapter.get('properties')) : List();
    },
    params: ({ adapters, bridge }) =>
      (!bridgeSlug || bridge) && adapters && [adapters, bridge],
  },
});

const handleSubmit = ({ bridgeSlug, agentSlug }) => values =>
  (bridgeSlug ? updateBridge : createBridge)({
    bridgeSlug,
    agentSlug,
    bridge: values.toJS(),
  }).then(({ bridge, error }) => {
    if (error) {
      throw (error.statusCode === 400 && error.message) ||
        'There was an error saving the bridge';
    }
    return bridge;
  });

const fields = ({ bridgeSlug, adapterClass }) => ({
  bridge,
  adapters,
  adapterProperties,
}) =>
  adapterProperties && [
    {
      name: 'slug',
      label: 'Bridge Slug',
      type: 'text',
      required: true,
      initialValue: get(bridge, 'slug', ''),
      helpText: 'Unique name used in the bridge path.',
    },
    {
      name: 'adapterClass',
      label: 'Adapter Class',
      type: 'text',
      enabled: false,
      required: false,
      initialValue: bridge ? bridge.get('adapterClass') : adapterClass,
      options: adapters.map(adapter =>
        Map({
          value: adapter.get('class'),
          label: adapter.get('name'),
        }),
      ),
    },
    ...adapterProperties
      .flatMap(property => {
        const name = property.get('name');
        return !property.get('sensitive') || !bridge
          ? [
              {
                name: `property_${name}`,
                label: name,
                type: property.get('sensitive') ? 'password' : 'text',
                required: property.get('required'),
                transient: true,
                initialValue: getIn(bridge, ['properties', name], ''),
              },
            ]
          : [
              {
                name: `property_${name}`,
                label: name,
                type: 'password',
                required: property.get('required')
                  ? ({ values }) => values.get(`changeProperty_${name}`)
                  : false,
                transient: true,
                initialValue: getIn(bridge, ['properties', name], ''),
                visible: ({ values }) => values.get(`changeProperty_${name}`),
              },
              {
                name: `changeProperty_${name}`,
                label: `Change ${name}`,
                type: 'checkbox',
                transient: true,
                onChange: ({ values }, { setValue }) => {
                  if (values.get(`property_${name}`) !== '') {
                    setValue(`property_${name}`, '');
                  }
                },
              },
            ];
      })
      .toArray(),
    {
      name: 'properties',
      visible: false,
      initialValue: get(bridge, 'properties', {}),
      serialize: ({ values }) =>
        adapterProperties
          .filter(
            prop =>
              !bridge ||
              !prop.get('sensitive') ||
              values.get(`changeProperty_${prop.get('name')}`),
          )
          .map(prop => prop.get('name'))
          .reduce(
            (reduction, propName) =>
              reduction.set(propName, values.get(`property_${propName}`)),
            Map(),
          )
          .toObject(),
    },
  ];

export const BridgeForm = generateForm({
  formOptions: ['bridgeSlug', 'adapterClass', 'agentSlug'],
  dataSources,
  fields,
  handleSubmit,
});

BridgeForm.displayName = 'BridgeForm';
