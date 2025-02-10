import React, { createContext } from 'react';

export const GlobalsContext = createContext();

export const GlobalsProvider = props => (
  <GlobalsContext.Provider value={props.globals}>
    {props.children}
  </GlobalsContext.Provider>
);
