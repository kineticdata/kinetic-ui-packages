import React from 'react';
import { connect } from 'react-redux';
import { compose, withHandlers, withProps } from 'recompose';
import { actions } from '../../redux/modules/submission';
import { modalFormActions, Utils } from 'common';
import { I18n } from '../../../../app/src/I18nProvider';

const CommentButton = props =>
  props.enableButton && (
    <button
      type="button"
      onClick={props.handleClick}
      className="btn btn-success"
    >
      <I18n>Start Discussion</I18n>
    </button>
  );

export const mapStateToProps = state => ({});

export const mapDispatchToProps = {
  setSendMessageModalOpen: actions.setSendMessageModalOpen,
};

const enhance = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withProps(props => {
    const disabledAttribute = Utils.getAttributeValue(
      props.submission.form,
      'Comment Disabled',
      'false',
    ).toLowerCase();
    return {
      enableButton:
        disabledAttribute === 'true' || disabledAttribute === 'yes'
          ? false
          : true,
    };
  }),
  withHandlers({
    handleClick: props => () => props.setSendMessageModalOpen(true, 'comment'),
  }),
);

export const CommentButtonContainer = enhance(CommentButton);