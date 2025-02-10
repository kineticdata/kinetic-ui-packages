import React from 'react';
import { create, act } from 'react-test-renderer';
import { KineticLib } from '../../../index';
import { store } from '../../../store';
import { generateForm, setValue, submitForm } from '../Form';
import { FIELD_DEFAULT_VALUES } from '../Form.models';
import { mockFieldConfig } from './components';

const FORM_KEY = 'test';

const mountForm = ({
  dataSources = () => ({}),
  fields = () => () => [],
  handleSubmit = () => {},
  formOptions = {},
  ...formProps
}) => {
  // Generate a Form using the options defined by the particular test case.
  const Form = generateForm({
    dataSources,
    fields,
    formOptions: Object.keys(formOptions),
    handleSubmit,
  });
  return act(
    () =>
      // Wrap the render call with a promise that will be resolved when the
      // form is initialized (most of the test cases need to wait for this).
      new Promise(resolve => {
        const result = create(
          <KineticLib components={{ fields: mockFieldConfig }}>
            <Form
              formKey={FORM_KEY}
              uncontrolled
              {...formProps}
              {...formOptions}
            />
          </KineticLib>,
        );
        const ready = () =>
          !!store.getState().getIn(['forms', FORM_KEY, 'fields']);
        if (ready()) {
          resolve(result);
        } else {
          const unsub = store.subscribe(() => {
            if (ready()) {
              resolve(result);
              // Remove the store listener since we're done.
              unsub();
            }
          });
        }
      }),
  );
};

// Helper function to find an element within the rendered component
const getByTestId = (json, id, depth = 0) => {
  if (json?.props?.['data-testid'] === id) {
    return json;
  }
  if (Array.isArray(json?.children)) {
    return json.children
      .map(child => getByTestId(child, id, depth + 1))
      .find(Boolean);
  }
  if (depth === 0) {
    throw new Error(`Cannot find element with test id: '${id}'`);
  }
  return undefined;
};

// Helper function to get the props of an element within the rendered component
const getPropsByTestId = (json, id) => {
  const element = getByTestId(json, id);
  if (element?.props['data-props']) {
    return JSON.parse(element?.props['data-props']);
  }
  return undefined;
};

// Helper function to get the immutable types of the props of an element within
// the rendered component
const getImmutablePropTypesByTestId = (json, id) => {
  const element = getByTestId(json, id);
  if (element?.props['data-immutable-props']) {
    return JSON.parse(element?.props['data-immutable-props']);
  }
  return undefined;
};

describe('dataSources', () => {
  test('simple', async () => {
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
    expect(getByTestId(result.toJSON(), 'FormLayout')).toMatchSnapshot();
    // should be called once
    expect(dependencyFn.mock.calls).toMatchSnapshot();
    // should be called once with the result dependencyFn
    expect(messageFn.mock.calls).toMatchSnapshot();
    // should be called several times as bindings change
    expect(messageParams.mock.calls).toMatchSnapshot();
    result.unmount();
  });

  // This tests a specific bug where calling setValue multiple times was
  // resulting in issues where the state was updated multiple times before the
  // saga could check for the change in the datasource params.
  // Additionally, I could only reproduce this issue by making the `setValue`
  // calls inside the change event of a field.
  test('handles multiple change events', async () => {
    const dataFn = jest.fn(arg => Promise.resolve({ arg }));
    const result = await mountForm({
      dataSources: () => ({
        data: {
          fn: dataFn,
          params: ({ values }) => [values.get('paramField')],
        },
      }),
      fields: () => () => [
        {
          name: 'mainField',
          onChange: ({ values }, { setValue }) => {
            setValue('paramField', 'Two');
            setValue('otherField', 'n/a');
          },
          type: 'text',
        },
        { initialValue: 'One', name: 'paramField', type: 'text' },
        { name: 'otherField', type: 'text' },
      ],
    });
    // dataFn should be called once with the initial value of paramField
    expect(dataFn.mock.calls.length).toBe(1);
    expect(dataFn.mock.calls[0][0]).toBe('One');
    // trigger change event that changes the paramField
    act(() => setValue(FORM_KEY, 'mainField', 'n/a'));
    // dataFn should be called again with the updated value of paramField
    expect(dataFn.mock.calls.length).toBe(2);
    expect(dataFn.mock.calls[1][0]).toBe('Two');
    result.unmount();
  });

  test('resets to null when params evaluates to falsey', async () => {
    const dataFn = jest.fn(arg => Promise.resolve({ arg }));
    const paramFn = jest.fn(({ values }) => values.get('enabled') && ['Test']);
    const result = await mountForm({
      dataSources: () => ({
        data: {
          fn: dataFn,
          params: paramFn,
        },
      }),
      fields: () => () => [
        {
          initialValue: true,
          name: 'enabled',
          type: 'checkbox',
        },
      ],
    });
    expect(dataFn.mock.calls.length).toBe(1);
    expect(
      getPropsByTestId(result.toJSON(), 'FormLayout')?.bindings?.data,
    ).toMatchObject({
      arg: 'Test',
    });
    // Uncheck enabled which should cause paramFn to return false, which should
    // result in clearing the datasource.
    act(() => setValue(FORM_KEY, 'enabled', false));
    expect(dataFn.mock.calls.length).toBe(1);
    expect(
      getPropsByTestId(result.toJSON(), 'FormLayout')?.bindings?.data,
    ).toBe(null);
    result.unmount();
  });
});

describe('fields', () => {
  describe('constraint', function() {
    test('given false', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            constraint: false,
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('given null', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            constraint: null,
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('given function that returns true', async () => {
      const constraintFn = jest.fn(bindings => true);
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            constraint: constraintFn,
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      expect(constraintFn.mock.calls).toMatchSnapshot();
      result.unmount();
    });

    test('given function that returns false', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            constraint: () => false,
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('given function that returns null', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            constraint: () => null,
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('given function that returns a string', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            constraint: () => 'test message',
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });
  });

  describe('constraintMessage', function() {
    test('given constraint true and constraintMessage string', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            constraint: () => true,
            constraintMessage: 'test message',
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('given constraint false and constraintMessage string', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            constraint: () => false,
            constraintMessage: 'test message',
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('given constraint with string and constraintMessage string', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            constraint: () => 'test',
            constraintMessage: 'test message',
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('given constraint true and constraintMessage null', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            constraint: () => true,
            constraintMessage: null,
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('given constraint true and constraintMessage function that returns string', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            constraint: () => true,
            constraintMessage: () => 'test message',
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('given constraint true and constraintMessage function that returns null', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            constraint: () => true,
            constraintMessage: () => null,
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });
  });

  describe('enabled', function() {
    test('given true', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            enabled: true,
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('given false', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            enabled: false,
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('given a string value', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            enabled: 'true',
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('given a null value', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            enabled: null,
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('given a function that returns a boolean', async () => {
      const enabledFn = jest.fn(bindings => false);
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            enabled: enabledFn,
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      expect(enabledFn.mock.calls).toMatchSnapshot();
      result.unmount();
    });
  });

  describe('helpText', function() {
    test('=<<TODO>>=', async () => {});
  });

  describe('initialValue', function() {
    describe('initialValue properly converted to immutable', function() {
      test('attributes', async () => {
        const initial = { testkey: 'Hello World!' };
        const result = await mountForm({
          fields: () => () => [
            {
              name: 'test',
              type: 'attributes',
              initialValue: initial,
            },
          ],
        });
        expect(
          getPropsByTestId(result.toJSON(), 'AttributesFieldMock')?.value,
        ).toEqual(initial);
        expect(
          getImmutablePropTypesByTestId(result.toJSON(), 'AttributesFieldMock')
            ?.value,
        ).toEqual('Immutable.Map');
        expect(
          getByTestId(result.toJSON(), 'AttributesFieldMock'),
        ).toMatchSnapshot();
        result.unmount();
      });

      test('checkbox', async () => {
        const initial = true;
        const result = await mountForm({
          fields: () => () => [
            { name: 'test', type: 'checkbox', initialValue: initial },
          ],
        });
        expect(
          getPropsByTestId(result.toJSON(), 'CheckboxFieldMock')?.value,
        ).toEqual(initial);
        expect(
          getImmutablePropTypesByTestId(result.toJSON(), 'CheckboxFieldMock')
            ?.value,
        ).toEqual(undefined);
        expect(
          getByTestId(result.toJSON(), 'CheckboxFieldMock'),
        ).toMatchSnapshot();
        result.unmount();
      });

      test('code', async () => {
        const initial = `<div>code test</div>`;
        const result = await mountForm({
          fields: () => () => [
            {
              name: 'test',
              type: 'code',
              initialValue: initial,
            },
          ],
        });
        expect(
          getPropsByTestId(result.toJSON(), 'CodeFieldMock')?.value,
        ).toEqual(initial);
        expect(
          getImmutablePropTypesByTestId(result.toJSON(), 'CodeFieldMock')
            ?.value,
        ).toEqual(undefined);
        expect(getByTestId(result.toJSON(), 'CodeFieldMock')).toMatchSnapshot();
        result.unmount();
      });

      test('form', async () => {
        const initial = { name: 'Test Form', slug: 'test-form' };
        const result = await mountForm({
          fields: () => () => [
            {
              name: 'test',
              type: 'form',
              initialValue: initial,
            },
          ],
        });
        expect(
          getPropsByTestId(result.toJSON(), 'FormFieldMock')?.value,
        ).toEqual(initial);
        expect(
          getImmutablePropTypesByTestId(result.toJSON(), 'FormFieldMock')
            ?.value,
        ).toEqual('Immutable.Map');
        expect(getByTestId(result.toJSON(), 'FormFieldMock')).toMatchSnapshot();
        result.unmount();
      });

      test('form-multi', async () => {
        const initial = [
          { name: 'Test Form A', slug: 'test-form-a' },
          { name: 'Test Form B', slug: 'test-form-b' },
        ];
        const result = await mountForm({
          fields: () => () => [
            {
              name: 'test',
              type: 'form-multi',
              initialValue: initial,
            },
          ],
        });
        expect(
          getPropsByTestId(result.toJSON(), 'FormMultiFieldMock')?.value,
        ).toEqual(initial);
        expect(
          getImmutablePropTypesByTestId(result.toJSON(), 'FormMultiFieldMock')
            ?.value,
        ).toEqual('Immutable.List');
        expect(
          getByTestId(result.toJSON(), 'FormMultiFieldMock'),
        ).toMatchSnapshot();
        result.unmount();
      });

      test('password', async () => {
        const initial = 'test-password';
        const result = await mountForm({
          fields: () => () => [
            { name: 'test', type: 'password', initialValue: initial },
          ],
        });
        expect(
          getPropsByTestId(result.toJSON(), 'PasswordFieldMock')?.value,
        ).toEqual(initial);
        expect(
          getImmutablePropTypesByTestId(result.toJSON(), 'PasswordFieldMock')
            ?.value,
        ).toEqual(undefined);
        expect(
          getByTestId(result.toJSON(), 'PasswordFieldMock'),
        ).toMatchSnapshot();
        result.unmount();
      });

      test('radio', async () => {
        const initial = { label: 'radio test', value: 'radio-test' };
        const result = await mountForm({
          fields: () => () => [
            {
              name: 'test',
              type: 'radio',
              initialValue: initial,
            },
          ],
        });
        expect(
          getPropsByTestId(result.toJSON(), 'RadioFieldMock')?.value,
        ).toEqual(initial);
        expect(
          getImmutablePropTypesByTestId(result.toJSON(), 'RadioFieldMock')
            ?.value,
        ).toEqual('Immutable.Map');
        expect(
          getByTestId(result.toJSON(), 'RadioFieldMock'),
        ).toMatchSnapshot();
        result.unmount();
      });

      test('select', async () => {
        const initial = { value: 'Hello World!', label: 'Hello World!' };
        const result = await mountForm({
          fields: () => () => [
            {
              name: 'test',
              type: 'select',
              initialValue: initial,
            },
          ],
        });
        expect(
          getPropsByTestId(result.toJSON(), 'SelectFieldMock')?.value,
        ).toEqual(initial);
        expect(
          getImmutablePropTypesByTestId(result.toJSON(), 'SelectFieldMock')
            ?.value,
        ).toEqual('Immutable.Map');
        expect(
          getByTestId(result.toJSON(), 'SelectFieldMock'),
        ).toMatchSnapshot();
        result.unmount();
      });

      test('select-multi', async () => {
        const initial = [
          { value: 'Hello World A', label: 'Hello World A' },
          { value: 'Hello World B', label: 'Hello World B' },
        ];
        const result = await mountForm({
          fields: () => () => [
            {
              name: 'test',
              type: 'select-multi',
              initialValue: initial,
            },
          ],
        });
        expect(
          getPropsByTestId(result.toJSON(), 'SelectMultiFieldMock')?.value,
        ).toEqual(initial);
        expect(
          getImmutablePropTypesByTestId(result.toJSON(), 'SelectMultiFieldMock')
            ?.value,
        ).toEqual('Immutable.List');
        expect(
          getByTestId(result.toJSON(), 'SelectMultiFieldMock'),
        ).toMatchSnapshot();
        result.unmount();
      });

      test('team', async () => {
        const initial = { name: 'Test Team', slug: 'test-team' };
        const result = await mountForm({
          fields: () => () => [
            {
              name: 'test',
              type: 'team',
              initialValue: initial,
            },
          ],
        });
        expect(
          getPropsByTestId(result.toJSON(), 'TeamFieldMock')?.value,
        ).toEqual(initial);
        expect(
          getImmutablePropTypesByTestId(result.toJSON(), 'TeamFieldMock')
            ?.value,
        ).toEqual('Immutable.Map');
        expect(getByTestId(result.toJSON(), 'TeamFieldMock')).toMatchSnapshot();
        result.unmount();
      });

      test('team-multi', async () => {
        const initial = [
          { name: 'Test Team A', slug: 'test-team-a' },
          { name: 'Test Team B', slug: 'test-team-b' },
        ];
        const result = await mountForm({
          fields: () => () => [
            {
              name: 'test',
              type: 'team-multi',
              initialValue: initial,
            },
          ],
        });
        expect(
          getPropsByTestId(result.toJSON(), 'TeamMultiFieldMock')?.value,
        ).toEqual(initial);
        expect(
          getImmutablePropTypesByTestId(result.toJSON(), 'TeamMultiFieldMock')
            ?.value,
        ).toEqual('Immutable.List');
        expect(
          getByTestId(result.toJSON(), 'TeamMultiFieldMock'),
        ).toMatchSnapshot();
        result.unmount();
      });

      test('text', async () => {
        const initial = 'Hello World!';
        const result = await mountForm({
          fields: () => () => [
            { name: 'test', type: 'text', initialValue: initial },
          ],
        });
        expect(
          getPropsByTestId(result.toJSON(), 'TextFieldMock')?.value,
        ).toEqual(initial);
        expect(
          getImmutablePropTypesByTestId(result.toJSON(), 'TextFieldMock')
            ?.value,
        ).toEqual(undefined);
        expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
        result.unmount();
      });

      test('text-multi', async () => {
        const initial = ['Hello World A', 'Hello World B'];
        const result = await mountForm({
          fields: () => () => [
            {
              name: 'test',
              type: 'text-multi',
              initialValue: initial,
            },
          ],
        });
        expect(
          getPropsByTestId(result.toJSON(), 'TextMultiFieldMock')?.value,
        ).toEqual(initial);
        expect(
          getImmutablePropTypesByTestId(result.toJSON(), 'TextMultiFieldMock')
            ?.value,
        ).toEqual('Immutable.List');
        expect(
          getByTestId(result.toJSON(), 'TextMultiFieldMock'),
        ).toMatchSnapshot();
        result.unmount();
      });

      test('user', async () => {
        const initial = { username: 'test-user' };
        const result = await mountForm({
          fields: () => () => [
            {
              name: 'test',
              type: 'user',
              initialValue: initial,
            },
          ],
        });
        expect(
          getPropsByTestId(result.toJSON(), 'UserFieldMock')?.value,
        ).toEqual(initial);
        expect(
          getImmutablePropTypesByTestId(result.toJSON(), 'UserFieldMock')
            ?.value,
        ).toEqual('Immutable.Map');
        expect(getByTestId(result.toJSON(), 'UserFieldMock')).toMatchSnapshot();
        result.unmount();
      });

      test('user-multi', async () => {
        const initial = [
          { username: 'test-user-a' },
          { username: 'test-user-b' },
        ];
        const result = await mountForm({
          fields: () => () => [
            {
              name: 'test',
              type: 'user-multi',
              initialValue: initial,
            },
          ],
        });
        expect(
          getPropsByTestId(result.toJSON(), 'UserMultiFieldMock')?.value,
        ).toEqual(initial);
        expect(
          getImmutablePropTypesByTestId(result.toJSON(), 'UserMultiFieldMock')
            ?.value,
        ).toEqual('Immutable.List');
        expect(
          getByTestId(result.toJSON(), 'UserMultiFieldMock'),
        ).toMatchSnapshot();
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
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
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
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
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
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      expect(labelFn.mock.calls).toMatchSnapshot();
      result.unmount();
    });
  });

  describe('language', function() {
    test('=<<TODO>>=', async () => {});
  });

  describe('name', function() {
    test('=<<TODO>>=', async () => {});
  });

  describe('onChange', function() {
    test('=<<TODO>>=', async () => {});
  });

  describe('options', function() {
    test('=<<TODO>>=', async () => {});
  });

  describe('pattern', function() {
    test('given regex and matching initialValue', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            initialValue: '314159',
            pattern: /^\d+$/,
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('given null', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            initialValue: '314159',
            pattern: null,
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('given function that returns regex and matching initialValue', async () => {
      const patternFn = jest.fn(bindings => /^\d+$/);
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            initialValue: '314159',
            pattern: patternFn,
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      expect(patternFn.mock.calls).toMatchSnapshot();
      result.unmount();
    });

    test('given function that returns null', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            initialValue: '314159',
            pattern: () => null,
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });
  });

  describe('patternMessage', function() {
    test('given trigger and string message', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            initialValue: 'hello',
            pattern: /^\d+$/,
            patternMessage: 'test message',
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('given trigger and null message', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            initialValue: 'hello',
            pattern: /^\d+$/,
            patternMessage: null,
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('given trigger and message function that returns string', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            initialValue: 'hello',
            pattern: /^\d+$/,
            patternMessage: () => 'test message',
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('given trigger and message function that returns null', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            initialValue: 'hello',
            pattern: /^\d+$/,
            patternMessage: () => null,
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('given no trigger', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            initialValue: '314159',
            pattern: /^\d+$/,
            patternMessage: 'test message',
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });
  });

  describe('placeholder', function() {
    test('given a string value', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            placeholder: 'Test 123',
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('given a null value', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            placeholder: null,
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('given a function that returns a string value', async () => {
      const placeholderFn = jest.fn(bindings => 'Test ABC');
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            placeholder: placeholderFn,
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      expect(placeholderFn.mock.calls).toMatchSnapshot();
      result.unmount();
    });

    test('given a function that returns a null value', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            placeholder: () => null,
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });
  });

  describe('renderAttributes', function() {
    test('=<<TODO>>=', async () => {});
  });

  describe('required', () => {
    test('given true', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            required: true,
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('given false', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            required: false,
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('has value', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            required: true,
            initialValue: 'Test',
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('given function that returns true', async () => {
      const requiredFn = jest.fn(bindings => true);
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            required: requiredFn,
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      expect(requiredFn.mock.calls).toMatchSnapshot();
      result.unmount();
    });

    test('given function that returns false', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            required: () => false,
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('given function that returns null', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            required: () => null,
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });
  });

  describe('requiredMessage', function() {
    test('given trigger and string message', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            initialValue: '',
            required: true,
            requiredMessage: 'test message',
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('given trigger and null message', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            initialValue: '',
            required: true,
            requiredMessage: null,
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('given trigger and message function that returns string', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            initialValue: '',
            required: true,
            requiredMessage: () => 'test message',
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('given trigger and message function that returns null', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            initialValue: '',
            required: true,
            requiredMessage: () => null,
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('given no trigger', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            initialValue: 'hello',
            required: true,
            requiredMessage: 'test message',
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });
  });

  describe('search', function() {
    test('=<<TODO>>=', async () => {});
  });

  describe('serialize', function() {
    test('=<<TODO>>=', async () => {});
  });

  describe('transient', function() {
    test('given true', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            transient: true,
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('given false', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            transient: false,
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('given a string value', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            transient: 'false',
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('given a null value', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            transient: null,
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('given function that returns true', async () => {
      const transientFn = jest.fn(bindings => true);
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            transient: transientFn,
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      expect(transientFn.mock.calls).toMatchSnapshot();
      result.unmount();
    });

    test('given function that returns false', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            transient: () => false,
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('given function that returns null', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            transient: () => null,
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });
  });

  describe('type', () => {
    describe('attributes', function() {
      test('minimal', async () => {
        const result = await mountForm({
          fields: () => () => [
            {
              name: 'test',
              type: 'attributes',
            },
          ],
        });
        // options should default to an empty list
        // value should default to empty map
        expect(
          getByTestId(result.toJSON(), 'AttributesFieldMock'),
        ).toMatchSnapshot();
        result.unmount();
      });

      test('=<<TODO>>= invalid value type', async () => {});
      test('=<<TODO>>= valid options', async () => {});
      test('=<<TODO>>= invalid options', async () => {});
    });

    describe('checkbox', function() {
      test('minimal', async () => {
        const result = await mountForm({
          fields: () => () => [
            {
              name: 'test',
              type: 'checkbox',
            },
          ],
        });
        // value should default to false
        expect(
          getByTestId(result.toJSON(), 'CheckboxFieldMock'),
        ).toMatchSnapshot();
        result.unmount();
      });

      test('=<<TODO>>= invalid value type', async () => {});
    });

    describe('code', function() {
      test('minimal', async () => {
        const result = await mountForm({
          fields: () => () => [
            {
              name: 'test',
              type: 'code',
            },
          ],
        });
        // options should default to an empty list and language should be passed
        // value should default to empty string
        expect(getByTestId(result.toJSON(), 'CodeFieldMock')).toMatchSnapshot();
        result.unmount();
      });

      test('=<<TODO>>= valid language', async () => {});
      test('=<<TODO>>= invalid language', async () => {});
      test('=<<TODO>>= invalid value type', async () => {});
      test('=<<TODO>>= valid options', async () => {});
      test('=<<TODO>>= invalid options', async () => {});
    });

    describe('form', function() {
      // test('minimal', async () => {
      //   const result = await mountForm({
      //     fields: () => () => [
      //       {
      //         name: 'test',
      //         type: 'form',
      //       },
      //     ],
      //   });
      //   // options should default to an empty list
      //   // search should default to an empty map
      //   // value should default to empty string
      //   expect(getByTestId(result.toJSON(), 'FormFieldMock')).toMatchSnapshot();
      //   result.unmount();
      // });

      test('=<<TODO>>= invalid value type', async () => {});
      test('=<<TODO>>= valid options', async () => {});
      test('=<<TODO>>= invalid options', async () => {});
      test('=<<TODO>>= valid search', async () => {});
      test('=<<TODO>>= invalid search', async () => {});
    });

    describe('form-multi', function() {
      // test('minimal', async () => {
      //   const result = await mountForm({
      //     fields: () => () => [
      //       {
      //         name: 'test',
      //         type: 'form-multi',
      //       },
      //     ],
      //   });
      //   // options should default to an empty list
      //   // search should default to an empty map
      //   // value should default to empty array, (but doesn't right now)
      //   expect(getByTestId(result.toJSON(), 'FormMultiFieldMock')).toMatchSnapshot();
      //   result.unmount();
      // });

      test('=<<TODO>>= invalid value type', async () => {});
      test('=<<TODO>>= valid options', async () => {});
      test('=<<TODO>>= invalid options', async () => {});
      test('=<<TODO>>= valid search', async () => {});
      test('=<<TODO>>= invalid search', async () => {});
    });

    describe('password', function() {
      test('minimal', async () => {
        const result = await mountForm({
          fields: () => () => [
            {
              name: 'test',
              type: 'password',
            },
          ],
        });
        // value should default to empty string
        expect(
          getByTestId(result.toJSON(), 'PasswordFieldMock'),
        ).toMatchSnapshot();
        result.unmount();
      });

      test('=<<TODO>>= invalid value type', async () => {});
    });

    describe('radio', function() {
      test('minimal', async () => {
        const result = await mountForm({
          fields: () => () => [
            {
              name: 'test',
              type: 'radio',
            },
          ],
        });
        // options should default to an empty list
        // value should default to empty string
        expect(
          getByTestId(result.toJSON(), 'RadioFieldMock'),
        ).toMatchSnapshot();
        result.unmount();
      });

      test('=<<TODO>>= invalid value type', async () => {});
      test('=<<TODO>>= valid options', async () => {});
      test('=<<TODO>>= invalid options', async () => {});
    });

    describe('table', function() {
      test('=<<TODO>>=', async () => {});
    });

    describe('select', () => {
      test('minimal', async () => {
        const result = await mountForm({
          fields: () => () => [
            {
              name: 'test',
              type: 'select',
            },
          ],
        });
        // options should default to an empty list
        // value should default to empty string
        expect(
          getByTestId(result.toJSON(), 'SelectFieldMock'),
        ).toMatchSnapshot();
        result.unmount();
      });

      test('=<<TODO>>= invalid value type', async () => {});
      test('=<<TODO>>= valid options', async () => {});
      test('=<<TODO>>= invalid options', async () => {});
    });

    describe('select-multi', function() {
      test('minimal', async () => {
        const result = await mountForm({
          fields: () => () => [
            {
              name: 'test',
              type: 'select-multi',
            },
          ],
        });
        // options should default to an empty list
        // value should default to empty array
        expect(
          getByTestId(result.toJSON(), 'SelectMultiFieldMock'),
        ).toMatchSnapshot();
        result.unmount();
      });

      test('=<<TODO>>= invalid value type', async () => {});
      test('=<<TODO>>= valid options', async () => {});
      test('=<<TODO>>= invalid options', async () => {});
    });

    describe('team', function() {
      test('minimal', async () => {
        const result = await mountForm({
          fields: () => () => [
            {
              name: 'test',
              type: 'team',
            },
          ],
        });
        // options is not passed right now
        // value should default to null
        expect(getByTestId(result.toJSON(), 'TeamFieldMock')).toMatchSnapshot();
        result.unmount();
      });

      test('=<<TODO>>= invalid value type', async () => {});
      test('=<<TODO>>= valid options', async () => {});
      test('=<<TODO>>= invalid options', async () => {});
    });

    describe('team-multi', function() {
      test('minimal', async () => {
        const result = await mountForm({
          fields: () => () => [
            {
              name: 'test',
              type: 'team-multi',
            },
          ],
        });
        // options is not passed right now
        // value should default to empty array
        expect(
          getByTestId(result.toJSON(), 'TeamMultiFieldMock'),
        ).toMatchSnapshot();
        result.unmount();
      });

      test('=<<TODO>>= invalid value type', async () => {});
      test('=<<TODO>>= valid options', async () => {});
      test('=<<TODO>>= invalid options', async () => {});
    });

    describe('text', () => {
      test('minimal', async () => {
        const result = await mountForm({
          fields: () => () => [
            {
              name: 'test',
              type: 'text',
            },
          ],
        });
        // options should default to an empty list
        // value should default to empty string
        expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
        result.unmount();
      });

      test('=<<TODO>>= invalid value type', async () => {});
      test('=<<TODO>>= valid options', async () => {});
      test('=<<TODO>>= invalid options', async () => {});
    });

    describe('text-multi', function() {
      test('minimal', async () => {
        const result = await mountForm({
          fields: () => () => [
            {
              name: 'test',
              type: 'text-multi',
            },
          ],
        });
        // options should default to an empty list
        // value should default to empty list
        expect(
          getByTestId(result.toJSON(), 'TextMultiFieldMock'),
        ).toMatchSnapshot();
        result.unmount();
      });

      test('=<<TODO>>= invalid value type', async () => {});
      test('=<<TODO>>= valid options', async () => {});
      test('=<<TODO>>= invalid options', async () => {});
    });

    describe('user', function() {
      test('minimal', async () => {
        const result = await mountForm({
          fields: () => () => [
            {
              name: 'test',
              type: 'user',
            },
          ],
        });
        // options is not passed right now
        // value should default to null
        expect(getByTestId(result.toJSON(), 'UserFieldMock')).toMatchSnapshot();
        result.unmount();
      });

      test('=<<TODO>>= invalid value type', async () => {});
      test('=<<TODO>>= valid options', async () => {});
      test('=<<TODO>>= invalid options', async () => {});
    });

    describe('user-multi', function() {
      test('minimal', async () => {
        const result = await mountForm({
          fields: () => () => [
            {
              name: 'test',
              type: 'user-multi',
            },
          ],
        });
        // options is not passed right now
        // value should default to null
        expect(
          getByTestId(result.toJSON(), 'UserMultiFieldMock'),
        ).toMatchSnapshot();
        result.unmount();
      });

      test('=<<TODO>>= invalid value type', async () => {});
      test('=<<TODO>>= valid options', async () => {});
      test('=<<TODO>>= invalid options', async () => {});
    });
  });

  describe('visible', function() {
    test('given true', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            visible: true,
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('given false', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            visible: false,
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('given a string value', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            visible: 'false',
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('given a null value', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            visible: null,
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('given function that returns true', async () => {
      const visibleFn = jest.fn(bindings => true);
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            visible: visibleFn,
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      expect(visibleFn.mock.calls).toMatchSnapshot();
      result.unmount();
    });

    test('given function that returns false', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            visible: () => false,
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('given function that returns null', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text',
            visible: () => null,
          },
        ],
      });
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });
  });
});

describe('setValue', function() {
  test('triggerChange', async () => {
    const onChangeMock = jest.fn();
    const result = await mountForm({
      dataSources: () => ({
        test: {
          fn: () => 2,
          params: [],
        },
      }),
      fields: () => () => [
        { name: 'test', type: 'text', onChange: onChangeMock },
      ],
    });
    act(() => setValue(FORM_KEY, 'test', 'Hello World!'));
    // The Field should be dirty and the value should be updated.
    expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
    // onChange should be called with the current bindings
    // (values and dataSources).
    expect(onChangeMock.mock.calls).toMatchSnapshot();
    result.unmount();
  });

  test('triggerChange false', async () => {
    const onChangeMock = jest.fn();
    const result = await mountForm({
      fields: () => () => [
        { name: 'test', type: 'text', onChange: onChangeMock },
      ],
    });
    act(() => setValue(FORM_KEY, 'test', 'Hello World!', false));
    // The Field should be dirty and the value should be updated.
    expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
    // onChange should not have been called
    expect(onChangeMock.mock.calls.length).toBe(0);
    result.unmount();
  });

  describe('empty string values should use FIELD_DEFAULT_VALUES', () => {
    test('attributes', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'attributes',
            initialValue: { testkey: 'Hello World!' },
          },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', ''));
      expect(
        getPropsByTestId(result.toJSON(), 'AttributesFieldMock')?.value,
      ).toEqual(FIELD_DEFAULT_VALUES.get('attributes').toJS());
      expect(
        getImmutablePropTypesByTestId(result.toJSON(), 'AttributesFieldMock')
          ?.value,
      ).toEqual('Immutable.Map');
      expect(
        getByTestId(result.toJSON(), 'AttributesFieldMock'),
      ).toMatchSnapshot();
      result.unmount();
    });

    test('checkbox', async () => {
      const result = await mountForm({
        fields: () => () => [
          { name: 'test', type: 'checkbox', initialValue: true },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', ''));
      expect(
        getPropsByTestId(result.toJSON(), 'CheckboxFieldMock')?.value,
      ).toEqual(FIELD_DEFAULT_VALUES.get('checkbox'));
      expect(
        getByTestId(result.toJSON(), 'CheckboxFieldMock'),
      ).toMatchSnapshot();
      result.unmount();
    });

    test('code', async () => {
      const result = await mountForm({
        fields: () => () => [
          { name: 'test', type: 'code', initialValue: `<div>code test</div>` },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', ''));
      expect(getPropsByTestId(result.toJSON(), 'CodeFieldMock')?.value).toEqual(
        '',
      ); // no default
      expect(getByTestId(result.toJSON(), 'CodeFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('form', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'form',
            initialValue: { name: 'Test Form', slug: 'test-form' },
          },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', ''));
      expect(getPropsByTestId(result.toJSON(), 'FormFieldMock')?.value).toEqual(
        FIELD_DEFAULT_VALUES.get('form'),
      );
      expect(getByTestId(result.toJSON(), 'FormFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('form-multi', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'form-multi',
            initialValue: [
              { name: 'Test Form A', slug: 'test-form-a' },
              { name: 'Test Form B', slug: 'test-form-b' },
            ],
          },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', ''));
      expect(
        getPropsByTestId(result.toJSON(), 'FormMultiFieldMock')?.value,
      ).toEqual(FIELD_DEFAULT_VALUES.get('form-multi').toJS());
      expect(
        getImmutablePropTypesByTestId(result.toJSON(), 'FormMultiFieldMock')
          ?.value,
      ).toEqual('Immutable.List');
      expect(
        getByTestId(result.toJSON(), 'FormMultiFieldMock'),
      ).toMatchSnapshot();
      result.unmount();
    });

    test('password', async () => {
      const result = await mountForm({
        fields: () => () => [
          { name: 'test', type: 'password', initialValue: 'test-password' },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', ''));
      expect(
        getPropsByTestId(result.toJSON(), 'PasswordFieldMock')?.value,
      ).toEqual(''); // no default
      expect(
        getByTestId(result.toJSON(), 'PasswordFieldMock'),
      ).toMatchSnapshot();
      result.unmount();
    });

    test('radio', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'radio',
            initialValue: { label: 'radio test', value: 'radio-test' },
          },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', ''));
      expect(
        getPropsByTestId(result.toJSON(), 'RadioFieldMock')?.value,
      ).toEqual(''); // no default
      expect(getByTestId(result.toJSON(), 'RadioFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('select', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'select',
            initialValue: { value: 'Hello World!', label: 'Hello World!' },
          },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', ''));
      expect(
        getPropsByTestId(result.toJSON(), 'SelectFieldMock')?.value,
      ).toEqual(''); // no default
      expect(getByTestId(result.toJSON(), 'SelectFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('select-multi', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'select-multi',
            initialValue: [
              { value: 'Hello World A', label: 'Hello World A' },
              { value: 'Hello World B', label: 'Hello World B' },
            ],
          },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', ''));
      expect(
        getPropsByTestId(result.toJSON(), 'SelectMultiFieldMock')?.value,
      ).toEqual(FIELD_DEFAULT_VALUES.get('select-multi').toJS());
      expect(
        getImmutablePropTypesByTestId(result.toJSON(), 'SelectMultiFieldMock')
          ?.value,
      ).toEqual('Immutable.List');
      expect(
        getByTestId(result.toJSON(), 'SelectMultiFieldMock'),
      ).toMatchSnapshot();
      result.unmount();
    });

    test('team', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'team',
            initialValue: { name: 'Test Team', slug: 'test-team' },
          },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', ''));
      expect(getPropsByTestId(result.toJSON(), 'TeamFieldMock')?.value).toEqual(
        FIELD_DEFAULT_VALUES.get('team'),
      );
      expect(getByTestId(result.toJSON(), 'TeamFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('team-multi', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'team-multi',
            initialValue: [
              { name: 'Test Team A', slug: 'test-team-a' },
              { name: 'Test Team B', slug: 'test-team-b' },
            ],
          },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', ''));
      expect(
        getPropsByTestId(result.toJSON(), 'TeamMultiFieldMock')?.value,
      ).toEqual(FIELD_DEFAULT_VALUES.get('team-multi').toJS());
      expect(
        getImmutablePropTypesByTestId(result.toJSON(), 'TeamMultiFieldMock')
          ?.value,
      ).toEqual('Immutable.List');
      expect(
        getByTestId(result.toJSON(), 'TeamMultiFieldMock'),
      ).toMatchSnapshot();
      result.unmount();
    });

    test('text', async () => {
      const result = await mountForm({
        fields: () => () => [
          { name: 'test', type: 'text', initialValue: 'Hello World!' },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', ''));
      expect(getPropsByTestId(result.toJSON(), 'TextFieldMock')?.value).toEqual(
        '',
      ); // no default
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('text-multi', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text-multi',
            initialValue: ['Hello World A', 'Hello World B'],
          },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', ''));
      expect(
        getPropsByTestId(result.toJSON(), 'TextMultiFieldMock')?.value,
      ).toEqual(FIELD_DEFAULT_VALUES.get('text-multi').toJS());
      expect(
        getImmutablePropTypesByTestId(result.toJSON(), 'TextMultiFieldMock')
          ?.value,
      ).toEqual('Immutable.List');
      expect(
        getByTestId(result.toJSON(), 'TextMultiFieldMock'),
      ).toMatchSnapshot();
      result.unmount();
    });

    test('user', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'user',
            initialValue: { username: 'test-user' },
          },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', ''));
      expect(getPropsByTestId(result.toJSON(), 'UserFieldMock')?.value).toEqual(
        FIELD_DEFAULT_VALUES.get('user'),
      );
      expect(getByTestId(result.toJSON(), 'UserFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('user-multi', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'user-multi',
            initialValue: [
              { username: 'test-user-a' },
              { username: 'test-user-b' },
            ],
          },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', ''));
      expect(
        getPropsByTestId(result.toJSON(), 'UserMultiFieldMock')?.value,
      ).toEqual(FIELD_DEFAULT_VALUES.get('user-multi').toJS());
      expect(
        getImmutablePropTypesByTestId(result.toJSON(), 'UserMultiFieldMock')
          ?.value,
      ).toEqual('Immutable.List');
      expect(
        getByTestId(result.toJSON(), 'UserMultiFieldMock'),
      ).toMatchSnapshot();
      result.unmount();
    });
  });

  describe('null values should use FIELD_DEFAULT_VALUES', () => {
    test('attributes', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'attributes',
            initialValue: { testkey: 'Hello World!' },
          },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', null));
      expect(
        getPropsByTestId(result.toJSON(), 'AttributesFieldMock')?.value,
      ).toEqual(FIELD_DEFAULT_VALUES.get('attributes').toJS());
      expect(
        getImmutablePropTypesByTestId(result.toJSON(), 'AttributesFieldMock')
          ?.value,
      ).toEqual('Immutable.Map');
      expect(
        getByTestId(result.toJSON(), 'AttributesFieldMock'),
      ).toMatchSnapshot();
      result.unmount();
    });

    test('checkbox', async () => {
      const result = await mountForm({
        fields: () => () => [
          { name: 'test', type: 'checkbox', initialValue: true },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', null));
      expect(
        getPropsByTestId(result.toJSON(), 'CheckboxFieldMock')?.value,
      ).toEqual(FIELD_DEFAULT_VALUES.get('checkbox'));
      expect(
        getByTestId(result.toJSON(), 'CheckboxFieldMock'),
      ).toMatchSnapshot();
      result.unmount();
    });

    test('code', async () => {
      const result = await mountForm({
        fields: () => () => [
          { name: 'test', type: 'code', initialValue: `<div>code test</div>` },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', null));
      expect(getPropsByTestId(result.toJSON(), 'CodeFieldMock')?.value).toEqual(
        '',
      ); // no default
      expect(getByTestId(result.toJSON(), 'CodeFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('form', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'form',
            initialValue: { name: 'Test Form', slug: 'test-form' },
          },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', null));
      expect(getPropsByTestId(result.toJSON(), 'FormFieldMock')?.value).toEqual(
        FIELD_DEFAULT_VALUES.get('form'),
      );
      expect(getByTestId(result.toJSON(), 'FormFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('form-multi', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'form-multi',
            initialValue: [
              { name: 'Test Form A', slug: 'test-form-a' },
              { name: 'Test Form B', slug: 'test-form-b' },
            ],
          },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', null));
      expect(
        getPropsByTestId(result.toJSON(), 'FormMultiFieldMock')?.value,
      ).toEqual(FIELD_DEFAULT_VALUES.get('form-multi').toJS());
      expect(
        getImmutablePropTypesByTestId(result.toJSON(), 'FormMultiFieldMock')
          ?.value,
      ).toEqual('Immutable.List');
      expect(
        getByTestId(result.toJSON(), 'FormMultiFieldMock'),
      ).toMatchSnapshot();
      result.unmount();
    });

    test('password', async () => {
      const result = await mountForm({
        fields: () => () => [
          { name: 'test', type: 'password', initialValue: 'test-password' },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', null));
      expect(
        getPropsByTestId(result.toJSON(), 'PasswordFieldMock')?.value,
      ).toEqual(''); // no default
      expect(
        getByTestId(result.toJSON(), 'PasswordFieldMock'),
      ).toMatchSnapshot();
      result.unmount();
    });

    test('radio', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'radio',
            initialValue: { label: 'radio test', value: 'radio-test' },
          },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', null));
      expect(
        getPropsByTestId(result.toJSON(), 'RadioFieldMock')?.value,
      ).toEqual(''); // no default
      expect(getByTestId(result.toJSON(), 'RadioFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('select', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'select',
            initialValue: { value: 'Hello World!', label: 'Hello World!' },
          },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', null));
      expect(
        getPropsByTestId(result.toJSON(), 'SelectFieldMock')?.value,
      ).toEqual(''); // no default
      expect(getByTestId(result.toJSON(), 'SelectFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('select-multi', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'select-multi',
            initialValue: [
              { value: 'Hello World A', label: 'Hello World A' },
              { value: 'Hello World B', label: 'Hello World B' },
            ],
          },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', null));
      expect(
        getPropsByTestId(result.toJSON(), 'SelectMultiFieldMock')?.value,
      ).toEqual(FIELD_DEFAULT_VALUES.get('select-multi').toJS());
      expect(
        getImmutablePropTypesByTestId(result.toJSON(), 'SelectMultiFieldMock')
          ?.value,
      ).toEqual('Immutable.List');
      expect(
        getByTestId(result.toJSON(), 'SelectMultiFieldMock'),
      ).toMatchSnapshot();
      result.unmount();
    });

    test('team', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'team',
            initialValue: { name: 'Test Team', slug: 'test-team' },
          },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', null));
      expect(getPropsByTestId(result.toJSON(), 'TeamFieldMock')?.value).toEqual(
        FIELD_DEFAULT_VALUES.get('team'),
      );
      expect(getByTestId(result.toJSON(), 'TeamFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('team-multi', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'team-multi',
            initialValue: [
              { name: 'Test Team A', slug: 'test-team-a' },
              { name: 'Test Team B', slug: 'test-team-b' },
            ],
          },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', null));
      expect(
        getPropsByTestId(result.toJSON(), 'TeamMultiFieldMock')?.value,
      ).toEqual(FIELD_DEFAULT_VALUES.get('team-multi').toJS());
      expect(
        getImmutablePropTypesByTestId(result.toJSON(), 'TeamMultiFieldMock')
          ?.value,
      ).toEqual('Immutable.List');
      expect(
        getByTestId(result.toJSON(), 'TeamMultiFieldMock'),
      ).toMatchSnapshot();
      result.unmount();
    });

    test('text', async () => {
      const result = await mountForm({
        fields: () => () => [
          { name: 'test', type: 'text', initialValue: 'Hello World!' },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', null));
      expect(getPropsByTestId(result.toJSON(), 'TextFieldMock')?.value).toEqual(
        '',
      ); // no default
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('text-multi', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text-multi',
            initialValue: ['Hello World A', 'Hello World B'],
          },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', null));
      expect(
        getPropsByTestId(result.toJSON(), 'TextMultiFieldMock')?.value,
      ).toEqual(FIELD_DEFAULT_VALUES.get('text-multi').toJS());
      expect(
        getImmutablePropTypesByTestId(result.toJSON(), 'TextMultiFieldMock')
          ?.value,
      ).toEqual('Immutable.List');
      expect(
        getByTestId(result.toJSON(), 'TextMultiFieldMock'),
      ).toMatchSnapshot();
      result.unmount();
    });

    test('user', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'user',
            initialValue: { username: 'test-user' },
          },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', null));
      expect(getPropsByTestId(result.toJSON(), 'UserFieldMock')?.value).toEqual(
        FIELD_DEFAULT_VALUES.get('user'),
      );
      expect(getByTestId(result.toJSON(), 'UserFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('user-multi', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'user-multi',
            initialValue: [
              { username: 'test-user-a' },
              { username: 'test-user-b' },
            ],
          },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', null));
      expect(
        getPropsByTestId(result.toJSON(), 'UserMultiFieldMock')?.value,
      ).toEqual(FIELD_DEFAULT_VALUES.get('user-multi').toJS());
      expect(
        getImmutablePropTypesByTestId(result.toJSON(), 'UserMultiFieldMock')
          ?.value,
      ).toEqual('Immutable.List');
      expect(
        getByTestId(result.toJSON(), 'UserMultiFieldMock'),
      ).toMatchSnapshot();
      result.unmount();
    });
  });

  describe('undefined values should use FIELD_DEFAULT_VALUES', () => {
    test('attributes', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'attributes',
            initialValue: { testkey: 'Hello World!' },
          },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', undefined));
      expect(
        getPropsByTestId(result.toJSON(), 'AttributesFieldMock')?.value,
      ).toEqual(FIELD_DEFAULT_VALUES.get('attributes').toJS());
      expect(
        getImmutablePropTypesByTestId(result.toJSON(), 'AttributesFieldMock')
          ?.value,
      ).toEqual('Immutable.Map');
      expect(
        getByTestId(result.toJSON(), 'AttributesFieldMock'),
      ).toMatchSnapshot();
      result.unmount();
    });

    test('checkbox', async () => {
      const result = await mountForm({
        fields: () => () => [
          { name: 'test', type: 'checkbox', initialValue: true },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', undefined));
      expect(
        getPropsByTestId(result.toJSON(), 'CheckboxFieldMock')?.value,
      ).toEqual(FIELD_DEFAULT_VALUES.get('checkbox'));
      expect(
        getByTestId(result.toJSON(), 'CheckboxFieldMock'),
      ).toMatchSnapshot();
      result.unmount();
    });

    test('code', async () => {
      const result = await mountForm({
        fields: () => () => [
          { name: 'test', type: 'code', initialValue: `<div>code test</div>` },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', undefined));
      expect(getPropsByTestId(result.toJSON(), 'CodeFieldMock')?.value).toEqual(
        '',
      ); // no default
      expect(getByTestId(result.toJSON(), 'CodeFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('form', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'form',
            initialValue: { name: 'Test Form', slug: 'test-form' },
          },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', undefined));
      expect(getPropsByTestId(result.toJSON(), 'FormFieldMock')?.value).toEqual(
        FIELD_DEFAULT_VALUES.get('form'),
      );
      expect(getByTestId(result.toJSON(), 'FormFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('form-multi', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'form-multi',
            initialValue: [
              { name: 'Test Form A', slug: 'test-form-a' },
              { name: 'Test Form B', slug: 'test-form-b' },
            ],
          },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', undefined));
      expect(
        getPropsByTestId(result.toJSON(), 'FormMultiFieldMock')?.value,
      ).toEqual(FIELD_DEFAULT_VALUES.get('form-multi').toJS());
      expect(
        getImmutablePropTypesByTestId(result.toJSON(), 'FormMultiFieldMock')
          ?.value,
      ).toEqual('Immutable.List');
      expect(
        getByTestId(result.toJSON(), 'FormMultiFieldMock'),
      ).toMatchSnapshot();
      result.unmount();
    });

    test('password', async () => {
      const result = await mountForm({
        fields: () => () => [
          { name: 'test', type: 'password', initialValue: 'test-password' },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', undefined));
      expect(
        getPropsByTestId(result.toJSON(), 'PasswordFieldMock')?.value,
      ).toEqual(''); // no default
      expect(
        getByTestId(result.toJSON(), 'PasswordFieldMock'),
      ).toMatchSnapshot();
      result.unmount();
    });

    test('radio', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'radio',
            initialValue: { label: 'radio test', value: 'radio-test' },
          },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', undefined));
      expect(
        getPropsByTestId(result.toJSON(), 'RadioFieldMock')?.value,
      ).toEqual(''); // no default
      expect(getByTestId(result.toJSON(), 'RadioFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('select', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'select',
            initialValue: { value: 'Hello World!', label: 'Hello World!' },
          },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', undefined));
      expect(
        getPropsByTestId(result.toJSON(), 'SelectFieldMock')?.value,
      ).toEqual(''); // no default
      expect(getByTestId(result.toJSON(), 'SelectFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('select-multi', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'select-multi',
            initialValue: [
              { value: 'Hello World A', label: 'Hello World A' },
              { value: 'Hello World B', label: 'Hello World B' },
            ],
          },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', undefined));
      expect(
        getPropsByTestId(result.toJSON(), 'SelectMultiFieldMock')?.value,
      ).toEqual(FIELD_DEFAULT_VALUES.get('select-multi').toJS());
      expect(
        getImmutablePropTypesByTestId(result.toJSON(), 'SelectMultiFieldMock')
          ?.value,
      ).toEqual('Immutable.List');
      expect(
        getByTestId(result.toJSON(), 'SelectMultiFieldMock'),
      ).toMatchSnapshot();
      result.unmount();
    });

    test('team', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'team',
            initialValue: { name: 'Test Team', slug: 'test-team' },
          },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', undefined));
      expect(getPropsByTestId(result.toJSON(), 'TeamFieldMock')?.value).toEqual(
        FIELD_DEFAULT_VALUES.get('team'),
      );
      expect(getByTestId(result.toJSON(), 'TeamFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('team-multi', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'team-multi',
            initialValue: [
              { name: 'Test Team A', slug: 'test-team-a' },
              { name: 'Test Team B', slug: 'test-team-b' },
            ],
          },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', undefined));
      expect(
        getPropsByTestId(result.toJSON(), 'TeamMultiFieldMock')?.value,
      ).toEqual(FIELD_DEFAULT_VALUES.get('team-multi').toJS());
      expect(
        getImmutablePropTypesByTestId(result.toJSON(), 'TeamMultiFieldMock')
          ?.value,
      ).toEqual('Immutable.List');
      expect(
        getByTestId(result.toJSON(), 'TeamMultiFieldMock'),
      ).toMatchSnapshot();
      result.unmount();
    });

    test('text', async () => {
      const result = await mountForm({
        fields: () => () => [
          { name: 'test', type: 'text', initialValue: 'Hello World!' },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', undefined));
      expect(getPropsByTestId(result.toJSON(), 'TextFieldMock')?.value).toEqual(
        '',
      ); // no default
      expect(getByTestId(result.toJSON(), 'TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('text-multi', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'text-multi',
            initialValue: ['Hello World A', 'Hello World B'],
          },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', undefined));
      expect(
        getPropsByTestId(result.toJSON(), 'TextMultiFieldMock')?.value,
      ).toEqual(FIELD_DEFAULT_VALUES.get('text-multi').toJS());
      expect(
        getImmutablePropTypesByTestId(result.toJSON(), 'TextMultiFieldMock')
          ?.value,
      ).toEqual('Immutable.List');
      expect(
        getByTestId(result.toJSON(), 'TextMultiFieldMock'),
      ).toMatchSnapshot();
      result.unmount();
    });

    test('user', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'user',
            initialValue: { username: 'test-user' },
          },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', undefined));
      expect(getPropsByTestId(result.toJSON(), 'UserFieldMock')?.value).toEqual(
        FIELD_DEFAULT_VALUES.get('user'),
      );
      expect(getByTestId(result.toJSON(), 'UserFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('user-multi', async () => {
      const result = await mountForm({
        fields: () => () => [
          {
            name: 'test',
            type: 'user-multi',
            initialValue: [
              { username: 'test-user-a' },
              { username: 'test-user-b' },
            ],
          },
        ],
      });
      act(() => setValue(FORM_KEY, 'test', undefined));
      expect(
        getPropsByTestId(result.toJSON(), 'UserMultiFieldMock')?.value,
      ).toEqual(FIELD_DEFAULT_VALUES.get('user-multi').toJS());
      expect(
        getImmutablePropTypesByTestId(result.toJSON(), 'UserMultiFieldMock')
          ?.value,
      ).toEqual('Immutable.List');
      expect(
        getByTestId(result.toJSON(), 'UserMultiFieldMock'),
      ).toMatchSnapshot();
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

    act(() => submitForm(FORM_KEY, {}));

    // FormButtons submitting prop should be set to true
    expect(getByTestId(result.toJSON(), 'FormLayout')).toMatchSnapshot();

    await act(async () => {
      await submitFn();
    });

    // FormButtons submitting prop should be false
    expect(getByTestId(result.toJSON(), 'FormLayout')).toMatchSnapshot();

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
    act(() => submitForm('test', {}));
    await act(async () => {
      await submitFn().catch(e => e);
    });
    expect(getByTestId(result.toJSON(), 'FormLayout')).toMatchSnapshot();
    result.unmount();
  });

  test('submit unexpected error, we expect the promise to reject with a string', async () => {
    const submitFn = jest.fn(() => Promise.reject({}));
    const handleSubmit = jest.fn(() => submitFn);
    const result = await mountForm({ handleSubmit });
    act(() => submitForm('test', {}));
    await act(async () => {
      await submitFn().catch(e => e);
    });
    expect(getByTestId(result.toJSON(), 'FormLayout')).toMatchSnapshot();
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
    act(() => submitForm('test', {}));
    await act(async () => {
      await submitFn().catch(e => e);
    });
    expect(onError.mock.calls).toMatchSnapshot();
    expect(errorFn.mock.calls).toMatchSnapshot();
    result.unmount();
  });
});

describe('submitForm', () => {
  test('with fieldset and values', async () => {
    const onSubmit = jest.fn(bindings => 'success');
    const handleSubmit = jest.fn(() => onSubmit);
    const result = await mountForm({
      fields: () => () => [
        { name: 'firstName', type: 'text', initialValue: 'Shayne' },
        { name: 'lastName', type: 'text', initialValue: 'Koestler' },
        { name: 'email', type: 'text' },
      ],
      formOptions: { testOption: 'Foo' },
      handleSubmit,
    });
    act(() =>
      submitForm(FORM_KEY, {
        fieldSet: ['firstName', 'lastName'],
        values: {
          firstName: 'Matt',
          lastName: null,
        },
      }),
    );
    expect(onSubmit.mock.calls).toMatchSnapshot();
    expect(
      getPropsByTestId(result.toJSON(), 'FormLayout')?.bindings,
    ).toMatchSnapshot();
    result.unmount();
  });
});
