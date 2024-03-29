import crypto from 'node:crypto';
import dedent from 'dedent';
import {type ChatId} from 'node-telegram-bot-api';
import {getHttpEndpoint} from '@orbs-network/ton-access';
import {type SendTransactionResponse, type Wallet} from '@tonconnect/sdk';
import {Address, Cell} from 'ton-core';
import {TonClient} from 'ton';
import {Bot, BotInfo, Debug} from '../Services';

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
  senderId: number,
  isInitial?: boolean,
): Promise<boolean> => {
  const chat = await Bot.getChat(chatId);
  const member = await Bot.getChatMember(chatId, BotInfo.id);

  const isMember =
    member.is_member || member.status === 'member' || member.status === 'administrator';
  const isSuperGroup = chat.type === 'supergroup';
  const isAdmin = member.status === 'administrator';
  const canInviteUser = member.can_invite_users;

  Debug.bot('Group Requirement Checks: isMember %o', isMember);
  Debug.bot('Group Requirement Checks: isSuperGroup %o', isSuperGroup);
  Debug.bot('Group Requirement Checks: isAdmin %o', isAdmin);
  Debug.bot('Group Requirement Checks: canInviteUser %o', canInviteUser);
  Debug.bot('Group Requirement Checks %o', isMember && isSuperGroup && isAdmin && canInviteUser);

  if (!isMember) return false;

  if (isInitial) {
    const steps = [];

    if (!isSuperGroup) steps.push('Make the group a Super Group');
    if (!isAdmin) steps.push('Make me an admin');
    if (!canInviteUser) steps.push('Give me the permission to invite and add members');

    steps.push('Type /connect to start the setup');

    Bot.sendMessage(
      chat.id,
      dedent`
        Hi! Let's setup the group. Please follow the instructions:
        ${steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}
      `,
    );

    return false;
  }

  if (!Number.isNaN(senderId) && senderId !== BotInfo.id) {
    const sender = await Bot.getChatMember(chatId, senderId);

    if (sender.status !== 'creator') {
      Bot.sendMessage(chat.id, 'Only the group owner can use this command.');

      return false;
    }
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

export const getWalletAddress = (wallet: Wallet): Address => {
  const [workchain, address] = wallet.account.address.split(':');

  return new Address(Number(workchain), Buffer.from(address, 'hex'));
};

export const getTxHash = (
  tx: SendTransactionResponse,
  encoding: BufferEncoding = 'base64',
): string => {
  return Cell.fromBoc(Buffer.from(tx.boc, 'base64'))[0].hash().toString(encoding);
};

export const getRandomUrlSafeString = (length: number, prefix = ''): string => {
  const randomBytes = crypto
    .randomBytes(length * 2)
    .toString('base64')
    .replace(/\+/g, '')
    .replace(/=/g, '')
    .replace(/\//g, '');

  const randomString = `${prefix}${randomBytes}`.substring(0, length);

  if (randomString.length < length) {
    return getRandomUrlSafeString(length, randomString);
  }

  return randomString;
};

export const getTonClient = async (): Promise<TonClient> => {
  const endpoint = await getHttpEndpoint({network: 'testnet'});
  const client = new TonClient({endpoint});

  return client;
};
