import TelegramBot from 'node-telegram-bot-api';
import {TELEGRAM_BOT_TOKEN} from '../Utils/Constants';

const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, {polling: true});

export const BotInfo = new (class BotInfo {
  public id = -1;
  public first_name = '';
  public last_name = '';
  public username: string | undefined;

  public setBotInfo = (info: TelegramBot.User): void => {
    this.id = info.id;
    this.first_name = info.first_name;
    this.last_name = info.first_name;
    this.username = info.username;
  };
})();

export default bot;
