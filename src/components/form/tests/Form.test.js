import React from 'react';
import { KineticLib } from '../../../index';
import { store } from '../../../store';
import { generateForm, submitForm } from '../Form';
import { mount } from 'enzyme';

const FORM_KEY = 'test';

const mountForm = ({
  dataSources = () => ({}),
  fields = () => () => [],
  handleSubmit = () => {},
  formOptions = {},
  ...configurationProps
}) => {
  // Use a no-op for the FormLayout component because we don't want to actually
  // test specific content rendered by other render functions. We only care that
  // the right render functions are called with the right props.
  const FormLayout = () => null;
  // Generate a Form using the options defined by the particular test case.
  const Form = generateForm({
    dataSources,
    fields,
    formOptions: Object.keys(formOptions),
    handleSubmit,
  });
  // Wrap the enyzme mount call with a promise that will be resolved when the
  // form is initialized (most of the test cases need to wait for this).
  return new Promise(resolve => {
    const result = mount(
      <KineticLib components={{ FormLayout }}>
        <Form
          formKey={FORM_KEY}
          uncontrolled
          {...configurationProps}
          {...formOptions}
        />
      </KineticLib>,
    );
    const ready = () => !!store.getState().getIn(['forms', 'test', 'fields']);
    if (ready()) {
      result.update();
      resolve(result);
    } else {
      store.subscribe(() => {
        if (ready()) {
          result.update();
          resolve(result);
        }
      });
    }
  });
};

describe('simple', () => {
  test('data source dependencies', async () => {
    const dependencyFn = jest.fn(() => 'Test Arg');
    const messageFn = jest.fn(() => Promise.resolve('Hello World!'));
    const messageParams = jest.fn(
      ({ dependency }) => dependency && [dependency],
    );
    const result = await mountForm({
      dataSources: () => ({
        dependency: {
          fn: dependencyFn,
          params: [],
        },
        message: {
          fn: messageFn,
          params: messageParams,
        },
      }),
      fields: () => ({ message }) =>
        message && [
          {
            name: 'test',
            type: 'text',
            initialValue: message,
          },
        ],
    });
    expect(result.find('FormLayout')).toMatchSnapshot();
    // should be called once
    expect(dependencyFn.mock.calls).toMatchSnapshot();
    // should be called once with the result dependencyFn
    expect(messageFn.mock.calls).toMatchSnapshot();
    // should be called several times as bindings change
    expect(messageParams.mock.calls).toMatchSnapshot();
    result.unmount();
  });
});

describe('fields', () => {
  describe('type', () => {
    describe('text', () => {
      test('no options', async () => {
        const result = await mountForm({
          fields: () => () => [
            {
              name: 'test',
              type: 'text',
            },
          ],
        });
        expect(result.find('FormLayout')).toMatchSnapshot();
        result.unmount();
      });
    });

    describe('select', () => {
      test('no options', async () => {
        const result = await mountForm({
          fields: () => () => [
            {
              name: 'test',
              type: 'select',
            },
          ],
        });
        expect(result.find('FormLayout')).toMatchSnapshot();
        result.unmount();
      });
    });
  });

  describe('label', () => {
    test('given a string value', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            label: 'Testing Label',
          },
        ],
      });
      expect(result.find('FormLayout')).toMatchSnapshot();
      result.unmount();
    });

    test('given a null value', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            label: null,
          },
        ],
      });
      expect(result.find('FormLayout')).toMatchSnapshot();
      result.unmount();
    });

    test('given a function value', async () => {
      const labelFn = jest.fn(bindings => 'Functional Label');
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            initialValue: 'foo',
            label: labelFn,
          },
        ],
      });
      expect(result.find('FormLayout')).toMatchSnapshot();
      expect(labelFn.mock.calls).toMatchSnapshot();
      result.unmount();
    });
  });
});

describe('handleSubmit', () => {
  test('happy path', async () => {
    const submitFn = jest.fn(() => Promise.resolve('Success!'));
    const saveFn = jest.fn();
    const onSave = jest.fn(() => saveFn);
    const handleSubmit = jest.fn(() => submitFn);

    const result = await mountForm({
      fields: () => () => [{ name: 'test2', type: 'text' }],
      formOptions: { testOption: 'Foo' },
      handleSubmit,
      onSave,
    });

    submitForm(FORM_KEY, {});

    // FormButtons submitting prop should be set to true
    result.update();
    expect(result.find('FormLayout')).toMatchSnapshot();

    await submitFn();

    // FormButtons submitting prop should be false
    result.update();
    expect(result.find('FormLayout')).toMatchSnapshot();

    // check mocks
    //
    // both should be called with formOptions provided above
    expect(handleSubmit.mock.calls).toMatchSnapshot();
    expect(onSave.mock.calls).toMatchSnapshot();
    // should be called with values map and bindings object
    expect(submitFn.mock.calls).toMatchSnapshot();
    // should be called with resolved value of submitFn
    expect(saveFn.mock.calls).toMatchSnapshot();

    // cleanup
    //
    result.unmount();
  });

  test('submit error', async () => {
    const submitFn = jest.fn(() => Promise.reject('This is a test error'));
    const handleSubmit = jest.fn(() => submitFn);
    const result = await mountForm({ handleSubmit });
    submitForm('test', {});
    await submitFn().catch(e => e);
    result.update();
    expect(result.find('FormLayout')).toMatchSnapshot();
    result.unmount();
  });

  test('submit unexpected error, we expect the promise to reject with a string', async () => {
    const submitFn = jest.fn(() => Promise.reject({}));
    const handleSubmit = jest.fn(() => submitFn);
    const result = await mountForm({ handleSubmit });
    submitForm('test', {});
    await submitFn().catch(e => e);
    result.update();
    expect(result.find('FormLayout')).toMatchSnapshot();
    result.unmount();
  });

  test('submit error calls onError', async () => {
    const submitFn = jest.fn(() => Promise.reject('TEST ERROR'));
    const handleSubmit = jest.fn(() => submitFn);
    // This mock should be called with the string in the rejected promise above
    const errorFn = jest.fn();
    // This mock should be called with the formOptions provided below
    const onError = jest.fn(() => errorFn);
    const result = await mountForm({
      formOptions: { testOption: 'Foo' },
      handleSubmit,
      onError,
    });
    submitForm('test', {});
    await submitFn().catch(e => e);
    expect(onError.mock.calls).toMatchSnapshot();
    expect(errorFn.mock.calls).toMatchSnapshot();
    result.unmount();
  });
});
