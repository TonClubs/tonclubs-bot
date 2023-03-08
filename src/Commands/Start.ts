import {type Message} from 'node-telegram-bot-api';
import {Bot} from '../Services';

export default async (msg: Message): Promise<void> => {
  await Bot.sendMessage(
    msg.chat.id,
    `Hello ${msg.from?.first_name}, Would you like to create a new group or join an existing one?`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Create',
              callback_data: 'create',
            },
            {
              text: 'Join',
              callback_data: 'join',
            },
          ],
        ],
      },
    },
  );
};
