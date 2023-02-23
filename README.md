# Kinetic UI Packages

There are a number of packages that have been built by Kinetic Data and are available to be installed from NPM into a custom bundle. Many of these packages are already installed in the `app` package of the `customer-project-default` bundle (which is the starting point for custom bundles).

These packages are meant to be used as they are, and generally not modified. However, sometimes a customer may want to customize one of these packages, or use one as a starting point for their own custom bundle. This can be accomplished by pulling in the source code of one of the pre-built Kinetic packages and then treating it as a custom package.

This repository contains branches that hold the source code for these pre-built packages.

_Note: Once you do this and start customizing a pre-built package, any improvements made to that package by Kinetic Data will be more difficult to merge into your bundle. It will be your responsibility to merge in and resolve any conflicts when you want to pull in the latest changes from the pre-built package._

---

## Available Packages

- **Queue** `packages/queue`
- **Services** `packages/services`
- **Settings** `packages/settings`
- **Survey** `packages/survey`
- **Tech Bar** `packages/tech-bar`

The above packages are for v6 of the bundle. If you need the v5 package, append `-v5` to the end of the package name when adding the source code.

_Please contact us to request the addition of the source code for any other pre-built packages._

## Adding Source Code of Pre-Built Package to Your Custom Bundle

To add the source code for a package into your bundle, run the following command from the root directory of your repository. The `--prefix` argument specifies the path into which we want to pull in the source code. After that we specify the git repo URL and the branch to pull code from.

_The below example uses the `packages/services` branch as an example. You will need to update the prefix value and the branch name in the below command for other packages._

```shell
$ git subtree add --prefix bundle/packages/services https://github.com/kineticdata/kinetic-ui-packages.git packages/services
> git fetch https://github.com/kineticdata/kinetic-ui-packages.git packages/services
> From https://github.com/kineticdata/kinetic-ui-packages
>  * branch            packages/services -> FETCH_HEAD
> Added dir 'bundle/packages/services'
```

Once this completes, you should have a `services` folder inside the `bundle/packages` directory. You will also have a large number of commits made, as this command will pull in all of the git history for the source code. This will allow you to later use the `git subtree pull` command to pull in changes from the source package.

### Connecting the Imported Package

When you add the source code for one of these packages, the name of the package will be the same as the name of the corresponding NPM package. If you leave everything as is, you will need to make sure that the version of your modified package always matches the latest version available on NPM so that your bundle uses your modified package as its dependency, instead of the one from NPM.

We recommend renaming the package you just added so you won't have to worry about this. Follow the steps below to do this.

#### Rename Imported Package

In `bundle/packages/<PACKAGE_DIR>/package.json` update the name and (optionally) version.

- You can set the name to anything you'd like.  
  Example: `@kineticdata/bundle-services` => `@kineticdata/bundle-services-custom`
- You may optionally change the version number if you'd like. We'll be adding this package as a dependency within the `app` package which is where this version will be used.  
  Example: `5.1.2` => `5.0.0`
- _If you are importing a v6 package into a v5 bundle that still uses `@react-workspaces/react-scripts`, you will need to add the following line to this package.json file: `"main:src": "./src/index.js"`_

#### Update References to Imported Package

Next, you will need to update the references that used the original package to use this modified one.

- In `bundle/packages/app/package.json`, replace the dependency for the original package, using the name and version from the previous step.  
  Example: `"@kineticdata/bundle-services": "^5.1.2"` => `"@kineticdata/bundle-services-custom": "^5.0.0"`
- In `bundle/packages/app/src/App.js`, replace the import from the original package.  
  Example: `import ServicesApp from '@kineticdata/bundle-services'` => `import ServicesApp from '@kineticdata/bundle-services-custom'`
- In `bundle/packages/app/src/assets/styles/master.scss`, replace references to any style sheets from the original package.  
  Example: `@import '~@kineticdata/bundle-services/assets/styles/master'` => `@import '~@kineticdata/bundle-services-custom/assets/styles/master'`
- You may need to search through your bundle to see if there are any other imports from the original package, and replace those with the new package name. The number of these references that exist within the bundle may vary between different bundles.  
  Example: `import { RequestCard } from '@kineticdata/bundle-services'` => `import { RequestCard } from '@kineticdata/bundle-services-custom';`

_If you would like to use both the original package from NPM and the modified version, instead of replacing the parts defined in the four steps above, add new lines for your modified package._

#### Update Craco Config (v6+ bundles only)

Next, you will need to update the craco config file to recognize that this new package is local to enable proper monorepo functionality.

- In `bundle/craco.config.js`, add a line to the `packages` map at the top of the file, that maps the directory name of your new package to the package name.  
  Example: `'services': '@kineticdata/bundle-services-custom'`

**Lastly, you will need to run `yarn install` in the bundle directory to update its dependencies and have it use the added source code.**

## Updating Source Code of Pre-Built Package in Your Custom Bundle

Once you've added the source code for a package into your bundle, you may want to pull in any updates we've made to the source code after you initially added it.

To update the source code for a package, run the following command from the root directory of your repository. The `--prefix` argument specifies the path into which you added the source code. After that we specify the git repo URL and the branch to pull code from.

_The below example uses the `packages/services` branch as an example. You will need to update the prefix value and the branch name in the below command for other packages._

```shell
$ git subtree pull --prefix bundle/packages/services https://github.com/kineticdata/kinetic-ui-packages.git packages/services
```

There will likely be merge commits that you will need to resolve when you run this command if you've made changes to the source code. If your changes were minimal, the merge will hopefully not be very difficult. If you've heavily modified the source code, the merge may be very difficult to do, and potentially not worth it.
