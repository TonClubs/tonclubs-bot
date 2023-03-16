import dedent from 'dedent';
import {type Message} from 'node-telegram-bot-api';
import {Address} from 'ton-core';
import {store, ConnectCollectionFormActions} from '../Redux';
import {Bot} from '../Services';
import {CheckGroupRequirements, getTonClient} from '../Utils/Helpers';

export default async (msg: Message): Promise<void> => {
  if (!msg.from?.id) return;

  if (!(await CheckGroupRequirements(msg.chat.id, msg.from.id, false))) return;

  const {connectCollectionForm} = store.getState();

  const nextField = connectCollectionForm[msg.chat.id]?.nextField;

  if (!nextField || nextField === 'done') return;

  if (nextField === 'address') {
    if (!msg.text || !msg.text.trim()) return;

    const client = await getTonClient();

    const address = Address.parse(msg.text.trim());

    if (
      !(await client.isContractDeployed(address)) ||
      (await client.getContractState(address)).state !== 'active'
    ) {
      await Bot.sendMessage(msg.chat.id, `This address is not a valid contract address.`);
      return;
    }

    try {
      const collectionData = await client.runMethod(address, 'get_collection_data');

      const nextIndex = collectionData.stack.readNumber();
      if (typeof nextIndex !== 'number' || nextIndex < 0) {
        // Next index is not a number or is negative so this is not a valid collection
        throw new Error();
      }
    } catch (_) {
      await Bot.sendMessage(msg.chat.id, `This is not a valid NFT Collection address.`);
      return;
    }

    store.dispatch(
      ConnectCollectionFormActions.updateForm({
        chatId: msg.chat.id,
        fields: {
          address: msg.text.trim(),
          nextField: 'done',
        },
      }),
    );

    const currentState = store.getState().connectCollectionForm[msg.chat.id];

    await Bot.sendMessage(
      msg.chat.id,
      dedent`
        Please confirm your NFT Collection details.
        Address: ${currentState?.address}
        After confirming, users will be able to enter this group by holding one of your NFTs.
      `,
      {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: 'Looks good!',
                callback_data: 'connect__confirm',
              },
              {
                text: 'Start over',
                callback_data: 'connect__discard',
              },
            ],
          ],
        },
      },
    );
  }
};
