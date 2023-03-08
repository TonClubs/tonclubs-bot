import {type Message} from 'node-telegram-bot-api';
import {Bot} from '../Services';

export default async (msg: Message): Promise<void> => {
  await Bot.sendMessage(
    msg.chat.id,
    `Great! Let's setup a new group. As a first step, please add me to the group you want to create. And we will continue from there.`,
  );
};
