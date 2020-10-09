import React from 'react';
import t from 'prop-types';
import moment from 'moment';

const DateBanner = props => (
  <div className="date-divider">
    <hr />
    <span>{moment(props.date).format('MMMM Do, YYYY')}</span>
    <hr />
  </div>
);
DateBanner.propTypes = {
  /** The date object to use for the banner output. */
  date: t.oneOfType([t.instanceOf(Date), t.string]).isRequired,
};

export { DateBanner };
