# @kineticdata/react

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![NPM Version](https://img.shields.io/npm/v/@kineticdata/react/latest.svg)](https://opensource.org/licenses/MIT)


A reactJS library that makes it super simple to interact with the [Kinetic Platform](https://kineticdata.com/platform/) within your sites and applications.

## [Docs](https://kineticdata.github.io/react-kinetic-lib)
Embedded in the React component library is an interactive styleguide and 
documentation system that allows you to see the components and manipulate them. 

### Run and View Docs Locally
To use this styleguide simply run `yarn start` and connect to `http://localhost:8000`.

## Install
Via [npm](https://npmjs.com/package/@kineticdata/react)

```bash
npm install @kineticdata/react
```

Via [Yarn](http://yarn.fyi/@kineticdata/react)

```bash
yarn add @kineticdata/react
```

## Quick Start
### `KineticLib`
The `KineticLib` Provider provides a global context to your site or applications connection to the Kinetic Platform.

```js static
import React from 'react';
import { KineticLib } from '@kineticdata/react';
import { Router, Route, Switch } from 'react-router-dom';
import Space from './Space';  
import Kapp from './Kapp'; // @see the Kapp component defined in `Kapp` example below

export const clientId =
  process.env.NODE_ENV === 'development'
    ? 'kinetic-bundle-dev'
    : 'kinetic-bundle';

const App = () => (
  <KineticLib clientId={clientId}>
    {({ loggedIn, loggingIn, loginProps }) => (
      <Router>
        {loggingIn ? (
          <LoginLoading />
        ) : !loggedIn ? (
          <LoginScreen {...loginProps} />
        ) : (
          <Switch>
            <Route path="/" component={Space} />
            <Route path="/kapps/:kappSlug" component={Kapp} />
          </Switch>
        )}
      </Router>
    )}
  </KineticLib>
);

export default App;
```

### API's
All Service API's are exposed as functions to perform CRUD operations within the platform.

```js static
import React from 'react';
import { fetchKapp } from '@kineticdata/react';

class Kapp extends React.Component {
  constructor(props) {
    super(props);
    this.state = { kapp: {} };
  }

  componentDidMount() {
    const { kapp } = fetchKapp(this.props.kappSlug, {
      include: 'details,forms',
    });
    this.setState({ kapp });
  }

  render() {
    const { kapp } = this.state;
    return (
      <div>
        <h1>{kapp.slug}</h1>
        <ul>
          {kapp.forms.map(form => (
            <li>{form.name}</li>
          ))}
        </ul>
      </div>
    );
  }
}

export default Kapp;
```

## Development / Contributing

See the [Contributing](/#/Contributing) page for information on developing the component library.

## License
MIT © [Kinetic Data](https://kineticdata.com)
