import {Bot, Debug} from './Services';
import Start from './Commands/Start';
import Create from './Commands/Create';
import CreateCollection from './Commands/CreateCollection';
import CreateCollectionForm from './Commands/CreateCollectionForm';
import {store} from './Redux';
import BotInfo from './Utils/BotInfo';
import {CheckGroupRequirements} from './Utils/Helpers';

(async (): Promise<void> => {
  const ok = await Bot.setMyCommands([
    {
      command: 'start',
      description: 'Starts the bot',
    },
    {
      command: 'create',
      description: 'Shows instructions to setup a telegram group with the bot',
    },
    {
      command: 'join',
      description: 'Shows instructions to join a telegram group with the bot',
    },
  ]);

  Debug.bot('Commands set successfully: %o', ok);

  if (!ok) throw new Error('Could not set commands');

  const me = await Bot.getMe();

  BotInfo.setBotInfo(me);

  Debug.bot('Bot info received successfully');
  console.info('Bot started');
})();

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
    CreateCollection(query.message);
  }
});

Bot.on('my_chat_member', (member) => {
  CheckGroupRequirements(member.chat.id, member.old_chat_member.status === 'left');
});
