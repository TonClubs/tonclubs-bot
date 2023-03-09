import {type Message} from 'node-telegram-bot-api';
import {store, ActiveFormActions, CreateCollectionFormActions} from '../Redux';
import {Bot, Debug} from '../Services';
import {CheckGroupRequirements} from '../Utils/Helpers';

export default async (msg: Message, type: 'request' | 'confirm' | 'discard'): Promise<void> => {
  if (msg.chat.type !== 'supergroup') return;

  const ok = await CheckGroupRequirements(msg.chat.id, false);

  Debug.bot('Group Requirement Checks %o', ok);

  if (!ok) return;

  if (type === 'request') {
    store.dispatch(
      ActiveFormActions.setActiveForm({chatId: msg.chat.id, activeForm: 'createCollectionForm'}),
    );

    store.dispatch(CreateCollectionFormActions.clearForm({chatId: msg.chat.id}));

    await Bot.sendMessage(
      msg.chat.id,
      "Great! Let's create a new collection! As a first step, please enter the name of your collection.",
    );

    store.dispatch(
      CreateCollectionFormActions.setNextField({
        chatId: msg.chat.id,
        nextField: 'name',
      }),
    );

    return;
  }

  if (type === 'confirm') {
    // TODO: Send transaction to create collection
  }

  if (type === 'discard') {
    store.dispatch(ActiveFormActions.setActiveForm({chatId: msg.chat.id, activeForm: 'none'}));
    store.dispatch(CreateCollectionFormActions.clearForm({chatId: msg.chat.id}));

    await Bot.sendMessage(
      msg.chat.id,
      'Okay, I have discarded your request. You can go ahead and type /create again to start over.',
    );
  }
};
