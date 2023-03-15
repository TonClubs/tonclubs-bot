import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';
import type {ChatId} from 'node-telegram-bot-api';

type ActiveForm = undefined | 'none' | 'conectCollectionForm' | 'createCollectionForm' | 'mintForm';

export type ActiveFormState = Record<ChatId, ActiveForm>;

const initialState: ActiveFormState = {};

export const activeFormSlice = createSlice({
  name: 'activeForm',
  initialState,
  reducers: {
    setActiveForm: (state, action: PayloadAction<{chatId: ChatId; activeForm: ActiveForm}>) => {
      state[action.payload.chatId] = action.payload.activeForm;
    },
  },
});

export const ActiveFormActions = activeFormSlice.actions;

export default activeFormSlice.reducer;
