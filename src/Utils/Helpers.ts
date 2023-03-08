import dedent from 'dedent';
import {type ChatId} from 'node-telegram-bot-api';
import {Bot} from '../Services';
import BotInfo from './BotInfo';

export const GetPostgresTimestamp = (date: Date = new Date()): string => {
  /**
   * Date.prototype.toISOString returns: 2022-01-22T13:59:11.983Z
   * Postgres wants: 2022-01-22 13:59:11
   *
   * Replace T with ` ` (space)
   * Split by . (dot) to remove ms
   */
  return date.toISOString().replace('T', ' ').split('.')[0];
};

export const CheckGroupRequirements = async (
  chatId: ChatId,
  isInitial?: boolean,
): Promise<boolean> => {
  const chat = await Bot.getChat(chatId);
  const member = await Bot.getChatMember(chatId, BotInfo.id);

  const isMember = member.is_member || member.status === 'member';
  const isSuperGroup = chat.type === 'supergroup';
  const isAdmin = member.status === 'administrator';
  const canInviteUser = member.can_invite_users;

  if (!isMember) return false;

  if (isInitial) {
    const steps = [];

    if (!isSuperGroup) steps.push('Make the group a Super Group');
    if (!isAdmin) steps.push('Make me an admin');
    if (!canInviteUser) steps.push('Give me the permission to invite and add members');

    steps.push('Type /create to start the setup');

    Bot.sendMessage(
      chat.id,
      dedent`
        Hi! Let's setup the group. Please follow the instructions:
        ${steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}
      `,
    );

    return false;
  }

  if (!isSuperGroup) {
    Bot.sendMessage(
      chat.id,
      'This bot only works in Super Groups. Please follow the setup instructions to create a Super Group with the bot.',
    );

    return false;
  }

  if (!isAdmin) {
    Bot.sendMessage(chat.id, 'Please make me an admin.');

    return false;
  }

  if (!canInviteUser) {
    Bot.sendMessage(chat.id, 'Please give me the permission to invite members to the group.');

    return false;
  }

  return true;
};
