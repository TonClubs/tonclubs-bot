import dedent from 'dedent';
import {type InlineKeyboardButton, type Message} from 'node-telegram-bot-api';
import {Integrations} from '@prisma/client';
import {Address} from 'ton-core';
import NFTCollection from '../Contracts/NFTCollection';
import {ActiveFormActions, store} from '../Redux';
import {Bot, Prisma, useWallet} from '../Services';
import {getTonClient, getTxHash, getWalletAddress} from '../Utils/Helpers';

const MintNFT = async (msg: Message, integration: Integrations): Promise<void> => {
  useWallet(msg, async (connector, wallet) => {
    const client = await getTonClient();

    const mintData = NFTCollection.getMintData({
      owner: getWalletAddress(wallet),
    });

    let mintPrice: bigint;
    try {
      const mintPriceRes = await client.runMethod(
        Address.parse(integration.collectionAddress),
        'get_mint_price',
      );

      mintPrice = mintPriceRes.stack.readBigNumber();

      Bot.sendMessage(msg.chat.id, 'Please confirm the mint transaction in your wallet.');
    } catch (err) {
      mintPrice = 0n;

      Bot.sendMessage(
        msg.chat.id,
        dedent`
          This collection is not created using the TonClubs Bot. Mint transaction may fail.
          Please confirm the mint transaction in your wallet if you're sure.
        `,
      );
    }

    try {
      const tx = await connector.sendTransaction({
        validUntil: Date.now() / 1000 + 60, // 1 minute
        messages: [
          {
            address: integration.collectionAddress,
            amount: mintPrice.toString(),
            payload: mintData.toBoc().toString('base64'),
          },
        ],
      });

      if (!tx || !tx.boc) {
        // TODO: handle error
        return;
      }

      const txHash = getTxHash(tx);

      await Bot.sendMessage(
        msg.chat.id,
        dedent`
          Mint transaction sent. You can join the group that uses this collection after the transaction is confirmed.
          You can track the status of the transcation at tonscan: https://testnet.tonscan.org/tx/by-msg-hash/${txHash}
        `,
      );
    } catch (err) {
      // TODO: handle error
    }
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
      MintNFT(msg, integration);
    }

    return;
  }

  if (msg.chat.type !== 'private' || !msg.from?.id) return;

  const activeForm = store.getState().activeForm[msg.chat.id];

  if (activeForm !== 'mintForm') {
    store.dispatch(ActiveFormActions.setActiveForm({chatId: msg.chat.id, activeForm: 'mintForm'}));

    await Bot.sendMessage(
      msg.chat.id,
      `Great! Please enter the collection address or group handle for the collection you want to mint.`,
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
      MintNFT(msg, integrationByHandle);
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
                callback_data: `mint_for__${integration.handle}`,
              },
            ]),
          },
        },
      );
      return;
    }

    // collection found
    MintNFT(msg, integrationsByCollection[0]);
  }
};
