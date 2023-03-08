import {Bot, Debug} from './Services';
import Start from './Commands/Start';

Bot.setMyCommands([
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
]).then((ok) => {
  Debug.bot('Commands set successfully: %o', ok);
  console.info('Bot started');
});

Bot.on('message', async (msg) => {
  if (msg.text === '/start') {
    Start(msg);
  }
});
