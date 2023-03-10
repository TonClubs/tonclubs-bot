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
    // TODO: Request collection
  }

  if (type === 'confirm') {
    // TODO: Connect collection
  }

  if (type === 'discard') {
    // TODO: Discard request
  }
};
