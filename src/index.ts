import {Bot, Debug} from './Services';
import Start from './Commands/Start';
import Create from './Commands/Create';
import BotInfo from './Utils/BotInfo';
import {CheckGroupRequirements} from './Utils/Helpers';

(async (): Promise<void> => {
  const ok = Bot.setMyCommands([
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
  if (msg.text?.startsWith('/start')) {
    Start(msg);
  }

  if (msg.text?.startsWith('/create')) {
    Create(msg);
  }
});

Bot.on('callback_query', async (query) => {
  if (query.data === 'create' && query.message) {
    Create(query.message);
  }
});

Bot.on('my_chat_member', (member) => {
  CheckGroupRequirements(member.chat.id, member.old_chat_member.status === 'left');
});
