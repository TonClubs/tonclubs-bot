import {configureStore, combineReducers} from '@reduxjs/toolkit';

import CreateCollectionFormReducer from './Reducers/CreateCollectionFormSlice';
import ActiveFormReducer from './Reducers/ActiveFormSlice';

export const store = configureStore({
  reducer: combineReducers({
    createCollectionForm: CreateCollectionFormReducer,
    activeForm: ActiveFormReducer,
  }),
});

export type RootState = ReturnType<typeof store.getState>;
