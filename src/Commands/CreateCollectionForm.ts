import dedent from 'dedent';
import {type Message} from 'node-telegram-bot-api';
import {store, CreateCollectionFormActions} from '../Redux';
import {Bot} from '../Services';

export default async (msg: Message): Promise<void> => {
  if (msg.chat.type !== 'private' || !msg.from?.id) return;

  const {createCollectionForm} = store.getState();

  const nextField = createCollectionForm[msg.chat.id]?.nextField;

  if (!nextField || nextField === 'done') return;

  if (nextField === 'name') {
    if (!msg.text || !msg.text.trim()) return;

    store.dispatch(
      CreateCollectionFormActions.updateForm({
        chatId: msg.chat.id,
        fields: {
          name: msg.text.trim(),
          nextField: 'description',
        },
      }),
    );

    await Bot.sendMessage(msg.chat.id, 'Please enter a description for your collection.');
  }

  if (nextField === 'description') {
    if (!msg.text || !msg.text.trim()) return;

    store.dispatch(
      CreateCollectionFormActions.updateForm({
        chatId: msg.chat.id,
        fields: {
          description: msg.text.trim(),
          nextField: 'image',
        },
      }),
    );

    await Bot.sendMessage(msg.chat.id, 'Please upload an image for your collection.');
  }

  if (nextField === 'image') {
    if (!msg.photo?.length) return;

    const largestPhoto = msg.photo[msg.photo.length - 1];

    store.dispatch(
      CreateCollectionFormActions.updateForm({
        chatId: msg.chat.id,
        fields: {
          image: largestPhoto.file_id,
          nextField: 'price',
        },
      }),
    );

    await Bot.sendMessage(msg.chat.id, 'Please enter the mint and monthly renewal price in TON.');
  }

  if (nextField === 'price') {
    if (!msg.text || !msg.text.trim()) return;

    store.dispatch(
      CreateCollectionFormActions.updateForm({
        chatId: msg.chat.id,
        fields: {
          price: Number(msg.text.trim()),
          nextField: 'limit',
        },
      }),
    );

    await Bot.sendMessage(
      msg.chat.id,
      'Please enter how many NFTs should be allowed to be minted. Enter 0 for unlimited.',
    );
  }

  if (nextField === 'limit') {
    if (!msg.text || !msg.text.trim()) return;

    store.dispatch(
      CreateCollectionFormActions.updateForm({
        chatId: msg.chat.id,
        fields: {
          limit: Number(msg.text.trim()),
          nextField: 'done',
        },
      }),
    );

    const currentState = store.getState().createCollectionForm[msg.chat.id];

    await Bot.sendPhoto(msg.chat.id, currentState?.image || '', {
      caption: dedent`
        Please confirm your NFT Collection details.
        Name: ${currentState?.name}
        Description: ${currentState?.description}
        Price: ${currentState?.price}
        Mint Limit: ${currentState?.limit || 'Unlimited'}
      `,
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: 'Looks good!',
              callback_data: 'create__confirm',
            },
            {
              text: 'Start over',
              callback_data: 'create__discard',
            },
          ],
        ],
      },
    });
  }
};
