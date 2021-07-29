import React, { Fragment } from 'react';
import { CoreForm } from '@kineticdata/react';
import { PageTitle } from '../shared/PageTitle';

import { I18n } from '@kineticdata/react';

export const Form = ({
  form,
  type,
  category,
  submissionId,
  handleCreated,
  handleUpdated,
  handleCompleted,
  handleLoaded,
  handleDelete,
  handleUnauthorized,
  values,
  kappSlug,
  formSlug,
  path,
  appLocation,
  authenticated,
}) => (
  <Fragment>
    <div className="page-container">
      <div className="page-panel">
        <PageTitle
          parts={[form ? form.name : '']}
          breadcrumbs={[
            { label: 'Home', to: '/' },
            path.includes('request/') && {
              label: 'My Requests',
              to: `${appLocation}/requests`,
            },
            path.includes('request/') &&
              type && {
                label: type,
                to: `${appLocation}/requests/${type || ''}`,
              },
            category && {
              label: 'Service Catalog',
              to: `${appLocation}/categories`,
            },
            ...(category ? category.getTrail() : []).map(ancestorCategory => ({
              label: ancestorCategory.name,
              to: `${appLocation}/categories/${ancestorCategory.slug}`,
            })),
          ].filter(Boolean)}
          title={form ? form.name : ''}
          actions={
            authenticated && submissionId && form
              ? [{ label: 'Cancel Request', onClick: handleDelete }]
              : undefined
          }
        />
        <div className="form-description text-muted">
          {form && (
            <p>
              <I18n context={`kapps.${kappSlug}.forms.${form.slug}`}>
                {form.description}
              </I18n>
            </p>
          )}
        </div>
        <div className="embedded-core-form--wrapper mb-5">
          {submissionId ? (
            <I18n submissionId={submissionId} public={!authenticated}>
              <CoreForm
                submission={submissionId}
                loaded={handleLoaded}
                updated={handleUpdated}
                completed={handleCompleted}
                unauthorized={handleUnauthorized}
                public={!authenticated}
              />
            </I18n>
          ) : (
            <I18n
              context={`kapps.${kappSlug}.forms.${formSlug}`}
              public={!authenticated}
            >
              <CoreForm
                kapp={kappSlug}
                form={formSlug}
                loaded={handleLoaded}
                created={handleCreated}
                updated={handleUpdated}
                completed={handleCompleted}
                unauthorized={handleUnauthorized}
                values={values}
                public={!authenticated}
              />
            </I18n>
          )}
        </div>
      </div>
    </div>
  </Fragment>
);
