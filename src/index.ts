import Listeners from './Listeners';
import {Bot, Debug} from './Services';
import BotInfo from './Utils/BotInfo';

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

  Listeners();
})();
