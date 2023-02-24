import createSagaMiddleware from 'redux-saga';
import * as effects from 'redux-saga/effects';
import { IO } from '@redux-saga/symbols';

// The list of saga effects that we support using as a single argument to the
// regSaga function.
const supportedEffects = [
  effects.takeEvery('NOOP', function*() {}).payload.fn,
  effects.takeLatest('NOOP', function*() {}).payload.fn,
  effects.takeLeading('NOOP', function*() {}).payload.fn,
  effects.throttle(0, 'NOOP', function*() {}).payload.fn,
  effects.debounce(0, 'NOOP', function*() {}).payload.fn,
];

const parseSagaEffect = sagaEffect => {
  if (sagaEffect[IO]) {
    if (supportedEffects.includes(sagaEffect.payload.fn)) {
      const args = sagaEffect.payload.args;
      const name = typeof args[0] === 'number' ? args[1] : args[0];
      const genFn = typeof args[0] === 'number' ? args[2] : args[1];
      if (typeof name === 'string') {
        return { name, genFn };
      } else {
        throw new Error(
          'regSaga called with saga effect that had non-string pattern',
        );
      }
    } else {
      throw new Error(
        'regSaga called with an unsupported saga effect, must be one of takeEvery, takeLatest, takeLeading, throttle, debounce',
      );
    }
  } else {
    throw new Error(
      'regSaga called with single value that is not not a saga effect',
    );
  }
};

export const sagaMiddleware = createSagaMiddleware();

const generatorFns = {};
const runningTasks = {};
const pendingTasks = {};

/**
 * Takes either a single argument which should be a saga effect that we can
 * extract from which we can extract the name automatically.  Or a pair of
 * arguments, the name and the saga generator function.
 */
export const regSaga = (arg0, arg1) => {
  if (arg1) {
    pendingTasks[arg0] = arg1;
    generatorFns[arg0] = arg1;
  } else {
    const { name, genFn } = parseSagaEffect(arg0);
    pendingTasks[name] = function*() {
      yield arg0;
    };
    generatorFns[name] = genFn;
  }
};

export const commitSagas = () => {
  Object.entries(pendingTasks).forEach(([name, saga]) => {
    if (runningTasks[name] && runningTasks[name].isRunning()) {
      runningTasks[name].cancel();
    }
    runningTasks[name] = sagaMiddleware.run(saga);
    delete pendingTasks[name];
  });
};

export const runSaga = (name, ...args) => generatorFns[name](...args);
