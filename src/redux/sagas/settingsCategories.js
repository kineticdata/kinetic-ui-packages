import { call, put, takeEvery } from 'redux-saga/effects';
import { fetchCategories } from 'react-kinetic-lib';
import { toastActions } from 'common';
import { actions, types } from '../modules/settingsCategories';

export function* fetchCategoriesSaga(action) {
  const { serverError, categories } = yield call(fetchCategories, {
    kappSlug: action.payload,
    include: 'attributes',
  });

  if (serverError) {
    yield put(
      toastActions.addError('Failed to fetch categories.', 'Fetch Categories'),
    );
    yield put(actions.setCategoriesErrors(serverError));
  } else {
    yield put(actions.setCategories(categories));
  }
}

export function* watchSettingsCategories() {
  yield takeEvery(types.FETCH_CATEGORIES, fetchCategoriesSaga);
}
