/* eslint lines-between-class-members: "off" */

import {type User} from 'node-telegram-bot-api';

export default new (class BotInfo {
  public id = -1;
  public first_name = '';
  public last_name = '';
  public username: string | undefined;

  public setBotInfo = (info: User): void => {
    this.id = info.id;
    this.first_name = info.first_name;
    this.last_name = info.first_name;
    this.username = info.username;
  };
})();
