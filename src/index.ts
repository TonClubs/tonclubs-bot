import {Bot, Debug} from './Services';

Bot.on('message', async (msg) => {
  Debug.bot('Message received: %O', msg);
});
