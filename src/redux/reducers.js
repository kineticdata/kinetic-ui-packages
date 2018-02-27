import appReducer from './modules/app';
import categoriesReducer from './modules/categories';
import formsReducer from './modules/forms';
import searchReducer from './modules/search';
import submissionsReducer from './modules/submissions';
import submissionReducer from './modules/submission';
import submissionCountsReducer from './modules/submissionCounts';
import systemErrorReducer from './modules/systemError';

export default {
  app: appReducer,
  categories: categoriesReducer,
  forms: formsReducer,
  search: searchReducer,
  submissions: submissionsReducer,
  submission: submissionReducer,
  submissionCounts: submissionCountsReducer,
  systemError: systemErrorReducer,
};
