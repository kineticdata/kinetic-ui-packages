import { generateForm } from './Form';

export const KitchenSinkForm = generateForm({
  dataSources: () => ({}),
  fields: () => () => [
    {
      name: 'attributes1',
      type: 'attributes',
      label: 'Attributes 1',
      options: [
        {
          name: 'Icon',
          description: 'Select an icon for the thing',
          allowsMultiple: false,
        },
        {
          name: 'Owner',
          description: 'Contact(s) for managing this thing',
          allowsMultiple: true,
        },
      ],
    },
    {
      name: 'attributes2',
      type: 'attributes',
      label: 'Attributes 2',
      options: [
        {
          name: 'Icon',
          description: 'Select an icon for the thing',
          allowsMultiple: false,
        },
        {
          name: 'Owner',
          description: 'Contact(s) for managing this thing',
          allowsMultiple: true,
        },
      ],
      required: true,
    },
    {
      name: 'attributes3',
      type: 'attributes',
      label: 'Attributes 3',
      options: [
        {
          name: 'Icon',
          description: 'Select an icon for the thing',
          allowsMultiple: false,
        },
        {
          name: 'Owner',
          description: 'Contact(s) for managing this thing',
          allowsMultiple: true,
        },
      ],
      enabled: false,
      initialValue: { Icon: ['fa-toolbox'], Owner: ['Shayne'] },
    },
    {
      name: 'attributes4',
      type: 'attributes',
      label: 'Attributes 4',
      options: [
        {
          name: 'Icon',
          description: 'Select an icon for the thing',
          allowsMultiple: false,
        },
        {
          name: 'Owner',
          description: 'Contact(s) for managing this thing',
          allowsMultiple: true,
        },
      ],
      helpText: 'Help Text',
      placeholder: 'Placeholder',
    },
    {
      name: 'checkbox1',
      type: 'checkbox',
      label: 'Checkbox 1',
    },
    {
      name: 'checkbox2',
      type: 'checkbox',
      label: 'Checkbox 2',
      required: true,
    },
    {
      name: 'checkbox3',
      type: 'checkbox',
      label: 'Checkbox 3',
      enabled: false,
    },
    {
      name: 'checkbox4',
      type: 'checkbox',
      label: 'Checkbox 4',
      helpText: 'This is a checkbox with help text',
    },
    {
      name: 'checkbox-multi1',
      type: 'checkbox-multi',
      label: 'Checkbox Multi 1',
      options: [
        {
          label: 'Circle',
          value: 'circle',
        },
        {
          label: 'Triangle',
          value: 'triangle',
        },
        {
          label: 'Square',
          value: 'square',
        },
      ],
    },
    {
      name: 'checkbox-multi2',
      type: 'checkbox-multi',
      label: 'Checkbox Multi 2',
      required: true,
      options: [
        {
          label: 'Circle',
          value: 'circle',
        },
        {
          label: 'Triangle',
          value: 'triangle',
        },
        {
          label: 'Square',
          value: 'square',
        },
      ],
    },
    {
      name: 'checkbox-multi3',
      type: 'checkbox-multi',
      label: 'Checkbox Multi 3',
      enabled: false,
      initialValue: 'triangle',
      options: [
        {
          label: 'Circle',
          value: 'circle',
        },
        {
          label: 'Triangle',
          value: 'triangle',
        },
        {
          label: 'Square',
          value: 'square',
        },
      ],
    },
    {
      name: 'checkbox-multi4',
      type: 'checkbox-multi',
      label: 'Checkbox Multi 4',
      helpText: 'Help Text',
      placeholder: 'Placeholder',
      options: [
        {
          label: 'Circle',
          value: 'circle',
        },
        {
          label: 'Triangle',
          value: 'triangle',
        },
        {
          label: 'Square',
          value: 'square',
        },
      ],
    },
    {
      name: 'code1',
      type: 'code',
      label: 'Code 1',
      language: 'js-template',
      options: {
        Colors: {
          children: {
            Red: { value: '#ff0000' },
            Green: { value: '#00ff00' },
            Blue: { value: '#0000ff' },
          },
        },
      },
    },
    {
      name: 'code2',
      type: 'code',
      label: 'Code 2',
      required: true,
      language: 'js-template',
    },
    {
      name: 'code3a',
      type: 'code',
      label: 'Code (JS Template)',
      enabled: false,
      // eslint-disable-next-line no-template-curly-in-string
      initialValue: 'Hello, ${values("First Name")}',
      language: 'js-template',
    },
    {
      name: 'code3b',
      type: 'code',
      label: 'Code (JS)',
      enabled: false,
      // eslint-disable-next-line no-template-curly-in-string
      initialValue: 'console.log(`Hello ${first_name}`)',
      language: 'js',
    },
    {
      name: 'code3c',
      type: 'code',
      label: 'Code (ERB)',
      enabled: false,
      initialValue: 'Hello <%= @first_name %>',
      language: 'erb',
    },
    {
      name: 'code3d',
      type: 'code',
      label: 'Code (RUBY)',
      enabled: false,
      initialValue: 'puts "Hello #{@first_name}"',
      language: 'ruby',
    },
    {
      name: 'code4',
      type: 'code',
      label: 'Code 4',
      language: 'js-template',
      helpText: 'Help Text',
    },
    {
      name: 'form1',
      type: 'form',
      label: 'Form 1',
      search: { kappSlug: 'services' },
    },
    {
      name: 'form2',
      type: 'form',
      label: 'Form 2',
      required: true,
      search: { kappSlug: 'services' },
    },
    {
      name: 'form3',
      type: 'form',
      label: 'Form 3',
      enabled: false,
      initialValue: {
        name: 'Leave a comment',
        slug: 'comments',
      },
      search: { kappSlug: 'services' },
    },
    {
      name: 'form4',
      type: 'form',
      label: 'Form 4',
      helpText: 'Help Text',
      placeholder: 'Placeholder',
      search: { kappSlug: 'services' },
    },
    {
      name: 'form-multi1',
      type: 'form-multi',
      label: 'Form Multi 1',
      search: { kappSlug: 'services' },
    },
    {
      name: 'form-multi2',
      type: 'form-multi',
      label: 'Form Multi 2',
      required: true,
      search: { kappSlug: 'services' },
    },
    {
      name: 'form-multi3',
      type: 'form-multi',
      label: 'Form Multi 3',
      enabled: false,
      initialValue: [
        {
          name: 'Leave a comment',
          slug: 'comments',
        },
      ],
      search: { kappSlug: 'services' },
    },
    {
      name: 'form-multi4',
      type: 'form-multi',
      label: 'Form Multi 4',
      helpText: 'Help Text',
      placeholder: 'Placeholder',
      search: { kappSlug: 'services' },
    },
    {
      name: 'map1',
      type: 'map',
      label: 'Map 1',
      options: [
        {
          label: 'First Name',
          value: 'firstName',
        },
        {
          label: 'Last Name',
          value: 'lastName',
        },
        {
          label: 'Email',
          value: 'email',
        },
      ],
    },
    {
      name: 'map2',
      type: 'map',
      label: 'Map 2',
      options: [
        {
          label: 'First Name',
          value: 'firstName',
        },
        {
          label: 'Last Name',
          value: 'lastName',
        },
        {
          label: 'Email',
          value: 'email',
        },
      ],
      required: true,
    },
    {
      name: 'map3',
      type: 'map',
      label: 'Map 3',
      options: bindings => [
        {
          label: 'First Name',
          value: 'firstName',
        },
        {
          label: 'Last Name',
          value: 'lastName',
        },
        {
          label: 'Email',
          value: 'email',
        },
      ],
      enabled: false,
      initialValue: { lastName: 'Demo' },
    },
    {
      name: 'map4',
      type: 'map',
      label: 'Map 4',
      options: [
        {
          label: 'First Name',
          value: 'firstName',
        },
        {
          label: 'Last Name',
          value: 'lastName',
        },
        {
          label: 'Email',
          value: 'email',
        },
      ],
      helpText: 'Help Text',
      placeholder: 'Placeholder',
    },
    {
      name: 'password1',
      type: 'password',
      label: 'Password 1',
    },
    {
      name: 'password2',
      type: 'password',
      label: 'Password 2',
      required: true,
    },
    {
      name: 'password3',
      type: 'password',
      label: 'Password 3',
      enabled: false,
      initialValue: 'asdfasdf',
    },
    {
      name: 'password4',
      type: 'password',
      label: 'Password 4',
      helpText: 'Help Text',
      placeholder: 'Placeholder',
    },
    {
      name: 'radio1',
      type: 'radio',
      label: 'Radio 1',
      options: [
        {
          label: 'Circle',
          value: 'circle',
        },
        {
          label: 'Triangle',
          value: 'triangle',
        },
        {
          label: 'Square',
          value: 'square',
        },
      ],
    },
    {
      name: 'radio2',
      type: 'radio',
      label: 'Radio 2',
      required: true,
      options: [
        {
          label: 'Circle',
          value: 'circle',
        },
        {
          label: 'Triangle',
          value: 'triangle',
        },
        {
          label: 'Square',
          value: 'square',
        },
      ],
    },
    {
      name: 'radio3',
      type: 'radio',
      label: 'Radio 3',
      enabled: false,
      initialValue: 'triangle',
      options: [
        {
          label: 'Circle',
          value: 'circle',
        },
        {
          label: 'Triangle',
          value: 'triangle',
        },
        {
          label: 'Square',
          value: 'square',
        },
      ],
    },
    {
      name: 'radio4',
      type: 'radio',
      label: 'Radio 4',
      helpText: 'Help Text',
      placeholder: 'Placeholder',
      options: [
        {
          label: 'Circle',
          value: 'circle',
        },
        {
          label: 'Triangle',
          value: 'triangle',
        },
        {
          label: 'Square',
          value: 'square',
        },
      ],
    },
    {
      name: 'select1',
      type: 'select',
      label: 'Select 1',
      options: [
        {
          label: 'Circle',
          value: 'circle',
        },
        {
          label: 'Triangle',
          value: 'triangle',
        },
        {
          label: 'Square',
          value: 'square',
        },
      ],
    },
    {
      name: 'select2',
      type: 'select',
      label: 'Select 2',
      required: true,
      options: [
        {
          label: 'Circle',
          value: 'circle',
        },
        {
          label: 'Triangle',
          value: 'triangle',
        },
        {
          label: 'Square',
          value: 'square',
        },
      ],
    },
    {
      name: 'select3',
      type: 'select',
      label: 'Select 3',
      enabled: false,
      initialValue: 'triangle',
      options: [
        {
          label: 'Circle',
          value: 'circle',
        },
        {
          label: 'Triangle',
          value: 'triangle',
        },
        {
          label: 'Square',
          value: 'square',
        },
      ],
    },
    {
      name: 'select4',
      type: 'select',
      label: 'Select 4',
      helpText: 'Help Text',
      placeholder: 'Placeholder',
      options: [
        {
          label: 'Circle',
          value: 'circle',
        },
        {
          label: 'Triangle',
          value: 'triangle',
        },
        {
          label: 'Square',
          value: 'square',
        },
      ],
    },
    {
      name: 'select-multi1',
      type: 'select-multi',
      label: 'Select Multi 1',
      options: [
        {
          label: 'Circle',
          value: 'circle',
        },
        {
          label: 'Triangle',
          value: 'triangle',
        },
        {
          label: 'Square',
          value: 'square',
        },
      ],
    },
    {
      name: 'select-multi2',
      type: 'select-multi',
      label: 'Select Multi 2',
      required: true,
      options: [
        {
          label: 'Circle',
          value: 'circle',
        },
        {
          label: 'Triangle',
          value: 'triangle',
        },
        {
          label: 'Square',
          value: 'square',
        },
      ],
    },
    {
      name: 'select-multi3',
      type: 'select-multi',
      label: 'Select Multi 3',
      enabled: false,
      initialValue: ['circle', 'triangle'],
      options: [
        {
          label: 'Circle',
          value: 'circle',
        },
        {
          label: 'Triangle',
          value: 'triangle',
        },
        {
          label: 'Square',
          value: 'square',
        },
      ],
    },
    {
      name: 'select-multi4',
      type: 'select-multi',
      label: 'Select Multi 4',
      helpText: 'Help Text',
      placeholder: 'Placeholder',
      options: [
        {
          label: 'Circle',
          value: 'circle',
        },
        {
          label: 'Triangle',
          value: 'triangle',
        },
        {
          label: 'Square',
          value: 'square',
        },
      ],
    },
    {
      name: 'team1',
      type: 'team',
      label: 'Team 1',
    },
    {
      name: 'team2',
      type: 'team',
      label: 'Team 2',
      required: true,
    },
    {
      name: 'team3',
      type: 'team',
      label: 'Team 3',
      enabled: false,
      initialValue: { name: 'Role::Submission Support' },
    },
    {
      name: 'team4',
      type: 'team',
      label: 'Team 4',
      helpText: 'Help Text',
      placeholder: 'Placeholder',
    },
    {
      name: 'team-multi1',
      type: 'team-multi',
      label: 'Team Multi 1',
    },
    {
      name: 'team-multi2',
      type: 'team-multi',
      label: 'Team Multi 2',
      required: true,
    },
    {
      name: 'team-multi3',
      type: 'team-multi',
      label: 'Team Multi 3',
      enabled: false,
      initialValue: [{ name: 'Role::Submission Support' }],
    },
    {
      name: 'team-multi4',
      type: 'team-multi',
      label: 'Team Multi 4',
      helpText: 'Help Text',
      placeholder: 'Placeholder',
    },
    {
      name: 'text1',
      type: 'text',
      label: 'Text 1',
    },
    {
      name: 'text2',
      type: 'text',
      label: 'Text 2',
      required: true,
    },
    {
      name: 'text3',
      type: 'text',
      label: 'Text 3',
      enabled: false,
    },
    {
      name: 'text4',
      type: 'text',
      label: 'Text 4',
      helpText: 'Help Text',
      placeholder: 'Placeholder',
    },
    {
      name: 'text-multi1',
      type: 'text-multi',
      label: 'Text Multi 1',
    },
    {
      name: 'text-multi2',
      type: 'text-multi',
      label: 'Text Multi 2',
      required: true,
    },
    {
      name: 'text-multi3',
      type: 'text-multi',
      label: 'Text Multi 3',
      enabled: false,
      initialValue: ['red', 'green', 'blue'],
    },
    {
      name: 'text-multi4',
      type: 'text-multi',
      label: 'Text Multi 4',
      helpText: 'Help Text',
      placeholder: 'Placeholder',
    },
    {
      name: 'user1',
      type: 'user',
      label: 'User 1',
    },
    {
      name: 'user2',
      type: 'user',
      label: 'User 2',
      required: true,
    },
    {
      name: 'user3',
      type: 'user',
      label: 'User 3',
      enabled: false,
      initialValue: {
        username: 'wally@kineticdata.com',
      },
    },
    {
      name: 'user4',
      type: 'user',
      label: 'User 4',
      helpText: 'Help Text',
      placeholder: 'Placeholder',
    },
    {
      name: 'user-multi1',
      type: 'user-multi',
      label: 'User Multi 1',
    },
    {
      name: 'user-multi2',
      type: 'user-multi',
      label: 'User Multi 2',
      required: true,
    },
    {
      name: 'user-multi3',
      type: 'user-multi',
      label: 'User Multi 3',
      enabled: false,
      initialValue: [
        {
          username: 'wally@kineticdata.com',
          displayName: 'Wally',
        },
      ],
    },
    {
      name: 'user-multi4',
      type: 'user-multi',
      label: 'User Multi 4',
      helpText: 'Help Text',
      placeholder: 'Placeholder',
    },
  ],
  formOptions: ['input'],
  handleSubmit: formOptions => (values, bindings) => {
    console.log('handleSubmit', {
      formOptions,
      values,
      bindings,
    });
  },
});
