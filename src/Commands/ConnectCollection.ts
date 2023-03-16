import dedent from 'dedent';
import {type Message} from 'node-telegram-bot-api';
import {store, ActiveFormActions, ConnectCollectionFormActions} from '../Redux';
import {Bot, BotInfo, Prisma} from '../Services';
import {CheckGroupRequirements, getRandomUrlSafeString} from '../Utils/Helpers';

export default async (msg: Message, type: 'request' | 'confirm' | 'discard'): Promise<void> => {
  if (msg.chat.type === 'private' && type === 'request') {
    Bot.sendMessage(
      msg.chat.id,
      dedent`
        Great! Let's setup a new group then.
        As a first step, please add me to the group you want to create. And we will continue from there.
      `,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Add me to a group',
                url: `https://t.me/${BotInfo.username}?startgroup`,
              },
            ],
          ],
        },
      },
    );
  }

  if (msg.chat.type !== 'supergroup' || !msg.from?.id) return;

  if (!(await CheckGroupRequirements(msg.chat.id, msg.from.id, false))) return;

  if (type === 'request') {
    store.dispatch(
      ActiveFormActions.setActiveForm({chatId: msg.chat.id, activeForm: 'conectCollectionForm'}),
    );
    store.dispatch(ConnectCollectionFormActions.clearForm({chatId: msg.chat.id}));

    Bot.sendMessage(
      msg.chat.id,
      dedent`
        Great! Let's connect your collection to this group.
        Please enter the address of your NFT collection.
        Please note that using collections created by other tools may cause unexpected behavior and may be incompatible with the future versions of the bot.
      `,
    );

    store.dispatch(
      ConnectCollectionFormActions.setNextField({chatId: msg.chat.id, nextField: 'address'}),
    );
  }

  if (type === 'confirm') {
    const {connectCollectionForm} = store.getState();

    const formData = connectCollectionForm[msg.chat.id];

    if (!formData?.address || !msg.from?.id) return;

    if (await Prisma.integrations.findUnique({where: {groupId: msg.chat.id}})) {
      Bot.sendMessage(msg.chat.id, 'This group is already connected to a collection.');
      return;
    }

    const createdIntegration = await Prisma.integrations.create({
      data: {
        groupId: msg.chat.id,
        collectionAddress: formData.address,
        handle: getRandomUrlSafeString(8),
      },
    });

    await Bot.sendMessage(
      msg.chat.id,
      dedent`
        Your collection has been connected to this group\.
        Your group handle is: \`${createdIntegration.handle}\`
        Users can now join the group by having the group handle and holding your collection's NFTs\.
      `,
      {parse_mode: 'MarkdownV2'},
    );
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
