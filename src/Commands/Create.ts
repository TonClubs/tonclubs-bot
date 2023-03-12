import dedent from 'dedent';
import {type Message} from 'node-telegram-bot-api';
import {Bot} from '../Services';
import {CheckGroupRequirements} from '../Utils/Helpers';

export default async (msg: Message): Promise<void> => {
  if (!msg.from?.id) return;

  if (msg.chat.type === 'private') {
    await Bot.sendMessage(
      msg.chat.id,
      `Great! Let's setup a new group. As a first step, please add me to the group you want to create. And we will continue from there.`,
    );

    return;
  }

  if (!(await CheckGroupRequirements(msg.chat.id, msg.from.id, false))) return;

  await Bot.sendMessage(
    msg.chat.id,
    dedent`
      Great! You've completed the first step. Now, please select how you want to proceed.
      If you already have an NFT collection, you can select "I already have an NFT collection".
      If you don't have an NFT collection, you can create one using the "I don't have an NFT collection" button.
    `,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'I already have an NFT collection',
              callback_data: 'create__collection_existing',
            },
          ],
          [
            {
              text: "I don't have an NFT collection",
              callback_data: 'create__collection_new',
            },
          ],
        ],
      },
    },
  );
};
