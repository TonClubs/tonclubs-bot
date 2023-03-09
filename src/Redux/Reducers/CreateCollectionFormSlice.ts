import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from '@reduxjs/toolkit';
import type {ChatId} from 'node-telegram-bot-api';

type _CreateCollectionForm = {
  name?: string;
  description?: string;
  image?: string;
  price?: number;
  limit?: number;
};

type NextField = 'done' | keyof _CreateCollectionForm;

type CreateCollectionForm = _CreateCollectionForm & {
  nextField?: NextField;
};

export type CreateCollectionFormState = Record<ChatId, CreateCollectionForm | undefined>;

const initialState: CreateCollectionFormState = {};

export const createCollectionFormSlice = createSlice({
  name: 'createCollectionForm',
  initialState,
  reducers: {
    updateForm: (
      state,
      action: PayloadAction<{
        chatId: ChatId;
        fields: Partial<CreateCollectionForm>;
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
        (state[action.payload.chatId] as CreateCollectionForm).nextField = action.payload.nextField;
      } else {
        state[action.payload.chatId] = {nextField: action.payload.nextField};
      }
    },
  },
});

export const CreateCollectionFormActions = createCollectionFormSlice.actions;

export default createCollectionFormSlice.reducer;
