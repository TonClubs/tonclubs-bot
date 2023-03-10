import dedent from 'dedent';
import {type Message} from 'node-telegram-bot-api';
import {store, ActiveFormActions, ConnectCollectionFormActions} from '../Redux';
import {Bot, Debug} from '../Services';
import {CheckGroupRequirements} from '../Utils/Helpers';

export default async (msg: Message, type: 'request' | 'confirm' | 'discard'): Promise<void> => {
  if (msg.chat.type !== 'supergroup') return;

  const ok = await CheckGroupRequirements(msg.chat.id, false);

  Debug.bot('Group Requirement Checks %o', ok);

  if (!ok) return;

  if (type === 'request') {
    store.dispatch(
      ActiveFormActions.setActiveForm({chatId: msg.chat.id, activeForm: 'conectCollectionForm'}),
    );
    store.dispatch(ConnectCollectionFormActions.clearForm({chatId: msg.chat.id}));

    Bot.sendMessage(
      msg.chat.id,
      dedent`
        Please enter the address of your NFT collection.
        Please note that using collections created by other tools may cause unexpected behavior and may be incompatible with the future versions of the bot.
      `,
    );

    store.dispatch(
      ConnectCollectionFormActions.setNextField({chatId: msg.chat.id, nextField: 'address'}),
    );
  }

  if (type === 'confirm') {
    // TODO: Connect collection
  }

  if (type === 'discard') {
    store.dispatch(ActiveFormActions.setActiveForm({chatId: msg.chat.id, activeForm: 'none'}));
    store.dispatch(ConnectCollectionFormActions.clearForm({chatId: msg.chat.id}));

    await Bot.sendMessage(
      msg.chat.id,
      'Okay, I have discarded your request. You can go ahead and type /create again to start over.',
    );
  }
};
