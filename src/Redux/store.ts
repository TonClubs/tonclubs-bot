import {configureStore, combineReducers} from '@reduxjs/toolkit';

import ActiveFormReducer from './Reducers/ActiveFormSlice';
import CreateCollectionFormReducer from './Reducers/CreateCollectionFormSlice';
import ConnectCollectionFormReducer from './Reducers/ConnectCollectionFormSlice';

export const store = configureStore({
  reducer: combineReducers({
    activeForm: ActiveFormReducer,
    createCollectionForm: CreateCollectionFormReducer,
    connectCollectionForm: ConnectCollectionFormReducer,
  }),
});

export type RootState = ReturnType<typeof store.getState>;
