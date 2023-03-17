import dedent from 'dedent';
import {type Message} from 'node-telegram-bot-api';
import {Bot, Prisma} from '../Services';
import {CheckGroupRequirements} from '../Utils/Helpers';

export default async (msg: Message, type: 'request' | 'confirm' | 'discard'): Promise<void> => {
  if (msg.chat.type !== 'supergroup' || !msg.from?.id) return;

  if (!(await CheckGroupRequirements(msg.chat.id, msg.from.id, false))) return;

  if (type === 'request') {
    const integration = await Prisma.integrations.findUnique({where: {groupId: msg.chat.id}});

    if (!integration) {
      Bot.sendMessage(msg.chat.id, 'This group is not connected to any collection.');
      return;
    }

    Bot.sendMessage(
      msg.chat.id,
      dedent`
        This group is connected to the collection with address \`${integration.collectionAddress}\`\.
        It's handle is \`${integration.handle}\`\.
        Are you sure you want to disconnect this group from the collection?
        People will no longer be able to join the group by holding the collection's NFTs\.
        Current members will not be affected\.
      `,
      {
        parse_mode: 'MarkdownV2',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Yes, disconnect',
                callback_data: 'disconnect__confirm',
              },
              {
                text: 'No, cancel',
                callback_data: 'disconnect__discard',
              },
            ],
          ],
        },
      },
    );
  }

  if (type === 'confirm') {
    // TODO: delete confirm message

    if (await Prisma.integrations.findUnique({where: {groupId: msg.chat.id}})) {
      await Prisma.integrations.delete({where: {groupId: msg.chat.id}});

      await Bot.sendMessage(
        msg.chat.id,
        'Okay, I have disconnected your group from the collection.',
      );
    }
  }

  if (type === 'discard') {
    // TODO: delete confirm message
    await Bot.sendMessage(msg.chat.id, 'Okay, I have discarded your disconnect request.');
  }
};
