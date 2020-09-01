import { reducer as app } from './modules/app';
import { reducer as errors } from './modules/errors';
import { reducer as settingsApp } from './modules/settingsApp';
import { reducer as settingsDatastore } from './modules/settingsDatastore';
import { reducer as settingsNotifications } from './modules/settingsNotifications';
import { reducer as settingsRobots } from './modules/settingsRobots';
import { reducer as settingsUsers } from './modules/settingsUsers';

export default {
  app,
  errors,
  settingsApp,
  settingsDatastore,
  settingsNotifications,
  settingsRobots,
  settingsUsers,
};
