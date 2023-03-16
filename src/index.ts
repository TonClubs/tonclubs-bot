import Listeners from './Listeners';
import {Bot, BotInfo, Debug} from './Services';

(async (): Promise<void> => {
  const ok = await Bot.setMyCommands([
    {
      command: 'start',
      description: 'Starts the bot',
    },
    {
      command: 'connect',
      description: 'Shows instructions to connect your group to a collection',
    },
    {
      command: 'create',
      description: 'Shows instructions to create a new collection',
    },
    {
      command: 'mint',
      description: 'Shows instructions to mint a new NFT for a collection',
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
