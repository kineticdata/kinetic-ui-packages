import React, { Fragment } from 'react';
import { ServiceCard } from '../shared/ServiceCard';
import { PageTitle } from '../shared/PageTitle';
import { StateListWrapper } from '@kineticdata/bundle-common';
import { I18n } from '@kineticdata/react';

export const FormList = ({
  forms,
  error,
  paging,
  hasNextPage,
  hasPreviousPage,
  pageIndexStart,
  pageIndexEnd,
  loadPreviousHandler,
  loadNextHandler,
}) => (
  <Fragment>
    <div className="page-container">
      <div className="page-panel">
        <div className="page-panel__header">
          <PageTitle
            parts={['Forms']}
            breadcrumbs={[{ label: 'services', to: '..' }]}
            title="All Forms"
          />
        </div>
        <div className="page-panel__body">
          <StateListWrapper
            data={forms}
            error={error}
            loadingTitle="Loading Forms"
            emptyTitle="No forms to display"
          >
            {data => (
              <Fragment>
                <div className="cards">
                  {forms
                    .map(form => ({
                      form,
                      path: form.slug,
                      key: form.slug,
                    }))
                    .map(props => <ServiceCard {...props} />)}
                </div>
                <div className="pagination-bar">
                  <I18n
                    render={translate => (
                      <button
                        className="btn btn-icon"
                        onClick={loadPreviousHandler}
                        disabled={paging || !hasPreviousPage}
                        title={translate('Previous Page')}
                      >
                        <span className="icon">
                          <span className="fa fa-fw fa-caret-left" />
                        </span>
                      </button>
                    )}
                  />
                  <small>
                    {paging ? (
                      <span className="fa fa-spinner fa-spin" />
                    ) : (
                      <strong>{`${pageIndexStart}-${pageIndexEnd}`}</strong>
                    )}
                  </small>
                  <I18n
                    render={translate => (
                      <button
                        className="btn btn-icon"
                        onClick={loadNextHandler}
                        disabled={paging || !hasNextPage}
                        title={translate('Next Page')}
                      >
                        <span className="icon">
                          <span className="fa fa-fw fa-caret-right" />
                        </span>
                      </button>
                    )}
                  />
                </div>
              </Fragment>
            )}
          </StateListWrapper>
        </div>
      </div>
    </div>
  </Fragment>
);
