## Prerequisites

[Node.js](http://nodejs.org/) >= 10 must be installed.

## Installation

- Running `yarn install` in the component's root directory will install everything you need for development.

## Styleguide / Development Server

- `yarn start` will run a development server with the component's styleguide app at [http://localhost:6060](http://localhost:6060) with hot module reloading.

## Running Tests

- `yarn test` will run the tests once.

- `yarn test:coverage` will run the tests and produce a coverage report in `coverage/`.

- `yarn test:watch` will run the tests on every change.

## Building

- `yarn build` will build the component for publishing to npm and also bundle the demo app.

## Publishing


### Prereleases
- `npm version prerelease --preid=alpha` will create a new pre-release with the tag "alpha" and increment the number after.
    For example, if the current version is 0.1.0-alpha.1, running this command will bump the version to 0.1.0-alpha.2

# Code Style

The React component library project contains a Prettier config.
Developers should be using an extension/plugin that runs the Prettier tool before committing.

If you are using Visual Studio Code we encourage you to install the `Prettier - Code formatter` extension and enable `Editor: Format On Save` setting.

If you are developing other JavaScript projects and do not want Prettier to format them you should check the `Prettier: Require Config` setting so that VS Code only formats projects with Prettier enabled.

# References

Below are some of the references we used to help us build our devtool setup.
Basically the idea is that we are calling babel / eslint / etc ourselves but
leveraging the fact that create-react-app publishes those configs as libraries so
we don't need to delve into those details. This also gives us a consistent working
environment with our bundles which are using create-react-app. Below are their
instructions for using these outside of create-react-app.

https://www.npmjs.com/package/babel-preset-react-app#usage-outside-of-create-react-app
https://www.npmjs.com/package/eslint-config-react-app#usage-outside-of-create-react-app

This is a helpful article that shows the simplest method we've found for publishing
a React library as a npm module.

https://parastudios.de/create-a-react-component-as-npm-module/

Finally, this gist was a super helpful example for showing how to setup our scripts.
One thing we were missing out on without webpack was the fact that it combines all
of the steps in one process (babel, eslint, asset handling, etc). So we needed
something like this to help us stich those things together so that we can just
run `yarn build:watch` and that will call babel, eslint, copy assets on file changes.

https://gist.github.com/adamreisnz/9edf1f48e19c104b81f8102a27de0940#file-package-json-L24

# devDependnecies

As mentioned above we are rolling our own dev tooling setup here so its appropriate
for us to document some of the development dependencies in here and why there are
here.

##### babel

All of the following are installed together (see the babel-preset-react-app link)
to transpile our React/ES6 code into browser-friendly code. These should likely
be upgraded together.

```javascript static
"@babel/cli": "^7.19.3",
"babel-preset-react-app": "^10.0.1",
```

##### eslint

All of the following are installed together (see the eslint-config-react-app link)
to enable linting and should be upgraded together as well. The first two are dependencies
of react-scripts and would be installed anyways but we specify them explicitly to ensure
gatsby's dependencies don't get lifted into the root and break the react-scripts preflight
check.

```javascript static
"babel-eslint": "9.0.0",
"eslint": "5.1.2",
"eslint-config-react-app": "^3.0.8",
```

##### testing

```javascript static
"enzyme": "^3.9.0",
"enzyme-adapter-react-16": "^1.9.1",
"enzyme-to-json": "^3.3.5",
"react-addons-test-utils": "^15.6.2",
```

##### scripting

```javascript static
"concurrently": "^4.1.0",
"cross-env": "^5.2.0",
"lint-staged": "^8.1.3",
"onchange": "^5.2.0",
"prettier": "^1.16.4",
```

##### styleguide

We are using the Styleguidist project to render our components as a styleguide.

```javascript static
"react-styleguidist": "^9.0.0"
```

The following are dependencies used solely to run the styleguide.

```javascript static
"babel-polyfill": "^6.26.0",
"bootstrap": "4.1.3",
"documentation": "^9.1.1",
"font-awesome": "4.7.0",
"react": "^16.8.1",
"react-dom": "^16.8.1",
```

Finally we have `react-scripts`. Styleguide works by using a webpack config to
handle the source code, but we are not using webpack in this project. We started
to build one out but we kind of wanted to avoid that in this project in the first
place. Fortunately they support using create-react-app out of the box, so by adding
react-scripts as a development dependency we can get styleguide to use their
webpack config and we can avoid adding all of those dependencies and config files.

```javascript static
"react-scripts": "^2.1.8",
```
