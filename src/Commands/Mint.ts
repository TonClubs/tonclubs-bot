import dedent from 'dedent';
import {type Message} from 'node-telegram-bot-api';
import NFTCollection from '../Contracts/NFTCollection';
import {ActiveFormActions, store} from '../Redux';
import {Bot, Prisma, useWallet} from '../Services';
import {getTxHash, getWalletAddress} from '../Utils/Helpers';

export default async (msg: Message): Promise<void> => {
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

    if (message.includes(' ')) {
      await Bot.sendMessage(msg.chat.id, `Please enter a single address or group handle.`);
      return;
    }

    const integration = await Prisma.integrations.findFirst({
      where: {
        OR: {
          handle: message,
          collectionAddress: message,
        },
      },
    });

    if (!integration) {
      await Bot.sendMessage(msg.chat.id, `No collection found for ${message}.`);
      return;
    }

    // TODO: Show collection info

    useWallet(msg, async (connector, wallet) => {
      const mintData = NFTCollection.getMintData({
        owner: getWalletAddress(wallet),
      });

      Bot.sendMessage(msg.chat.id, 'Please confirm the mint transaction in your wallet.');

      try {
        const tx = await connector.sendTransaction({
          validUntil: Date.now() / 1000 + 60, // 1 minute
          messages: [
            {
              address: integration.collectionAddress,
              amount: '120000000',
              stateInit: mintData.toBoc().toString('base64'),
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
            Mint transaction sent.
            You can track the status of the transcation at tonscan: https://testnet.tonscan.org/tx/by-msg-hash/${txHash}
          `,
        );
      } catch (err) {
        // TODO: handle error
      }
    });
  }
};
