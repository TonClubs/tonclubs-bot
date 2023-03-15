import {type Message} from 'node-telegram-bot-api';
import {TonConnect, Wallet} from '@tonconnect/sdk';
import {Cell} from 'ton-core';
import QRCode from 'qrcode';
import dedent from 'dedent';
import NFTCollection from '../Contracts/NFTCollection';
import {store, ActiveFormActions, CreateCollectionFormActions} from '../Redux';
import {Bot, Debug} from '../Services';
import {CheckGroupRequirements, getWalletAddress} from '../Utils/Helpers';
import TonStorage from '../Utils/TonStorage';

export default async (msg: Message, type: 'request' | 'confirm' | 'discard'): Promise<void> => {
  if (msg.chat.type !== 'supergroup' || !msg.from?.id) return;

  const ok = await CheckGroupRequirements(msg.chat.id, msg.from.id, false);

  Debug.bot('Group Requirement Checks %o', ok);

  if (!ok) return;

  if (type === 'request') {
    store.dispatch(
      ActiveFormActions.setActiveForm({chatId: msg.chat.id, activeForm: 'createCollectionForm'}),
    );

    store.dispatch(CreateCollectionFormActions.clearForm({chatId: msg.chat.id}));

    await Bot.sendMessage(
      msg.chat.id,
      "Great! Let's create a new collection! As a first step, please enter the name of your collection.",
    );

    store.dispatch(
      CreateCollectionFormActions.setNextField({
        chatId: msg.chat.id,
        nextField: 'name',
      }),
    );

    return;
  }

  if (type === 'confirm') {
    store.dispatch(ActiveFormActions.setActiveForm({chatId: msg.chat.id, activeForm: 'none'}));
    store.dispatch(CreateCollectionFormActions.clearForm({chatId: msg.chat.id}));

    const currentState = store.getState().createCollectionForm[msg.chat.id];

    const connector = new TonConnect({
      storage: TonStorage.getStorage(msg.from?.id || 0),
      manifestUrl:
        'https://ipfs.io/ipfs/bafkreieg5etvju7ovw7vlq5shinzsoembbgt6jvfb6v4lpgn3kpryize7i',
    });

    await connector.restoreConnection();

    const sendTransaction = async (wallet: Wallet): Promise<void> => {
      const collection = NFTCollection.getDeployData({
        owner: getWalletAddress(wallet),
        limit: currentState?.limit,
        price: currentState?.price,
      });

      Bot.sendMessage(msg.chat.id, 'Please confirm the deploy transaction in your wallet.');

      try {
        const tx = await connector.sendTransaction({
          validUntil: Date.now() / 1000 + 60, // 1 minute
          messages: [
            {
              address: collection.address.toString(),
              amount: '20000000',
              stateInit: collection.stateInit.toBoc().toString('base64'),
            },
          ],
        });

        if (!tx || !tx.boc) {
          // TODO: handle error
          return;
        }

        const txHash = Cell.fromBoc(Buffer.from(tx.boc, 'base64'))[0].hash().toString('base64');

        await Bot.sendMessage(
          msg.chat.id,
          dedent`
            Collection deploy transaction sent.
            You can track the status of the transcation at tonscan: https://testnet.tonscan.org/tx/by-msg-hash/${txHash}
          `,
        );

        Bot.sendMessage(
          msg.chat.id,
          dedent`
            Collection address: \`${collection.address.toString()}\`
            You can use this address to connect your collection to the bot when the transaction is confirmed\.
          `,
          {
            parse_mode: 'MarkdownV2',
          },
        );
      } catch (err) {
        // TODO: handle error
      }
    };

    if (connector.connected && connector.wallet) {
      sendTransaction(connector.wallet);
    } else {
      const connectURL = connector.connect({
        universalLink: 'https://app.tonkeeper.com/ton-connect',
        bridgeUrl: 'https://bridge.tonapi.io/bridge',
      });

      const qrBuffer = await QRCode.toBuffer(connectURL, {width: 256});

      const connectMsg = await Bot.sendPhoto(msg.chat.id, qrBuffer, {
        caption: 'Scan the QR code or click the button below to connect your wallet',
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Click To Connect',
                url: connectURL,
              },
            ],
          ],
        },
      });

      const unsubscribe = connector.onStatusChange((walletInfo) => {
        if (!walletInfo) return;

        Bot.deleteMessage(connectMsg.chat.id, connectMsg.message_id);
        sendTransaction(walletInfo);
        unsubscribe();
      });
    }
  }

  if (type === 'discard') {
    store.dispatch(ActiveFormActions.setActiveForm({chatId: msg.chat.id, activeForm: 'none'}));
    store.dispatch(CreateCollectionFormActions.clearForm({chatId: msg.chat.id}));

    await Bot.sendMessage(
      msg.chat.id,
      'Okay, I have discarded your request. You can go ahead and type /create again to start over.',
    );
  }
};
