import { call, put, takeEvery, select } from 'redux-saga/effects';
import {
  bundle,
  fetchForm,
  SubmissionSearch,
  searchSubmissions,
  fetchSubmission,
  fetchKapp,
  updateForm,
  createForm,
  deleteForm,
} from '@kineticdata/react';
import {
  addToast,
  addToastAlert,
  addSuccess,
  addError,
} from '@kineticdata/bundle-common';
import axios from 'axios';
import {
  actions,
  types,
  FORM_INCLUDES,
  FORM_FULL_INCLUDES,
  SUBMISSION_INCLUDES,
} from '../modules/settingsForms';

export function* fetchFormSaga(action) {
  const { error, form } = yield call(fetchForm, {
    kappSlug: action.payload.kappSlug,
    formSlug: action.payload.formSlug,
    include: FORM_INCLUDES,
  });

  if (error) {
    yield put(actions.setFormsError(error));
  } else {
    yield put(actions.setForm(form));
  }
}

export function* fetchFormRequestSaga({ payload }) {
  const { error, form } = yield call(fetchForm, {
    kappSlug: payload.kappSlug,
    formSlug: payload.formSlug,
    include: FORM_INCLUDES,
  });

  if (error) {
    yield put(actions.fetchFormFailure(error));
  } else {
    yield put(actions.fetchFormSuccess(form));
  }
}

export function* cloneFormSaga({ payload }) {
  const { error: cloneError, form: cloneForm } = yield call(fetchForm, {
    kappSlug: payload.kappSlug,
    formSlug: payload.cloneFormSlug,
    include: FORM_FULL_INCLUDES,
  });

  if (cloneError) {
    addToastAlert({
      title: 'Error Cloning Form',
      message: 'Could not find form to clone.',
    });
    yield put(actions.cloneFormComplete(payload));
  } else {
    const { error, form } = yield call(updateForm, {
      kappSlug: payload.kappSlug,
      formSlug: payload.formSlug,
      form: {
        bridgedResources: cloneForm.bridgedResources,
        customHeadContent: cloneForm.customHeadContent,
        pages: cloneForm.pages,
        securityPolicies: cloneForm.securityPolicies,
        attributesMap: cloneForm.attributesMap,
        categorizations: cloneForm.categorizations,
      },
    });

    if (error) {
      addToastAlert({
        title: 'Error Cloning Form',
        message: error.message,
      });
      yield put(actions.cloneFormComplete(payload));
    }

    addToast(`${form.name} cloned successfully from ${cloneForm.name}`);
    if (typeof payload.callback === 'function') {
      payload.callback(form);
    }
    yield put(actions.cloneFormComplete(payload));
  }
}

export function* fetchFormSubmissionsSaga(action) {
  const kappSlug = action.payload.kappSlug;
  const pageToken = action.payload.pageToken;
  const formSlug = action.payload.formSlug;
  const q = action.payload.q;
  const searchBuilder = new SubmissionSearch().includes([
    'details',
    'values',
    'form',
    'form.kapp',
  ]);
  // Add some of the optional parameters to the search
  if (pageToken) searchBuilder.pageToken(pageToken);
  // Loop over items in q and append them as "eq"
  // to search build
  if (q) {
    for (const key in q) {
      searchBuilder.eq(key, q[key]);
    }
  }
  searchBuilder.end();
  const search = searchBuilder.build();

  const { submissions, nextPageToken, error } = yield call(searchSubmissions, {
    search,
    kapp: kappSlug,
    form: formSlug,
  });

  if (error) {
    yield put(actions.setFormsError(error));
  } else {
    yield put(actions.setFormSubmissions({ submissions, nextPageToken }));
  }
}

export function* fetchFormSubmissionSaga(action) {
  const id = action.payload.id;
  const { submission, error } = yield call(fetchSubmission, {
    id,
    include: SUBMISSION_INCLUDES,
  });
  if (error) {
    yield put(actions.setFormsError(error));
  } else {
    yield put(actions.setFormSubmission(submission));
  }
}

export function* fetchKappSaga(action) {
  const { error, kapp } = yield call(fetchKapp, {
    kappSlug: action.payload,
    include: 'formTypes, categories, formAttributeDefinitions',
  });

  if (error) {
    yield put(actions.setFormsError(error));
  } else {
    const me = yield select(state => state.app.profile);
    if (
      me.spaceAdmin &&
      !kapp.formAttributeDefinitions.find(d => d.name === 'Form Configuration')
    ) {
      // Create Form Configuration Definition if it doesn't exist
      yield call(axios.request, {
        method: 'post',
        url: `${bundle.apiLocation()}/kapps/${
          kapp.slug
        }/formAttributeDefinitions`,
        data: {
          name: 'Form Configuration',
          allowsMultiple: false,
        },
      });
    }

    yield put(actions.setKapp(kapp));
  }
}

export function* updateFormSaga(action) {
  const currentForm = action.payload.form;
  const currentFormChanges = action.payload.inputs;
  const formContent = {
    attributesMap: {
      'Permitted Subtasks': currentFormChanges['Permitted Subtasks']
        ? [currentFormChanges['Permitted Subtasks'].join(',')]
        : [],
      'Prohibit Subtasks': currentFormChanges['Prohibit Subtasks']
        ? [currentFormChanges['Prohibit Subtasks']]
        : [],
      'Allow Reassignment': currentFormChanges['Allow Reassignment']
        ? [currentFormChanges['Allow Reassignment']]
        : [],
      'Assignable Teams': currentFormChanges['Assignable Teams']
        ? currentFormChanges['Assignable Teams']
        : [],
      'Notification Template Name - Create': currentFormChanges[
        'Notification Template Name - Create'
      ]
        ? [currentFormChanges['Notification Template Name - Create']]
        : [],
      'Notification Template Name - Complete': currentFormChanges[
        'Notification Template Name - Complete'
      ]
        ? [currentFormChanges['Notification Template Name - Complete']]
        : [],
      'Owning Team': currentFormChanges['Owning Team']
        ? currentFormChanges['Owning Team']
        : [],
      'Form Configuration': [
        JSON.stringify({
          columns: currentFormChanges.columns.toJS(),
        }),
      ],
    },
    status: currentFormChanges.status,
    type: currentFormChanges.type,
    description: currentFormChanges.description,
    categorizations: currentFormChanges.categories,
  };
  const { error } = yield call(updateForm, {
    kappSlug: action.payload.kappSlug,
    formSlug: currentForm.slug,
    form: formContent,
    include: FORM_INCLUDES,
  });
  if (!error) {
    yield put(
      addSuccess('The form was successfully updated.', 'Update Successful'),
    );
    yield put(
      actions.fetchForm({
        kappSlug: action.payload.kappSlug,
        formSlug: currentForm.slug,
      }),
    );
  }
}

export function* fetchNotificationsSaga() {
  const search = new SubmissionSearch(true)
    .index('values[Name]')
    .includes(['details', 'values'])
    .build();

  const { error, submissions } = yield call(searchSubmissions, {
    search,
    form: 'notification-data',
    datastore: true,
  });

  if (error) {
    yield put(actions.setFormsError(error));
  } else {
    yield put(actions.setNotifications(submissions));
  }
}

export function* createFormSaga(action) {
  const { error, form } = yield call(fetchForm, {
    kappSlug: action.payload.kappSlug,
    formSlug: action.payload.inputs['Template to Clone'],
    include: FORM_FULL_INCLUDES,
  });

  if (error) {
    yield put(actions.setFormsError(error));
  }

  const formContent = {
    ...form,
    slug: action.payload.inputs.Slug,
    name: action.payload.inputs.Name,
    description: action.payload.inputs.Description,
    status: action.payload.inputs.Status,
    type: action.payload.inputs.Type,
    attributesMap: {
      ...form.attributesMap,
      'Owning Team': action.payload.inputs['Owning Team'],
    },
  };

  const createdForm = yield call(createForm, {
    kappSlug: action.payload.kappSlug,
    form: formContent,
    include: FORM_FULL_INCLUDES,
  });
  if (createdForm.error) {
    yield put(addError(createdForm.error.message));
  } else {
    if (typeof action.payload.callback === 'function') {
      action.payload.callback(createdForm.form.slug);
    }
  }
}

export function* fetchAllSubmissionsSaga(action) {
  const {
    pageToken,
    accumulator,
    formSlug,
    kappSlug,
    createdAt,
    coreState,
    q,
  } = action.payload;
  const searcher = new SubmissionSearch(false); // changed to false!

  if (q) {
    for (const key in q) {
      searcher.eq(key, q[key]);
    }
  }
  if (createdAt) {
    createdAt['startDate'] && searcher.startDate(createdAt['startDate']);
    createdAt['endDate'] && searcher.endDate(createdAt['endDate']);
  }
  if (coreState) {
    searcher.coreState(coreState);
  }
  searcher.include('values,form,form.kapp');
  searcher.limit(1000);
  if (pageToken) {
    searcher.pageToken(pageToken);
  }

  const { submissions, nextPageToken = null, error } = yield call(
    searchSubmissions,
    {
      search: searcher.build(),
      form: formSlug,
      kapp: kappSlug,
    },
  );

  // Update the action with the new results
  action = {
    ...action,
    payload: {
      ...action.payload,
      accumulator: [...accumulator, ...submissions],
      pageToken: nextPageToken,
    },
  };

  yield put(actions.setExportCount(action.payload.accumulator.length));

  if (nextPageToken) {
    yield call(fetchAllSubmissionsSaga, action);
  } else {
    if (error) {
      // What should we do?
      console.log(error);
    } else {
      yield put(actions.setExportSubmissions(action.payload.accumulator));
    }
  }
}

export function* deleteFormSaga({ payload }) {
  const { form, error } = yield call(deleteForm, {
    kappSlug: payload.kappSlug,
    formSlug: payload.formSlug,
  });
  if (form) {
    if (typeof payload.onSuccess === 'function') {
      yield call(payload.onSuccess, form);
    }
    yield put(actions.deleteFormComplete(payload));
    addToast('Form deleted successfully.');
  } else {
    addToastAlert({ title: 'Error Deleting Form', message: error.message });
  }
}

export function* watchSettingsForms() {
  yield takeEvery(types.FETCH_FORM, fetchFormSaga);
  yield takeEvery(types.FETCH_FORM_REQUEST, fetchFormRequestSaga);
  yield takeEvery(types.FETCH_KAPP, fetchKappSaga);
  yield takeEvery(types.UPDATE_QUEUE_FORM, updateFormSaga);
  yield takeEvery(types.CREATE_FORM, createFormSaga);
  yield takeEvery(types.CLONE_FORM_REQUEST, cloneFormSaga);
  yield takeEvery(types.FETCH_NOTIFICATIONS, fetchNotificationsSaga);
  yield takeEvery(types.FETCH_FORM_SUBMISSIONS, fetchFormSubmissionsSaga);
  yield takeEvery(types.FETCH_FORM_SUBMISSION, fetchFormSubmissionSaga);
  yield takeEvery(types.FETCH_ALL_SUBMISSIONS, fetchAllSubmissionsSaga);
  yield takeEvery(types.DELETE_FORM_REQUEST, deleteFormSaga);
}
