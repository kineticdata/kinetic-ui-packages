const handlers = {};

export const regHandlers = newHandlers => {
  Object.assign(handlers, newHandlers);
};

export const reducer = (state, action) =>
  handlers[action.type] ? handlers[action.type](state, action) : state;
