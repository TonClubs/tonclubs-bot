import crypto from 'node:crypto';
import {type Message} from 'node-telegram-bot-api';
import {TonConnect, type Wallet} from '@tonconnect/sdk';
import QRCode from 'qrcode';
import Bot from './Bot';
import TonStorage from '../Utils/TonStorage';

export const useWallet = async (
  msg: Message,
  onConnect: (connector: TonConnect, wallet: Wallet) => void | Promise<void>,
): Promise<void> => {
  if (!msg.from?.id) return;

  // FIXME: Remove the try/catch block from the whole function
  try {
    const connector = new TonConnect({
      storage: TonStorage.getStorage(msg.chat.id),
      manifestUrl:
        'https://ipfs.io/ipfs/bafkreieg5etvju7ovw7vlq5shinzsoembbgt6jvfb6v4lpgn3kpryize7i',
    });

    await connector.restoreConnection();

    const proof = crypto.randomBytes(32).toString('hex');

    if (connector.connected && connector.wallet) {
      onConnect(connector, connector.wallet);
    } else {
      const connectURL = connector.connect(
        {
          universalLink: 'https://app.tonkeeper.com/ton-connect',
          bridgeUrl: 'https://bridge.tonapi.io/bridge',
        },
        {tonProof: proof},
      );

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

        const tonProof = walletInfo.connectItems?.tonProof;

        if (!tonProof || !('proof' in tonProof) || tonProof.proof.payload !== proof) {
          Bot.sendMessage(msg.chat.id, 'Invalid proof received, please try again');

          return;
        }

        Bot.deleteMessage(connectMsg.chat.id, connectMsg.message_id);
        onConnect(connector, walletInfo);
        unsubscribe();
      });
    }
  } catch (e) {
    //
  }
};
