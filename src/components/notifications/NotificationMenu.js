import React, { Fragment } from 'react';
import { connect } from 'react-redux';
import { compose, lifecycle, withHandlers, withState } from 'recompose';
import {
  Collapse,
  UncontrolledButtonDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
} from 'reactstrap';

import { actions } from '../../redux/modules/settingsNotifications';
import { context } from '../../redux/store';

import { I18n } from '@kineticdata/react';

const wrapVar = type => property => `\${${type}('${property}')}`;

const submissionProperties = [
  'handle',
  'id',
  'closedAt',
  'closedBy',
  'coreState',
  'createdAt',
  'createdBy',
  'label',
  'submittedAt',
  'submittedBy',
  'type',
  'updatedAt',
  'updatedBy',
];
const formProperties = [
  'Form Name',
  'Form Slug',
  'Form Description',
  'Form Status',
  'Form Notes',
  'Form Type',
];
const kappProperties = ['Kapp Name', 'Kapp Slug'];
const spaceProperties = ['Space Name', 'Space Slug'];

const SubmissionMenu = ({ form, handleClick }) => (
  <ul className="dropdown-menu">
    {submissionProperties.map(wrapVar('submission')).map(prop => (
      <DropdownItem key={prop} data-value={prop} onClick={handleClick}>
        {prop}
      </DropdownItem>
    ))}
    <div className="dropdown-divider" role="none" />
    <h6 className="dropdown-header">
      <I18n>Submission Values</I18n>
    </h6>
    {form ? (
      form.fields
        .map(field => field.name)
        .map(wrapVar('values'))
        .map(prop => (
          <DropdownItem key={prop} data-value={prop} onClick={handleClick}>
            {prop}
          </DropdownItem>
        ))
    ) : (
      <Fragment>
        <small className="dropdown-header">
          <I18n>
            Select a form to see available fields or select the placeholder
            below and manually enter the field name
          </I18n>
        </small>
        <DropdownItem
          data-value={wrapVar('values')('###Field Name Here###')}
          onClick={handleClick}
        >
          {wrapVar('values')('###Field Name Here###')}
        </DropdownItem>
      </Fragment>
    )}
  </ul>
);

const FormMenu = ({ form, handleClick }) => (
  <ul className="dropdown-menu">
    {formProperties.map(wrapVar('form')).map(prop => (
      <DropdownItem key={prop} data-value={prop} onClick={handleClick}>
        {prop}
      </DropdownItem>
    ))}
    <div className="dropdown-divider" role="none" />
    <h6 className="dropdown-header">
      <I18n>Form Attributes</I18n>
    </h6>
    {form ? (
      form.attributes
        .map(attr => attr.name)
        .map(wrapVar('formAttributes'))
        .map(prop => (
          <DropdownItem key={prop} data-value={prop} onClick={handleClick}>
            {prop}
          </DropdownItem>
        ))
    ) : (
      <Fragment>
        <small className="dropdown-header">
          <I18n>
            Select a form to see available attributes or select the placeholder
            below and manually enter the attribute name
          </I18n>
        </small>
        <DropdownItem
          data-value={wrapVar('formAttributes')(
            '##Replace with form attribute name##',
          )}
          onClick={handleClick}
        >
          {wrapVar('formAttributes')('##Replace with form attribute name##')}
        </DropdownItem>
      </Fragment>
    )}
  </ul>
);

const KappMenu = ({ kapp, handleClick }) => (
  <ul className="dropdown-menu">
    {kappProperties.map(wrapVar('kapp')).map(prop => (
      <DropdownItem key={prop} data-value={prop} onClick={handleClick}>
        {prop}
      </DropdownItem>
    ))}
    <div className="dropdown-divider" role="none" />
    <h6 className="dropdown-header">
      <I18n>Kapp Attributes</I18n>
    </h6>
    {kapp ? (
      kapp.attributes
        .map(attribute => attribute.name)
        .map(wrapVar('kappAttributes'))
        .map(prop => (
          <DropdownItem key={prop} data-value={prop} onClick={handleClick}>
            {prop}
          </DropdownItem>
        ))
    ) : (
      <Fragment>
        <small className="dropdown-header">
          <I18n>
            Select a kapp to see available attributes or select the placeholder
            below and manually enter the attribute name
          </I18n>
        </small>
        <DropdownItem
          data-value={wrapVar('kappAttributes')(
            '##Replace with attribute name##',
          )}
          onClick={handleClick}
        >
          {wrapVar('kappAttributes')('##Replace with attribute name##')}
        </DropdownItem>
      </Fragment>
    )}
  </ul>
);

const SpaceMenu = ({ space, handleClick }) => (
  <ul className="dropdown-menu">
    {spaceProperties.map(wrapVar('space')).map(prop => (
      <DropdownItem key={prop} data-value={prop} onClick={handleClick}>
        {prop}
      </DropdownItem>
    ))}
    <div className="dropdown-divider" role="none" />
    <h6 className="dropdown-header">
      <I18n>Space Attributes</I18n>
    </h6>
    {space.attributes
      .map(attribute => attribute.name)
      .map(wrapVar('spaceAttributes'))
      .map(prop => (
        <DropdownItem key={prop} data-value={prop} onClick={handleClick}>
          {prop}
        </DropdownItem>
      ))}
  </ul>
);

const OtherVariablesMenu = ({ handleClick }) => (
  <ul className="dropdown-menu">
    <small className="dropdown-header">
      <I18n>
        Provided at run-time in the Task engine. Select the placeholder below
        and manually enter the variable name
      </I18n>
    </small>
    <DropdownItem
      data-value={wrapVar('vars')('##Replace with variable name##')}
      onClick={handleClick}
    >
      {wrapVar('vars')('##Replace with variable name##')}
    </DropdownItem>
  </ul>
);

const DateFormatMenu = ({ dateFormats, selection, handleClick }) => (
  <ul className="dropdown-menu">
    {selection && selection.startsWith('${') && selection.endsWith('}') ? (
      <Fragment>
        <small className="dropdown-header">
          <I18n>Formatting selection:</I18n> {selection}
        </small>
        {dateFormats.map(name => (
          <DropdownItem
            key={name}
            data-value={wrapVar('appearance')(
              selection + wrapVar('format')(name),
            )}
            onClick={handleClick}
          >
            {name}
          </DropdownItem>
        ))}
      </Fragment>
    ) : (
      <small className="dropdown-header">
        <I18n>
          Highlight a dynamic replacement value in one of the fields below that
          you would like to apply a date format to.
        </I18n>
      </small>
    )}
  </ul>
);

const SnippetsMenu = ({ snippets, handleClick }) => (
  <ul className="dropdown-menu">
    {snippets.map(snippet => (
      <DropdownItem
        key={snippet.values.Name}
        data-value={wrapVar('snippet')(snippet.values.Name)}
        onClick={handleClick}
      >
        {wrapVar('snippet')(snippet.values.Name)}
      </DropdownItem>
    ))}
  </ul>
);

export const NotificationMenuComponent = ({
  selection,
  space,
  kapps,
  forms,
  snippets,
  dateFormats,
  selectedKapp,
  selectedForm,
  isDatastore,
  handleClick,
  handleKappSelect,
  handleFormSelect,
  toggleIsDatastore,
  showHelp,
  toggleHelp,
}) => (
  <div className="alert alert-secondary">
    <div className="form-row">
      <div className="form-group col-2">
        <label htmlFor="notification-menu-datastore">
          <I18n>Datastore?</I18n>
        </label>
        <I18n
          render={translate => (
            <select
              id="notification-menu-datastore"
              className="form-control form-control-sm"
              value={isDatastore}
              onChange={toggleIsDatastore}
            >
              <option value={false}>{translate('No')}</option>
              <option value={true}>{translate('Yes')}</option>
            </select>
          )}
        />
      </div>
      {!isDatastore && (
        <div className="form-group col-md-2">
          <label htmlFor="notification-menu-kapp">
            <I18n>Kapp</I18n>
          </label>
          <I18n
            render={translate => (
              <select
                id="notification-menu-kapp"
                className="form-control form-control-sm"
                value={selectedKapp ? selectedKapp.slug : ''}
                onChange={handleKappSelect}
              >
                <option />
                {kapps.map(kapp => (
                  <option key={kapp.slug} value={kapp.slug}>
                    {translate(kapp.name)}
                  </option>
                ))}
              </select>
            )}
          />
        </div>
      )}
      <div className="form-group col">
        <label htmlFor="notification-menu-form">
          <I18n>Form</I18n>
        </label>
        <select
          id="notification-menu-form"
          className="form-control form-control-sm"
          value={selectedForm ? selectedForm.slug : ''}
          onChange={handleFormSelect}
        >
          {forms ? (
            <Fragment>
              <option />
              {forms.map(form => (
                <I18n
                  key={form.slug}
                  context={
                    selectedKapp
                      ? `kapps.${selectedKapp.slug}.forms.${form.slug}`
                      : `datastore.forms.${form.slug}`
                  }
                  render={translate => (
                    <option value={form.slug}>{translate(form.name)}</option>
                  )}
                />
              ))}
            </Fragment>
          ) : (
            <I18n
              render={translate => (
                <option value="" disabled>
                  {translate('Select a Kapp first or Set Is Datastore to Yes')}
                </option>
              )}
            />
          )}
        </select>
      </div>
    </div>
    <div className="form-row">
      <div className="form-group col-md-6">
        <label htmlFor="">
          <I18n>Dynamic Replacement Value</I18n>
        </label>
        <UncontrolledButtonDropdown>
          <DropdownToggle caret>
            <I18n>Insert Dynamic Replacement Value</I18n>
          </DropdownToggle>
          <DropdownMenu className="dropdown-multi">
            <li className="dropdown-item dropdown-submenu">
              <I18n>Snippets</I18n>
              <SnippetsMenu snippets={snippets} handleClick={handleClick} />
            </li>
            <li className="dropdown-item dropdown-submenu">
              <I18n>Submission</I18n>
              <SubmissionMenu form={selectedForm} handleClick={handleClick} />
            </li>
            <li className="dropdown-item dropdown-submenu">
              <I18n>Form</I18n>
              <FormMenu form={selectedForm} handleClick={handleClick} />
            </li>
            {!isDatastore && (
              <li className="dropdown-item dropdown-submenu">
                <I18n>Kapp</I18n>
                <KappMenu kapp={selectedKapp} handleClick={handleClick} />
              </li>
            )}
            <li className="dropdown-item dropdown-submenu">
              <I18n>Space</I18n>
              <SpaceMenu space={space} handleClick={handleClick} />
            </li>
            <li className="dropdown-item dropdown-submenu">
              <I18n>Other variables</I18n>
              <OtherVariablesMenu handleClick={handleClick} />
            </li>
            <li className="dropdown-item dropdown-submenu">
              <I18n>Date Formats</I18n>
              <DateFormatMenu
                handleClick={handleClick}
                selection={selection}
                dateFormats={dateFormats}
              />
            </li>
          </DropdownMenu>
        </UncontrolledButtonDropdown>
      </div>
      <div className="form-group col-md-6 d-flex justify-content-end align-items-end">
        <I18n
          render={translate => (
            <button
              type="button"
              className="btn btn-icon"
              aria-label={translate('Toggle Help')}
              onClick={toggleHelp}
              title={translate('Toggle Help')}
            >
              <span className="fa fa-fw fa-2x fa-info-circle" />
            </button>
          )}
        />
      </div>
    </div>
    <Collapse className="formRow" isOpen={showHelp}>
      <p>
        <I18n>
          Use the dropdown to insert dynamic elements within the subject and
          body of your templates. Just put your cursor into one of those fields
          where you want the element to appear and choose an option from the
          dropdown list.
        </I18n>
      </p>
      <p>
        <I18n>
          Selecting a Kapp and Form will populate the dropdown menu with
          available options.
        </I18n>
      </p>
      <p>
        <I18n>
          Caution: Email templates can be used by any process. Since not all
          Kapps have the same attributes and not all forms have the same
          attributes or fields, relying on attributes or fields that may not
          exist will yield unexpected results. Test your email templates!
        </I18n>
      </p>
    </Collapse>
  </div>
);

export const mapStateToProps = state => ({
  space: state.app.space,
  kapps: state.app.kapps,
  forms: state.settingsNotifications.variables,
  dateFormats: state.settingsNotifications.dateFormats
    .filter(submission => submission.values.Status === 'Active')
    .map(submission => submission.values.Name),
  snippets: state.settingsNotifications.snippets.filter(
    submission => submission.values.Status === 'Active',
  ),
});

const mapDispatchToProps = {
  fetchSnippets: actions.fetchSnippetsRequest,
  fetchDateFormats: actions.fetchDateFormatsRequest,
  fetchVariables: actions.fetchVariablesRequest,
};

export const NotificationMenu = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
    null,
    { context },
  ),
  withState('selectedKapp', 'setSelectedKapp', null),
  withState('selectedForm', 'setSelectedForm', null),
  withState('isDatastore', 'setIsDatastore', false),
  withState('showHelp', 'setShowHelp', false),
  withHandlers({
    handleClick: props => event => props.onSelect(event.target.dataset.value),
    handleKappSelect: props => event => {
      props.fetchVariables({ kappSlug: event.target.value });
      props.setSelectedKapp(
        props.kapps.find(kapp => kapp.slug === event.target.value),
      );
    },
    handleFormSelect: props => event => {
      props.setSelectedForm(
        props.forms.find(form => form.slug === event.target.value),
      );
    },
    toggleIsDatastore: props => () => {
      props.setIsDatastore(!props.isDatastore);
      if (!props.isDatastore) {
        props.fetchVariables({ kappSlug: 'app/datastore' });
      }
    },
    toggleHelp: props => () => props.setShowHelp(b => !b),
  }),
  lifecycle({
    componentDidMount() {
      this.props.fetchSnippets();
      this.props.fetchDateFormats();
    },
  }),
)(NotificationMenuComponent);
