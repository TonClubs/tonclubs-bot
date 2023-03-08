import {type Message} from 'node-telegram-bot-api';
import {Bot} from '../Services';

export default async (msg: Message): Promise<void> => {
  await Bot.sendMessage(msg.chat.id, 'Hello there!');
};
