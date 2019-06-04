import React from 'react';
import { Form } from '../form/Form';
import {
  createTeam,
  updateTeam,
  fetchTeam,
  fetchTeams,
} from '../../../apis/core';
import { splitTeamName } from '../../../helpers/splitTeamName';

const dataSources = ({ teamSlug }) => ({
  team: [
    fetchTeam,
    [{ teamSlug }],
    {
      transform: result => result.team,
      runIf: () => !!teamSlug,
    },
  ],
  teams: [fetchTeams, [], { transform: result => result.teams }],
});

const handleSubmit = ({ teamSlug }) => values =>
  new Promise((resolve, reject) => {
    const team = values.toJS();
    (teamSlug ? updateTeam({ teamSlug, team }) : createTeam({ team })).then(
      ({ team, error }) => {
        if (team) {
          resolve(team);
        } else {
          reject(error);
        }
      },
    );
  });

const fields = ({ teamSlug }) => [
  {
    name: 'localName',
    label: 'Name',
    type: 'text',
    required: true,
    transient: true,
    initialValue: ({ team }) => (team ? splitTeamName(team)[1] : ''),
  },
  {
    name: 'parentTeam',
    label: 'Parent Team',
    type: 'team',
    required: true,
    transient: true,
    options: ({ teams }) => teams,
    initialValue: ({ team }) =>
      team
        ? {
            name: splitTeamName(team)[0],
          }
        : null,
  },
  {
    name: 'name',
    type: 'text',
    visible: false,
    serialize: ({ values }) =>
      `${values.get('parentTeam').name}::${values.get('localName')}`,
  },
];

export const TeamForm = ({
  addFields,
  alterFields,
  formKey,
  components,
  onSave,
  onError,
  children,
  ...formOptions
}) => (
  <Form
    addFields={addFields}
    alterFields={alterFields}
    formKey={formKey}
    components={components}
    onSubmit={handleSubmit(formOptions)}
    onSave={onSave}
    onError={onError}
    dataSources={dataSources(formOptions)}
    fields={fields(formOptions)}
  >
    {children}
  </Form>
);
