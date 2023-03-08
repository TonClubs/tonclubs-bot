import {type Message} from 'node-telegram-bot-api';
import {Bot} from '../Services';
import {CheckGroupRequirements} from '../Utils/Helpers';

export default async (msg: Message): Promise<void> => {
  if (msg.chat.type === 'private') {
    await Bot.sendMessage(
      msg.chat.id,
      `Great! Let's setup a new group. As a first step, please add me to the group you want to create. And we will continue from there.`,
    );
  }

  const ok = await CheckGroupRequirements(msg.chat.id, false);

  if (!ok) return;

  // TODO: Setup group
};
