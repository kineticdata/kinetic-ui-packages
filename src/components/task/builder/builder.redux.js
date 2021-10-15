import { all, call, put, select, takeEvery } from 'redux-saga/effects';
import { List, OrderedMap } from 'immutable';
import { isFunction } from 'lodash-es';
import { action, dispatch, regHandlers, regSaga } from '../../../store';
import {
  deserializeTree,
  serializeTree,
  Connector,
  TreeBuilderState,
  deserializeWebApi,
} from './models';
import {
  cloneTree,
  fetchTaskCategories,
  fetchTree,
  fetchWebApi,
  updateTree,
  updateWebApi,
} from '../../../apis';
import { renameDependencies, treeReturnTask } from './helpers';

export const mountTreeBuilder = treeKey => dispatch('TREE_MOUNT', { treeKey });
export const unmountTreeBuilder = treeKey =>
  dispatch('TREE_UNMOUNT', { treeKey });
export const configureTreeBuilder = props => dispatch('TREE_CONFIGURE', props);

// Helper that adds the present state to the past stack and clears the future
// stack. This should be called by reducer cases that will be undo/redo able.
const remember = (state, treeKey) =>
  state
    .updateIn(['trees', treeKey, 'undoStack'], stack =>
      stack.push({
        tree: state.getIn(['trees', treeKey, 'tree']),
        webApi: state.getIn(['trees', treeKey, 'webApi']),
      }),
    )
    .deleteIn(['trees', treeKey, 'redoStack']);

regSaga(
  takeEvery('TREE_CONFIGURE', function*({ payload }) {
    try {
      const { name, sourceGroup, sourceName, treeKey } = payload;
      const webApiProps = getWebApiProps(payload);

      const [{ tree }, { categories }, { webApi }] = yield all([
        call(fetchTree, {
          name,
          sourceGroup,
          sourceName,
          include: 'bindings,categories,details,treeJson,inputs,outputs',
        }),
        call(fetchTaskCategories, {
          include:
            'handlers.results,handlers.parameters,trees.parameters,trees.inputs,trees.outputs',
        }),
        webApiProps
          ? call(fetchWebApi, {
              ...webApiProps,
              include: 'details,securityPolicies',
            })
          : {},
      ]);
      yield put(
        action('TREE_LOADED', {
          categories,
          kappSlug: webApiProps && webApiProps.kappSlug,
          treeKey,
          tree: deserializeTree(tree),
          webApi: webApiProps && deserializeWebApi(webApi),
        }),
      );
    } catch (e) {
      console.error('Caught error loading tree', e);
    }
  }),
);

regSaga(
  takeEvery('TREE_SAVE', function*({ payload }) {
    try {
      // because of the optimistic locking functionality newName / overwrite can
      // be passed as options to the builder's save function
      const { newName, onError, onSave, overwrite, treeKey } = payload;
      const { kappSlug, lastSave, lastWebApi, tree, webApi } = yield select(
        state => state.getIn(['trees', treeKey]),
      );
      const { name, sourceGroup, sourceName } = lastSave;
      // if a newName was passed we will be creating a new tree with the builder
      // contents, otherwise just an update
      const { error: error1, tree: newTree } = yield newName
        ? call(cloneTree, {
            name,
            sourceGroup,
            sourceName,
            tree: {
              name: newName,
              ...serializeTree(tree, true),
            },
          })
        : call(updateTree, {
            name,
            sourceGroup,
            sourceName,
            tree: serializeTree(tree, overwrite),
          });

      const { error: error2 } = yield webApi && !error1
        ? call(updateWebApi, {
            slug: lastWebApi.get('slug'),
            kappSlug,
            webApi,
          })
        : {};

      const error = error1 || error2;

      // dispatch the appropriate action based on the result of the call above
      yield put(
        error
          ? action('TREE_SAVE_ERROR', {
              treeKey,
              error: error.message || error,
              onError,
            })
          : action('TREE_SAVE_SUCCESS', {
              previousTree: lastSave,
              treeKey,
              tree: newTree,
              webApi,
              onSave,
            }),
      );
    } catch (e) {
      console.error(e);
    }
  }),
);

regSaga(
  takeEvery('TREE_SAVE_ERROR', function*({ payload: { error, onError } }) {
    try {
      if (isFunction(onError)) {
        yield call(onError, error);
      }
    } catch (e) {
      console.error(e);
    }
  }),
);

regSaga(
  takeEvery('TREE_SAVE_SUCCESS', function*({
    payload: { onSave, previousTree, treeKey },
  }) {
    try {
      if (isFunction(onSave)) {
        const tree = yield select(state =>
          state.getIn(['trees', treeKey, 'tree']),
        );
        yield call(onSave, tree, previousTree);
      }
    } catch (e) {
      console.error(e);
    }
  }),
);

regHandlers({
  // the TreeBuilder component does nothing while the tree state is undefined,
  // on mount we set it to null to signal to the component to dispatch the
  // configure action with its configuration props
  TREE_MOUNT: (state, { payload: { treeKey } }) =>
    state.setIn(['trees', treeKey], null),
  TREE_CONFIGURE: (state, { payload: { treeKey } }) =>
    state.setIn(['trees', treeKey], TreeBuilderState()),
  TREE_UNMOUNT: (state, { payload: { treeKey } }) =>
    state.deleteIn(['trees', treeKey]),
  TREE_LOADED: (
    state,
    { payload: { categories, kappSlug, treeKey, tree, webApi } },
  ) =>
    state.mergeIn(['trees', treeKey], {
      kappSlug,
      lastSave: tree,
      lastWebApi: webApi,
      loading: false,
      tasks: List(categories)
        .map(
          category =>
            category.name === 'System Controls'
              ? {
                  ...category,
                  handlers: [...category.handlers, treeReturnTask(tree)],
                }
              : category,
        )
        .flatMap(category => [...category.handlers, ...category.trees])
        .sortBy(task => task.name)
        .reduce(
          (reduction, task) => reduction.set(task.definitionId, task),
          OrderedMap(),
        ),
      tree,
      webApi,
    }),
  TREE_SAVE: (state, { payload: { treeKey } }) =>
    state.mergeIn(['trees', treeKey], {
      saving: true,
    }),
  TREE_SAVE_ERROR: (state, { payload: { treeKey, error } }) =>
    state.mergeIn(['trees', treeKey], {
      error,
      saving: false,
    }),
  TREE_SAVE_SUCCESS: (state, { payload: { tree, treeKey, webApi } }) => {
    const newTree = state.getIn(['trees', treeKey, 'tree']).merge({
      name: tree.name,
      versionId: tree.versionId,
    });
    return state.mergeIn(['trees', treeKey], {
      dirty: false,
      error: null,
      lastSave: newTree,
      lastWebApi: webApi,
      saving: false,
      tree: newTree,
      webApi,
    });
  },
  TREE_UNDO: (state, { payload: { treeKey } }) =>
    state.getIn(['trees', treeKey, 'undoStack']).isEmpty()
      ? state
      : state
          .updateIn(['trees', treeKey], builderState =>
            builderState.merge({
              tree: builderState.undoStack.last().tree,
              redoStack: builderState.redoStack.push({
                tree: builderState.tree,
                webApi: builderState.webApi,
              }),
              undoStack: builderState.undoStack.butLast(),
              webApi: builderState.undoStack.last().webApi,
            }),
          )
          .updateIn(['trees', treeKey], synchronizeRoutineDefinition),
  TREE_REDO: (state, { payload: { treeKey } }) =>
    state.getIn(['trees', treeKey, 'redoStack']).isEmpty()
      ? state
      : state
          .updateIn(['trees', treeKey], builderState =>
            builderState.merge({
              tree: builderState.redoStack.last().tree,
              redoStack: builderState.redoStack.butLast(),
              undoStack: builderState.undoStack.push({
                tree: builderState.tree,
                webApi: builderState.webApi,
              }),
              webApi: builderState.redoStack.last().webApi,
            }),
          )
          .updateIn(['trees', treeKey], synchronizeRoutineDefinition),
  TREE_UPDATE: (state, { payload: { tree, treeKey } }) =>
    remember(state, treeKey).setIn(['trees', treeKey, 'tree'], tree),
  TREE_UPDATE_NODE: (
    state,
    {
      payload: {
        treeKey,
        id,
        messages,
        deferrable,
        defers,
        definitionId,
        dependencies,
        name,
        parameters,
        visible,
      },
    },
  ) =>
    remember(state, treeKey)
      .mergeIn(['trees', treeKey, 'tree', 'nodes', id], {
        deferrable,
        defers,
        definitionId,
        messages,
        name,
        parameters,
        visible,
      })
      .updateIn(
        ['trees', treeKey, 'tree'],
        renameDependencies(dependencies, name),
      ),
  TREE_UPDATE_NODE_POSITION: (state, { payload: { treeKey, id, position } }) =>
    remember(state, treeKey).setIn(
      ['trees', treeKey, 'tree', 'nodes', id, 'position'],
      position,
    ),
  TREE_REMOVE_NODE: (state, { payload: { treeKey, id } }) =>
    remember(state, treeKey)
      .deleteIn(['trees', treeKey, 'tree', 'nodes', id])
      .updateIn(['trees', treeKey, 'tree', 'connectors'], connectors =>
        connectors.filter(
          connector => connector.headId !== id && connector.tailId !== id,
        ),
      ),
  TREE_ADD_CONNECTOR: (state, { payload: { treeKey, headId, tailId } }) =>
    remember(state, treeKey).updateIn(['trees', treeKey, 'tree'], tree =>
      tree
        .update('connectors', connectors =>
          connectors.set(
            tree.nextConnectorId,
            Connector({
              id: tree.nextConnectorId,
              headId,
              tailId,
            }),
          ),
        )
        .update('nextConnectorId', id => id + 1),
    ),
  TREE_UPDATE_CONNECTOR: (
    state,
    { payload: { treeKey, id, type, label, condition } },
  ) =>
    state.hasIn(['trees', treeKey, 'tree', 'connectors', id])
      ? remember(state, treeKey).mergeIn(
          ['trees', treeKey, 'tree', 'connectors', id],
          {
            type,
            label,
            condition,
          },
        )
      : state,
  TREE_REMOVE_CONNECTOR: (state, { payload: { treeKey, id } }) =>
    remember(state, treeKey).deleteIn([
      'trees',
      treeKey,
      'tree',
      'connectors',
      id,
    ]),
  TREE_UPDATE_CONNECTOR_HEAD: (state, { payload: { treeKey, id, nodeId } }) =>
    remember(state, treeKey).setIn(
      ['trees', treeKey, 'tree', 'connectors', id, 'headId'],
      nodeId,
    ),
  TREE_UPDATE_CONNECTOR_TAIL: (state, { payload: { treeKey, id, nodeId } }) =>
    remember(state, treeKey).setIn(
      ['trees', treeKey, 'tree', 'connectors', id, 'tailId'],
      nodeId,
    ),
  TREE_UPDATE_SETTINGS: (state, { payload: { treeKey, values } }) => {
    // If the updated settings are for a routine we rebuild the "Tree Input"
    // bindings.
    const bindings = values.inputs
      ? {
          ...state.getIn(['trees', treeKey, 'tree', 'bindings']),
          'Tree Input': values.inputs
            .groupBy(input => input.get('name'))
            .map(list => list.first().get('name'))
            .map(name => `<%=@inputs['${name}']%>`)
            .toJS(),
        }
      : state.getIn(['trees', treeKey, 'tree', 'bindings']);
    return remember(state, treeKey)
      .mergeIn(['trees', treeKey, 'tree'], { ...values, bindings })
      .updateIn(['trees', treeKey], synchronizeRoutineDefinition);
  },
  TREE_UPDATE_WEB_API: (state, { payload: { treeKey, values } }) =>
    remember(state, treeKey)
      .mergeIn(['trees', treeKey, 'webApi'], values)
      .setIn(['trees', treeKey, 'tree', 'name'], values.slug),
});

const synchronizeRoutineDefinition = treeBuilderState => {
  const {
    tree: { definitionId, inputs, outputs },
  } = treeBuilderState;
  return treeBuilderState.update('tasks', tasks =>
    tasks.map(
      (task, taskDefinitionId) =>
        definitionId === taskDefinitionId
          ? { ...task, inputs: inputs.toJS(), outputs: outputs.toJS() }
          : task,
    ),
  );
};

const getWebApiProps = ({
  name,
  platformSourceName,
  sourceGroup,
  sourceName,
}) => {
  if (sourceName === platformSourceName && sourceGroup.startsWith('WebApis')) {
    const kappSlug = sourceGroup.startsWith('WebApis > ')
      ? sourceGroup.replace('WebApis > ', '')
      : undefined;
    const slug = name;
    return { kappSlug, slug };
  }
  return null;
};
