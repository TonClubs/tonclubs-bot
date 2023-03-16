import dedent from 'dedent';
import {Integrations} from '@prisma/client';
import {type InlineKeyboardButton, type Message} from 'node-telegram-bot-api';
import {Address} from 'ton-core';
import {ActiveFormActions, store} from '../Redux';
import {Bot, Prisma} from '../Services';
import {getTonClient} from '../Utils/Helpers';

const JoinToIntegration = async (msg: Message, integration: Integrations): Promise<void> => {
  const client = await getTonClient();

  const collectionAddress = Address.parse(integration.collectionAddress);

  const collectionData = await client.runMethod(collectionAddress, 'get_collection_data');

  const nextItemIndex = collectionData.stack.readNumber();

  if (nextItemIndex > 0) {
    Array(nextItemIndex)
      .fill('')
      .map(async (_, idx) => {
        const nftAddress = await client.runMethod(collectionAddress, 'get_nft_address_by_index', [
          {type: 'int', value: BigInt(idx)},
        ]);

        console.log(nftAddress);
      });
  }
};

export default async (msg: Message, integrationId?: number): Promise<void> => {
  if (integrationId) {
    const integration = await Prisma.integrations.findUnique({
      where: {
        id: integrationId,
      },
    });

    if (integration) {
      JoinToIntegration(msg, integration);
    }

    return;
  }

  if (msg.chat.type !== 'private' || !msg.from?.id) return;

  const activeForm = store.getState().activeForm[msg.chat.id];

  if (activeForm !== 'joinForm') {
    store.dispatch(ActiveFormActions.setActiveForm({chatId: msg.chat.id, activeForm: 'joinForm'}));

    await Bot.sendMessage(
      msg.chat.id,
      `Great! Please enter the collection address or group handle for the collection you want to join to.`,
    );
  } else {
    if (!msg.text || !msg.text.trim()) return;

    const message = msg.text.trim();

    if (message.includes(' ') || message.includes('@')) {
      await Bot.sendMessage(msg.chat.id, `Please enter a single address or group handle.`);
      return;
    }

    const integrationByHandle = await Prisma.integrations.findUnique({
      where: {
        handle: message,
      },
    });

    if (integrationByHandle) {
      JoinToIntegration(msg, integrationByHandle);
      return;
    }

    const integrationsByCollection = await Prisma.integrations.findMany({
      where: {
        collectionAddress: message,
      },
    });

    if (!integrationsByCollection.length) {
      await Bot.sendMessage(msg.chat.id, `No collection found for ${message}.`);
      return;
    }

    if (integrationsByCollection.length > 1) {
      await Bot.sendMessage(
        msg.chat.id,
        dedent`
          Multiple collections found for ${message}.
          Please select one of the following:
        `,
        {
          reply_markup: {
            inline_keyboard: integrationsByCollection.map<InlineKeyboardButton[]>((integration) => [
              {
                text: integration.handle,
                callback_data: `join_to__${integration.handle}`,
              },
            ]),
          },
        },
      );
      return;
    }

    // collection found
    JoinToIntegration(msg, integrationsByCollection[0]);
  }
};
