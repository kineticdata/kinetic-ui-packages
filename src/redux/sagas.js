import { all } from 'redux-saga/effects';
import { watchApp } from './sagas/app';
import { watchSettingsApp } from './sagas/settingsApp';
import { watchSettingsDatastore } from './sagas/settingsDatastore';
import { watchSettingsNotifications } from './sagas/settingsNotifications';
import { watchSettingsRobots } from './sagas/settingsRobots';
import { watchSettingsUsers } from './sagas/settingsUsers';

export default function* sagas() {
  yield all([
    watchApp(),
    watchSettingsApp(),
    watchSettingsDatastore(),
    watchSettingsNotifications(),
    watchSettingsRobots(),
    watchSettingsUsers(),
  ]);
}
