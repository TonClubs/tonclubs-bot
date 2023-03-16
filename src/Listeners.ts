import Start from './Commands/Start';
import Setup from './Commands/Setup';
import CreateCollection from './Commands/CreateCollection';
import CreateCollectionForm from './Commands/CreateCollectionForm';
import ConnectCollection from './Commands/ConnectCollection';
import ConnectCollectionForm from './Commands/ConnectCollectionForm';
import Mint from './Commands/Mint';
import Join from './Commands/Join';
import {store} from './Redux';
import {Bot, Debug} from './Services';
import {CheckGroupRequirements} from './Utils/Helpers';

export default (): void => {
  Bot.on('message', async (msg) => {
    Debug.bot('Message received: %o', msg);

    if (msg.text?.startsWith('/start')) {
      Start(msg);
      return;
    }

    if (msg.text?.startsWith('/create')) {
      CreateCollection(msg, 'request');
      return;
    }

    if (msg.text?.startsWith('/connect')) {
      ConnectCollection(msg, 'request');
      return;
    }

    if (msg.text?.startsWith('/mint')) {
      Mint(msg);
      return;
    }

    if (msg.text?.startsWith('/join')) {
      Join(msg);
      return;
    }

    if (msg.chat.type === 'supergroup') {
      const {activeForm} = store.getState();

      if (activeForm[msg.chat.id] === 'conectCollectionForm') {
        ConnectCollectionForm(msg);
      }
    }

    if (msg.chat.type === 'private') {
      const {activeForm} = store.getState();

      if (activeForm[msg.chat.id] === 'createCollectionForm') {
        CreateCollectionForm(msg);
      }

      if (activeForm[msg.chat.id] === 'mintForm') {
        Mint(msg);
      }

      if (activeForm[msg.chat.id] === 'joinForm') {
        Join(msg);
      }
    }
  });

  Bot.on('callback_query', async (query) => {
    if (!query.message) return;

    Debug.bot('Query received: %o', query);

    if (query.data?.startsWith('join_to__')) {
      const integrationId = Number(query.data.replace('join_to__', ''));
      Join(query.message, integrationId);
    }

    if (query.data?.startsWith('mint_for__')) {
      const integrationId = Number(query.data.replace('mint_for__', ''));
      Mint(query.message, integrationId);
    }

    if (query.data === 'setup') {
      Setup(query.message);
    }

    if (query.data === 'create') {
      CreateCollection(query.message, 'request');
    }

    if (query.data === 'create__confirm') {
      CreateCollection(query.message, 'confirm');
    }

    if (query.data === 'create__discard') {
      CreateCollection(query.message, 'discard');
    }

    if (query.data === 'connect') {
      ConnectCollection(query.message, 'request');
    }

    if (query.data === 'connect__confirm') {
      ConnectCollection(query.message, 'confirm');
    }

    if (query.data === 'connect__discard') {
      ConnectCollection(query.message, 'discard');
    }
  });

  Bot.on('my_chat_member', (member) => {
    Debug.bot('My chat member received: %o', member);

    if (member.new_chat_member.status === 'left') return;

    CheckGroupRequirements(member.chat.id, NaN, member.old_chat_member.status === 'left');
  });
};
