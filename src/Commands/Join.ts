import dedent from 'dedent';
import {Integrations} from '@prisma/client';
import {type InlineKeyboardButton, type Message} from 'node-telegram-bot-api';
import {Address} from 'ton-core';
import {ActiveFormActions, store} from '../Redux';
import {Bot, Prisma, useWallet} from '../Services';
import {getTonClient, getWalletAddress} from '../Utils/Helpers';

const JoinToIntegration = async (msg: Message, integration: Integrations): Promise<void> => {
  useWallet(msg, async (connector, wallet) => {
    const loadingMessage = await Bot.sendMessage(
      msg.chat.id,
      `Please wait while we make sure you are eligible to join this group...`,
    );

    const client = await getTonClient();

    const collectionAddress = Address.parse(integration.collectionAddress);

    const collectionData = await client.runMethod(collectionAddress, 'get_collection_data');

    const nextItemIndex = collectionData.stack.readNumber();

    if (nextItemIndex < 1) {
      Bot.deleteMessage(msg.chat.id, loadingMessage.message_id);

      await Bot.sendMessage(
        msg.chat.id,
        `There are no NFTs in this collection. Please mint an NFT first.`,
      );
      return;
    }

    const ownerAddresses = await Promise.all(
      Array(nextItemIndex)
        .fill('')
        .map(async (_, idx) => {
          const nftAddressResult = await client.runMethod(
            collectionAddress,
            'get_nft_address_by_index',
            [{type: 'int', value: BigInt(idx)}],
          );

          const nftAddress = nftAddressResult.stack.readAddress();

          const ownerResult = await client.runMethod(nftAddress, 'get_nft_data', []);

          const ownerAddress = ownerResult.stack.skip().skip().skip().readAddress();

          return ownerAddress.hash.toString('hex');
        }),
    );

    const walletAddress = getWalletAddress(wallet);

    const walletAddressHash = walletAddress.hash.toString('hex');

    if (!ownerAddresses.includes(walletAddressHash)) {
      Bot.deleteMessage(msg.chat.id, loadingMessage.message_id);

      await Bot.sendMessage(
        msg.chat.id,
        `You don't have an NFT for this collection. You can't join this group.`,
      );
      return;
    }

    const exists = await Prisma.users.findUnique({
      where: {
        integrationId_userId: {
          integrationId: integration.id,
          userId: msg.from!.id,
        },
      },
    });

    if (exists) {
      Bot.sendMessage(
        msg.chat.id,
        dedent`
          Congratulations! You can join the group using the link below!
          ${exists.inviteLink}
        `,
        {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Join Group',
                  url: exists.inviteLink,
                },
              ],
            ],
          },
        },
      );
      return;
    }

    await Bot.unbanChatMember(Number(integration.groupId), msg.from!.id);

    const inviteLink = await Bot.createChatInviteLink(
      integration.groupId.toString(),
      undefined,
      Date.now() / 1000 + 60 * 60 * 24 * 7,
      1,
      false,
    );

    await Prisma.users.create({
      data: {
        integration: {
          connect: {
            id: integration.id,
          },
        },
        userId: msg.from!.id,
        address: walletAddress.toString(),
        inviteLink: inviteLink.invite_link,
      },
    });

    Bot.deleteMessage(msg.chat.id, loadingMessage.message_id);
    Bot.sendMessage(
      msg.chat.id,
      dedent`
        Congratulations! You can join the group using the link below!
        ${inviteLink.invite_link}
      `,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Join Group',
                url: inviteLink.invite_link,
              },
            ],
          ],
        },
      },
    );
  });
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
