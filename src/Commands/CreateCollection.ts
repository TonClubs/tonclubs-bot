import dedent from 'dedent';
import {type Message} from 'node-telegram-bot-api';
import {Bot, Debug} from '../Services';
import {CheckGroupRequirements} from '../Utils/Helpers';

export default async (msg: Message): Promise<void> => {
  if (msg.chat.type !== 'supergroup') return;

  const ok = await CheckGroupRequirements(msg.chat.id, false);

  Debug.bot('Group Requirement Checks %o', ok);

  if (!ok) return;

  await Bot.sendMessage(
    msg.chat.id,
    "Great! Let's create a new collection! As a first step, please enter the name of your collection.",
    {
      reply_markup: {
        force_reply: true,
      },
    },
  );
};
