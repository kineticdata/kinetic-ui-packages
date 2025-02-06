# Changelog for `@kineticdata/react`

This changelog documents the changes to the `@kineticdata/react` library that are relevant when the library is used for customer implementations. It does not document changes made to components used in our internal consoles.

When upgrading `@kineticdata/react` to a newer version, remember that all `@kineticdata/*` libraries must be on the same exact version. This is because each `@kineticdata/bundle-*` library has `@kineticdata/react` as a dependency, and if two different versions of `@kineticdata/react` are installed in a bundle, the bundle will never load because authentication happens in a different version of `@kineticdata/react` than the one used during rendering the packages.

Remember to always run `yarn install` after upgrading any dependency versions.

## 6.1.0 (February 7, 2025)

- Upgraded `axios` version to resolve vulnerabilities
- Added missing `qs` and `react-beautiful-dnd` dependencies
- Added new API functions for Kapp Integrations
  - `fetchIntegrations`, `fetchIntegration`, `createIntegration`, `updateIntegration`, `deleteIntegration`, `executeIntegration`
- Added new API functions for Connections
  - `fetchConnections`, `fetchConnection`, `updateConnection`, `createConnection`, `deleteConnection`, `testConnection`
- Added new API functions for Operations
  - `fetchOperations`, `fetchOperation`, `updateOperation`, `createOperation`, `deleteOperation`, `fetchBulkOperations`, `inspectOperation`, `executeOperation`
- Added misc API functions that were missing
  - `cloneSubmission`
- Added new props to `CoreForm`
  - `renderProps` allows passing through props to the `Layout` component
  - `addSubmissionIncludes` and `addFormIncludes` allows passing an array of additional `include` properties for the corresponding queries

## 6.0.5 (February 16, 2024)

- Upgraded `axios` version to resolve vulnerabilities

## 6.0.4 (January 22, 2024)

- Fixed bug with SAML logout options

## 6.0.3 (December 11, 2023)

_No relevant changes._

## 6.0.2 (November 6, 2023)

- Removed XSRF header setting from Request Interceptor
- Added SAML logout options
- Upgraded various `dependencies` to resolve vulnerabilities
- Updated the `react` and `react-dom` `peerDependencies` to `>=17.0.2` to support the latest versions of React

### Bundle Issues

One of the `dependencies` that was updated is `axios` whose latest version causes some issues with the latest `react-scripts`. If the bundle has a `craco.config.js` file, the following steps must be taken when upgrading to this version.

1.  In `craco.config.js`, add the following function to the very end of the file:

```javascript
function getFileLoaderRule(rules) {
  for (const rule of rules) {
    if ('oneOf' in rule) {
      const found = getFileLoaderRule(rule.oneOf);
      if (found) {
        return found;
      }
    } else if (rule.test === undefined && rule.type === 'asset/resource') {
      return rule;
    }
  }
}
```

2.  In `craco.config.js`, add the following code inside the `configure` function of the `webpack` object:

```javascript
// Fix for CJS files not being treated as JavaScript files
// https://github.com/facebook/create-react-app/issues/11889#issuecomment-1114928008
const fileLoaderRule = getFileLoaderRule(webpackConfig.module.rules);
if (!fileLoaderRule) {
  throw new Error('File loader not found');
}
fileLoaderRule.exclude.push(/\.cjs$/);
```

## 6.0.1 (September 20, 2023)

- Updated the `react` and `react-dom` `peerDependencies` to `^17.0.2` to support React v17

### Bundle Issues

It is recommended to upgrade the bundle's `react` and `react-dom` versions to `^17.0.2`. This upgrade should not have any breaking changes. To do so, update these two dependency versions in `bundle/packages/app/package.json` and the peer dependency versions in all of the `package.json` files of the other packages.

If you do upgrade `react` to v17, the following steps must also be taken if the bundle has testing configured:

1.  In `bundle/package.json`, remove the `enzyme-adapter-react-16` dependency, and add the following dependency:  
    `"@wojtekmaj/enzyme-adapter-react-17": "^0.8.0"`
2.  In `bundle/packages/app/src/setupTests.js`, change the `Adapter` import from `enzyme-adapter-react-16` to be from `@wojtekmaj/enzyme-adapter-react-17`.

## 6.0.0 (February 22, 2023)

- Removed all code related to Discussions
- Removed most `devDependencies`, which were move to the project root

### Bundle Issues

Because all discussions code was removed from the library, any bundles that are upgraded to this version must have all of their discussions code removed as well, since the various imports from this library that bundles used no longer exist.

We consolidated most of our `devDependencies` into the root of our project, of which `@kineticdata/react` is just one part. Any bundles upgrading to this version must add the following `devDependencies` to the `package.json` file in the root of their `bundle` folder:

```
"@babel/cli": "^7.23.0",
"@babel/runtime": "^7.23.2",
```

If you get the following error when trying to run your bundle:  
`Uncaught Error: Cannot find module '@babel/runtime/helpers/esm/regeneratorRuntime'`  
You will need to run the following commands in your `bundle` directory:

```
npx yarn-deduplicate --packages @babel/runtime -- yarn.lock
yarn install
```

The above step will always be required when first upgrading to a v6+ version of `@kineticdata/react`.
