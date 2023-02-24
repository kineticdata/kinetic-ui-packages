import React from 'react';
import { Map, fromJS } from 'immutable';
import { mount } from 'enzyme';
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
  // Wrap the enyzme mount call with a promise that will be resolved when the
  // form is initialized (most of the test cases need to wait for this).
  return new Promise(resolve => {
    const result = mount(
      <KineticLib components={{ fields: mockFieldConfig }}>
        <Form formKey={FORM_KEY} uncontrolled {...formProps} {...formOptions} />
      </KineticLib>,
    );
    const ready = () => !!store.getState().getIn(['forms', FORM_KEY, 'fields']);
    if (ready()) {
      result.update();
      resolve(result);
    } else {
      const unsub = store.subscribe(() => {
        if (ready()) {
          result.update();
          resolve(result);
          // Remove the store listener since we're done.
          unsub();
        }
      });
    }
  });
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
    expect(result.find('FormLayout')).toMatchSnapshot();
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
    setValue(FORM_KEY, 'mainField', 'n/a');
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
        { initialValue: true, name: 'enabled', type: 'checkbox' },
      ],
    });
    // Update the component because we want to test the bindings prop passed to
    // FormLayout.
    result.update();
    expect(dataFn.mock.calls.length).toBe(1);
    expect(result.find('FormLayout').prop('bindings').data).toEqual(
      Map({ arg: 'Test' }),
    );
    // Uncheck enabled which should cause paramFn to return false, which should
    // result in clearing the datasource.
    setValue(FORM_KEY, 'enabled', false);
    // Update the component because we want to test the bindings prop passed to
    // FormLayout.
    result.update();
    expect(dataFn.mock.calls.length).toBe(1);
    expect(result.find('FormLayout').prop('bindings').data).toBe(null);
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
        expect(result.find('AttributesFieldMock').prop('value')).toEqual(
          fromJS(initial),
        );
        expect(result.find('AttributesFieldMock')).toMatchSnapshot();
        result.unmount();
      });

      test('checkbox', async () => {
        const initial = true;
        const result = await mountForm({
          fields: () => () => [
            { name: 'test', type: 'checkbox', initialValue: initial },
          ],
        });
        expect(result.find('CheckboxFieldMock').prop('value')).toEqual(
          fromJS(initial),
        );
        expect(result.find('CheckboxFieldMock')).toMatchSnapshot();
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
        expect(result.find('CodeFieldMock').prop('value')).toEqual(
          fromJS(initial),
        );
        expect(result.find('CodeFieldMock')).toMatchSnapshot();
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
        expect(result.find('FormFieldMock').prop('value')).toEqual(
          fromJS(initial),
        );
        expect(result.find('FormFieldMock')).toMatchSnapshot();
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
        expect(result.find('FormMultiFieldMock').prop('value')).toEqual(
          fromJS(initial),
        );
        expect(result.find('FormMultiFieldMock')).toMatchSnapshot();
        result.unmount();
      });

      test('password', async () => {
        const initial = 'test-password';
        const result = await mountForm({
          fields: () => () => [
            { name: 'test', type: 'password', initialValue: initial },
          ],
        });
        expect(result.find('PasswordFieldMock').prop('value')).toEqual(
          fromJS(initial),
        );
        expect(result.find('PasswordFieldMock')).toMatchSnapshot();
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
        expect(result.find('RadioFieldMock').prop('value')).toEqual(
          fromJS(initial),
        );
        expect(result.find('RadioFieldMock')).toMatchSnapshot();
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
        expect(result.find('SelectFieldMock').prop('value')).toEqual(
          fromJS(initial),
        );
        expect(result.find('SelectFieldMock')).toMatchSnapshot();
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
        expect(result.find('SelectMultiFieldMock').prop('value')).toEqual(
          fromJS(initial),
        );
        expect(result.find('SelectMultiFieldMock')).toMatchSnapshot();
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
        // value should be immutable version of initialValue passed in
        expect(result.find('TeamFieldMock').prop('value')).toEqual(
          fromJS(initial),
        );
        expect(result.find('TeamFieldMock')).toMatchSnapshot();
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
        // value should be immutable version of initialValue passed in
        expect(result.find('TeamMultiFieldMock').prop('value')).toEqual(
          fromJS(initial),
        );
        expect(result.find('TeamMultiFieldMock')).toMatchSnapshot();
        result.unmount();
      });

      test('text', async () => {
        const initial = 'Hello World!';
        const result = await mountForm({
          fields: () => () => [
            { name: 'test', type: 'text', initialValue: initial },
          ],
        });
        expect(result.find('TextFieldMock').prop('value')).toEqual(
          fromJS(initial),
        );
        expect(result.find('TextFieldMock')).toMatchSnapshot();
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
        expect(result.find('TextMultiFieldMock').prop('value')).toEqual(
          fromJS(initial),
        );
        expect(result.find('TextMultiFieldMock')).toMatchSnapshot();
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
        expect(result.find('UserFieldMock').prop('value')).toEqual(
          fromJS(initial),
        );
        expect(result.find('UserFieldMock')).toMatchSnapshot();
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
        expect(result.find('UserMultiFieldMock').prop('value')).toEqual(
          fromJS(initial),
        );
        expect(result.find('UserMultiFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
      result.unmount();
    });
    // test('given null', async () => {
    //   const result = await mountForm({
    //     fields: () => () => [
    //       {
    //         name: 'test',
    //         type: 'text',
    //         initialValue: '314159',
    //         pattern: null,
    //       },
    //     ],
    //   });
    //   expect(result.find('TextFieldMock')).toMatchSnapshot();
    //   result.unmount();
    // });
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
      expect(requiredFn.mock.calls).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
        expect(result.find('AttributesFieldMock')).toMatchSnapshot();
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
        expect(result.find('CheckboxFieldMock')).toMatchSnapshot();
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
        expect(result.find('CodeFieldMock')).toMatchSnapshot();
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
      //   expect(result.find('FormFieldMock')).toMatchSnapshot();
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
      //   expect(result.find('FormMultiFieldMock')).toMatchSnapshot();
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
        expect(result.find('PasswordFieldMock')).toMatchSnapshot();
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
        expect(result.find('RadioFieldMock')).toMatchSnapshot();
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
        expect(result.find('SelectFieldMock')).toMatchSnapshot();
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
        expect(result.find('SelectMultiFieldMock')).toMatchSnapshot();
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
        expect(result.find('TeamFieldMock')).toMatchSnapshot();
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
        expect(result.find('TeamMultiFieldMock')).toMatchSnapshot();
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
        expect(result.find('TextFieldMock')).toMatchSnapshot();
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
        expect(result.find('TextMultiFieldMock')).toMatchSnapshot();
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
        expect(result.find('UserFieldMock')).toMatchSnapshot();
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
        expect(result.find('UserMultiFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
    setValue(FORM_KEY, 'test', 'Hello World!');
    result.update();
    // The Field should be dirty and the value should be updated.
    expect(result.find('TextFieldMock')).toMatchSnapshot();
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
    setValue(FORM_KEY, 'test', 'Hello World!', false);
    result.update();
    // The Field should be dirty and the value should be updated.
    expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      setValue(FORM_KEY, 'test', '');
      result.update();
      expect(result.find('AttributesFieldMock').prop('value')).toBe(
        FIELD_DEFAULT_VALUES.get('attributes'),
      );
      expect(result.find('AttributesFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('checkbox', async () => {
      const result = await mountForm({
        fields: () => () => [
          { name: 'test', type: 'checkbox', initialValue: true },
        ],
      });
      setValue(FORM_KEY, 'test', '');
      result.update();
      expect(result.find('CheckboxFieldMock').prop('value')).toBe(
        FIELD_DEFAULT_VALUES.get('checkbox'),
      );
      expect(result.find('CheckboxFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('code', async () => {
      const result = await mountForm({
        fields: () => () => [
          { name: 'test', type: 'code', initialValue: `<div>code test</div>` },
        ],
      });
      setValue(FORM_KEY, 'test', '');
      result.update();
      expect(result.find('CodeFieldMock').prop('value')).toBe(''); // no default
      expect(result.find('CodeFieldMock')).toMatchSnapshot();
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
      setValue(FORM_KEY, 'test', '');
      result.update();
      expect(result.find('FormFieldMock').prop('value')).toBe(
        FIELD_DEFAULT_VALUES.get('form'),
      );
      expect(result.find('FormFieldMock')).toMatchSnapshot();
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
      setValue(FORM_KEY, 'test', '');
      result.update();
      expect(result.find('FormMultiFieldMock').prop('value')).toBe(
        FIELD_DEFAULT_VALUES.get('form-multi'),
      );
      expect(result.find('FormMultiFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('password', async () => {
      const result = await mountForm({
        fields: () => () => [
          { name: 'test', type: 'password', initialValue: 'test-password' },
        ],
      });
      setValue(FORM_KEY, 'test', '');
      result.update();
      expect(result.find('PasswordFieldMock').prop('value')).toBe(''); // no default
      expect(result.find('PasswordFieldMock')).toMatchSnapshot();
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
      setValue(FORM_KEY, 'test', '');
      result.update();
      expect(result.find('RadioFieldMock').prop('value')).toBe(''); // no default
      expect(result.find('RadioFieldMock')).toMatchSnapshot();
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
      setValue(FORM_KEY, 'test', '');
      result.update();
      expect(result.find('SelectFieldMock').prop('value')).toBe(''); // no default
      expect(result.find('SelectFieldMock')).toMatchSnapshot();
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
      setValue(FORM_KEY, 'test', '');
      result.update();
      expect(result.find('SelectMultiFieldMock').prop('value')).toBe(
        FIELD_DEFAULT_VALUES.get('select-multi'),
      );
      expect(result.find('SelectMultiFieldMock')).toMatchSnapshot();
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
      setValue(FORM_KEY, 'test', '');
      result.update();
      expect(result.find('TeamFieldMock').prop('value')).toBe(
        FIELD_DEFAULT_VALUES.get('team'),
      );
      expect(result.find('TeamFieldMock')).toMatchSnapshot();
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
      setValue(FORM_KEY, 'test', '');
      result.update();
      expect(result.find('TeamMultiFieldMock').prop('value')).toBe(
        FIELD_DEFAULT_VALUES.get('team-multi'),
      );
      expect(result.find('TeamMultiFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('text', async () => {
      const result = await mountForm({
        fields: () => () => [
          { name: 'test', type: 'text', initialValue: 'Hello World!' },
        ],
      });
      setValue(FORM_KEY, 'test', '');
      result.update();
      expect(result.find('TextFieldMock').prop('value')).toBe(''); // no default
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      setValue(FORM_KEY, 'test', '');
      result.update();
      expect(result.find('TextMultiFieldMock').prop('value')).toBe(
        FIELD_DEFAULT_VALUES.get('text-multi'),
      );
      expect(result.find('TextMultiFieldMock')).toMatchSnapshot();
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
      setValue(FORM_KEY, 'test', '');
      result.update();
      expect(result.find('UserFieldMock').prop('value')).toBe(
        FIELD_DEFAULT_VALUES.get('user'),
      );
      expect(result.find('UserFieldMock')).toMatchSnapshot();
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
      setValue(FORM_KEY, 'test', '');
      result.update();
      expect(result.find('UserMultiFieldMock').prop('value')).toBe(
        FIELD_DEFAULT_VALUES.get('user-multi'),
      );
      expect(result.find('UserMultiFieldMock')).toMatchSnapshot();
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
      setValue(FORM_KEY, 'test', null);
      result.update();
      expect(result.find('AttributesFieldMock').prop('value')).toBe(
        FIELD_DEFAULT_VALUES.get('attributes'),
      );
      expect(result.find('AttributesFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('checkbox', async () => {
      const result = await mountForm({
        fields: () => () => [
          { name: 'test', type: 'checkbox', initialValue: true },
        ],
      });
      setValue(FORM_KEY, 'test', null);
      result.update();
      expect(result.find('CheckboxFieldMock').prop('value')).toBe(
        FIELD_DEFAULT_VALUES.get('checkbox'),
      );
      expect(result.find('CheckboxFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('code', async () => {
      const result = await mountForm({
        fields: () => () => [
          { name: 'test', type: 'code', initialValue: `<div>code test</div>` },
        ],
      });
      setValue(FORM_KEY, 'test', null);
      result.update();
      expect(result.find('CodeFieldMock').prop('value')).toBe(''); // no default
      expect(result.find('CodeFieldMock')).toMatchSnapshot();
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
      setValue(FORM_KEY, 'test', null);
      result.update();
      expect(result.find('FormFieldMock').prop('value')).toBe(
        FIELD_DEFAULT_VALUES.get('form'),
      );
      expect(result.find('FormFieldMock')).toMatchSnapshot();
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
      setValue(FORM_KEY, 'test', null);
      result.update();
      expect(result.find('FormMultiFieldMock').prop('value')).toBe(
        FIELD_DEFAULT_VALUES.get('form-multi'),
      );
      expect(result.find('FormMultiFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('password', async () => {
      const result = await mountForm({
        fields: () => () => [
          { name: 'test', type: 'password', initialValue: 'test-password' },
        ],
      });
      setValue(FORM_KEY, 'test', null);
      result.update();
      expect(result.find('PasswordFieldMock').prop('value')).toBe(''); // no default
      expect(result.find('PasswordFieldMock')).toMatchSnapshot();
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
      setValue(FORM_KEY, 'test', null);
      result.update();
      expect(result.find('RadioFieldMock').prop('value')).toBe(''); // no default
      expect(result.find('RadioFieldMock')).toMatchSnapshot();
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
      setValue(FORM_KEY, 'test', null);
      result.update();
      expect(result.find('SelectFieldMock').prop('value')).toBe(''); // no default
      expect(result.find('SelectFieldMock')).toMatchSnapshot();
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
      setValue(FORM_KEY, 'test', null);
      result.update();
      expect(result.find('SelectMultiFieldMock').prop('value')).toBe(
        FIELD_DEFAULT_VALUES.get('select-multi'),
      );
      expect(result.find('SelectMultiFieldMock')).toMatchSnapshot();
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
      setValue(FORM_KEY, 'test', null);
      result.update();
      expect(result.find('TeamFieldMock').prop('value')).toBe(
        FIELD_DEFAULT_VALUES.get('team'),
      );
      expect(result.find('TeamFieldMock')).toMatchSnapshot();
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
      setValue(FORM_KEY, 'test', null);
      result.update();
      expect(result.find('TeamMultiFieldMock').prop('value')).toBe(
        FIELD_DEFAULT_VALUES.get('team-multi'),
      );
      expect(result.find('TeamMultiFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('text', async () => {
      const result = await mountForm({
        fields: () => () => [
          { name: 'test', type: 'text', initialValue: 'Hello World!' },
        ],
      });
      setValue(FORM_KEY, 'test', null);
      result.update();
      expect(result.find('TextFieldMock').prop('value')).toBe(''); // no default
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      setValue(FORM_KEY, 'test', null);
      result.update();
      expect(result.find('TextMultiFieldMock').prop('value')).toBe(
        FIELD_DEFAULT_VALUES.get('text-multi'),
      );
      expect(result.find('TextMultiFieldMock')).toMatchSnapshot();
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
      setValue(FORM_KEY, 'test', null);
      result.update();
      expect(result.find('UserFieldMock').prop('value')).toBe(
        FIELD_DEFAULT_VALUES.get('user'),
      );
      expect(result.find('UserFieldMock')).toMatchSnapshot();
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
      setValue(FORM_KEY, 'test', null);
      result.update();
      expect(result.find('UserMultiFieldMock').prop('value')).toBe(
        FIELD_DEFAULT_VALUES.get('user-multi'),
      );
      expect(result.find('UserMultiFieldMock')).toMatchSnapshot();
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
      setValue(FORM_KEY, 'test', undefined);
      result.update();
      expect(result.find('AttributesFieldMock').prop('value')).toBe(
        FIELD_DEFAULT_VALUES.get('attributes'),
      );
      expect(result.find('AttributesFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('checkbox', async () => {
      const result = await mountForm({
        fields: () => () => [
          { name: 'test', type: 'checkbox', initialValue: true },
        ],
      });
      setValue(FORM_KEY, 'test', undefined);
      result.update();
      expect(result.find('CheckboxFieldMock').prop('value')).toBe(
        FIELD_DEFAULT_VALUES.get('checkbox'),
      );
      expect(result.find('CheckboxFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('code', async () => {
      const result = await mountForm({
        fields: () => () => [
          { name: 'test', type: 'code', initialValue: `<div>code test</div>` },
        ],
      });
      setValue(FORM_KEY, 'test', undefined);
      result.update();
      expect(result.find('CodeFieldMock').prop('value')).toBe(''); // no default
      expect(result.find('CodeFieldMock')).toMatchSnapshot();
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
      setValue(FORM_KEY, 'test', undefined);
      result.update();
      expect(result.find('FormFieldMock').prop('value')).toBe(
        FIELD_DEFAULT_VALUES.get('form'),
      );
      expect(result.find('FormFieldMock')).toMatchSnapshot();
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
      setValue(FORM_KEY, 'test', undefined);
      result.update();
      expect(result.find('FormMultiFieldMock').prop('value')).toBe(
        FIELD_DEFAULT_VALUES.get('form-multi'),
      );
      expect(result.find('FormMultiFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('password', async () => {
      const result = await mountForm({
        fields: () => () => [
          { name: 'test', type: 'password', initialValue: 'test-password' },
        ],
      });
      setValue(FORM_KEY, 'test', undefined);
      result.update();
      expect(result.find('PasswordFieldMock').prop('value')).toBe(''); // no default
      expect(result.find('PasswordFieldMock')).toMatchSnapshot();
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
      setValue(FORM_KEY, 'test', undefined);
      result.update();
      expect(result.find('RadioFieldMock').prop('value')).toBe(''); // no default
      expect(result.find('RadioFieldMock')).toMatchSnapshot();
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
      setValue(FORM_KEY, 'test', undefined);
      result.update();
      expect(result.find('SelectFieldMock').prop('value')).toBe(''); // no default
      expect(result.find('SelectFieldMock')).toMatchSnapshot();
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
      setValue(FORM_KEY, 'test', undefined);
      result.update();
      expect(result.find('SelectMultiFieldMock').prop('value')).toBe(
        FIELD_DEFAULT_VALUES.get('select-multi'),
      );
      expect(result.find('SelectMultiFieldMock')).toMatchSnapshot();
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
      setValue(FORM_KEY, 'test', undefined);
      result.update();
      expect(result.find('TeamFieldMock').prop('value')).toBe(
        FIELD_DEFAULT_VALUES.get('team'),
      );
      expect(result.find('TeamFieldMock')).toMatchSnapshot();
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
      setValue(FORM_KEY, 'test', undefined);
      result.update();
      expect(result.find('TeamMultiFieldMock').prop('value')).toBe(
        FIELD_DEFAULT_VALUES.get('team-multi'),
      );
      expect(result.find('TeamMultiFieldMock')).toMatchSnapshot();
      result.unmount();
    });

    test('text', async () => {
      const result = await mountForm({
        fields: () => () => [
          { name: 'test', type: 'text', initialValue: 'Hello World!' },
        ],
      });
      setValue(FORM_KEY, 'test', undefined);
      result.update();
      expect(result.find('TextFieldMock').prop('value')).toBe(''); // no default
      expect(result.find('TextFieldMock')).toMatchSnapshot();
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
      setValue(FORM_KEY, 'test', undefined);
      result.update();
      expect(result.find('TextMultiFieldMock').prop('value')).toBe(
        FIELD_DEFAULT_VALUES.get('text-multi'),
      );
      expect(result.find('TextMultiFieldMock')).toMatchSnapshot();
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
      setValue(FORM_KEY, 'test', undefined);
      result.update();
      expect(result.find('UserFieldMock').prop('value')).toBe(
        FIELD_DEFAULT_VALUES.get('user'),
      );
      expect(result.find('UserFieldMock')).toMatchSnapshot();
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
      setValue(FORM_KEY, 'test', undefined);
      result.update();
      expect(result.find('UserMultiFieldMock').prop('value')).toBe(
        FIELD_DEFAULT_VALUES.get('user-multi'),
      );
      expect(result.find('UserMultiFieldMock')).toMatchSnapshot();
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
    submitForm(FORM_KEY, {
      fieldSet: ['firstName', 'lastName'],
      values: {
        firstName: 'Matt',
        lastName: null,
      },
    });
    result.update();
    expect(onSubmit.mock.calls).toMatchSnapshot();
    expect(result.find('FormLayout').prop('bindings')).toMatchSnapshot();
    result.unmount();
  });
});
