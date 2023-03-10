import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';
import type {ChatId} from 'node-telegram-bot-api';

type _ConnectCollectionForm = {
  address?: string;
};

type NextField = 'done' | keyof _ConnectCollectionForm;

type ConnectCollectionForm = _ConnectCollectionForm & {
  nextField?: NextField;
};

export type ConnectCollectionFormState = Record<ChatId, ConnectCollectionForm | undefined>;

const initialState: ConnectCollectionFormState = {};

export const connectCollectionFormSlice = createSlice({
  name: 'connectCollectionForm',
  initialState,
  reducers: {
    updateForm: (
      state,
      action: PayloadAction<{
        chatId: ChatId;
        fields: Partial<ConnectCollectionForm>;
      }>,
    ) => {
      state[action.payload.chatId] = {
        nextField: 'done',
        ...state[action.payload.chatId],
        ...action.payload.fields,
      };
    },

    clearForm: (state, action: PayloadAction<{chatId: ChatId}>) => {
      delete state[action.payload.chatId];
    },

    setNextField: (state, action: PayloadAction<{chatId: ChatId; nextField: NextField}>) => {
      if (state[action.payload.chatId]) {
        (state[action.payload.chatId] as ConnectCollectionForm).nextField =
          action.payload.nextField;
      } else {
        state[action.payload.chatId] = {nextField: action.payload.nextField};
      }
    },
  },
});

export const ConnectCollectionFormActions = connectCollectionFormSlice.actions;

export default connectCollectionFormSlice.reducer;
