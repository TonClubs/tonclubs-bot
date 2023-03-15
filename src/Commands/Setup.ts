import {type Message} from 'node-telegram-bot-api';
import {Bot} from '../Services';

export default async (msg: Message): Promise<void> => {
  if (msg.chat.type !== 'private' || !msg.from?.id) return;

  await Bot.sendMessage(
    msg.chat.id,
    `Great! Let's setup a new group. Do you already have an NFT collection?`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Yes, I already have an NFT collection',
              callback_data: 'connect',
            },
          ],
          [
            {
              text: "No, Let's create a new NFT collection",
              callback_data: 'create',
            },
          ],
        ],
      },
    },
  );
};
