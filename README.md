# Kinetic UI Packages

There are a number of packages that have been built by Kinetic Data and are available to be installed from NPM into a custom bundle. Many of these packages are already installed in the `app` package of the `customer-project-default` bundle (which is the starting point for custom bundles).

These packages are meant to be used as they are, and generally not modified. However, sometimes a customer may want to customize one of these packages, or use one as a starting point for their own custom bundle. This can be accomplished by pulling in the source code of one of the pre-built Kinetic packages and then treating it as a custom package.

This repository contains branches that hold the source code for these pre-built packages.

_Note: Once you do this and start customizing a pre-built package, any improvements made to that package by Kinetic Data will be more difficult to merge into your bundle. It will be your responsibility to merge in and resolve any conflicts when you want to pull in the latest changes from the pre-built package._

---

## Available Packages

- **Services** `packages/services`

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

You will just need to run `yarn install` in your bundle to update its dependencies and have it use the added source code.

**Note: The added source code has the same package name in its `package.json` file as the published version of that package in NPM. It is very important that the version of the dependency for this package in your bundle's `app/package.json` file matches the version in the added package. Otherwise, the dependency will be fetched from NPM and your local code will not be used.**

## Updating Source Code of Pre-Built Package in Your Custom Bundle

Once you've added the source code for a package into your bundle, you may want to pull in any updates we've made to the source code after you initially added it.

To update the source code for a package, run the following command from the root directory of your repository. The `--prefix` argument specifies the path into which you added the source code. After that we specify the git repo URL and the branch to pull code from.

_The below example uses the `packages/services` branch as an example. You will need to update the prefix value and the branch name in the below command for other packages._

```shell
$ git subtree pull --prefix bundle/packages/services https://github.com/kineticdata/kinetic-ui-packages.git packages/services
```

There will likely be merge commits that you will need to resolve when you run this command if you've made changes to the source code. If your changes were minimal, the merge will hopefully not be very difficult. If you've heavily modified the source code, the merge may be very difficult to do, and potentially not worth it.
