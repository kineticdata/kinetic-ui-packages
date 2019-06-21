## Examples

### With no data provided

When the data passed into the `Table` is empty it will display the empty message.

```js
<Table
  data={[]}
  columns={[{ value: 'username', title: 'Username' }]}
  emptyMessage="There are no data rows."
>
  {({ table }) => <div>{table}</div>}
</Table>
```

### With basic data

```js
import { users } from '@kineticdata/fixtures';

const data = users(2);
const columns = [
  {
    value: 'username',
    title: 'Username',
  },
  {
    value: 'displayName',
    title: 'Display Name',
  },
];
<Table emptyMessage="There are no data rows." data={data} columns={columns}>
  {({ table }) => <div>{table}</div>}
</Table>;
```

### If you need to custom render a field

```js
import { users } from '@kineticdata/fixtures';

const BooleanYesNoCell = props => <td>{props.value ? 'Yes' : 'No'}</td>;

const data = users(2);
const columns = [
  {
    value: 'username',
    title: 'Username',
  },
  {
    value: 'displayName',
    title: 'Display Name',
  },
  {
    value: 'spaceAdmin',
    title: 'Is Space Admin?',
    components: { BodyCell: BooleanYesNoCell },
  },
];
<Table data={data} columns={columns}>
  {({ table }) => <div>{table}</div>}
</Table>;
```

### With configured pagination controls

```js
import { users } from '@kineticdata/fixtures';

const BooleanYesNoCell = props => <td>{props.value ? 'Yes' : 'No'}</td>;

const data = users(35);
const columns = [
  {
    value: 'username',
    title: 'Username',
    filterable: true,
  },
  {
    value: 'displayName',
    title: 'Display Name',
  },
  {
    value: 'spaceAdmin',
    title: 'Is Space Admin?',
    components: { BodyCell: BooleanYesNoCell },
  },
];

<Table data={data} columns={columns} filtering pagination>
  {({ table, filter, pagination }) => (
    <div>
      {filter}
      {table}
      {pagination}
    </div>
  )}
</Table>;
```

### With configured footer

```js
import { users } from '@kineticdata/fixtures';

const data = users(4);
const columns = [
  {
    value: 'username',
    title: 'Username',
  },
  {
    value: 'displayName',
    title: 'Display Name',
  },
  {
    value: 'spaceAdmin',
    title: 'Is Space Admin?',
  },
];

const Footer = ({ colSpan }) => (
  <tfoot>
    <tr>
      <td colSpan={colSpan}>
        <b>Footer</b>
      </td>
    </tr>
  </tfoot>
);

<Table data={data} columns={columns} components={{ Footer }} includeFooter>
  {({ table, pagination }) => (
    <div>
      {table}
      {pagination}
    </div>
  )}
</Table>;
```