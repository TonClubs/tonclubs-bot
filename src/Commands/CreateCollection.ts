import {type Message} from 'node-telegram-bot-api';
import dedent from 'dedent';
import {v4 as uuid} from 'uuid';
import NFTCollection from '../Contracts/NFTCollection';
import {store, ActiveFormActions, CreateCollectionFormActions} from '../Redux';
import {Bot, S3, useWallet} from '../Services';
import {getTxHash, getWalletAddress} from '../Utils/Helpers';
import {AWS_S3_URL} from '../Utils/Constants';

export default async (msg: Message, type: 'request' | 'confirm' | 'discard'): Promise<void> => {
  if (msg.chat.type !== 'private' || !msg.from?.id) return;

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
    const currentState = store.getState().createCollectionForm[msg.chat.id];

    store.dispatch(ActiveFormActions.setActiveForm({chatId: msg.chat.id, activeForm: 'none'}));
    store.dispatch(CreateCollectionFormActions.clearForm({chatId: msg.chat.id}));

    if (!currentState || !currentState.name || !currentState.description || !currentState.image) {
      return;
    }

    useWallet(msg, async (connector, wallet) => {
      const owner = getWalletAddress(wallet);

      const collectionContent = {
        name: currentState.name!,
        description: currentState.description!,
        image: await Bot.getFileLink(currentState.image!),
        external_link: 'https://tonclubs.com',
        seller_fee_basis_points: 50,
        fee_recipient: owner.toString(),
      };

      const objectKey = `${uuid()}.json`;

      const uploadResponse = await S3.Upload(
        objectKey,
        Buffer.from(JSON.stringify(collectionContent)),
        'application/json',
      );

      if (!uploadResponse.ok) {
        return;
      }

      const collection = NFTCollection.getDeployData({
        owner,
        limit: currentState.limit,
        price: currentState.price,
        collectionContentUrl: `${AWS_S3_URL}/${objectKey}`,
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

        const txHash = getTxHash(tx);

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
    });
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
