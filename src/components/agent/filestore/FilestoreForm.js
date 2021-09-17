import {
  createFilestore,
  fetchFilestore,
  updateFilestore,
} from '../../../apis';
import { fetchAdapters } from '../../../apis';
import { get, getIn, List, Map } from 'immutable';
import { buildPropertyFields, handleFormErrors } from '../../form/Form.helpers';
import { generateForm } from '../../form/Form';

const dataSources = ({ agentSlug, filestoreSlug, adapterClass }) => ({
  filestore: {
    fn: fetchFilestore,
    params: agentSlug &&
      filestoreSlug && [{ agentSlug, filestoreSlug, include: 'details' }],
    transform: result => result.filestore,
  },
  adapters: {
    fn: fetchAdapters,
    params: [{ include: 'details', type: 'filestore', agentSlug }],
    transform: result => result.adapters,
  },
  adapterProperties: {
    fn: (adapters, filestore) => {
      const appliedAdapterClass = filestore
        ? filestore.get('adapterClass')
        : adapterClass;
      const adapter = adapters.find(
        adapter => adapter.get('class') === appliedAdapterClass,
      );
      return adapter ? List(adapter.get('properties')) : List();
    },
    params: ({ adapters, filestore }) =>
      (!filestoreSlug || filestore) && adapters && [adapters, filestore],
  },
});

const handleSubmit = ({ agentSlug, filestoreSlug }) => values =>
  (filestoreSlug ? updateFilestore : createFilestore)({
    agentSlug,
    filestoreSlug,
    filestore: values.toJS(),
  }).then(
    handleFormErrors('filestore', 'There was a problem saving the filestore.'),
  );

const fields = ({ adapterClass }) => ({
  filestore,
  adapters,
  adapterProperties,
}) => {
  if (adapterProperties) {
    const { propertiesFields, propertiesSerialize } = buildPropertyFields({
      isNew: !filestore,
      properties: adapterProperties,
      getName: property => property.get('name'),
      getRequired: property => property.get('required'),
      getSensitive: property => property.get('sensitive'),
      getOptions: property => property.get('options'),
      getValue: property =>
        getIn(filestore, ['properties', property.get('name')], ''),
    });

    return [
      {
        name: 'slug',
        label: 'Filestore Slug',
        type: 'text',
        required: true,
        initialValue: get(filestore, 'slug', ''),
        pattern: /^[a-z\d-]+$/,
        patternMessage:
          'File Store Slug may only contain letters, numbers, and dashes',
        helpText: 'Unique name used in the bridge path.',
      },
      {
        name: 'adapterClass',
        label: 'Adapter Class',
        type: 'text',
        enabled: false,
        required: false,
        initialValue: filestore ? filestore.get('adapterClass') : adapterClass,
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
        initialValue: get(filestore, 'properties', {}),
        serialize: propertiesSerialize,
      },
    ];
  }
};

export const FilestoreForm = generateForm({
  formOptions: ['filestoreSlug', 'adapterClass', 'agentSlug'],
  dataSources,
  fields,
  handleSubmit,
});

FilestoreForm.displayName = 'FilestoreForm';
