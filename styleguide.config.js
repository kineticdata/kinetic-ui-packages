const path = require('path');

module.exports = {
  title: 'React Kinetic - Component Library and Style Guide',
  components: 'src/**/[A-Z]*.js',
  skipComponentsWithoutExample: true,
  pagePerSection: true,
  require: [
    'babel-polyfill',
  ],
  moduleAliases: {
    'react-kinetic-lib': path.resolve(__dirname, 'src'),
  },
  getComponentPathLine: (componentPath) => {
    const name = path.basename(componentPath, '.js')
    return `import { ${name} } from 'react-kinetic-lib';`
  },
  styleguideComponents: {
    Wrapper: path.join(__dirname, 'src/styleguide/StyleguideWrapper')
  },
  usageMode: 'expand',
  exampleMode: 'expand',
  sections: [
    {
      name: 'Components',
      content: 'src/apis/APIs.md',
      sectionDepth: 1,
      sections: [
        { name: 'Common', components: 'src/components/common/**/*.js' },
        { name: 'Core', components: 'src/components/core/**/*.js' },
        { name: 'Discussions', components: 'src/components/discussions/**/*.js', },
      ]
    },
    {
      name: 'APIs',
      content: 'src/apis/APIs.md',
      sections: [
        { name: 'Disussions API', content: 'src/apis/discussions/DiscussionsAPI.md' },
      ],
      sectionDepth: 1
    }
  ],

  template: {
    head: {
      links: [
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css?family=Roboto',
        },
      ],
    },
  },
  theme: {
    fontFamily: {
      base: '"Roboto", sans-serif',
    },
  },
};