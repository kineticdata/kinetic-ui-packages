import React from 'react';
import { Link } from 'react-router-dom';
import { ServiceCard } from '../ServiceCard';
import { PageTitle } from '../Shared/PageTitle';

export const FormList = ({ forms }) => (
  <div>
    <PageTitle parts={['Forms']} />
    <div className="services-bar">
      <span className="bordercolor" />
    </div>
    <div className="services-category-container container">
      <div className="page-title-wrapper">
        <div className="page-title">
          <h3>
            <Link to="/">services</Link> /
          </h3>
          <h1>All Forms</h1>
        </div>
      </div>
      <div className="c-cards-wrapper">
        {forms
          .map(form => ({
            form,
            path: `/forms/${form.slug}`,
            key: form.slug,
          }))
          .map(props => <ServiceCard {...props} />)}
      </div>
    </div>
  </div>
);
