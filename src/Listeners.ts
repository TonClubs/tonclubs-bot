import Start from './Commands/Start';
import Create from './Commands/Create';
import CreateCollection from './Commands/CreateCollection';
import CreateCollectionForm from './Commands/CreateCollectionForm';
import ConnectCollection from './Commands/ConnectCollection';
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
      Create(msg);
      return;
    }

    if (msg.text?.startsWith('/join')) {
      return;
    }

    if (msg.chat.type === 'supergroup') {
      const {activeForm} = store.getState();

      if (activeForm[msg.chat.id] === 'createCollectionForm') {
        CreateCollectionForm(msg);
        return;
      }
    }
  });

  Bot.on('callback_query', async (query) => {
    if (!query.message) return;

    if (query.data === 'create') {
      Create(query.message);
    }

    if (query.data === 'create__collection_new') {
      CreateCollection(query.message, 'request');
    }

    if (query.data === 'create__collection_new__confirm') {
      CreateCollection(query.message, 'confirm');
    }

    if (query.data === 'create__collection_new__discard') {
      CreateCollection(query.message, 'discard');
    }

    if (query.data === 'create__collection_existing') {
      ConnectCollection(query.message, 'request');
    }
  });

  Bot.on('my_chat_member', (member) => {
    CheckGroupRequirements(member.chat.id, member.old_chat_member.status === 'left');
  });
};
