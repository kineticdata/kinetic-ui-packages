import React from 'react';
import { I18n } from '../../../../app/src/I18nProvider';

export const CatalogSearch = props => (
  <form onSubmit={props.submitHandler(props)} className="search-box__form">
    <I18n
      render={translate => (
        <input
          type="text"
          placeholder={translate('Search services...')}
          value={props.searchTerm}
          autoFocus
          onChange={event => props.catalogSearchInput(event.target.value)}
        />
      )}
    />
    <button type="submit">
      <span className="fa fa-search" />
    </button>
  </form>
);
