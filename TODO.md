# Kinetic UI Packages - Scaffold To Do

This is a scaffold package that can be used to build your own custom package from scratch. For more information about how this package works, please see [Adding a Custom Package](https://github.com/kineticdata/customer-project-default/blob/master/bundle/CUSTOM_PACKAGE.md) which has detailed instructions for how this package is built and what all the files do.

Once you pull the source code of this package into your bundle, you will need the make the following changes in your bundle to complete setup of this new package.

## Rename The Package and Update Name References

First, rename the package directory name to whatever name you want to use. Update the following file to use your package name instead of 'scaffold'.

- `src/redux/store.js` Lines 10 and 13 _Update the `console.log` message and the `name` parameter in the `__REDUX_DEVTOOLS_EXTENSION_COMPOSE__` argument._

Next, update the name in the `package.json` file, Line 2, in this package. This name will be used to add this package as a dependency into your bundle. It doesn't have to match the directory name.

Then, update the class names in the following locations to use your package name in place of the word 'scaffold'.

- `src/index.js` Line 85 _Update the `bodyClassName` value._
- `src/assets/styles/master.scss` Line 6 _Update the wrapping class name to match the value of the `bodyClassName` from the above step._
- `src/App.js` Lines 27 and 62 _Update the `package-layout--*` class to use your package name._

Lastly, update (and uncomment) the `location` value if your package will be rendered as a space level (meaning it won't be rendered via a Kapp).

- `src/index.js` Line 79 _Set `location` to the path you want this package to render at. If you will use a Kapp to render the package, you can leave this line commented out, or you can delete it._

## Update Dependencies

The scaffold package may be out of date on some of its dependencies. You should update the following dependency version in the `package.json` file in this package. You can copy the versions used in the `app` package of your bundle.

- `@kineticdata/bundle-common`
- `@kineticdata/react`

It is also very important that the following devDependency has the same exact version at the `app` package of your bundle.

- `@react-workspaces/react-scripts`

You may also update any of the other dependency version if you're using a different version in your other packages, or wish to use a different version.'

## Connect this New Package to Your Bundle

Now that made the necessary changes in this package, we need to connect that package into the bundle, so that it will be rendered.

First, we'll need to add this package as a dependency of the `app` package so that it can be imported into the `app` package. In `app/package.json` of your bundle, add a dependency matching the `name` and `version` found in the `package.json` file of this package.

In `app/src/assets/styles/masters.scss`, we'll need to import the `master.scss` file from this package. This should be added along with the imports from other packages, but before the imports of individual files from within the app package. Replace the `YOUR_PACKAGE_NAME` below with the name of your package found in its `package.json` file.

```scss
@import "~YOUR_PACKAGE_NAME/src/assets/styles/master";
```

Lastly, we'll need to configure when this package should be rendered. In `app/src/App.js`, we'll need to import our new `AppProvider`. Again, replace the `YOUR_PACKAGE_NAME` below with the name of your package found in its `package.json` file, and you can change the import name from `NewApp` to whatever you want.

```JavaScript
import NewApp from 'YOUR_PACKAGE_NAME';
```

Then we'll need to add the `NewApp` to either the `BUNDLE_PACKAGE_PROVIDERS` or `STATIC_PACKAGE_PROVIDERS` variables in `app/src/App.js`.

- If you want your package to be connected to a Kapp, then you will want to add it to BUNDLE_PACKAGE_PROVIDERS. The key can be anything (typically the name of your package) and the value should be the imported component. Then, any Kapp that has a 'Bundle Package' Kapp attribute with a value matching the key will be rendered using the new package.

  - If adding the package as a Kapp package, you will need to define a Kapp with the appropriate 'Bundle Package' Kapp attribute to be able to render the custom package.

- If you want the package to not be related to a Kapp, then you will just need to add the imported component to the STATIC_PACKAGE_PROVIDERS array. You will then be able to access the package by going to the location URL you defined in the AppProvider.

  - If adding it as a static package, make sure that you remove the `newState.kapp` check in the conditional of the `src/redux/modules/app.js` file in this package. Otherwise, the ready state will never be true and you will just see a blank screen.

Now you just need to run `yarn install`, and then `yarn start` from your bundle directory to start the development server, and you should be able to access your new package.
