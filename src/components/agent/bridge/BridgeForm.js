import { get, getIn, List, Map } from 'immutable';
import { generateForm } from '../../form/Form';
import {
  createBridge,
  fetchAdapters,
  fetchBridge,
  updateBridge,
} from '../../../apis';
import { buildPropertyFields } from '../../form/Form.helpers';

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
}) => {
  if (adapterProperties) {
    const { propertiesFields, propertiesSerialize } = buildPropertyFields({
      isNew: !bridge,
      properties: adapterProperties,
      getName: property => property.get('name'),
      getRequired: property => property.get('required'),
      getSensitive: property => property.get('sensitive'),
      getValue: property =>
        getIn(bridge, ['properties', property.get('name')], ''),
    });

    return [
      {
        name: 'slug',
        label: 'Bridge Slug',
        type: 'text',
        required: true,
        initialValue: get(bridge, 'slug', ''),
        pattern: /^[A-Za-z\d-]+$/,
        patternMessage:
          'Bridge Slug may only contain letters, numbers, and dashes',
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
      ...propertiesFields,
      {
        name: 'properties',
        visible: false,
        initialValue: get(bridge, 'properties', {}),
        serialize: propertiesSerialize,
      },
    ];
  }
};

export const BridgeForm = generateForm({
  formOptions: ['bridgeSlug', 'adapterClass', 'agentSlug'],
  dataSources,
  fields,
  handleSubmit,
});

BridgeForm.displayName = 'BridgeForm';
