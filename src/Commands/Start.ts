import {type Message} from 'node-telegram-bot-api';
import {Bot} from '../Services';
import {CheckGroupRequirements} from '../Utils/Helpers';

export default async (msg: Message): Promise<void> => {
  if (msg.chat.type !== 'private') {
    if (!msg.from?.id) return;

    CheckGroupRequirements(msg.chat.id, msg.from?.id, true);
    return;
  }

  await Bot.sendMessage(
    msg.chat.id,
    `Hello ${msg.from?.first_name}, Would you like to setup a new group or join an existing one?`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Setup new group',
              callback_data: 'setup',
            },
            {
              text: 'Join existing group',
              callback_data: 'join',
            },
          ],
        ],
      },
    },
  );
};
