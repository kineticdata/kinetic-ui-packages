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
  createWorkflow,
  updateWorkflow,
  createTree,
  fetchTaskCategories,
  fetchTree,
  fetchWebApi,
  updateTree,
  updateWebApi,
  fetchWorkflow,
  fetchPlatformItem,
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
      const {
        name,
        sourceGroup,
        sourceName,
        treeKey,
        platformSourceName,
      } = payload;
      const webApiProps = getWebApiProps(payload);
      const workflowProps = getWorkflowProps(payload);

      const [
        { tree, error: treeError },
        { workflow, error: workflowError },
        { categories },
        { webApi, error: webApiError },
      ] = yield all([
        // Fetch the tree if not a linked workflow
        !workflowProps
          ? call(fetchTree, {
              name,
              sourceGroup,
              sourceName,
              include: 'bindings,categories,details,treeJson,inputs,outputs',
            })
          : {},
        // Fetch the workflow if it is a linked workflow
        workflowProps ? call(fetchWorkflow, { ...workflowProps }) : {},
        // Fetch task categories
        call(fetchTaskCategories, {
          include:
            'handlers.results,handlers.parameters,trees.parameters,trees.inputs,trees.outputs',
        }),
        // Fetch the webAPI if applicable
        webApiProps
          ? call(fetchWebApi, {
              ...webApiProps,
              include: 'details,securityPolicies',
            })
          : {},
      ]);

      let workflowObject = workflow;
      let workflowObjectError = workflowError;
      // If a tree was fetched and the tree has platform item data, fetch the
      // platform item and then retrieve the workflow
      if (tree && tree.platformItemId && tree.platformItemType) {
        const { platformItem, error: platformItemError } = yield call(
          fetchPlatformItem,
          {
            type: tree.platformItemType,
            id: tree.platformItemId,
          },
        );
        if (platformItem) {
          const { workflow: linkedWorkflow, error: linkedError } = yield call(
            fetchWorkflow,
            { workflowId: sourceGroup, ...getPlatformItemSlugs(platformItem) },
          );
          workflowObject = linkedWorkflow;
          workflowObjectError = linkedError;
        } else {
          // If platform item was not retrieved, show an error because we don't
          // want to render a workflow using a tree route
          workflowObjectError =
            platformItemError || 'Failed to load linked workflow.';
        }
      }

      // If workflow, set sourceName to platformSourceName since the value is
      // needed when creating new runs
      const treeObject = workflowObject
        ? { sourceName: platformSourceName, ...workflowObject }
        : tree;

      const loadError = workflowObjectError || treeError || webApiError;

      yield put(
        action('TREE_LOADED', {
          categories,
          kappSlug: webApiProps?.kappSlug || workflowProps?.kappSlug,
          formSlug: workflowProps?.formSlug,
          treeKey,
          tree:
            // Don't set the tree if it's for a webApi but the webApi errors
            treeObject && (!webApiProps || webApi)
              ? deserializeTree(treeObject)
              : null,
          webApi: webApi
            ? deserializeWebApi(webApi, webApiProps.kappSlug)
            : null,
          error: loadError ? loadError.message || loadError : null,
        }),
      );
    } catch (e) {
      console.error('Caught error loading tree', e);
    }
  }),
);

const getPlatformItemSlugs = platformItem =>
  // If platform item has a kapp property, then it's a form object
  platformItem?.kapp
    ? { formSlug: platformItem.slug, kappSlug: platformItem.kapp.slug }
    : // If platform item has a space property, than it's a kapp object
      platformItem?.space
      ? { kappSlug: platformItem.slug }
      : {};

regSaga(
  takeEvery('TREE_SAVE', function*({ payload }) {
    try {
      // because of the optimistic locking functionality newName / overwrite can
      // be passed as options to the builder's save function
      const { newName, onError, onSave, overwrite, treeKey } = payload;
      const {
        kappSlug,
        formSlug,
        lastSave,
        lastWebApi,
        tree,
        webApi,
      } = yield select(state => state.getIn(['trees', treeKey]));
      const { name, sourceGroup, sourceName } = lastSave;
      // if a newName was passed we will be creating a new tree with the builder
      // contents, otherwise just an update
      // additionally, if the tree is a linked workflow then we call a core
      // endpoint to create the workflow
      const {
        error: error1,
        tree: newTree,
        workflow: newWorkflow,
      } = yield newName
        ? tree.event
          ? call(createWorkflow, {
              workflow: { ...serializeTree(tree), name: newName },
              kappSlug,
              formSlug,
            })
          : call(createTree, {
              tree: {
                ...serializeTree(tree, true),
                name: newName,
              },
            })
        : tree.event
          ? call(updateWorkflow, {
              workflowId: sourceGroup,
              workflow: serializeTree(tree, overwrite),
              kappSlug,
              formSlug,
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
              tree: newTree || newWorkflow,
              webApi,
              onSave,
              scope: { kappSlug, formSlug },
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
    payload: { onSave, previousTree, treeKey, scope },
  }) {
    try {
      if (isFunction(onSave)) {
        const tree = yield select(state =>
          state.getIn(['trees', treeKey, 'tree']),
        );
        yield call(onSave, tree, previousTree, scope);
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
    {
      payload: { categories, kappSlug, formSlug, treeKey, tree, webApi, error },
    },
  ) =>
    state.mergeIn(['trees', treeKey], {
      kappSlug,
      formSlug,
      lastSave: tree,
      lastWebApi: webApi,
      loading: false,
      tasks: List(categories)
        .map(
          category =>
            category.name === 'System Controls'
              ? {
                  ...category,
                  handlers: [
                    ...category.handlers,
                    tree ? treeReturnTask(tree) : null,
                  ].filter(Boolean),
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
      error,
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
      sourceGroup: tree.sourceGroup,
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
      .setIn(['trees', treeKey, 'tree', 'name'], values.slug)
      .setIn(['trees', treeKey, 'tree', 'ownerEmail'], values.ownerEmail),
});

const synchronizeRoutineDefinition = treeBuilderState => {
  const { tree } = treeBuilderState;
  const { definitionId, inputs, outputs } = tree;
  return treeBuilderState.update('tasks', tasks =>
    tasks.map(
      (task, taskDefinitionId) =>
        definitionId === taskDefinitionId
          ? { ...task, inputs: inputs.toJS(), outputs: outputs.toJS() }
          : taskDefinitionId === 'system_tree_return_v1'
            ? treeReturnTask(tree)
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

const getWorkflowProps = ({ type, sourceGroup, kappSlug, formSlug }) => {
  if (type === 'workflow') {
    return { workflowId: sourceGroup, kappSlug, formSlug };
  }
  return null;
};
